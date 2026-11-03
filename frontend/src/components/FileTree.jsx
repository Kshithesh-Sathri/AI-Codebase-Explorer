import { useState } from 'react';

const buildTree = (files) => {
  const root = {};
  for (const f of files) {
    const parts = f.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = { __dir: true, __children: {} };
      node = node[parts[i]].__children;
    }
    node[parts[parts.length - 1]] = { __file: f };
  }
  return root;
};

const LANG_COLORS = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5',
  css: '#563d7c', html: '#e34c26', json: '#999',
  markdown: '#083fa1', go: '#00add8', rust: '#dea584',
  java: '#b07219', ruby: '#701516', php: '#4f5d95',
};

const Node = ({ name, node, onSelect, selected, depth }) => {
  const [open, setOpen] = useState(depth < 1);
  if (node.__file) {
    const f = node.__file;
    const isSel = selected?.id === f.id;
    return (
      <div
        className={`tree-file ${isSel ? 'sel' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
        onClick={() => onSelect(f)}
      >
        <div className="lang-dot" style={{ background: LANG_COLORS[f.language] || '#555' }} />
        <span className="file-nm">{name}</span>
      </div>
    );
  }
  const children = node.__children || {};
  return (
    <div>
      <div
        className="tree-folder"
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="tree-arrow">{open ? '▾' : '▸'}</span>
        <span className="tree-folder-icon">{open ? '📂' : '📁'}</span>
        <span>{name}</span>
      </div>
      {open && Object.entries(children).sort(([,a],[,b]) => {
        const aIsDir = !a.__file; const bIsDir = !b.__file;
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return 0;
      }).map(([k, v]) => (
        <Node key={k} name={k} node={v} onSelect={onSelect} selected={selected} depth={depth + 1} />
      ))}
    </div>
  );
};

export default function FileTree({ files, onSelect, selected }) {
  const tree = buildTree(files);
  return (
    <div className="file-tree">
      {Object.entries(tree).sort(([,a],[,b]) => {
        const aD = !a.__file; const bD = !b.__file;
        if (aD && !bD) return -1; if (!aD && bD) return 1; return 0;
      }).map(([k, v]) => (
        <Node key={k} name={k} node={v} onSelect={onSelect} selected={selected} depth={0} />
      ))}
    </div>
  );
}
