import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

const SUGG = [
  'What does this project do?',
  'How does authentication work?',
  'What are the main API endpoints?',
  'How is the database structured?',
];

// ── Lightweight markdown renderer (no dependencies) ───────────────────────
function MarkdownBlock({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="md-code-block">
          {lang && <div className="md-code-lang">{lang}</div>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="md-h3">{inlineFormat(line.slice(4))}</h3>);
      i++; continue;
    }
    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="md-h2">{inlineFormat(line.slice(3))}</h2>);
      i++; continue;
    }
    // H1
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="md-h1">{inlineFormat(line.slice(2))}</h1>);
      i++; continue;
    }

    // Horizontal rule
    if (line.match(/^[-*]{3,}$/)) {
      elements.push(<hr key={i} className="md-hr" />);
      i++; continue;
    }

    // Table
    if (line.includes('|') && lines[i + 1]?.includes('|') && lines[i + 1]?.match(/\|[\s-]+\|/)) {
      const headers = line.split('|').map(c => c.trim()).filter(Boolean);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean));
        i++;
      }
      elements.push(
        <div key={`table-${i}`} className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>{headers.map((h, j) => <th key={j}>{inlineFormat(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{inlineFormat(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet list (collect consecutive items)
    if (line.match(/^[\*\-] /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[\*\-] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="md-ul">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="md-ol">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="md-blockquote">{inlineFormat(line.slice(2))}</blockquote>);
      i++; continue;
    }

    // Empty line → spacer
    if (line.trim() === '') {
      elements.push(<div key={i} className="md-spacer" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(<p key={i} className="md-p">{inlineFormat(line)}</p>);
    i++;
  }

  return <div className="md-root">{elements}</div>;
}

// Handle inline: **bold**, `code`, *italic*
function inlineFormat(text) {
  const parts = [];
  // Split on **bold**, `code`, *italic*
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const raw = m[0];
    if (raw.startsWith('**'))      parts.push(<strong key={m.index}>{raw.slice(2, -2)}</strong>);
    else if (raw.startsWith('`'))  parts.push(<code key={m.index} className="md-inline-code">{raw.slice(1, -1)}</code>);
    else if (raw.startsWith('*'))  parts.push(<em key={m.index}>{raw.slice(1, -1)}</em>);
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

// ── ChatPanel ─────────────────────────────────────────────────────────────
export default function ChatPanel({ repoId, repoName, initialMessage = '' }) {
  const [msgs, setMsgs] = useState([
    { role: 'assistant', content: `Hi! I've fully analyzed **${repoName}**. Ask me anything about this codebase — architecture, specific files, how features work, anything!` }
  ]);
  const [inp, setInp]       = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => { if (initialMessage) setInp(initialMessage); }, [initialMessage]);

  const send = async (e) => {
    e?.preventDefault();
    const msg = inp.trim();
    if (!msg || loading) return;
    setInp('');
    setMsgs(m => [...m, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const d = await api.chat(repoId, msg);
      setMsgs(m => [...m, { role: 'assistant', content: d.answer, sources: d.sourcesUsed }]);
    } catch (err) {
      setMsgs(m => [...m, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="chat-panel">
      <div className="chat-hdr">
        <div className="chat-hdr-info">
          <h2>💬 Chat with Repository</h2>
          <p>Talking about <strong style={{ color: 'var(--accent3)' }}>{repoName}</strong></p>
        </div>
        <div className="ai-status">
          <div className="ai-status-dot" /> AI Ready
        </div>
      </div>

      <div className="msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-av">{m.role === 'user' ? '👤' : '🤖'}</div>
            <div className="msg-body">
              {m.role === 'assistant'
                ? <MarkdownBlock content={m.content} />
                : <div className="msg-txt">{m.content}</div>
              }
              {m.sources?.length > 0 && (
                <div className="msg-srcs">
                  {m.sources.map((s, j) => <span key={j} className="src-tag">📄 {s}</span>)}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg assistant">
            <div className="msg-av">🤖</div>
            <div className="msg-body">
              <div className="typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {msgs.length === 1 && (
        <div className="chat-sugg">
          {SUGG.map(s => <button key={s} className="chip" onClick={() => setInp(s)}>{s}</button>)}
        </div>
      )}

      <form className="chat-foot" onSubmit={send}>
        <input
          className="chat-inp"
          placeholder="Ask about this codebase..."
          value={inp}
          onChange={e => setInp(e.target.value)}
          disabled={loading}
        />
        <button className="send-btn" type="submit" disabled={loading || !inp.trim()}>
          {loading ? <span className="spinner" /> : '→'}
        </button>
      </form>
    </div>
  );
}
