import { useEffect, useState } from 'react';
import { api } from '../services/api';

const STEPS = [
  { key: 'cloning',   label: 'Cloning repository',       num: '01' },
  { key: 'reading',   label: 'Parsing files',             num: '02' },
  { key: 'analyzing', label: 'Analyzing architecture',    num: '03' },
  { key: 'embedding', label: 'Generating AI embeddings',  num: '04' },
  { key: 'ready',     label: 'Ready to explore',          num: '05' },
];

const stepIdx = (s) => STEPS.findIndex(x => x.key === s);

export default function ProcessingPage({ repoId, repoName, onReady, onBack }) {
  const [status, setStatus] = useState('cloning');
  const [error, setError] = useState('');

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const d = await api.getStatus(repoId);
        setStatus(d.status);
        if (d.status === 'ready') { clearInterval(iv); setTimeout(onReady, 1000); }
        if (d.status === 'error') { clearInterval(iv); setError('Processing failed. Try again.'); }
      } catch (e) { setError(e.message); clearInterval(iv); }
    }, 2000);
    return () => clearInterval(iv);
  }, [repoId]);

  const cur = stepIdx(status);
  const pct = status === 'ready' ? 100 : Math.round((cur / (STEPS.length - 1)) * 100);

  return (
    <div className="processing">
      <div className="home-bg">
        <div className="home-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <div className="proc-card">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="proc-repo">
          <span>📁</span>
          <span style={{color: 'var(--accent3)'}}>{repoName}</span>
        </div>
        <h2 className="proc-title">
          {error ? '❌ Error' : status === 'ready' ? '🎉 All done!' : 'Processing...'}
        </h2>
        {error ? <div className="error-msg">{error}</div> : (
          <>
            <div className="prog-wrap">
              <div className="prog-bar" style={{ width: `${pct}%` }} />
            </div>
            <div className="prog-pct">{pct}%</div>
            <div className="steps">
              {STEPS.map((step, i) => {
                const done = i < cur || status === 'ready';
                const active = i === cur && status !== 'ready';
                return (
                  <div key={step.key} className={`step ${done?'done':''} ${active?'active':''}`}>
                    <div className="step-bullet">
                      {done ? '✓' : step.num}
                    </div>
                    <span className="step-label">{step.label}</span>
                    {active && <span className="step-spin" />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
