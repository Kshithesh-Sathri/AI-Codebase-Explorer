import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let initialized = false;

const resolveServiceAccount = () => {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();

    if (!raw) {
        const candidates = [
            path.resolve(process.cwd(), 'firebase-service-account.json'),
            path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../firebase-service-account.json'),
            path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../firebase-service-account.json'),
        ];

        const match = candidates.find((candidate) => existsSync(candidate));
        if (!match) {
            throw new Error('Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT to a JSON string or a valid file path.');
        }
        return JSON.parse(readFileSync(match, 'utf-8'));
    }

    if (raw.startsWith('{')) {
        return JSON.parse(raw);
    }

    const filePath = raw.startsWith('file://') ? fileURLToPath(raw) : raw;
    const candidates = [
        filePath,
        path.resolve(process.cwd(), filePath),
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), filePath),
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../', filePath),
    ];

    const match = candidates.find((candidate) => existsSync(candidate));
    if (!match) {
        throw new Error(`Firebase service account file not found: ${raw}`);
    }

    return JSON.parse(readFileSync(match, 'utf-8'));
};

export const initFirebase = () => {
    if (initialized) return;

    const serviceAccount = resolveServiceAccount();
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
};

export const verifyToken = async(token) => {
    initFirebase();
    return await admin.auth().verifyIdToken(token);
};