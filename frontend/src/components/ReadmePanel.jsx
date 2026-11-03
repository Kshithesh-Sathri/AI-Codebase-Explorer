import { useState } from 'react';
import { api } from '../services/api';

export default function ReadmePanel({ repoId, repoName }) {
  const [readme, setReadme] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true); setError('');
    try { const d = await api.generateReadme(repoId); setReadme(d.readme); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(readme);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([readme], {type:'text/markdown'}));
    a.download = 'README.md'; a.click();
  };

  return (
    <div className="panel">
      <div className="panel-hdr">
        <h2>📝 README Generator</h2>
        <p>AI generates a complete professional README.md for <strong style={{color:'var(--accent3)'}}>{repoName}</strong></p>
      </div>

      {!readme && !loading && (
        <div className="readme-prompt">
          <div className="readme-big-icon">📄</div>
          <div className="readme-desc">
            Generate a professional README with project overview, installation steps, API docs, tech stack, and more — all from your code.
          </div>
          <button className="btn-primary" style={{maxWidth:'280px'}} onClick={generate}>
            ✨ Generate README
          </button>
          {error && <div className="error-msg">{error}</div>}
        </div>
      )}

      {loading && (
        <div className="readme-load">
          <span className="spinner lg" />
          <p>Generating README with AI...</p>
          <p style={{fontSize:'12px',color:'var(--text3)'}}>This may take 10-20 seconds</p>
        </div>
      )}

      {readme && (
        <div className="readme-result">
          <div className="readme-actions">
            <button className="act-btn" onClick={copy}>{copied ? '✓ Copied!' : '📋 Copy'}</button>
            <button className="act-btn" onClick={download}>⬇ Download .md</button>
            <button className="act-btn" onClick={() => { setReadme(''); generate(); }}>🔄 Regenerate</button>
          </div>
          <pre className="readme-pre">{readme}</pre>
        </div>
      )}
    </div>
  );
}
