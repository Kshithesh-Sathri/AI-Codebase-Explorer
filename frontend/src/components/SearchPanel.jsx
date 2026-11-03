import { useState, useEffect } from 'react';
import { api } from '../services/api';

const SUGGESTIONS = [
  'Where is authentication implemented?',
  'How does routing work?',
  'Where is the database connected?',
  'Which file handles errors?',
  'How are API endpoints defined?',
  'Where are environment variables used?',
];

export default function SearchPanel({ repoId, initialQuery = '' }) {
  const [q, setQ]             = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!initialQuery.trim()) return;
    setQ(initialQuery);
    runSearch(initialQuery);
  }, [initialQuery]);

  const runSearch = async (query) => {
    if (!query.trim()) return;
    setLoading(true); setError(''); setResults(null); setExpanded({});
    try {
      const res = await api.search(repoId, query);
      setResults(res);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const onSubmit = (e) => { e.preventDefault(); runSearch(q); };

  return (
    <div className="panel">
      <div className="panel-hdr">
        <h2>🔍 Semantic Search</h2>
        <p>Search the entire codebase with natural language.</p>
      </div>

      <form className="search-bar" onSubmit={onSubmit}>
        <input
          className="search-inp"
          placeholder="e.g. Where is JWT authentication implemented?"
          value={q}
          onChange={e => setQ(e.target.value)}
          disabled={loading}
        />
        <button className="search-go" type="submit" disabled={loading || !q.trim()}>
          {loading ? <span className="spinner" /> : 'Search →'}
        </button>
      </form>

      {!results && !loading && (
        <div className="chips">
          {SUGGESTIONS.map(s => (
            <button key={s} className="chip" onClick={() => { setQ(s); runSearch(s); }}>{s}</button>
          ))}
        </div>
      )}

      <div className="search-body">
        {error && <div className="error-msg">{error}</div>}
        {loading && <div className="center-msg"><span className="spinner lg" /><span>Searching…</span></div>}

        {results && (
          <>
            <div className="res-count">
              Found <strong>{results.results?.length ?? 0}</strong> relevant files for "{results.query}"
            </div>
            {results.results?.length === 0 && (
              <div className="center-msg">No results found. Try a different query or broaden your terms.</div>
            )}
            {results.results?.map((result, i) => (
              <div key={i} className="res-card">
                <div className="res-hdr" onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}>
                  <div className="res-file">
                    <span>📄</span>
                    <span className="res-path">{result.filePath || result.path}</span>
                    <span className="res-lang">{result.language}</span>
                  </div>
                  {result.similarity != null && (
                    <span className="res-pct">{Math.round(parseFloat(result.similarity) * 100)}% match</span>
                  )}
                  <span className="res-chevron">{expanded[i] ? '▲' : '▼'}</span>
                </div>
                {expanded[i] && (
                  <div className="res-chunks">
                    <pre className="chunk">{result.chunks?.[0]?.text || result.snippet || '(no preview)'}</pre>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
