import { useState } from 'react';
import { api } from '../services/api';

// Reuse the MarkdownBlock renderer from ChatPanel
function MarkdownBlock({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      elements.push(
        <div key={i} className="md-code-block">
          {lang && <div className="md-code-lang">{lang}</div>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      i++; continue;
    }
    if (line.startsWith('### ')) { elements.push(<h3 key={i} className="md-h3">{inlineFormat(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith('## '))  { elements.push(<h2 key={i} className="md-h2">{inlineFormat(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith('# '))   { elements.push(<h1 key={i} className="md-h1">{inlineFormat(line.slice(2))}</h1>); i++; continue; }
    if (line.match(/^[-*]{3,}$/)) { elements.push(<hr key={i} className="md-hr" />); i++; continue; }

    if (line.includes('|') && lines[i+1]?.match(/\|[\s-]+\|/)) {
      const headers = line.split('|').map(c => c.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) { rows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean)); i++; }
      elements.push(
        <div key={`t${i}`} className="md-table-wrap">
          <table className="md-table">
            <thead><tr>{headers.map((h,j) => <th key={j}>{inlineFormat(h)}</th>)}</tr></thead>
            <tbody>{rows.map((row,ri) => <tr key={ri}>{row.map((cell,ci) => <td key={ci}>{inlineFormat(cell)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.match(/^[\*\-] /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[\*\-] /)) { items.push(lines[i].slice(2)); i++; }
      elements.push(<ul key={`ul${i}`} className="md-ul">{items.map((it,j) => <li key={j}>{inlineFormat(it)}</li>)}</ul>);
      continue;
    }
    if (line.match(/^\d+\. /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /,'')); i++; }
      elements.push(<ol key={`ol${i}`} className="md-ol">{items.map((it,j) => <li key={j}>{inlineFormat(it)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith('> ')) { elements.push(<blockquote key={i} className="md-blockquote">{inlineFormat(line.slice(2))}</blockquote>); i++; continue; }
    if (line.trim() === '') { elements.push(<div key={i} className="md-spacer" />); i++; continue; }
    elements.push(<p key={i} className="md-p">{inlineFormat(line)}</p>);
    i++;
  }
  return <div className="md-root">{elements}</div>;
}

function inlineFormat(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const raw = m[0];
    if (raw.startsWith('**'))     parts.push(<strong key={m.index}>{raw.slice(2,-2)}</strong>);
    else if (raw.startsWith('`')) parts.push(<code key={m.index} className="md-inline-code">{raw.slice(1,-1)}</code>);
    else if (raw.startsWith('*')) parts.push(<em key={m.index}>{raw.slice(1,-1)}</em>);
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

export default function ArchaeologyPanel({ repoId, repoName }) {
  const [report, setReport]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [started, setStarted] = useState(false);

  const run = async () => {
    setStarted(true);
    setLoading(true);
    setError('');
    setReport('');
    try {
      const data = await api.getArchaeology(repoId);
      setReport(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="arch-panel">
      {/* Header */}
      <div className="arch-panel-hdr">
        <div className="arch-panel-title-row">
          <div>
            <div className="arch-panel-eyebrow">🏺 Experimental AI Feature</div>
            <h1 className="arch-panel-title">Prompt Archaeology Engine</h1>
            <p className="arch-panel-sub">
              Reverse-engineers the original vision, blueprint, and AI prompts that likely guided the creation of <strong style={{color:'var(--primary)'}}>{repoName}</strong>
            </p>
          </div>
        </div>

        {!started && (
          <div className="arch-panel-intro">
            <div className="arch-features">
              {[
                { icon: '🧠', label: 'Original product idea reconstruction' },
                { icon: '📋', label: 'Full PRD & development blueprint' },
                { icon: '🗺️', label: 'MVP → Production roadmap' },
                { icon: '🤖', label: '3 reconstructed AI prompts with confidence scores' },
                { icon: '💡', label: 'Archaeology insights & design decision analysis' },
                { icon: '⚙️', label: 'Tech stack rationale & architecture inference' },
              ].map(f => (
                <div key={f.label} className="arch-feature-item">
                  <span className="arch-feature-icon">{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
            <div className="arch-warning">
              ⚡ This analysis takes 30-60 seconds. The AI reads every file and reconstructs intent.
            </div>
            <button className="arch-run-btn" onClick={run}>
              🏺 Run Prompt Archaeology
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="arch-loading">
          <div className="arch-loading-inner">
            <div className="arch-loading-orb" />
            <div className="arch-loading-title">Archaeology Engine Running…</div>
            <div className="arch-loading-steps">
              {[
                'Parsing repository structure…',
                'Inferring original product intent…',
                'Reconstructing development blueprint…',
                'Generating PRD & system design…',
                'Reverse-engineering AI prompts…',
                'Compiling archaeology report…',
              ].map((step, i) => (
                <div key={i} className="arch-loading-step">
                  <span className="arch-step-dot" style={{ animationDelay: `${i * 0.4}s` }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '24px' }}>
          <div className="error-msg">⚠ {error}</div>
          <button className="arch-run-btn" onClick={run} style={{ marginTop: '16px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div className="arch-report">
          <div className="arch-report-toolbar">
            <span style={{ color: 'var(--text3)', fontSize: '12px' }}>
              ✅ Analysis complete — {report.length.toLocaleString()} characters
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="arch-tool-btn"
                onClick={() => navigator.clipboard.writeText(report)}
              >
                📋 Copy
              </button>
              <button
                className="arch-tool-btn"
                onClick={() => {
                  const blob = new Blob([report], { type: 'text/markdown' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${repoName.replace('/', '-')}-archaeology.md`;
                  a.click();
                }}
              >
                ⬇️ Download
              </button>
              <button className="arch-tool-btn" onClick={run}>
                🔄 Re-run
              </button>
            </div>
          </div>
          <div className="arch-report-body">
            <MarkdownBlock content={report} />
          </div>
        </div>
      )}
    </div>
  );
}
