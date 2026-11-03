<div align="center">

# ⚡ AI Codebase Explorer

### *Explore, understand, and document any repository with AI that thinks like a senior engineer.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Nomic AI](https://img.shields.io/badge/Nomic_AI-Embeddings-7C6AFF?style=for-the-badge)](https://nomic.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

**Paste any GitHub URL → AI clones, reads every file, maps architecture, and lets you explore with natural language.**

[🐛 Report Bug](https://github.com/202452336/ai-codebase-explorer/issues) · [✨ Request Feature](https://github.com/202452336/ai-codebase-explorer/issues)

<br />

</div>

---

## 📸 Screenshots

| Overview | Explorer |
|----------|----------|
| ![Overview](https://placehold.co/600x340/030712/00E5FF?text=Repository+Overview) | ![Explorer](https://placehold.co/600x340/030712/7C4DFF?text=File+Explorer) |

| AI Chat | Semantic Search |
|---------|----------------|
| ![Chat](https://placehold.co/600x340/030712/00FF9D?text=AI+Chat+Interface) | ![Search](https://placehold.co/600x340/030712/00E5FF?text=Semantic+Search) |

| Architecture View | Prompt Archaeology Engine |
|-------------------|--------------------------|
| ![Architecture](https://placehold.co/600x340/030712/7C4DFF?text=Architecture+View) | ![Archaeology](https://placehold.co/600x340/030712/F59E0B?text=Prompt+Archaeology+Engine) |

---

## 🧠 What Is This?

**AI Codebase Explorer** is a full-stack developer intelligence platform. You give it a GitHub repository URL — it clones the repo, parses every file, generates vector embeddings, maps the architecture, and then gives you an intelligent AI assistant that truly *understands* the codebase.

It's like having a senior engineer who has read every line of code sitting next to you, ready to answer any question.

> **"Understanding a new codebase used to take days. This takes minutes."**

---

## ✨ Features

### 🔑 Core Features

| Feature | Description |
|---------|-------------|
| 🔗 **GitHub Clone** | Paste any public GitHub URL and the system clones and indexes it automatically |
| 📁 **File Explorer** | VS Code-style file tree with syntax-highlighted code viewer |
| 🧠 **AI File Explanation** | Click any file → AI explains purpose, functions, dependencies, flow, and quality score |
| 🔍 **Semantic Search** | Search by meaning, not keywords — *"where is JWT implemented?"* finds the right files |
| 💬 **Repo Chat** | Full conversational AI grounded in actual source code with source citations |
| 📝 **README Generator** | Auto-generates production-quality README.md from actual codebase content |
| 🏗️ **Architecture View** | Visualizes layers, data flow, design patterns, and tech stack |
| 📊 **Insights Dashboard** | Real AI-analyzed security score, maintainability score, strengths, risks, and recommendations |
| 🏺 **Prompt Archaeology Engine** | Reverse-engineers the original vision, PRD, blueprint, and AI prompts that likely guided the creation of any repository |

### 🚀 Advanced AI Features

| Feature | Description |
|---------|-------------|
| 🧬 **RAG Pipeline** | Retrieval-Augmented Generation for context-accurate answers |
| 📦 **Vector Embeddings** | Nomic AI `nomic-embed-text-v1.5` — semantic code understanding |
| 🗂️ **Smart Chunking** | Overlap-aware text chunking preserves context across file boundaries |
| 📎 **Source Citations** | Every AI answer includes references to the exact files used |
| 🔁 **Cross-file Analysis** | AI understands how files relate to each other, not just individually |
| 🛡️ **Security Detection** | Highlights auth patterns, input validation issues, and risk areas |
| 🏷️ **Tech Stack Detection** | Automatically identifies React, Express, PostgreSQL, Docker, and 50+ more |
| 🔍 **Prompt Reconstruction** | Generates 3 reconstructed AI prompts with confidence scores and supporting evidence |
| 📋 **PRD Generation** | Reconstructs the full Product Requirements Document from code evidence |
| 🗺️ **Roadmap Inference** | Infers the original MVP → production roadmap from repository evolution patterns |

### 🎨 Developer Experience

| Feature | Description |
|---------|-------------|
| 🌙 **Dark Theme** | Premium cyberpunk AI dark UI — `#030712` base with cyan/purple neon accents |
| ⚡ **Background Processing** | Repo indexing happens async with live status updates |
| 📱 **Responsive** | Works on desktop and mobile |
| 🔐 **Firebase Auth** | Google Sign-In + Email/Password authentication |
| 💾 **Recent Repos** | Quick access to previously analyzed repositories |
| 🖼️ **Markdown Rendering** | AI responses render with full markdown, tables, and code blocks |
| 💾 **Cached Results** | Archaeology, insights, and architecture results cached after first run |

---

## 🏺 Prompt Archaeology Engine

The most unique feature of this project. It reads your entire repository and reverse-engineers:

- The **original product idea** that inspired the project
- The **problem being solved** with evidence from actual code
- The **target users** inferred from UX and API design decisions
- A fully reconstructed **PRD (Product Requirements Document)**
- The **development phases** — what was built first, second, and third
- **Tech stack rationale** — *why* each technology was chosen
- **Database and API design decisions**
- The **original MVP → production roadmap**
- **3 reconstructed AI prompts** the developer likely used, each with:
  - Confidence score (1-10)
  - Supporting evidence from specific files
  - Missing assumptions honestly noted
- **Archaeology insights** — surprising findings about developer intent

> *No other developer tool does this. It's like carbon dating for code.*

---

## 🏗️ Architecture

```mermaid
graph TD
    A[👤 User] -->|GitHub URL| B[React Frontend]
    B -->|REST API + Firebase JWT| C[Express Backend]
    C -->|Clone & Parse| D[GitHub Service]
    D -->|File Contents| E[AI Service - Groq/Llama 3.3 70B]
    D -->|File Chunks| F[Embedding Service]
    F -->|nomic-embed-text-v1.5| G[Nomic AI API]
    G -->|768-dim Vectors| H[(PostgreSQL + pgvector)]
    E -->|Architecture + Insights + Archaeology| H
    B -->|Search Query| C
    C -->|Vector Similarity| H
    H -->|Top-K Chunks| E
    E -->|Grounded Answer| B
```

```
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend                             │
│  Overview │ Explorer │ Architecture │ Insights │ Search │ Chat   │
│           │          │              │          │        │        │
│                    🏺 Prompt Archaeology Engine                   │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTPS + Firebase JWT
┌─────────────────────────▼────────────────────────────────────────┐
│                      Express.js API                               │
│  /clone │ /explain │ /search │ /chat │ /readme │ /archaeology     │
└────┬──────────────┬─────────────────────────────────────────────┘
     │              │
┌────▼────┐   ┌─────▼─────────────────────────────────────────────┐
│ GitHub  │   │                  AI Pipeline                        │
│ Service │   │  Groq Llama 3.3 70B + Nomic AI Embeddings          │
│ Clone   │   │  Explain │ Chat │ README │ Architecture             │
│ Parse   │   │  Insights │ Prompt Archaeology Engine               │
└────┬────┘   └──────────────────┬────────────────────────────────┘
     │                           │
     └───────────────────────────►  PostgreSQL + pgvector (Supabase)
                                     repos │ files │ embeddings
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI framework | 19.x |
| Vite | Build tool & dev server | 8.x |
| Firebase | Authentication | 12.x |
| Custom CSS | Full design system (no framework) | — |
| Highlight.js | Syntax highlighting | CDN |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| Node.js | Runtime | 22.x |
| Express.js | API framework | 5.x |
| pg | PostgreSQL client | 8.x |
| simple-git | Git clone operations | 3.x |
| nodemon | Dev hot reload | 3.x |

### AI & Embeddings
| Technology | Purpose |
|-----------|---------|
| Groq (Llama 3.3 70B) | LLM for chat, explain, readme, architecture, insights, archaeology |
| Nomic AI nomic-embed-text-v1.5 | Vector embeddings for semantic search |
| pgvector | Vector similarity search in PostgreSQL |
| RAG Pipeline | Retrieval-augmented generation |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Supabase | PostgreSQL + pgvector hosting |
| Firebase Auth | User authentication |
| GitHub | Repository cloning via simple-git |

---

## 📁 Project Structure

```
ai-codebase-explorer/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                  # PostgreSQL connection pool
│   │   │   └── firebase.js            # Firebase Admin SDK setup
│   │   ├── controllers/
│   │   │   └── repoController.js      # All API route handlers
│   │   ├── middleware/
│   │   │   └── authMiddleware.js      # Firebase JWT verification
│   │   ├── migrations/
│   │   │   └── schema.sql             # Database schema (pgvector)
│   │   ├── routes/
│   │   │   └── repoRoutes.js          # Express route definitions
│   │   ├── services/
│   │   │   ├── aiService.js           # Groq LLM: explain, chat, readme,
│   │   │   │                          #   architecture, insights, archaeology
│   │   │   ├── embeddingService.js    # Nomic AI embeddings + vector search
│   │   │   └── githubService.js       # Clone, parse, detect tech stack
│   │   └── index.js                   # Express server entry point
│   ├── firebase-service-account.json  # Firebase Admin credentials (gitignored)
│   ├── .env                           # Environment variables (gitignored)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIPanel.jsx            # File intelligence sidebar
│   │   │   ├── ArchaeologyPanel.jsx   # 🏺 Prompt Archaeology Engine UI
│   │   │   ├── ChatPanel.jsx          # Chat UI with markdown renderer
│   │   │   ├── CodeViewer.jsx         # Syntax-highlighted code viewer
│   │   │   ├── FileTree.jsx           # VS Code-style file tree
│   │   │   ├── ReadmePanel.jsx        # README generator & preview
│   │   │   └── SearchPanel.jsx        # Semantic search UI
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Firebase auth state
│   │   ├── pages/
│   │   │   ├── HomePage.jsx           # Landing + repo URL input
│   │   │   ├── LoginPage.jsx          # Split-screen auth page
│   │   │   ├── ProcessingPage.jsx     # Repo indexing progress
│   │   │   └── ExplorerPage.jsx       # Main 8-tab explorer
│   │   ├── services/
│   │   │   ├── api.js                 # All backend API calls
│   │   │   └── firebase.js            # Firebase client config
│   │   ├── App.jsx                    # Root component + routing
│   │   ├── index.css                  # Full design system CSS
│   │   └── main.jsx                   # React entry point
│   ├── .env                           # Firebase config (gitignored)
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ How It Works

```
1. User pastes GitHub URL
         ↓
2. Backend clones repo with simple-git
         ↓
3. All files read, parsed, stored in PostgreSQL
         ↓
4. Tech stack detected from package.json, requirements.txt, etc.
         ↓
5. Architecture analyzed by Groq Llama 3.3 70B → cached
         ↓
6. Files chunked (800 char chunks, 100 char overlap)
         ↓
7. Nomic AI generates 768-dim vectors per chunk
         ↓
8. Vectors bulk-inserted into PostgreSQL via pgvector
         ↓
9. Repo status → "ready" — user can now explore
         ↓
10. User asks question → query embedded → top-K chunks retrieved
         ↓
11. Chunks + question sent to Groq → structured markdown answer
         ↓
12. Response rendered with full markdown, tables, code blocks
         ↓
13. [Optional] User runs Prompt Archaeology Engine →
    AI reads all files → reconstructs PRD, blueprint,
    development phases, and 3 AI prompts with confidence scores
```

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension (Supabase free tier works perfectly)
- Firebase project (for authentication)
- Groq API key — free at [console.groq.com](https://console.groq.com)
- Nomic AI API key — free at [atlas.nomic.ai](https://atlas.nomic.ai)

### 1. Clone the repository

```bash
git clone https://github.com/202452336/ai-codebase-explorer.git
cd ai-codebase-explorer
```

### 2. Set up the database

Run in your Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE repos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_url TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'cloning',
    tech_stack JSONB DEFAULT '[]',
    summary TEXT,
    architecture TEXT,
    insights JSONB,
    archaeology TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    content TEXT,
    language TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE embeddings (
    id SERIAL PRIMARY KEY,
    repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX embeddings_vector_idx ON embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### 3. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values
npm run dev
```

### 4. Set up the frontend

```bash
cd frontend
npm install
cp .env.example .env
# Fill in your Firebase config
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Supabase PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/postgres

# AI Keys
GROQ_API_KEY=your_groq_key          # console.groq.com — free
NOMIC_API_KEY=your_nomic_key        # atlas.nomic.ai — free

# Firebase Admin
# Set either the raw JSON content or a valid file path to your service account
FIREBASE_SERVICE_ACCOUNT=/absolute/path/to/firebase-service-account.json
# Example with raw JSON:
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Temp clone path
REPOS_CLONE_PATH=/tmp/ai-explorer-repos
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📡 API Reference

All routes require `Authorization: Bearer <firebase-id-token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/repos/clone` | Clone & index a GitHub repository |
| `GET` | `/api/repos/:id/status` | Get repo processing status + file count |
| `GET` | `/api/repos/:id/files` | List all files in the repo |
| `GET` | `/api/repos/:id/files/:fileId` | Get file content |
| `POST` | `/api/repos/:id/explain` | AI explanation of a specific file |
| `POST` | `/api/repos/:id/search` | Semantic search across the codebase |
| `POST` | `/api/repos/:id/chat` | Chat with the repository |
| `POST` | `/api/repos/:id/readme` | Generate a README.md |
| `GET` | `/api/repos/:id/architecture` | Get architecture analysis |
| `GET` | `/api/repos/:id/insights` | Real AI code quality scores + findings |
| `GET` | `/api/repos/:id/archaeology` | 🏺 Run Prompt Archaeology Engine |

### Example: Prompt Archaeology

```bash
curl -X GET http://localhost:5000/api/repos/{repoId}/archaeology \
  -H "Authorization: Bearer <token>"
```

```json
{
  "report": "# 🏺 Prompt Archaeology Report\n\n## 🧠 1. Original Product Idea\n\n..."
}
```

### Example: Chat with a repo

```bash
curl -X POST http://localhost:5000/api/repos/{repoId}/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "How does authentication work in this project?"}'
```

```json
{
  "answer": "## Answer\n\n### Quick Summary\n...",
  "sourcesUsed": ["src/middleware/auth.js", "src/config/passport.js"]
}
```

---

## ⚡ Performance

- **Bulk DB inserts** — all files inserted in a single query
- **Batch embeddings** — up to 100 chunks per API request
- **pgvector IVFFlat index** — sub-millisecond vector similarity search
- **Background processing** — repo indexing is async, frontend polls for status
- **Chunking strategy** — 800-char chunks with 100-char overlap
- **Result caching** — archaeology, insights, architecture cached after first run

---

## 🛡️ Security

- All API routes protected with Firebase JWT middleware
- `.env` files and service account key excluded from git
- Input validation on all endpoints
- Parameterized SQL queries — no injection risk
- CORS restricted to frontend URL only

---

## 🗺️ Roadmap

- [ ] Multi-repository chat (talk to multiple repos at once)
- [ ] PR review assistant
- [ ] Team collaboration & shared workspaces
- [ ] Folder-level AI explanations
- [ ] Code generation from natural language
- [ ] CI/CD integration (GitHub Actions analysis)
- [ ] Multi-model support (Claude, GPT-4, Gemini)
- [ ] Private repository support (OAuth token)
- [ ] Export analysis as PDF report
- [ ] VS Code extension

---

## 💼 Use Cases

| Persona | Use Case |
|---------|----------|
| 🧑‍💻 **New Developer** | Onboard to a new codebase in minutes instead of days |
| 🔍 **Open Source Contributor** | Understand project structure before making a PR |
| 👨‍💼 **Tech Lead** | Quickly audit code quality and architecture |
| 🎓 **Student** | Learn how real production codebases are structured |
| 🧪 **Code Reviewer** | Get AI-powered insights before reviewing a PR |
| 📄 **Documentation Writer** | Auto-generate accurate technical documentation |
| 🏺 **AI Researcher** | Reverse-engineer development intent and prompt patterns |

---

## 🏆 Why Recruiters Love This Project

| Skill | Evidence |
|-------|---------|
| **Full-Stack Engineering** | React 19 + Node.js/Express + PostgreSQL + Firebase |
| **AI/ML Integration** | RAG pipeline, vector embeddings, LLM prompt engineering |
| **Novel AI Feature** | Prompt Archaeology Engine — nothing like this exists publicly |
| **System Design** | Async processing, polling, bulk DB operations, caching |
| **Developer Tooling** | Solves a real problem developers face daily |
| **Security** | JWT auth, parameterized queries, env var management |
| **Product Thinking** | 8-tab UX designed around developer cognitive load |
| **Code Quality** | Clean architecture, separation of concerns, modular services |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m "feat: add amazing feature"`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 👤 Author

Built by **Thuppathi Nikitha**

---

<div align="center">

**If this project helped you, give it a ⭐ — it means a lot!**

*Built with ❤️ using React, Node.js, Groq, Nomic AI, and PostgreSQL*

</div>