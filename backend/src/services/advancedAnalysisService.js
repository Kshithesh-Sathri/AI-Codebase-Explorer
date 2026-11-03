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

const chat = async(systemPrompt, userPrompt, maxTokens = 3000) => {
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

// ── SENIOR ENGINEER ANALYSIS ───────────────────────────────────────────────
export const analyzeRepositoryAsEngineer = async(repoName, techStack, files, architecture) => {
    const fileTree = files.map(f => f.path).slice(0, 150).join('\n');

    // Extract key files
    const keyFiles = files
        .filter(f => f.path.match(/main|app|server|index|routes|controller|model|database|config|auth|middleware/i))
        .slice(0, 15)
        .map(f => `### ${f.path}\n\`\`\`\n${(f.content || '').slice(0, 800)}\n\`\`\``)
        .join('\n\n');

    const text = await chat(
        `You are a senior software engineer with 15+ years of experience.
You analyze codebases thoroughly like you would in a technical interview.
Be direct, specific, and insightful. Use technical depth.`,

        `Analyze this repository from a senior engineer's perspective. Return ONLY valid JSON with NO markdown formatting:

{
  "projectPurpose": "Clear one-liner: what does this project DO?",
  "highlevelArchitecture": "2-3 sentences: how are components organized? What's the overall pattern?",
  "folderStructure": {
    "frontend": "What does this layer handle?",
    "backend": "What does this layer handle?",
    "database": "How is data persisted?",
    "infrastructure": "Deployment, config, etc."
  },
  "requestLifecycle": [
    "HTTP request comes in",
    "Hits [specific route file/handler]",
    "Calls [controller/service]",
    "Queries [specific model/repository]",
    "Returns response"
  ],
  "authenticationFlow": "How does auth work? JWT? Sessions? OAuth? Be specific with actual implementation details.",
  "databaseSchema": "Main tables/collections and their relationships. Example: 'Users → Posts (1:many), Posts → Comments (1:many)'",
  "designPatterns": [
    "Pattern 1 (e.g., Repository Pattern, Factory, Middleware Chain, MVC, etc.) - where it's used"
  ],
  "keyFeatures": [
    "Feature 1 - brief description",
    "Feature 2 - brief description"
  ],
  "strengths": [
    "Well-organized separation of concerns",
    "Specific architectural decision that shows good engineering"
  ],
  "forTechnicalInterview": "What would you say about this project? Start with problem it solves, architecture, then interesting technical details. 2-3 paragraphs.",
  "technicalDepth": "Anything complex, interesting, or production-ready about this codebase?"
}

Repository: ${repoName}
Tech Stack: ${techStack.join(', ')}
Total Files: ${files.length}

File structure:
${fileTree}

Key source files:
${keyFiles}

Architecture notes:
${architecture || 'Not analyzed'}

Respond with ONLY the JSON object, no other text.`,
        4000
    );

    try {
        const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('JSON parse error:', e.message);
        return {
            projectPurpose: text,
            highlevelArchitecture: '',
            folderStructure: {},
            requestLifecycle: [],
            authenticationFlow: '',
            databaseSchema: '',
            designPatterns: [],
            keyFeatures: [],
            strengths: [],
            forTechnicalInterview: '',
            technicalDepth: ''
        };
    }
};

// ── ENHANCED FILE EXPLANATION ──────────────────────────────────────────────
export const explainFileDeep = async(filePath, fileContent, language, context = {}) => {
    const text = await chat(
        `You are a senior code reviewer explaining code to a developer.
Be technical, specific, and educational.
Always respond with valid JSON only.`,

        `Deep analysis of this file. Return ONLY valid JSON:

{
  "whatItDoes": "One sentence: the file's core responsibility",
  "whyItMatters": "Why does this file exist? What problem does it solve in the larger system?",
  "architecture": {
    "pattern": "Design pattern used (MVC, Repository, Middleware, Factory, etc.)",
    "responsibilities": ["Responsibility 1", "Responsibility 2"],
    "interfaces": ["What functions/classes does this expose?"]
  },
  "publicAPI": [
    {
      "name": "functionName",
      "input": "parameter types and meaning",
      "output": "what it returns and why",
      "usage": "when/why you'd call this"
    }
  ],
  "dependencies": [
    {
      "name": "dependency name",
      "why": "why is it needed here?",
      "impact": "what breaks if it's missing?"
    }
  ],
  "dataFlow": "Step-by-step: how data moves through this file. Reference actual function names.",
  "integrationPoints": "How does this file connect to other parts of the system?",
  "performance": "Any performance considerations? Optimizations? Bottlenecks?",
  "testing": "How would you test this file? What's hard to test?",
  "codeQuality": {
    "score": 1-10,
    "strengths": ["Specific strength"],
    "improvements": ["Specific improvement"],
    "readability": "Is it easy to understand? Why/why not?"
  },
  "technicalNotes": "Any complex logic? Gotchas? Clever solutions?"
}

File: ${filePath}
Language: ${language}

\`\`\`${language}
${fileContent.slice(0, 12000)}
\`\`\``,
        3000
    );

    try {
        const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return { whatItDoes: text, architecture: {}, publicAPI: [] };
    }
};

// ── SYSTEM DESIGN ANALYSIS ─────────────────────────────────────────────────
export const analyzeSystemDesign = async(repoName, files, architecture) => {
    const componentNames = files
        .map(f => f.path.split('/').slice(-1)[0])
        .filter(f => !f.match(/^\./))
        .slice(0, 50)
        .join(', ');

    const text = await chat(
        `You are a system design expert. Analyze this codebase's architecture.
Respond with valid JSON only.`,

        `System design analysis. Return ONLY valid JSON:

{
  "architectural_pattern": "What's the overall architecture? Monolith? Microservices? Layered? MVC?",
  "layers": [
    {
      "name": "Layer name",
      "responsibility": "What does this layer do?",
      "example_components": ["Component 1", "Component 2"]
    }
  ],
  "dataFlow": "ASCII diagram of how requests flow through the system",
  "scalability": {
    "bottlenecks": ["Potential bottleneck 1"],
    "improvements": ["How to scale this component"]
  },
  "reliabilityAndFaultTolerance": {
    "current": "What happens when something fails?",
    "improvements": ["Add circuit breaker", "Add retries"]
  },
  "securityConsiderations": {
    "good": ["Security practice 1"],
    "concerns": ["Security concern 1"]
  },
  "technologyChoices": {
    "appropriate": ["Why this tech choice is good"],
    "trade_offs": ["Trade-off of this choice"]
  }
}

Repository: ${repoName}
Components: ${componentNames}
Architecture: ${architecture || 'Unknown'}`,
        3000
    );

    try {
        const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return { architectural_pattern: text, layers: [], dataFlow: '' };
    }
};

export default {
    analyzeRepositoryAsEngineer,
    explainFileDeep,
    analyzeSystemDesign
};