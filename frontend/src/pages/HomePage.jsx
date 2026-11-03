import { useState, useEffect } from 'react';
import { api } from '../services/api';

const FEATURES = [
  { icon: '🔬', title: 'Analysis Hub',        desc: 'Scan architecture, folder roles, and code behavior with AI.',         color: '#7c6aff' },
  { icon: '🔍', title: 'Semantic Search',      desc: 'Find code by meaning instead of exact text or file names.',           color: '#00d4ff' },
  { icon: '💬', title: 'Repo Chat',            desc: 'Ask questions and get answers grounded in actual source code.',       color: '#00ff88' },
  { icon: '📝', title: 'README Generator',     desc: 'Produce polished documentation from repository content.',            color: '#ff6eb4' },
  { icon: '🏗️', title: 'Architecture View',   desc: 'Visualize component flow, data movement, and system layers.',        color: '#ffd93d' },
  { icon: '📄', title: 'File Deep Dive',       desc: 'Explain any file with purpose, dependencies, and suggestions.',      color: '#ff8c42' },
];

export default function HomePage({ onClone, user, onLogout }) {
  const [url, setUrl]               = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [recentRepos, setRecentRepos] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentRepos');
      if (saved) setRecentRepos(JSON.parse(saved));
    } catch {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError(''); setLoading(true);
    try {
      const data = await api.cloneRepo(url.trim());
      const newRepo = { id: data.repoId, name: data.name, url: url.trim(), date: new Date().toISOString() };
      const updated = [newRepo, ...recentRepos.filter(r => r.url !== url.trim())].slice(0, 5);
      setRecentRepos(updated);
      localStorage.setItem('recentRepos', JSON.stringify(updated));
      onClone(data.repoId, data.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hp-root">

      {/* ── Top nav ── */}
      <nav className="hp-nav">
        <div className="hp-nav-logo">⚡ CodeAI</div>
        <div className="hp-nav-right">
          {user && (
            <>
              {user.photoURL && <img src={user.photoURL} className="hp-avatar" alt="" />}
              <span className="hp-nav-name">{user.displayName || user.email}</span>
              <button className="hp-nav-signout" onClick={onLogout}>Sign out</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hp-hero">
        <div className="hp-hero-inner">
          <div className="hp-eyebrow">AI Repository Intelligence</div>
          <h1 className="hp-title">
            Explore, understand, and<br />
            document repositories with<br />
            <span className="hp-title-accent">AI that thinks like a senior engineer.</span>
          </h1>
          <p className="hp-desc">
            Paste any GitHub URL. AI clones, reads every file, maps the architecture,
            and lets you explore with natural language.
          </p>

          <form className="hp-form" onSubmit={handleSubmit}>
            <div className="hp-input-row">
              <span className="hp-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
              </span>
              <input
                className="hp-input"
                type="text"
                placeholder="https://github.com/username/repository"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={loading}
              />
              <button className="hp-btn" type="submit" disabled={loading || !url.trim()}>
                {loading ? <span className="spinner" /> : 'Analyze →'}
              </button>
            </div>
            {error && <div className="error-msg">⚠ {error}</div>}
          </form>

          {/* Stats row */}
          <div className="hp-stats">
            <div className="hp-stat"><strong>6</strong> AI tools</div>
            <div className="hp-stat-div" />
            <div className="hp-stat"><strong>Semantic</strong> search</div>
            <div className="hp-stat-div" />
            <div className="hp-stat"><strong>Auto</strong> README</div>
            <div className="hp-stat-div" />
            <div className="hp-stat"><strong>Architecture</strong> map</div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="hp-section">
        <div className="hp-section-hdr">
          <div>
            <h2 className="hp-section-title">What this workspace helps you do</h2>
            <p className="hp-section-sub">Discover intelligence, not just files.</p>
          </div>
        </div>
        <div className="hp-features">
          {FEATURES.map(f => (
            <div key={f.title} className="hp-feat">
              <div className="hp-feat-icon" style={{ color: f.color }}>{f.icon}</div>
              <div className="hp-feat-title">{f.title}</div>
              <div className="hp-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent repos ── */}
      {recentRepos.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-hdr">
            <div>
              <h2 className="hp-section-title">Recent repositories</h2>
              <p className="hp-section-sub">Return quickly to repos you analyzed before.</p>
            </div>
            <button className="hp-clear-btn" onClick={() => { setRecentRepos([]); localStorage.removeItem('recentRepos'); }}>
              Clear list
            </button>
          </div>
          <div className="hp-repos">
            {recentRepos.map((repo, i) => (
              <div key={i} className="hp-repo" onClick={() => onClone(repo.id, repo.name)}>
                <span className="hp-repo-icon">📦</span>
                <div className="hp-repo-info">
                  <div className="hp-repo-name">{repo.name}</div>
                  <div className="hp-repo-url">{repo.url}</div>
                </div>
                <div className="hp-repo-date">{new Date(repo.date).toLocaleDateString()}</div>
                <span className="hp-repo-arrow">→</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="hp-footer">
        <span>⚡ CodeAI — built for smarter repo understanding.</span>
        <span>Modern onboarding · AI search · Architecture insights</span>
      </footer>
    </div>
  );
}
