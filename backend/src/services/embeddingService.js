import fetch from 'node-fetch';
import pool from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// Nomic embed-text-v1.5 — free, no card, 768-dim
const NOMIC_API_KEY = process.env.NOMIC_API_KEY;
const NOMIC_MODEL = 'nomic-embed-text-v1.5';

const chunkText = (text, chunkSize = 800, overlap = 100) => {
    const lines = text.split('\n');
    const chunks = [];
    let current = [];
    let count = 0;
    for (const line of lines) {
        current.push(line);
        count += line.length;
        if (count >= chunkSize) {
            chunks.push(current.join('\n'));
            const overlapLines = [];
            let ob = 0;
            for (let i = current.length - 1; i >= 0 && ob < overlap; i--) {
                overlapLines.unshift(current[i]);
                ob += current[i].length;
            }
            current = overlapLines;
            count = ob;
        }
    }
    if (current.length > 0) chunks.push(current.join('\n'));
    return chunks.filter(c => c.trim().length > 20);
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Nomic supports batches of 100, no strict rate limit on free tier
const generateEmbeddings = async(texts, taskType = 'search_document') => {
    // Nomic requires task prefix in the text
    const prefixedTexts = texts.map(t =>
        taskType === 'search_query' ? `search_query: ${t}` : `search_document: ${t}`
    );

    const res = await fetch('https://api-atlas.nomic.ai/v1/embedding/text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${NOMIC_API_KEY}`
        },
        body: JSON.stringify({
            model: NOMIC_MODEL,
            texts: prefixedTexts,
            task_type: taskType,
            dimensionality: 768,
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Nomic API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.embeddings;
};

export const embedRepoFiles = async(repoId, files) => {
    console.log(`Starting embedding for ${files.length} files (nomic-embed-text-v1.5)...`);

    // Step 1: Get all file IDs in one query
    const pathsResult = await pool.query(
        `SELECT id, path FROM files WHERE repo_id = $1`, [repoId]
    );
    const pathToId = {};
    for (const row of pathsResult.rows) pathToId[row.path] = row.id;

    // Step 2: Build all chunks
    const allChunks = [];
    for (const file of files) {
        if (!file.content || file.content.trim().length < 30) continue;
        const fileId = pathToId[file.path];
        if (!fileId) continue;
        const chunks = chunkText(file.content);
        chunks.forEach((chunk, i) => {
            allChunks.push({
                fileId,
                path: file.path,
                chunkText: `File: ${file.path}\n\n${chunk}`,
                chunkIndex: i
            });
        });
    }

    if (allChunks.length === 0) {
        console.log('No chunks to embed.');
        return { processed: 0 };
    }

    console.log(`Total chunks: ${allChunks.length}`);

    // Step 3: Embed in batches of 100
    const BATCH = 100;
    const allEmbeddings = [];

    for (let i = 0; i < allChunks.length; i += BATCH) {
        const batch = allChunks.slice(i, i + BATCH).map(c => c.chunkText);
        const embeddings = await generateEmbeddings(batch, 'search_document');
        allEmbeddings.push(...embeddings);
        const done = Math.min(i + BATCH, allChunks.length);
        console.log(`  [${done}/${allChunks.length}] chunks embedded...`);
        if (done < allChunks.length) await sleep(300);
    }

    // Step 4: Bulk insert
    const values = [];
    const params = [];
    let p = 1;
    for (let i = 0; i < allChunks.length; i++) {
        values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(
            repoId,
            allChunks[i].fileId,
            allChunks[i].chunkText,
            allChunks[i].chunkIndex,
            JSON.stringify(allEmbeddings[i])
        );
    }

    await pool.query(
        `INSERT INTO embeddings (repo_id, file_id, chunk_text, chunk_index, embedding)
         VALUES ${values.join(', ')}`,
        params
    );

    console.log(`✅ Embedding complete. Inserted ${allChunks.length} chunks.`);
    return { processed: files.length, chunks: allChunks.length };
};

export const semanticSearch = async(repoId, query, topK = 6) => {
    try {
        const embeddings = await generateEmbeddings([query], 'search_query');
        const result = await pool.query(
            `SELECT e.chunk_text, e.chunk_index, f.path AS file_path, f.language,
                    1 - (e.embedding <=> $1::vector) AS similarity
             FROM embeddings e
             JOIN files f ON e.file_id = f.id
             WHERE e.repo_id = $2
             ORDER BY e.embedding <=> $1::vector
             LIMIT $3`, [JSON.stringify(embeddings[0]), repoId, topK]
        );
        return result.rows.map(row => ({
            filePath: row.file_path,
            language: row.language,
            chunkText: row.chunk_text,
            chunkIndex: row.chunk_index,
            similarity: parseFloat(row.similarity).toFixed(3)
        }));
    } catch (err) {
        console.error('semanticSearch error:', err.message);
        throw err;
    }
};