import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
dotenv.config();

// Works on both Windows and Linux/Mac
const CLONE_PATH = process.env.REPOS_CLONE_PATH || path.join(os.tmpdir(), 'ai-explorer-repos');

const SUPPORTED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go',
    '.rb', '.php', '.cs', '.cpp', '.c', '.h',
    '.json', '.yaml', '.yml', '.sh', '.sql'
];

const IGNORED_DIRS = [
    'node_modules', '.git', 'dist', 'build', 'out',
    '__pycache__', '.next', 'vendor', '.cache', 'coverage',
    '.turbo', '.vercel', 'target', 'test', 'tests',
    '__tests__', 'spec', 'fixtures', 'examples', 'docs', 'doc'
];

const MAX_FILE_SIZE_KB = 500; // skip files larger than 500KB

export const cloneRepository = async(githubUrl, repoId) => {
    const repoPath = path.join(CLONE_PATH, String(repoId));

    if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
    }
    fs.mkdirSync(repoPath, { recursive: true });

    const git = simpleGit();
    await git.clone(githubUrl, repoPath, ['--depth', '1']); // shallow clone for speed

    return repoPath;
};

export const readRepositoryFiles = (repoPath) => {
    const files = [];

    const walk = (dir) => {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if (IGNORED_DIRS.includes(entry.name)) continue;
            if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;

            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(repoPath, fullPath).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                walk(fullPath);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.size > MAX_FILE_SIZE_KB * 1024) {
                        console.log(`  Skipping large file: ${relativePath} (${Math.round(stat.size / 1024)}KB)`);
                        continue;
                    }

                    const content = fs.readFileSync(fullPath, 'utf-8');
                    files.push({
                        path: relativePath,
                        content,
                        language: getLanguage(ext)
                    });
                } catch (err) {
                    console.log(`  Skipping unreadable file: ${relativePath}`);
                }
            }
        }
    };

    walk(repoPath);
    return files;
};

export const detectTechStack = (files) => {
    const stack = [];
    const fileNames = files.map(f => f.path);
    const hasFile = (name) => fileNames.some(f => f.includes(name));

    if (hasFile('package.json')) {
        const pkgFile = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json'));
        if (pkgFile) {
            try {
                const pkg = JSON.parse(pkgFile.content);
                const deps = {...pkg.dependencies, ...pkg.devDependencies };

                if (deps.react) stack.push('React');
                if (deps.next) stack.push('Next.js');
                if (deps.vue) stack.push('Vue');
                if (deps['@angular/core']) stack.push('Angular');
                if (deps.svelte) stack.push('Svelte');
                if (deps.express) stack.push('Express');
                if (deps.fastify) stack.push('Fastify');
                if (deps.mongoose) stack.push('MongoDB');
                if (deps.prisma || deps['@prisma/client']) stack.push('Prisma');
                if (deps.pg) stack.push('PostgreSQL');
                if (deps.tailwindcss) stack.push('Tailwind CSS');
                if (deps.typescript || deps['@types/node']) stack.push('TypeScript');
                if (deps.socket) stack.push('Socket.io');
                if (deps.redis || deps.ioredis) stack.push('Redis');
                if (deps.graphql) stack.push('GraphQL');
                if (deps.stripe) stack.push('Stripe');
                if (deps.firebase || deps['firebase-admin']) stack.push('Firebase');
            } catch { /* malformed package.json */ }
        }
        stack.push('Node.js');
    }

    if (hasFile('requirements.txt') || hasFile('setup.py') || hasFile('pyproject.toml')) {
        stack.push('Python');
        const reqFile = files.find(f => f.path === 'requirements.txt');
        if (reqFile) {
            const content = reqFile.content.toLowerCase();
            if (content.includes('django')) stack.push('Django');
            if (content.includes('flask')) stack.push('Flask');
            if (content.includes('fastapi')) stack.push('FastAPI');
            if (content.includes('sqlalchemy')) stack.push('SQLAlchemy');
        }
    }

    if (hasFile('pom.xml') || hasFile('build.gradle')) stack.push('Java');
    if (hasFile('Gemfile')) stack.push('Ruby');
    if (hasFile('go.mod')) stack.push('Go');
    if (hasFile('Cargo.toml')) stack.push('Rust');
    if (hasFile('composer.json')) stack.push('PHP');
    if (hasFile('docker-compose') || hasFile('Dockerfile')) stack.push('Docker');

    return [...new Set(stack)];
};

const getLanguage = (ext) => {
    const map = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.go': 'go',
        '.rb': 'ruby',
        '.php': 'php',
        '.cs': 'csharp',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.html': 'html',
        '.css': 'css',
        '.json': 'json',
        '.md': 'markdown',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.sh': 'bash',
        '.sql': 'sql',
    };
    return map[ext] || 'text';
};