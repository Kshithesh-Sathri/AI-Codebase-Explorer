import { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthChange, signInWithGoogle, logout, signInWithEmail, signUpWithEmail } from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthChange(u => { setUser(u); setLoading(false); });
        return unsub;
    }, []);

    const getToken = async (forceRefresh = false) => {
        if (!user) return null;
        return await user.getIdToken(forceRefresh);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, getToken, signInWithEmail, signUpWithEmail }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);