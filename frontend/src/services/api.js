const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let _getToken = null;
export const setTokenProvider = (fn) => { _getToken = fn; };

const req = async (method, path, body) => {
    const send = async (forceRefresh = false) => {
        const headers = { 'Content-Type': 'application/json' };
        if (_getToken) {
            const token = await _getToken(forceRefresh);
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return await fetch(`${BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    };
    let res = await send();
    if (res.status === 401 && _getToken) {
        res = await send(true);
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
};

export const api = {
    cloneRepo:       (githubUrl) => req('POST', '/repos/clone', { githubUrl }),
    getStatus:       (id)        => req('GET',  `/repos/${id}/status`),
    getFiles:        (id)        => req('GET',  `/repos/${id}/files`),
    getFileContent:  (id, fid)   => req('GET',  `/repos/${id}/files/${fid}`),
    explainFile:     (id, fid)   => req('POST', `/repos/${id}/explain`, { fileId: fid }),
    search:          (id, query) => req('POST', `/repos/${id}/search`, { query }),
    chat:            (id, msg)   => req('POST', `/repos/${id}/chat`, { message: msg }),
    generateReadme:  (id)        => req('POST', `/repos/${id}/readme`, {}),
    getArchitecture: (id)        => req('GET',  `/repos/${id}/architecture`),
    // Maps to architecture endpoint (same data, different page use)
    getAnalysis:     (id)        => req('GET',  `/repos/${id}/architecture`),
    getInsights:     (id)        => req('GET',  `/repos/${id}/insights`),
    getArchaeology:  (id)        => req('GET',  `/repos/${id}/archaeology`),
};