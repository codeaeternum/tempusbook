'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail } from 'firebase/auth';

interface DbUser {
    id: string;
    email: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    businessMembers: Array<{ role: string; business: { id: string; name: string; slug: string; status: string } }>;
}

interface AuthContextType {
    token: string | null;
    dbUser: DbUser | null;
    isLoading: boolean;
    loginWithEmail: (e: string, p: string) => Promise<void>;
    registerWithEmail: (email: string, p: string, firstName: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithMock?: (vertical: string) => Promise<void>;
    logout: () => void;
    activeBusinessId: string | null;
    setActiveBusinessId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType>({
    token: null,
    dbUser: null,
    activeBusinessId: null,
    setActiveBusinessId: () => { },
    isLoading: true,
    loginWithEmail: async () => { },
    registerWithEmail: async () => { },
    resetPassword: async () => { },
    loginWithGoogle: async () => { },
    loginWithMock: async () => { },
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [dbUser, setDbUser] = useState<DbUser | null>(null);
    const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const setActiveBusinessId = (id: string) => {
        setActiveBusinessIdState(id);
        localStorage.setItem('aeterna-active-business', id);
        // Soft refresh or page reload could be needed here depending on architecture, 
        // for now React Context will propagate the id change downwards.
    };

    const fetchDbUser = async (jwt: string) => {
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const res = await fetch(`${API}/users/me`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            if (res.ok) {
                const user = await res.json();
                setDbUser(user);

                if (user.businessMembers && user.businessMembers.length > 0) {
                    const storedActive = localStorage.getItem('aeterna-active-business');
                    const hasStored = user.businessMembers.some((m: any) => m.business.id === storedActive);

                    if (storedActive && hasStored) {
                        setActiveBusinessIdState(storedActive);
                    } else {
                        setActiveBusinessIdState(user.businessMembers[0].business.id);
                        localStorage.setItem('aeterna-active-business', user.businessMembers[0].business.id);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const jwt = await user.getIdToken();
                setToken(jwt);
                localStorage.setItem('aeterna-token', jwt);
                document.cookie = `aeterna-auth=${jwt}; path=/; max-age=86400; SameSite=Strict`;
                await fetchDbUser(jwt);
            } else {
                if (process.env.NODE_ENV === 'development') {
                    // Si ya hay un token falso guardado de un inicio de sesión previo, respétalo
                    const storedToken = localStorage.getItem('aeterna-token');
                    if (storedToken && storedToken.startsWith('mock-')) {
                        setToken(storedToken);
                        await fetchDbUser(storedToken);
                    } else {
                        // Permite que el usuario dev vea el panel de Accesos en /login
                        setToken(null);
                        setDbUser(null);
                        localStorage.removeItem('aeterna-token');
                    }
                } else {
                    setToken(null);
                    setDbUser(null);
                    localStorage.removeItem('aeterna-token');
                    document.cookie = 'aeterna-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                }
            }
            setIsLoading(false);
        });

        setTimeout(() => setIsLoading(false), 2000);

        return () => unsubscribe();
    }, []);

    const loginWithEmail = async (e: string, p: string) => {
        if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-key-123')) {
            console.warn("🔐 MOCK AUTH: Simulación de inicio de sesión exitoso sin Firebase activo.");
            const mockJWT = 'mock-general-token';
            setToken(mockJWT);
            localStorage.setItem('aeterna-token', mockJWT);
            document.cookie = `aeterna-auth=${mockJWT}; path=/; max-age=86400; SameSite=Strict`;
            await fetchDbUser(mockJWT);
            return;
        }
        await signInWithEmailAndPassword(auth, e, p);
    };

    const loginWithMock = async (vertical: string) => {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`🔐 MOCK AUTH: Autenticando simulador vertical: ${vertical}`);
            const mockJWT = `mock-${vertical}-token`;
            setToken(mockJWT);
            localStorage.setItem('aeterna-token', mockJWT);
            localStorage.removeItem('aeterna-active-business');
            localStorage.removeItem('aeternasuite-settings');
            setActiveBusinessIdState(null);
            document.cookie = `aeterna-auth=${mockJWT}; path=/; max-age=86400; SameSite=Strict`;
            await fetchDbUser(mockJWT);
            return;
        }
    };

    const registerWithEmail = async (email: string, p: string, firstName: string) => {
        if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-key-123')) {
            console.warn("🔐 MOCK AUTH: Simulación de registro exitoso sin Firebase activo.");
            const mockJWT = 'mock-dev-token';
            setToken(mockJWT);
            localStorage.setItem('aeterna-token', mockJWT);
            document.cookie = `aeterna-auth=${mockJWT}; path=/; max-age=86400; SameSite=Strict`;
            return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, p);
        const jwt = await cred.user.getIdToken();
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

        // 1. Forzar sincronía inmediata del usuario Creador (con su Nombre)
        await fetch(`${API}/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({ email: cred.user.email, firstName, lastName: '' })
        });

        // 2. Crear primer Negocio (Hub B2B inicializado en ONBOARDING)
        await fetch(`${API}/businesses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({
                name: `Negocio de ${firstName}`,
                slug: `hub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                status: 'ONBOARDING',
            })
        });

        // 3. Refrescar estado del contexto
        await fetchDbUser(jwt);
    };

    const resetPassword = async (email: string) => {
        if (!email) throw new Error('Ingresa un correo primero');
        if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-key-123')) {
            console.warn("🔐 MOCK AUTH: Simulación de recuperación de contraseña.");
            return;
        }
        await sendPasswordResetEmail(auth, email);
    };

    const loginWithGoogle = async () => {
        if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock-key-123')) {
            console.warn("🔐 MOCK AUTH: Simulación de Google Auth.");
            const mockJWT = 'mock-dev-token';
            setToken(mockJWT);
            localStorage.setItem('aeterna-token', mockJWT);
            document.cookie = `aeterna-auth=${mockJWT}; path=/; max-age=86400; SameSite=Strict`;
            await fetchDbUser(mockJWT);
            return;
        }
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
        setToken(null);
        localStorage.removeItem('aeterna-token');
        document.cookie = 'aeterna-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ token, dbUser, activeBusinessId, setActiveBusinessId, isLoading, loginWithEmail, registerWithEmail, resetPassword, loginWithGoogle, loginWithMock, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ----------------------------------------------------------------------
// Interceptor Fetch (Para API Calls a NestJS)
// ----------------------------------------------------------------------
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('aeterna-token') : null;

        const headers = new Headers(options.headers);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const res = await fetch(url, { ...options, headers });
        return res;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
};
