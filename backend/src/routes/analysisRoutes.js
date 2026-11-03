import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import pool from '../config/db.js';
import {
    analyzeRepositoryAsEngineer,
    explainFileDeep,
    analyzeSystemDesign
} from '../services/advancedAnalysisService.js';

const router = express.Router();
router.use(requireAuth);

// ── GET /api/analysis/engineer/:repoId ─────────────────────────────────────
// Deep repository analysis from a senior engineer's perspective
router.get('/engineer/:repoId', async(req, res) => {
    try {
        const { repoId } = req.params;

        const repoResult = await pool.query(
            'SELECT id, name, tech_stack, architecture FROM repos WHERE id = $1', [repoId]
        );

        if (repoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        const repo = repoResult.rows[0];

        const filesResult = await pool.query(
            'SELECT id, path, content, language FROM files WHERE repo_id = $1 LIMIT 200', [repoId]
        );

        const analysis = await analyzeRepositoryAsEngineer(
            repo.name,
            repo.tech_stack || [],
            filesResult.rows,
            repo.architecture
        );

        res.json(analysis);
    } catch (err) {
        console.error('engineer analysis error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/analysis/file ────────────────────────────────────────────────
// Deep file analysis
router.post('/file', async(req, res) => {
    try {
        const { filePath, fileContent, language } = req.body;

        if (!fileContent) {
            return res.status(400).json({ error: 'fileContent is required' });
        }

        const analysis = await explainFileDeep(filePath, fileContent, language || 'javascript');

        res.json(analysis);
    } catch (err) {
        console.error('file analysis error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/analysis/system/:repoId ──────────────────────────────────────
// System design and architecture analysis
router.get('/system/:repoId', async(req, res) => {
    try {
        const { repoId } = req.params;

        const repoResult = await pool.query(
            'SELECT id, name, architecture FROM repos WHERE id = $1', [repoId]
        );

        if (repoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        const repo = repoResult.rows[0];

        const filesResult = await pool.query(
            'SELECT path, content FROM files WHERE repo_id = $1 LIMIT 100', [repoId]
        );

        const analysis = await analyzeSystemDesign(
            repo.name,
            filesResult.rows,
            repo.architecture
        );

        res.json(analysis);
    } catch (err) {
        console.error('system design analysis error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;