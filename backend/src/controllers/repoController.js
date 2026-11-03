import pool from '../config/db.js';
import { cloneRepository, readRepositoryFiles, detectTechStack } from '../services/githubService.js';
import { embedRepoFiles, semanticSearch } from '../services/embeddingService.js';
import {
    explainFileWithAI,
    chatWithRepoAI,
    generateReadmeWithAI,
    generateArchitectureWithAI,
    generateRepoSummaryWithAI,
    generateInsightsWithAI,
    runPromptArchaeology
} from '../services/aiService.js';

// ── POST /api/repos/clone ──────────────────────────────────────────────────
export const cloneRepo = async(req, res) => {
    const { githubUrl } = req.body;

    if (!githubUrl) {
        return res.status(400).json({ error: 'githubUrl is required' });
    }

    // Validate GitHub URL
    if (!githubUrl.startsWith('https://github.com/')) {
        return res.status(400).json({ error: 'Only GitHub URLs are supported (https://github.com/...)' });
    }

    try {
        const repoName = githubUrl.replace('https://github.com/', '').replace(/\.git$/, '');

        const result = await pool.query(
            `INSERT INTO repos (github_url, name, status) VALUES ($1, $2, 'cloning') RETURNING *`, [githubUrl, repoName]
        );

        const repo = result.rows[0];

        // Respond immediately — processing is async
        res.json({
            message: 'Repository cloning started',
            repoId: repo.id,
            name: repo.name,
            status: 'cloning'
        });

        // Fire-and-forget background processing
        processRepo(repo.id, githubUrl).catch(err =>
            console.error(`processRepo fatal error for ${repo.id}:`, err)
        );

    } catch (err) {
        console.error('cloneRepo error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ── Background Processing Pipeline ────────────────────────────────────────
const setStatus = (repoId, status) =>
    pool.query(`UPDATE repos SET status = $1 WHERE id = $2`, [status, repoId]);

const processRepo = async(repoId, githubUrl) => {
    try {
        // STEP 1 — Clone
        console.log(`[${repoId}] Cloning ${githubUrl}...`);
        const repoPath = await cloneRepository(githubUrl, repoId);

        // STEP 2 — Read files
        await setStatus(repoId, 'reading');
        console.log(`[${repoId}] Reading files...`);
        const files = readRepositoryFiles(repoPath);
        const techStack = detectTechStack(files);

        // STEP 3 — Save files to DB (bulk insert)
        if (files.length > 0) {
            const values = [];
            const params = [];
            let p = 1;
            for (const file of files) {
                values.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
                params.push(repoId, file.path, file.content, file.language);
            }
            await pool.query(
                `INSERT INTO files (repo_id, path, content, language) VALUES ${values.join(', ')}`,
                params
            );
        }

        // STEP 4 — Generate architecture + summary with AI
        await setStatus(repoId, 'analyzing');
        console.log(`[${repoId}] Generating architecture...`);

        const repoName = githubUrl.replace('https://github.com/', '').replace(/\.git$/, '');
        const [architecture, summary] = await Promise.all([
            generateArchitectureWithAI(repoName, techStack, files).catch(() => null),
            generateRepoSummaryWithAI(repoName, techStack, files.length, files).catch(() => null)
        ]);

        const architectureText = architecture ?
            (architecture.overview + '\n\n' + architecture.diagram) :
            null;

        await pool.query(
            `UPDATE repos SET tech_stack = $1, summary = $2, architecture = $3 WHERE id = $4`, [JSON.stringify(techStack), summary, architectureText, repoId]
        );

        // STEP 5 — Generate embeddings (optional — skip if it fails)
        try {
            await setStatus(repoId, 'embedding');
            console.log(`[${repoId}] Generating embeddings for ${files.length} files...`);
            await embedRepoFiles(repoId, files);
            console.log(`[${repoId}] Embeddings done.`);
        } catch (embedErr) {
            console.warn(`[${repoId}] Embedding skipped (will use text search fallback): ${embedErr.message}`);
        }

        // STEP 6 — Done!
        await setStatus(repoId, 'ready');
        console.log(`[${repoId}] ✅ Ready! Tech: ${techStack.join(', ')}`);

    } catch (err) {
        console.error(`[${repoId}] processRepo error:`, err);
        await setStatus(repoId, 'error');
    }
};

// ── GET /api/repos/:repoId/status ──────────────────────────────────────────
export const getRepoStatus = async(req, res) => {
    const { repoId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, status, tech_stack, summary, architecture, created_at
             FROM repos WHERE id = $1`, [repoId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Repo not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/repos/:repoId/files ───────────────────────────────────────────
export const getFiles = async(req, res) => {
    const { repoId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, path, language FROM files WHERE repo_id = $1 ORDER BY path`, [repoId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/repos/:repoId/files/:fileId ──────────────────────────────────
export const getFileContent = async(req, res) => {
    const { repoId, fileId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, path, content, language, summary FROM files
             WHERE id = $1 AND repo_id = $2`, [fileId, repoId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/repos/:repoId/explain ───────────────────────────────────────
// Body: { fileId } OR { filePath }
export const explainFile = async(req, res) => {
    const { repoId } = req.params;
    const { fileId, filePath } = req.body;

    if (!fileId && !filePath) {
        return res.status(400).json({ error: 'fileId or filePath is required' });
    }

    try {
        // Fetch file from DB
        const query = fileId ?
            `SELECT * FROM files WHERE id = $1 AND repo_id = $2` :
            `SELECT * FROM files WHERE path = $1 AND repo_id = $2`;
        const param = fileId ? fileId : filePath;

        const result = await pool.query(query, [param, repoId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = result.rows[0];

        if (!file.content || file.content.trim().length < 10) {
            return res.status(400).json({ error: 'File is empty or too short to explain' });
        }

        // If we already have a cached summary, return fast
        if (file.summary) {
            try {
                const cached = JSON.parse(file.summary);
                return res.json({...cached, cached: true });
            } catch {
                // summary is plain text, not JSON — continue to regenerate
            }
        }

        // Generate AI explanation
        const explanation = await explainFileWithAI(file.path, file.content, file.language);

        // Cache explanation in DB
        await pool.query(
            `UPDATE files SET summary = $1 WHERE id = $2`, [JSON.stringify(explanation), file.id]
        );

        res.json(explanation);

    } catch (err) {
        console.error('explainFile error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/repos/:repoId/search ────────────────────────────────────────
// Body: { query, topK? }
export const searchRepo = async(req, res) => {
    const { repoId } = req.params;
    const { query, topK = 6 } = req.body;

    if (!query || query.trim().length < 3) {
        return res.status(400).json({ error: 'query must be at least 3 characters' });
    }

    try {
        // Check repo is ready
        const repoResult = await pool.query(
            `SELECT status FROM repos WHERE id = $1`, [repoId]
        );
        if (repoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Repo not found' });
        }
        if (repoResult.rows[0].status !== 'ready') {
            return res.status(400).json({
                error: 'Repo is not ready yet',
                status: repoResult.rows[0].status
            });
        }

        // Try vector search first
        let rawResults = [];
        try {
            rawResults = await semanticSearch(repoId, query, Math.min(topK, 10));
        } catch (searchErr) {
            console.warn('Vector search failed, using text search:', searchErr.message);
        }

        // Fallback: PostgreSQL full-text search
        if (rawResults.length === 0) {
            console.log('No vector results — falling back to full-text search...');
            const ftResult = await pool.query(
                `SELECT f.path AS file_path, f.language,
                        f.content AS chunk_text, 0 AS chunk_index,
                        ts_rank(to_tsvector('english', COALESCE(f.content, '')), plainto_tsquery('english', $1)) AS similarity
                 FROM files f
                 WHERE f.repo_id = $2
                   AND to_tsvector('english', COALESCE(f.content, '')) @@ plainto_tsquery('english', $1)
                 ORDER BY similarity DESC
                 LIMIT $3`, [query, repoId, Math.min(topK, 10)]
            );

            // Last resort: keyword ILIKE search
            if (ftResult.rows.length === 0) {
                const keywords = query.split(' ').filter(w => w.length > 3);
                const likeClause = keywords.map((_, i) => `f.content ILIKE $${i + 3}`).join(' OR ');
                const likeParams = keywords.map(w => `%${w}%`);

                if (keywords.length > 0) {
                    const likeResult = await pool.query(
                        `SELECT f.path AS file_path, f.language,
                                SUBSTRING(f.content, 1, 800) AS chunk_text,
                                0 AS chunk_index, 0.1 AS similarity
                         FROM files f
                         WHERE f.repo_id = $1 AND f.content IS NOT NULL
                           AND (${likeClause})
                         LIMIT $2`, [repoId, Math.min(topK, 10), ...likeParams]
                    );
                    rawResults = likeResult.rows;
                }
            } else {
                rawResults = ftResult.rows;
            }
        }

        // Group results by file
        const byFile = {};
        for (const r of rawResults) {
            const key = r.filePath || r.file_path;
            if (!byFile[key]) {
                byFile[key] = {
                    filePath: key,
                    language: r.language,
                    similarity: r.similarity,
                    chunks: []
                };
            }
            byFile[key].chunks.push({
                text: r.chunkText || r.chunk_text,
                similarity: r.similarity
            });
        }

        res.json({
            query,
            results: Object.values(byFile),
            totalChunks: rawResults.length
        });

    } catch (err) {
        console.error('searchRepo error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/repos/:repoId/chat ──────────────────────────────────────────
// Body: { message, history? }
export const chatWithRepo = async(req, res) => {
    const { repoId } = req.params;
    const { message, history = [] } = req.body;

    if (!message || message.trim().length < 2) {
        return res.status(400).json({ error: 'message is required' });
    }

    try {
        // Get repo info
        const repoResult = await pool.query(
            `SELECT name, status, tech_stack FROM repos WHERE id = $1`, [repoId]
        );
        if (repoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Repo not found' });
        }

        const repo = repoResult.rows[0];
        if (repo.status !== 'ready') {
            return res.status(400).json({
                error: 'Repo is not ready yet',
                status: repo.status
            });
        }

        const techStack = repo.tech_stack || [];

        // Semantic search to find relevant code context
        let contextChunks = [];
        try {
            contextChunks = await semanticSearch(repoId, message, 6);
        } catch (searchErr) {
            console.warn('Semantic search failed, using text search fallback:', searchErr.message);
        }

        // Fallback: PostgreSQL full-text search if no vector results
        if (contextChunks.length === 0) {
            console.log('No vector results — using full-text search fallback...');
            const ftResult = await pool.query(
                `SELECT f.path AS file_path, f.language, f.content AS chunk_text, 0 AS chunk_index,
                        ts_rank(to_tsvector('english', COALESCE(f.content, '')), plainto_tsquery('english', $1)) AS similarity
                 FROM files f
                 WHERE f.repo_id = $2
                   AND to_tsvector('english', COALESCE(f.content, '')) @@ plainto_tsquery('english', $1)
                 ORDER BY similarity DESC
                 LIMIT 6`, [message, repoId]
            );

            // If text search also finds nothing, just grab the most important files
            if (ftResult.rows.length === 0) {
                const fallback = await pool.query(
                    `SELECT path AS file_path, language, content AS chunk_text, 0 AS chunk_index
                     FROM files WHERE repo_id = $1
                     ORDER BY CASE
                         WHEN path ILIKE '%index%'   THEN 1
                         WHEN path ILIKE '%app%'     THEN 2
                         WHEN path ILIKE '%server%'  THEN 3
                         WHEN path ILIKE '%main%'    THEN 4
                         WHEN path ILIKE '%route%'   THEN 5
                         WHEN path ILIKE '%readme%'  THEN 6
                         ELSE 7
                     END LIMIT 6`, [repoId]
                );
                contextChunks = fallback.rows;
            } else {
                contextChunks = ftResult.rows;
            }
        }

        // Generate AI answer
        const answer = await chatWithRepoAI(message, contextChunks, repo.name, techStack);

        // Return answer + source files used
        const sources = [...new Set(contextChunks.map(c => c.filePath))];

        res.json({ answer, sources, contextChunks });

    } catch (err) {
        console.error('chatWithRepo error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ── POST /api/repos/:repoId/readme ────────────────────────────────────────
export const generateReadme = async(req, res) => {
    const { repoId } = req.params;

    try {
        const repoResult = await pool.query(
            `SELECT name, status, tech_stack, architecture FROM repos WHERE id = $1`, [repoId]
        );
        if (repoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Repo not found' });
        }

        const repo = repoResult.rows[0];
        if (repo.status !== 'ready') {
            return res.status(400).json({
                error: 'Repo is not ready yet',
                status: repo.status
            });
        }

        // Get all files (paths + content snippets)
        const filesResult = await pool.query(
            `SELECT path, language, content FROM files WHERE repo_id = $1 ORDER BY path`, [repoId]
        );

        const techStack = repo.tech_stack || [];
        const readme = await generateReadmeWithAI(
            repo.name,
            techStack,
            filesResult.rows,
            repo.architecture
        );

        res.json({ readme, repoName: repo.name });

    } catch (err) {
        console.error('generateReadme error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/repos/:repoId/architecture ───────────────────────────────────
export const getArchitecture = async(req, res) => {
    const { repoId } = req.params;
    try {
        const result = await pool.query(
            `SELECT r.name, r.tech_stack, r.architecture, r.summary,
                    COUNT(f.id) AS file_count
             FROM repos r
             LEFT JOIN files f ON r.id = f.repo_id
             WHERE r.id = $1
             GROUP BY r.id`, [repoId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Repo not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/repos/:repoId/insights ──────────────────────────────────────
export const getInsights = async(req, res) => {
    const { repoId } = req.params;
    try {
        const repoResult = await pool.query(
            `SELECT r.name, r.tech_stack, r.insights
             FROM repos r WHERE r.id = $1`, [repoId]
        );
        if (repoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Repo not found' });
        }

        const repo = repoResult.rows[0];

        // Return cached insights if available
        if (repo.insights) {
            try {
                const parsed = typeof repo.insights === 'string' ?
                    JSON.parse(repo.insights) :
                    repo.insights; // pg already parses JSONB columns
                return res.json(parsed);
            } catch (e) {
                console.warn('Cached insights invalid, regenerating...');
                await pool.query(`UPDATE repos SET insights = NULL WHERE id = $1`, [repoId]);
            }
        }

        // Generate fresh insights
        const filesResult = await pool.query(
            `SELECT path, content, language FROM files WHERE repo_id = $1`, [repoId]
        );

        const techStack = Array.isArray(repo.tech_stack) ?
            repo.tech_stack :
            JSON.parse(repo.tech_stack || '[]');

        const insights = await generateInsightsWithAI(repo.name, techStack, filesResult.rows);

        // Cache in DB (store as JSONB — pg handles serialization)
        await pool.query(
            `UPDATE repos SET insights = $1::jsonb WHERE id = $2`, [JSON.stringify(insights), repoId]
        );

        res.json(insights);
    } catch (err) {
        console.error('getInsights error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/repos/:repoId/archaeology ───────────────────────────────────────
export const getArchaeology = async(req, res) => {
    const { repoId } = req.params;
    try {
        const repoResult = await pool.query(
            `SELECT r.name, r.tech_stack, r.architecture, r.archaeology
             FROM repos r WHERE r.id = $1`, [repoId]
        );
        if (repoResult.rows.length === 0) return res.status(404).json({ error: 'Repo not found' });

        const repo = repoResult.rows[0];

        // Return cached result if available
        if (repo.archaeology) {
            return res.json({ report: repo.archaeology });
        }

        const filesResult = await pool.query(
            `SELECT path, content, language FROM files WHERE repo_id = $1`, [repoId]
        );

        const techStack = Array.isArray(repo.tech_stack) ?
            repo.tech_stack : JSON.parse(repo.tech_stack || '[]');

        console.log(`[${repoId}] Running Prompt Archaeology Engine...`);
        const report = await runPromptArchaeology(
            repo.name, techStack, filesResult.rows, repo.architecture
        );

        // Cache it
        await pool.query(
            `UPDATE repos SET archaeology = $1 WHERE id = $2`, [report, repoId]
        );

        res.json({ report });
    } catch (err) {
        console.error('getArchaeology error:', err);
        res.status(500).json({ error: err.message });
    }
};