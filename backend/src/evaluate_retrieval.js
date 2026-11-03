// evaluate_retrieval.js  --  file-level Link@k for AI Codebase Explorer
// Put this file in  backend/src/  (next to index.js) and run it from the backend folder.
//
// STEP 1  build a commit dataset from a local clone of the repo you want to evaluate
//   node src/evaluate_retrieval.js --from-git /path/to/local/clone --n 10 --out commits.json
//   Then OPEN commits.json and delete commits that are NOT feature-adding
//   (typo fixes, formatting, dependency bumps). Edit messages if they are too vague.
//
// STEP 2  index that same repo in the app (paste its URL, wait for status "ready"),
//   copy its repo id (UUID) from the repos table or the URL, then run
//   node src/evaluate_retrieval.js --repo <REPO_UUID> --commits commits.json
//
// Output: P / R / F1 (macro-average over commits) for k = 1, 3, 5 and for the three
// variants in Table VI: vector, full-text, keyword. A CSV copy is written to link_at_k.csv.
//
// To fill Table VII (ablation): change the defaults of chunkText(text, 800, 100) in
// embeddingService.js, re-index the repo, run STEP 2 again, and read the k = 3 row.
// The chunk count for the "#Chunks" column is:  SELECT count(*) FROM embeddings WHERE repo_id = '<id>';

import fs from 'fs';
import { execSync } from 'child_process';
import pool from './config/db.js';
import { semanticSearch } from './services/embeddingService.js';

const SUPPORTED = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb', '.php',
    '.cs', '.cpp', '.c', '.h', '.json', '.yaml', '.yml', '.sh', '.sql'
];
const KS = [1, 3, 5];

const arg = (name, def) => {
    const i = process.argv.indexOf(name);
    return i === -1 ? def : process.argv[i + 1];
};
const norm = (p) => p.replace(/\\/g, '/').replace(/^\.?\//, '');

// ---------- STEP 1: commits from git ----------
function buildCommits(repoPath, n, out) {
    const SEP = '@@COMMIT@@';
    const raw = execSync(
        `git -C "${repoPath}" log --no-merges --name-only --pretty=format:"${SEP}%s"`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );
    const commits = [];
    for (const block of raw.split(SEP).slice(1)) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const message = lines[0];
        const files = lines.slice(1).filter(f => SUPPORTED.some(e => f.toLowerCase().endsWith(e)));
        if (message && files.length > 0 && message.length > 15) commits.push({ message, files });
    }
    const picked = commits.slice(0, n);
    fs.writeFileSync(out, JSON.stringify(picked, null, 2));
    console.log(`Wrote ${picked.length} commits to ${out}. Review and prune it before running STEP 2.`);
}

// ---------- retrieval variants (same logic as repoController.searchRepo) ----------
async function vector(repoId, q, k) {
    const rows = await semanticSearch(repoId, q, k);
    return rows.map(r => r.filePath);
}
async function fulltext(repoId, q, k) {
    const { rows } = await pool.query(
        `SELECT f.path AS file_path
           FROM files f
          WHERE f.repo_id = $2
            AND to_tsvector('english', COALESCE(f.content, '')) @@ plainto_tsquery('english', $1)
          ORDER BY ts_rank(to_tsvector('english', COALESCE(f.content, '')), plainto_tsquery('english', $1)) DESC
          LIMIT $3`, [q, repoId, k]);
    return rows.map(r => r.file_path);
}
async function keyword(repoId, q, k) {
    const words = q.split(' ').filter(w => w.length > 3);
    if (words.length === 0) return [];
    const clause = words.map((_, i) => `f.content ILIKE $${i + 3}`).join(' OR ');
    const { rows } = await pool.query(
        `SELECT f.path AS file_path FROM files f
          WHERE f.repo_id = $1 AND f.content IS NOT NULL AND (${clause})
          LIMIT $2`, [repoId, k, ...words.map(w => `%${w}%`)]);
    return rows.map(r => r.file_path);
}
const VARIANTS = { 'Vector (Nomic)': vector, 'Full-text (ts_rank)': fulltext, 'Keyword (ILIKE)': keyword };

// ---------- metrics ----------
function prf(retrieved, truth) {
    const R = new Set(retrieved.map(norm));
    const T = new Set(truth.map(norm));
    let hit = 0;
    for (const f of R)
        if (T.has(f)) hit++;
    const p = R.size ? hit / R.size : 0;
    const r = T.size ? hit / T.size : 0;
    const f1 = p + r ? (2 * p * r) / (p + r) : 0;
    return { p, r, f1 };
}

async function evaluate(repoId, commitsPath) {
    const commits = JSON.parse(fs.readFileSync(commitsPath, 'utf8'));
    const csv = ['variant,k,P,R,F1,commits'];
    console.log(`\nRepo ${repoId}  |  ${commits.length} commits\n`);
    console.log('Variant               k    P      R      F1');
    for (const [name, fn] of Object.entries(VARIANTS)) {
        for (const k of KS) {
            let sp = 0,
                sr = 0,
                sf = 0,
                done = 0;
            for (const c of commits) {
                try {
                    const got = [...new Set(await fn(repoId, c.message, k))];
                    const m = prf(got, c.files);
                    sp += m.p;
                    sr += m.r;
                    sf += m.f1;
                    done++;
                } catch (e) {
                    console.warn(`  skipped one query (${name}, k=${k}): ${e.message}`);
                }
            }
            if (done === 0) {
                console.log(`${name.padEnd(21)} ${k}    FAILED - every query errored (check the repo id and API keys)`);
                continue;
            }
            const d = done;
            const row = [sp / d, sr / d, sf / d].map(x => x.toFixed(3));
            console.log(`${name.padEnd(21)} ${k}    ${row.join('  ')}`);
            csv.push(`${name},${k},${row.join(',')},${done}`);
        }
    }
    fs.writeFileSync('link_at_k.csv', csv.join('\n'));
    console.log('\nSaved link_at_k.csv');
    await pool.end();
}

// ---------- entry ----------
const gitPath = arg('--from-git');
if (gitPath) {
    buildCommits(gitPath, parseInt(arg('--n', '10'), 10), arg('--out', 'commits.json'));
    process.exit(0);
}
const repoId = arg('--repo');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const commitsPath = arg('--commits', 'commits.json');
if (repoId && !UUID_RE.test(repoId)) {
    console.error(`"${repoId}" is not a real repo id. Get the real UUID with:\n  SELECT id, name FROM repos ORDER BY created_at DESC;\nin the Supabase SQL editor, then run the command again.`);
    process.exit(1);
}
if (!repoId) {
    console.error('Usage: see the comment block at the top of this file.');
    process.exit(1);
}
evaluate(repoId, commitsPath).catch(e => {
    console.error(e);
    process.exit(1);
});