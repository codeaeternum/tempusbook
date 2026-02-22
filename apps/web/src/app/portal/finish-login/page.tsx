'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { fetchWithAuth } from '@/providers/AuthProvider';

export default function FinishLoginPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'VERIFYING' | 'MERGING' | 'SUCCESS' | 'ERROR'>('VERIFYING');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const processLogin = async () => {
            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email = window.localStorage.getItem('emailForSignIn');
                if (!email) {
                    // Si abrió el link en otro navegador o modo incógnito, pedimos confirmar el correo
                    email = window.prompt('Por favor, ingresa tu correo electrónico para confirmar:');
                }

                if (!email) {
                    setStatus('ERROR');
                    setErrorMessage('Se requiere el correo electrónico para continuar.');
                    return;
                }

                try {
                    // 1. Iniciar sesión mediante Token de Firbease
                    await signInWithEmailLink(auth, email, window.location.href);
                    window.localStorage.removeItem('emailForSignIn');

                    setStatus('MERGING');

                    // 2. Sincronizar y Fusionar (Identity Merge) en Backend
                    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                    await fetchWithAuth(`${API}/users/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email })
                    });

                    setStatus('SUCCESS');
                    router.push('/portal');
                } catch (error: any) {
                    console.error('Magic Link Error:', error);
                    setStatus('ERROR');
                    setErrorMessage(error.message || 'El enlace es inválido o expiró.');
                }
            } else {
                setStatus('ERROR');
                setErrorMessage('URL de Enlace Mágico Invalida.');
            }
        };

        processLogin();
    }, [router]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="max-w-md w-full text-center">
                {status === 'VERIFYING' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-black/60">Verificando pase de abordar...</p>
                    </div>
                )}

                {status === 'MERGING' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 flex items-center justify-center">
                            <span className="text-2xl animate-bounce">⚡</span>
                        </div>
                        <p className="text-sm font-medium text-black/60">Asincando tu historial de citas (Identity Merge)...</p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-lg font-medium text-black">¡Identidad Confirmada!</p>
                        <p className="text-sm text-black/60">Redirigiendo a tu Portal...</p>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-100 flex flex-col items-center gap-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <p className="font-semibold mb-1">¡Acceso Denegado!</p>
                            <p className="text-sm opacity-80">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => router.push('/portal/login')}
                            className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold uppercase tracking-wider px-6 py-2 rounded-full transition-colors mt-2 min-h-[44px] flex justify-center items-center"
                        >
                            Solicitar nuevo enlace
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
