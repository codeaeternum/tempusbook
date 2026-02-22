'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';

export default function B2CLoginPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'ERROR'>('IDLE');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSendMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) return;

        setStatus('SENDING');
        try {
            const actionCodeSettings = {
                // Must be the absolute URL to redirect to after clicking the email link
                url: window.location.origin + '/portal/finish-login',
                handleCodeInApp: true,
            };

            await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
            // Salvar el correo localmente para no tener que preguntarlo de nuevo en la siguiente pantalla
            window.localStorage.setItem('emailForSignIn', email.trim());
            setStatus('SENT');
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message);
            setStatus('ERROR');
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-black/5 text-center">

                <h2 className="text-2xl font-serif text-black mb-2">Bienvenido de Vuelta</h2>
                <p className="text-sm text-black/60 mb-8">
                    Ingresa tu correo electrónico para recibir un Enlace Mágico de acceso seguro. Sin contraseñas.
                </p>

                {status === 'SENT' ? (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-medium border border-emerald-100 flex flex-col items-center">
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        ¡Enlace Enviado! Revisa tu bandeja de entrada o la carpeta de SPAM.
                    </div>
                ) : (
                    <form onSubmit={handleSendMagicLink} className="flex flex-col gap-4">
                        <div className="text-left">
                            <label className="text-xs font-semibold text-black/60 uppercase tracking-wider mb-1 block">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                className="w-full bg-[#f8f8f8] border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black placeholder-black/30 transition-all min-h-[44px]"
                            />
                        </div>

                        {status === 'ERROR' && (
                            <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'SENDING' || !email.includes('@')}
                            className="w-full bg-black text-white font-medium text-sm py-3 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 min-h-[44px]"
                        >
                            {status === 'SENDING' ? 'Generando Enlace...' : 'Enviar Enlace Mágico ✨'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
