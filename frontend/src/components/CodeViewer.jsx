import { useEffect, useRef } from 'react';

export default function CodeViewer({ file }) {
  const codeRef = useRef(null);
  const lines = (file.content || '').split('\n');

  useEffect(() => {
    if (codeRef.current && window.hljs) {
      codeRef.current.removeAttribute('data-highlighted');
      window.hljs.highlightElement(codeRef.current);
    }
  }, [file.content]);

  return (
    <div className="code-area">
      <div className="code-hdr">
        <div className="traffic-lights">
          <div className="tl tl-r" />
          <div className="tl tl-y" />
          <div className="tl tl-g" />
        </div>
        <span className="code-path">{file.path}</span>
        <span className="code-badge">{file.language}</span>
        <span className="code-badge">{lines.length} lines</span>
      </div>
      <div className="code-body">
        <div className="line-nums">
          {lines.map((_, i) => (
            <span key={i} className="line-num">{i + 1}</span>
          ))}
        </div>
        <pre className="code-pre">
          <code ref={codeRef} className={`language-${file.language}`}>
            {file.content}
          </code>
        </pre>
      </div>
    </div>
  );
}
