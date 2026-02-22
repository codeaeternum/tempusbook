'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import styles from '../login/page.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const { registerWithEmail, loginWithGoogle } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await registerWithEmail(email, password, name);
            // After successful registration, navigate to dashboard onboarding
            router.push('/dashboard/onboarding');
        } catch (err: any) {
            setError(err.message || 'Error durante el registro');
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
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

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <div className={styles.logoMark}>Æ</div>
                <h1 className={styles.title}>Crear cuenta en <span className={styles.accent}>AeternaSuite</span></h1>
                <p className={styles.subtitle}>El ecosistema operativo para tu negocio</p>

                <form onSubmit={handleRegister} className={styles.form}>
                    {error && <div className={styles.errorBanner}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Nombre Completo</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Juan Pérez"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Correo Electrónico Empresarial</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contacto@minegocio.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Contraseña Segura</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Creando cuenta...' : 'Crear mi Negocio'}
                    </button>

                    <div className={styles.divider}>o</div>

                    <button type="button" onClick={handleGoogleRegister} className={styles.googleBtn} disabled={loading}>
                        Registrarse con Google
                    </button>
                </form>

                <div className={styles.footerLinks}>
                    <p className={styles.link} style={{ cursor: 'default' }}>¿Ya tienes cuenta?</p>
                    <a href="/login" className={styles.link} style={{ fontWeight: 'bold' }}>Inicia Sesión aquí</a>
                </div>
            </div>
        </div>
    );
}
