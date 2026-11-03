import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setTokenProvider } from './services/api';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProcessingPage from './pages/ProcessingPage';
import ExplorerPage from './pages/ExplorerPage';

function AppInner() {
    const { user, loading, getToken, logout } = useAuth();
    const [page, setPage] = useState('home');
    const [repoId, setRepoId] = useState(null);
    const [repoName, setRepoName] = useState('');

    useEffect(() => { setTokenProvider(getToken); }, [getToken]);

    if (loading) return (
        <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
            <span className="spinner lg" />
            <span style={{color:'var(--text3)',fontSize:'13px'}}>Loading...</span>
        </div>
    );

    if (!user) return <LoginPage />;

    const goToProcessing = (id, name) => { setRepoId(id); setRepoName(name); setPage('processing'); };
    const goToExplorer = () => setPage('explorer');
    const goHome = () => { setPage('home'); setRepoId(null); setRepoName(''); };

    return (
        <div className="app">
            {page === 'home' && <HomePage onClone={goToProcessing} user={user} onLogout={logout} />}
            {page === 'processing' && <ProcessingPage repoId={repoId} repoName={repoName} onReady={goToExplorer} onBack={goHome} />}
            {page === 'explorer' && <ExplorerPage repoId={repoId} repoName={repoName} onBack={goHome} user={user} onLogout={logout} />}
        </div>
    );
}

export default function App() {
    return <AuthProvider><AppInner /></AuthProvider>;
}