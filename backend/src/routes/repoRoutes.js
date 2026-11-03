import express from 'express';
import {
    cloneRepo,
    getFiles,
    getFileContent,
    explainFile,
    searchRepo,
    chatWithRepo,
    generateReadme,
    getRepoStatus,
    getArchitecture,
    getInsights,
    getArchaeology
} from '../controllers/repoController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require Firebase auth
router.use(requireAuth);

// Repo lifecycle
router.post('/clone', cloneRepo);
router.get('/:repoId/status', getRepoStatus);

// File browsing
router.get('/:repoId/files', getFiles);
router.get('/:repoId/files/:fileId', getFileContent);

// AI features
router.post('/:repoId/explain', explainFile);
router.post('/:repoId/search', searchRepo);
router.post('/:repoId/chat', chatWithRepo);
router.post('/:repoId/readme', generateReadme);
router.get('/:repoId/architecture', getArchitecture);
router.get('/:repoId/insights', getInsights);
router.get('/:repoId/archaeology', getArchaeology);

export default router;