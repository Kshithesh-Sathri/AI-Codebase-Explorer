import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🧠', title: 'AI File Explanation',  desc: 'Understand any file instantly with deep AI analysis' },
  { icon: '🔍', title: 'Semantic Search',       desc: 'Find code by meaning, not just filenames' },
  { icon: '💬', title: 'Chat with Repo',        desc: 'Ask questions, get answers grounded in real code' },
  { icon: '📝', title: 'README Generator',      desc: 'Auto-generate polished docs from your codebase' },
];

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode]               = useState('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [name, setName]               = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]             = useState('');
  const [showPass, setShowPass]       = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('');
    try { await signInWithGoogle(); }
    catch (e) {
      const msg =
        e.code === 'auth/popup-blocked' ? 'Google popup was blocked. Please allow popups and try again.' :
        e.code === 'auth/unauthorized-domain' ? 'This domain is not authorized in Firebase. Add localhost or your hosted domain in Firebase Authentication settings.' :
        e.code === 'auth/configuration-not-found' ? 'Google Sign-In is not enabled in Firebase Authentication.' :
        e.message;
      setError(msg);
    }
    finally { setGoogleLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'signup' && !name) return;
    setLoading(true); setError('');
    try {
      if (mode === 'login') await signInWithEmail(email, password);
      else await signUpWithEmail(email, password, name);
    } catch (e) {
      const msg =
        e.code === 'auth/invalid-credential'    ? 'Invalid email or password' :
        e.code === 'auth/email-already-in-use'  ? 'Email already in use' :
        e.code === 'auth/weak-password'          ? 'Password must be at least 6 characters' :
        e.code === 'auth/invalid-email'          ? 'Invalid email address' :
        e.message;
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">

      {/* ── Left: Branding ── */}
      <div className="login-left">
        <div className="login-left-grid" />

        <div className="login-brand">
          <span className="login-brand-logo">⚡</span>
          <span className="login-brand-name">CodeAI</span>
        </div>

        <div className="login-headline">
          <h2>
            Explore repositories<br />
            with <span>AI that thinks</span><br />
            like a senior engineer.
          </h2>
          <p>
            Paste any GitHub URL and instantly understand its architecture,
            search semantically, and generate professional documentation.
          </p>
        </div>

        <div className="login-feats">
          {FEATURES.map(f => (
            <div key={f.title} className="login-feat">
              <div className="login-feat-icon">{f.icon}</div>
              <div className="login-feat-text">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="login-right">
        <div className="login-card">

          <div className="login-card-header">
            <span className="login-logo">⚡</span>
            <h1 className="login-title">
              Welcome to <span className="gradient-text">CodeAI</span>
            </h1>
            <p className="login-sub">
              {mode === 'login' ? 'Sign in to continue exploring' : 'Create your free account'}
            </p>
          </div>

          {/* Google */}
          <button className="google-btn" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading ? <span className="spinner" /> : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span className="divider-line" />
            <span className="divider-text">or continue with email</span>
            <span className="divider-line" />
          </div>

          {/* Mode tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >Sign In</button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >Sign Up</button>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="pass-wrap">
                <input
                  className="auth-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && <div className="error-msg">⚠ {error}</div>}

            <button
              className="auth-submit-btn"
              type="submit"
              disabled={loading || !email || !password || (mode === 'signup' && !name)}
            >
              {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p className="login-footer-note">
            By continuing you agree to our{' '}
            <span style={{ color: 'var(--accent3)', cursor: 'pointer' }}>Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
}
