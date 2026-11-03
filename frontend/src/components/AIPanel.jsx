import { useState, useEffect } from 'react';
import { api } from '../services/api';

const DEFAULT_SUGGESTIONS = [
  'How does authentication flow through this codebase?',
  'Which files control API routing?',
  'Where are services and controllers connected?',
  'What are the main security risks?',
  'Which files are most important to review first?',
];

const safeJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return value; }
};

export default function AIPanel({ repoId, file, repoSummary, architecture }) {
  const [expl, setExpl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setExpl(null);
    setError('');
    if (file?.id) {
      analyzeFile(file.id);
    }
  }, [file?.id]);

  const analyzeFile = async (fileId) => {
    setLoading(true);
    setError('');
    try {
      let data = await api.explainFile(repoId, fileId);
      if (data?.purpose && typeof data.purpose === 'string' && data.purpose.trim().startsWith('{')) {
        try { data = JSON.parse(data.purpose); } catch {}
      }
      setExpl(safeJson(data) || { summary: String(data) });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const qualityColor = (score) => {
    if (typeof score !== 'number') return 'var(--accent)';
    if (score >= 8) return 'var(--green)';
    if (score >= 6) return 'var(--yellow)';
    return 'var(--red)';
  };

  return (
    <div className="ai-area">
      <div className="ai-hdr">
        <div>
          <span className="ai-hdr-icon">🧠</span>
          <span className="ai-hdr-title">AI Analysis</span>
        </div>
        {expl?.codeQuality?.score && (
          <span className="score-pill" style={{ color: qualityColor(expl.codeQuality.score) }}>
            {expl.codeQuality.score}/10
          </span>
        )}
      </div>

      <div className="ai-scroll">
        {!file && (
          <div className="ai-empty">
            <div className="repo-summary-box">
              <div className="repo-summary-label">Repository summary</div>
              <div>{repoSummary || 'AI is synthesizing the repository. Select any file to see purpose, architecture role, and improvement suggestions.'}</div>
            </div>
            <div className="ai-suggestions">
              <div className="ai-suggestions-title">Try asking</div>
              <div className="suggestion-grid">
                {DEFAULT_SUGGESTIONS.map((item) => (
                  <span key={item} className="suggestion-chip">{item}</span>
                ))}
              </div>
            </div>
            <div className="ai-help-card">
              <div className="help-title">What AI can discover</div>
              <ul>
                <li>Architecture role and data flow for selected files</li>
                <li>Dependencies, imports, exports, and related files</li>
                <li>Security and complexity hotspots</li>
                <li>Improvement suggestions for maintainability</li>
              </ul>
            </div>
          </div>
        )}

        {file && loading && (
          <div className="ai-load">
            <span className="spinner" />
            <span>Analyzing {file.path}...</span>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        {file && expl && !loading && (
          <div className="ai-body">
            {expl.summary && (
              <div className="ai-sec">
                <div className="ai-sec-title">AI Summary</div>
                <div className="ai-text">{expl.summary}</div>
              </div>
            )}

            {expl.purpose && (
              <div className="ai-sec">
                <div className="ai-sec-title">Purpose</div>
                <div className="ai-text">{expl.purpose}</div>
              </div>
            )}

            {expl.architectureRole && (
              <div className="ai-sec">
                <div className="ai-sec-title">Architecture role</div>
                <div className="ai-text">{expl.architectureRole}</div>
              </div>
            )}

            {expl.imports?.length > 0 && (
              <div className="ai-sec">
                <div className="ai-sec-title">Imports</div>
                <div className="data-grid">
                  {expl.imports.map((item, index) => (
                    <div key={index} className="data-card">{item}</div>
                  ))}
                </div>
              </div>
            )}

            {expl.exports?.length > 0 && (
              <div className="ai-sec">
                <div className="ai-sec-title">Exports</div>
                <div className="data-grid">
                  {expl.exports.map((item, index) => (
                    <div key={index} className="data-card">{item}</div>
                  ))}
                </div>
              </div>
            )}

            {expl.dependencies?.length > 0 && (
              <div className="ai-sec">
                <div className="ai-sec-title">Dependencies</div>
                <div className="data-grid">
                  {expl.dependencies.map((item, index) => (
                    <div key={index} className="data-card">{typeof item === 'string' ? item : item.name || JSON.stringify(item)}</div>
                  ))}
                </div>
              </div>
            )}

            {expl.flow && (
              <div className="ai-sec">
                <div className="ai-sec-title">Flow</div>
                <div className="ai-text">{expl.flow}</div>
              </div>
            )}

            {expl.security && (
              <div className="ai-sec">
                <div className="ai-sec-title">Security highlight</div>
                <div className="ai-text">{expl.security}</div>
              </div>
            )}

            {expl.relatedFiles?.length > 0 && (
              <div className="ai-sec">
                <div className="ai-sec-title">Related files</div>
                <div className="data-grid">
                  {expl.relatedFiles.map((item, index) => (
                    <div key={index} className="data-card">{item}</div>
                  ))}
                </div>
              </div>
            )}

            {expl.improvementSuggestions?.length > 0 && (
              <div className="ai-sec">
                <div className="ai-sec-title">Improvement suggestions</div>
                <ul className="suggestion-list">
                  {expl.improvementSuggestions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <button className="secondary-btn" onClick={() => analyzeFile(file.id)}>
              🔄 Refresh insights
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
