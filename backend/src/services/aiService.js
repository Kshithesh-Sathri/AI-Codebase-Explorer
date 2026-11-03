import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

let _groq = null;
const getGroq = () => {
    if (!_groq) {
        if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set in .env');
        _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return _groq;
};

const chat = async(systemPrompt, userPrompt, maxTokens = 2000) => {
    const response = await getGroq().chat.completions.create({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.3
    });
    return response.choices[0].message.content.trim();
};

// ── 1. EXPLAIN FILE ────────────────────────────────────────────────────────
export const explainFileWithAI = async(filePath, fileContent, language) => {
    const text = await chat(
        `You are a senior software engineer doing a thorough code review. 
You explain code clearly, specifically, and technically.
Always respond with valid JSON only — no markdown, no backticks, no preamble.`,

        `Analyze this ${language} file deeply and return a JSON object with these exact keys:

{
  "purpose": "One precise sentence: what does this file DO and WHY does it exist in this project?",
  "summary": "3-4 sentences covering: what problem it solves, how it fits in the architecture, key design decisions made",
  "functions": [
    {
      "name": "exact function/method name",
      "signature": "functionName(param1: type, param2: type): returnType",
      "description": "What it does, what it returns, any side effects",
      "complexity": "simple|moderate|complex"
    }
  ],
  "dependencies": [
    {
      "name": "module name",
      "purpose": "why this dependency is used here"
    }
  ],
  "flow": "Step-by-step walkthrough of the main execution flow, referencing actual function names",
  "keyPoints": [
    "Specific technical insight about this file",
    "Any patterns used (e.g. middleware pattern, factory pattern)",
    "Potential issues or things to watch out for",
    "Performance considerations if any"
  ],
  "codeQuality": {
    "score": 8,
    "strengths": ["specific strength 1", "specific strength 2"],
    "improvements": ["specific improvement suggestion"]
  }
}

File path: ${filePath}

\`\`\`${language}
${fileContent.slice(0, 8000)}
\`\`\``,
        2500
    );

    try {
        const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return { purpose: text, summary: '', functions: [], dependencies: [], flow: '', keyPoints: [], codeQuality: null };
    }
};

// ── 2. CHAT WITH REPO ──────────────────────────────────────────────────────
export const chatWithRepoAI = async(question, contextChunks, repoName, techStack) => {
    const context = contextChunks
        .map((c, i) => `[Source ${i + 1}] 📄 ${c.filePath}\n${'─'.repeat(40)}\n${c.chunkText}`)
        .join('\n\n');

    return await chat(
        `You are a senior software architect and repository analysis expert who has thoroughly studied the "${repoName}" codebase.
Tech Stack: ${techStack.join(', ') || 'Unknown'}
Your goal is to help developers understand the repository quickly and accurately.

STRICT RESPONSE RULES:
1. NEVER return one large paragraph.
2. ALWAYS use clean Markdown formatting.
3. Use headings, subheadings, bullet points, numbered lists, tables, and code blocks where appropriate.
4. Mention exact file names, function names, classes, APIs, and modules whenever available.
5. Reference the provided source files directly.
6. Explain architecture decisions and likely reasoning behind implementations.
7. Keep explanations concise, structured, and easy to scan.
8. Highlight important findings using **bold text**.
9. When showing code, use fenced code blocks with the correct language.
10. If information is not present in the provided context, clearly state: "This information is not available in the retrieved repository context."

RESPONSE TEMPLATE:
## Answer

### Quick Summary
Provide a short 2-4 sentence overview.

### Relevant Files
List the most relevant files involved.

### Key Findings
Use bullet points.

### Detailed Explanation
Explain the implementation in structured sections.

### Code References
Include relevant snippets from the repository when helpful.

### Architecture Notes
Explain patterns, design choices, dependencies, and reasoning.

### Related Components
Mention other files, services, APIs, models, or modules connected to the answer.

### Limitations / Missing Information
State anything that cannot be confirmed from the provided context.

ADDITIONAL RULES:
* For "How does X work?" questions, explain the flow step-by-step.
* For architecture questions, include component relationships.
* For database questions, include schemas, models, relations, plugins, and data flow if available.
* For API questions, include routes, controllers, services, validation, and response structure.
* For authentication questions, include middleware, JWT handling, permissions, guards, and user flow.
* For frontend questions, include components, state management, hooks, APIs, and routing.
* Prefer bullets over long paragraphs.
* Prefer tables when comparing multiple items.
* Make the answer look like professional technical documentation.`,

        `Relevant code from the repository:

${context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Developer question: ${question}

Provide a thorough, specific answer referencing actual code from the sources above. Follow the response template strictly.`,
        3000
    );
};

// ── 3. README GENERATOR ────────────────────────────────────────────────────
export const generateReadmeWithAI = async(repoName, techStack, files, architecture) => {
    const fileTree = files.map(f => f.path).slice(0, 100).join('\n');
    const importantFiles = files
        .filter(f => f.path.match(/index|main|app|server|router|route|controller|model|schema|config|package\.json|requirements|dockerfile/i))
        .slice(0, 8)
        .map(f => `### ${f.path}\n\`\`\`\n${(f.content || '').slice(0, 1000)}\n\`\`\``)
        .join('\n\n');

    const projectShortName = repoName.split('/')[1] || repoName;

    return await chat(
        `You are a senior developer writing a world-class GitHub README that will impress hiring managers and other developers.
Rules:
- Be SPECIFIC — use actual file names, function names, routes from the code
- NEVER use placeholder text like "your_value_here" — infer real values from code
- Write like a real developer, not an AI
- Include real working code examples
- Make every section earn its place — no filler`,

        `Generate a STUNNING, PRODUCTION-QUALITY README.md.

Project: ${repoName}
Tech Stack: ${techStack.join(', ') || 'unknown'}

File structure:
${fileTree}

Key source files with actual code:
${importantFiles}

Write this EXACT structure, every section filled with REAL specific details:

# ${projectShortName}

<div align="center">

[Generate 4-6 relevant shields.io badges based on ACTUAL tech stack - e.g. Node.js, Express, PostgreSQL etc]

**[One powerful tagline describing exactly what this project does]**

[⭐ Star this repo](https://github.com/${repoName}) · [🐛 Report Bug](https://github.com/${repoName}/issues) · [✨ Request Feature](https://github.com/${repoName}/issues)

</div>

---

## 📖 About

[2-3 specific sentences about what this project does, what problem it solves, who it's for. Reference actual features found in the code.]

## ✨ Features

[List 6-10 features. Each one should reference actual code. Format: **Feature Name** — specific detail]

## 🚀 Quick Start

### Prerequisites

[List exact prerequisites with version numbers inferred from package.json/code]

### Installation

\`\`\`bash
# Clone the repo
git clone https://github.com/${repoName}.git
cd ${projectShortName}

# Install dependencies  
[actual install command based on package manager detected]

# Copy environment file
cp .env.example .env
# Edit .env with your values

# [any database setup steps if applicable]

# Start development server
[actual dev command from package.json]
\`\`\`

## ⚙️ Configuration

\`\`\`env
[List REAL environment variables inferred from the actual code - no made up ones]
\`\`\`

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
[REAL variables with actual descriptions from code]

## 📁 Project Structure

\`\`\`
${projectShortName}/
[Show ACTUAL structure, max 2 levels deep, with inline comments explaining each folder]
\`\`\`

## 🔌 API Documentation

[Only include if it's a backend/API project]

### Base URL
\`\`\`
http://localhost:[actual port]/api
\`\`\`

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
[REAL endpoints from actual route files]

### Examples

**[Actual endpoint name]**
\`\`\`bash
curl -X POST http://localhost:3000/api/[real endpoint] \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <token>" \\
  -d '{[real request body based on actual code]}'
\`\`\`

\`\`\`json
// Response
{
  [realistic response structure based on actual controllers/models]
}
\`\`\`

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
[REAL scripts from package.json with accurate descriptions]

## 🏗️ Architecture

\`\`\`
[ASCII diagram showing actual architecture - layers, data flow, key components]
\`\`\`

[2-3 sentences explaining the architectural pattern and key design decisions visible in the code]

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
[ACTUAL dependencies from package.json with their real purpose in this project]

## 🧪 Testing

\`\`\`bash
[actual test commands from package.json]
\`\`\`

[Brief description of testing approach if test files exist]

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'feat: add AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See \`LICENSE\` for more information.

---

<div align="center">
  <strong>Built with ❤️ — Give it a ⭐ if you found it useful!</strong>
</div>

CRITICAL: Every single section must contain REAL, SPECIFIC content from the actual codebase. Zero placeholder text. Zero generic descriptions. This must look like it was written by the actual developer of this project.`,
        4000
    );
};

// ── 4. ARCHITECTURE OVERVIEW ───────────────────────────────────────────────
export const generateArchitectureWithAI = async(repoName, techStack, files) => {
    const fileTree = files.map(f => f.path).slice(0, 80).join('\n');
    const packageFile = files.find(f => f.path === 'package.json');
    const packageContent = packageFile && packageFile.content ? packageFile.content.slice(0, 1000) : '';

    const text = await chat(
        `You are a software architect. Analyze codebases and identify architecture patterns, layers, and data flows.
Always respond with valid JSON only — no markdown, no backticks.`,

        `Analyze this project's architecture deeply and return JSON:

{
  "overview": "3-4 sentences describing the overall architecture, patterns used, and key design decisions",
  "type": "monolith|microservice|serverless|MVC|layered|event-driven",
  "layers": [
    {
      "name": "Layer name (e.g. API Layer, Business Logic, Data Access)",
      "description": "What this layer does and its responsibilities",
      "files": ["actual file paths that belong to this layer"],
      "pattern": "design pattern used in this layer"
    }
  ],
  "dataFlow": "Detailed description of how data flows through the system from request to response",
  "diagram": "Multi-line ASCII diagram showing the actual architecture with real component names",
  "patterns": ["Specific patterns found: e.g. Repository Pattern, Middleware Chain, MVC, JWT Auth"],
  "entryPoints": ["main entry files with their purpose"],
  "externalServices": ["external services/APIs this project connects to"],
  "strengths": ["architectural strength 1", "architectural strength 2"],
  "considerations": ["something to be aware of about this architecture"]
}

Project: ${repoName}
Tech Stack: ${techStack.join(', ')}
package.json: ${packageContent}

File tree:
${fileTree}`,
        2500
    );

    try {
        const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return { overview: text, layers: [], dataFlow: '', diagram: '', patterns: [], type: 'unknown' };
    }
};

// ── 5. REPO SUMMARY ────────────────────────────────────────────────────────
export const generateRepoSummaryWithAI = async(repoName, techStack, fileCount, sampleFiles) => {
    const sample = sampleFiles.slice(0, 5)
        .map(f => `${f.path}:\n${(f.content || '').slice(0, 400)}`)
        .join('\n\n');

    return await chat(
        `You are a developer writing a sharp, impressive one-paragraph project summary for a GitHub README.
Be specific, technical, and compelling. Never be vague.`,

        `Write a 2-3 sentence summary for this project.

Requirements:
- Mention the specific tech stack
- Describe what it actually does (not just "a web app")
- Mention 1-2 standout features visible in the code
- Sound like a developer wrote it, not an AI

Repo: ${repoName}
Tech Stack: ${techStack.join(', ')}
Total Files: ${fileCount}

Sample code:
${sample}`,
        500
    );
};

// ── 6. EMBEDDINGS (Cohere) ─────────────────────────────────────────────────
import { CohereClient } from 'cohere-ai';

let _cohere = null;
const getCohere = () => {
    if (!_cohere) {
        if (!process.env.COHERE_API_KEY) throw new Error('COHERE_API_KEY is not set in .env');
        _cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
    }
    return _cohere;
};

export const generateEmbedding = async(text) => {
    const response = await getCohere().embed({
        texts: [text],
        model: 'embed-english-v3.0',
        inputType: 'search_query',
        embeddingTypes: ['float']
    });
    return response.embeddings.float[0];
};
// ── 7. REAL CODE QUALITY SCORES ────────────────────────────────────────────
export const generateInsightsWithAI = async(repoName, techStack, files) => {
    // Build a rich sample: pick key files across different types
    const keyFiles = files
        .filter(f => f.content && f.content.trim().length > 50)
        .sort((a, b) => {
            const priority = (p) => {
                if (p.match(/middleware|auth|security|guard/i)) return 0;
                if (p.match(/route|controller|handler/i)) return 1;
                if (p.match(/model|schema|entity/i)) return 2;
                if (p.match(/service|util|helper/i)) return 3;
                if (p.match(/index|app|server|main/i)) return 4;
                return 5;
            };
            return priority(a.path) - priority(b.path);
        })
        .slice(0, 12);

    const filesSample = keyFiles
        .map(f => `// ${f.path}\n${f.content.slice(0, 600)}`)
        .join('\n\n---\n\n');

    const filePaths = files.map(f => f.path).join('\n');

    const text = await chat(
        `You are a senior software engineer performing a real code quality audit.
Analyze the provided code carefully and return ONLY valid JSON — no markdown, no backticks, no explanation.
Base your scores on ACTUAL evidence found in the code, not assumptions.`,

        `Analyze this codebase and return a JSON object with REAL scores based on what you actually see in the code.

Project: ${repoName}
Tech Stack: ${techStack.join(', ')}
Total files: ${files.length}

File structure:
${filePaths.slice(0, 2000)}

Key source files:
${filesSample}

Return this exact JSON structure:

{
  "scores": {
    "security": <integer 0-100>,
    "maintainability": <integer 0-100>,
    "architecture": <integer 0-100>,
    "health": <integer 0-100>
  },
  "scoreReasons": {
    "security": "1-2 sentences explaining exactly why this security score was given, referencing specific files or patterns",
    "maintainability": "1-2 sentences explaining exactly why this maintainability score was given",
    "architecture": "1-2 sentences explaining exactly why this architecture score was given",
    "health": "1-2 sentences explaining exactly why this health score was given"
  },
  "strengths": [
    "Specific strength referencing actual code or file found",
    "Another specific strength",
    "Another specific strength"
  ],
  "risks": [
    "Specific risk or issue found in the actual code",
    "Another specific risk"
  ],
  "recommendations": [
    "Specific actionable recommendation based on actual code",
    "Another specific recommendation",
    "Another specific recommendation"
  ],
  "codeSmells": [
    "Specific code smell found (or 'None detected' if clean)"
  ],
  "securityFindings": [
    "Specific security pattern found — e.g. JWT validation in middleware.js, bcrypt in user.model.js (or 'No issues found')"
  ]
}

SCORING GUIDE — be strict and realistic:
- Security (0-100): Check for: input validation, auth middleware, JWT handling, bcrypt/hashing, rate limiting, helmet/CORS, no hardcoded secrets, parameterized queries
- Maintainability (0-100): Check for: file length (under 300 lines is good), function decomposition, clear naming, consistent patterns, separation of concerns, comments/JSDoc
- Architecture (0-100): Check for: clear folder structure (routes/controllers/services/models), no god files, single responsibility, dependency injection patterns, no circular logic
- Health (0-100): Average of other scores weighted: (security*0.3 + maintainability*0.3 + architecture*0.4)

Be honest — a score of 60 means average, 80 means good, 90+ means excellent. Most real projects score 55-80.`,
        2000
    );

    try {
        const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        return JSON.parse(cleaned);
    } catch {
        // Fallback if JSON parse fails
        return {
            scores: { security: 65, maintainability: 68, architecture: 70, health: 68 },
            scoreReasons: {
                security: 'Could not analyze — default score applied.',
                maintainability: 'Could not analyze — default score applied.',
                architecture: 'Could not analyze — default score applied.',
                health: 'Could not analyze — default score applied.'
            },
            strengths: ['Code structure appears organized'],
            risks: ['Manual review recommended'],
            recommendations: ['Add automated testing'],
            codeSmells: ['None detected'],
            securityFindings: ['Manual security audit recommended']
        };
    }
};

// ── 8. PROMPT ARCHAEOLOGY ENGINE 🏺 ────────────────────────────────────────
export const runPromptArchaeology = async(repoName, techStack, files, architecture) => {
    const fileTree = files.map(f => f.path).slice(0, 120).join('\n');

    const keyFiles = files
        .filter(f => f.content && f.content.trim().length > 50)
        .sort((a, b) => {
            const rank = p =>
                p.match(/package\.json|requirements\.txt|go\.mod/i) ? 0 :
                p.match(/readme/i) ? 1 :
                p.match(/index|app|server|main/i) ? 2 :
                p.match(/route|controller|handler/i) ? 3 :
                p.match(/model|schema|entity/i) ? 4 :
                p.match(/service|util|helper/i) ? 5 : 6;
            return rank(a.path) - rank(b.path);
        })
        .slice(0, 15)
        .map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 800)}\n\`\`\``)
        .join('\n\n');

    const archContext = architecture ?
        `\nArchitecture analysis:\n${typeof architecture === 'string' ? architecture.slice(0, 1000) : JSON.stringify(architecture).slice(0, 1000)}` :
        '';

    return await chat(
        `You are an expert software architect and AI reverse-engineering specialist with 20 years of experience.
Your job is to deeply analyze a codebase and reconstruct the original vision, blueprint, and prompts that likely guided its creation.
You are a detective of software intent — reading between the lines of code to find the original human vision behind it.
Output in rich, professional Markdown. Be specific, insightful, and authoritative.`,

        `Analyze this repository and produce a complete **Prompt Archaeology Report**.

# Repository Information
**Project:** ${repoName}
**Tech Stack:** ${techStack.join(', ')}
${archContext}

# File Structure
\`\`\`
${fileTree}
\`\`\`

# Key Source Files
${keyFiles}

---

Produce the following report in this EXACT structure:

---

# 🏺 Prompt Archaeology Report
## *${repoName}*

> *This report reconstructs the most probable original vision, blueprint, and development prompts inferred from repository evidence. No claim is made that these are exact originals.*

---

## 🧠 1. Original Product Idea

[2-3 paragraphs inferring the original idea behind this project. What was the developer trying to build? What inspired it? Reference specific code evidence.]

---

## 🎯 2. Problem Being Solved

**Primary Problem:**
[One sentence — the core problem]

**Secondary Problems:**
- [Specific problem inferred from code]
- [Specific problem inferred from code]
- [Specific problem inferred from code]

**Evidence from repository:**
[Point to specific files, patterns, or implementations that reveal the problem being solved]

---

## 👥 3. Target Users

| User Type | Description | Evidence |
|-----------|-------------|----------|
| Primary   | [Who]       | [File/pattern that reveals this] |
| Secondary | [Who]       | [File/pattern that reveals this] |

---

## ⭐ 4. Core Features (Reconstructed)

[List ALL features inferred from the codebase, referencing actual files]

| # | Feature | Evidence | Priority |
|---|---------|----------|----------|
| 1 | [Feature] | [File] | P0 |
| 2 | [Feature] | [File] | P1 |
...

---

## 📋 5. Reconstructed PRD (Product Requirements Document)

### Overview
[Brief product overview]

### Goals
- [Goal 1]
- [Goal 2]

### User Stories
- As a [user], I want to [action] so that [benefit]
[Generate 6-8 user stories based on actual implemented features]

### Success Metrics
[What metrics would this product optimize for, inferred from design decisions]

---

## 🏗️ 6. Development Phases (Reconstructed Timeline)

### Phase 1 — MVP
[What was likely built first, based on core files and architecture]
Files: [specific files]

### Phase 2 — Core Features
[What was built next]
Files: [specific files]

### Phase 3 — Polish & Advanced Features
[What was added later, based on complexity patterns]
Files: [specific files]

---

## ⚙️ 7. Technical Architecture Rationale

### Why this tech stack?
[Explain WHY each technology was likely chosen, referencing specific usage patterns]

| Technology | Why Chosen | Evidence |
|------------|-----------|----------|
| [Tech]     | [Reason]  | [File]   |

### Architecture Pattern
[Identify the architectural pattern: MVC, microservices, layered, etc. and explain WHY it was chosen]

### Key Design Decisions
- **[Decision]:** [Why this decision was likely made]
- **[Decision]:** [Why this decision was likely made]

---

## 🗄️ 8. Database Design Rationale

[Analyze the database schema/models and explain the design decisions]

- Why these tables/collections?
- Relationships inferred
- Indexing decisions
- Scaling considerations that influenced design

---

## 🔌 9. API Design Rationale

[Analyze the API routes and explain the design philosophy]

- REST vs GraphQL choice
- Route naming conventions
- Auth patterns
- Response structure philosophy

---

## 🎨 10. Frontend Architecture Rationale

[Analyze the frontend structure and explain decisions]

- Component organization philosophy
- State management approach
- UI/UX decisions inferred from component names and structure

---

## 🗺️ 11. Probable Roadmap (MVP → Production)

\`\`\`
MVP (Week 1-2)
→ [Features based on simplest/core files]

v0.2 (Week 3-4)
→ [Features based on moderate complexity additions]

v0.5 (Month 2)
→ [Features inferred from more complex patterns]

v1.0 (Month 3)
→ [Full production features]

Future
→ [Patterns suggesting planned but not implemented features]
\`\`\`

---

## 📄 12. System Design Summary

\`\`\`
[ASCII diagram of the system architecture inferred from code]
\`\`\`

---

## 🔨 13. Step-by-Step Build Plan

If someone wanted to rebuild this from scratch:

1. **Step 1:** [Setup — based on project configuration files]
2. **Step 2:** [Core foundation — based on entry point files]
3. **Step 3:** [Data layer — based on models/schema files]
4. **Step 4:** [Business logic — based on service files]
5. **Step 5:** [API layer — based on route/controller files]
6. **Step 6:** [Frontend — based on component structure]
7. **Step 7:** [AI integration — based on AI service files]
8. **Step 8:** [Testing and polish — based on test files or lack thereof]

---

## 🤖 14. Reconstructed AI Prompts

*The following prompts are the most probable prompts the developer may have used when building this project. These are inferences based on code evidence, not exact reproductions.*

---

### 🏆 Prompt #1 — Most Probable (Initial Architecture Prompt)

**Confidence Score:** [X/10]

**Reconstructed Prompt:**
\`\`\`
[Write the most probable initial prompt the developer used — 100-200 words]
\`\`\`

**Supporting Evidence:**
- [Specific file or pattern that supports this inference]
- [Another piece of evidence]

**Missing Assumptions:**
- [What we cannot know for certain]
- [Another uncertainty]

---

### 🥈 Prompt #2 — Probable (Feature Implementation Prompt)

**Confidence Score:** [X/10]

**Reconstructed Prompt:**
\`\`\`
[Write a probable prompt for a specific feature — 100-200 words]
\`\`\`

**Supporting Evidence:**
- [Evidence]
- [Evidence]

**Missing Assumptions:**
- [Uncertainty]

---

### 🥉 Prompt #3 — Speculative (Design/Architecture Decision Prompt)

**Confidence Score:** [X/10]

**Reconstructed Prompt:**
\`\`\`
[Write a more speculative prompt — 100-200 words]
\`\`\`

**Supporting Evidence:**
- [Evidence]

**Missing Assumptions:**
- [Uncertainty]

---

## 💡 15. Archaeology Insights

[3-5 fascinating insights about this codebase that a developer reading this would find genuinely interesting and surprising — things that reveal the developer's intent, priorities, or evolution of thinking]

---

*Report generated by Prompt Archaeology Engine — AI Codebase Explorer*
*Confidence methodology: Evidence-based inference from repository structure, naming patterns, code complexity, and architectural decisions.*`,
        4000
    );
};