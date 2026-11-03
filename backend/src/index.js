import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import repoRoutes from './routes/repoRoutes.js';
import pool from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
    res.json({ message: 'AI Codebase Explorer API', version: '1.0.0' });
});

app.use('/api/repos', repoRoutes);

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

const start = async() => {
    try {
        await pool.query('SELECT 1');
        console.log('Database connected');
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
    app.listen(PORT, () => {
        console.log('Server running on http://localhost:' + PORT);
    });
};

start();