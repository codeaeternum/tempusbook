'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import toast from 'react-hot-toast';
import { CATEGORIES } from '@aeternasuite/shared-constants';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { loginWithEmail, loginWithGoogle, loginWithMock, resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleResetPassword = async (e: React.MouseEvent) => {
        e.preventDefault();
        setError('');
        if (!email) {
            setError('Ingresa tu correo electrónico en el campo superior primero para enviarte el enlace.');
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email);
            toast.success('Enlace de recuperación enviado. Revisa tu bandeja de entrada o spam.');
        } catch (err: any) {
            setError(err.message || 'Error al enviar enlace de recuperación');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await loginWithEmail(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await loginWithGoogle();
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Error con Google Auth');
            setLoading(false);
        }
    };

    const handleDevLogin = async (vertical: string) => {
        setLoading(true);
        try {
            if (loginWithMock) {
                await loginWithMock(vertical);
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Error en Dev Login');
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <div className={styles.logoMark}>Æ</div>
                <h1 className={styles.title}>Aeterna<span className={styles.accent}>Suite</span></h1>
                <p className={styles.subtitle}>Inicia sesión para gestionar tu negocio</p>

                <form onSubmit={handleLogin} className={styles.form}>
                    {error && <div className={styles.errorBanner}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Correo Electrónico</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@correo.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Verificando...' : 'Acceder con Email'}
                    </button>

                    <div className={styles.divider}>o</div>

                    <button type="button" onClick={handleGoogleLogin} className={styles.googleBtn} disabled={loading}>
                        Iniciar con Google
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div className={styles.devPanel}>
                            <p className={styles.devTitle}>🛠️ Accesos de Desarrollo Multipantalla</p>
                            <div className={styles.devButtons} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.slug}
                                        type="button"
                                        onClick={() => handleDevLogin(cat.slug)}
                                        className={styles.devBtn}
                                        title={cat.nameEs}
                                    >
                                        {cat.icon} {cat.nameEs.split(' ')[0]}
                                    </button>
                                ))}
                                <button type="button" onClick={() => handleDevLogin('general')} className={styles.devBtn}>📅 General</button>
                            </div>
                        </div>
                    )}
                </form>

                <div className={styles.footerLinks}>
                    <a href="#" onClick={handleResetPassword} className={styles.link}>
                        {loading ? 'Procesando...' : '¿Olvidaste tu contraseña?'}
                    </a>
                </div>
            </div>
        </div>
    );
}
