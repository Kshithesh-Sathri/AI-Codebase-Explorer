import { verifyToken } from '../config/firebase.js';

export const requireAuth = async(req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = await verifyToken(token);
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture
        };
        next();
    } catch (err) {
        console.error('Firebase ID token verification failed:', err.code || err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};