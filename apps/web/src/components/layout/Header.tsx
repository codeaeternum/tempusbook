'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/providers/LocaleProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import NotificationDropdown from './NotificationDropdown';
import styles from './Header.module.css';

interface HeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    mobileActionsInline?: boolean;
}

export default function Header({ title, subtitle, actions, mobileActionsInline }: HeaderProps) {
    const { t } = useLocale();
    const { theme } = useTheme();
    const { logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        if (profileOpen) {
            document.addEventListener('mousedown', handler);
            document.addEventListener('touchstart', handler as EventListener);
        }
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler as EventListener);
        };
    }, [profileOpen]);

    return (
        <>
            <header className={styles.header}>
                <div className={styles.topRow}>
                    <div className={styles.left}>
                        <h1 className={styles.title}>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>

                    <div className={styles.right}>
                        {/* Actions — inline on desktop only, or forced on mobile */}
                        {actions && (
                            <div className={`${styles.desktopActions} ${mobileActionsInline ? styles.forceInlineMobile : ''}`}>{actions}</div>
                        )}

                        {/* Notifications */}
                        <NotificationDropdown />

                        {/* Profile dropdown */}
                        <div className={styles.profileWrapper} ref={dropdownRef}>
                            <button
                                className={styles.profileBtn}
                                onClick={() => setProfileOpen(prev => !prev)}
                                aria-label="Perfil"
                                aria-expanded={profileOpen}
                            >
                                <div className={styles.avatar}>D</div>
                            </button>

                            {profileOpen && (
                                <div className={styles.profileDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <div className={styles.dropdownAvatar}>D</div>
                                        <div>
                                            <p className={styles.dropdownName}>Daniel Galindo</p>
                                            <p className={styles.dropdownEmail}>daniel@aeternasuite.com</p>
                                        </div>
                                    </div>
                                    <div className={styles.dropdownDivider} />
                                    <button className={styles.dropdownItem}>
                                        <span>👤</span> Mi Perfil
                                    </button>
                                    <button className={styles.dropdownItem}>
                                        <span>⚙️</span> Configuración
                                    </button>
                                    <div className={styles.dropdownDivider} />
                                    <button
                                        onClick={logout}
                                        className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                                    >
                                        <span>🚪</span> Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </header>

            {/* FAB — rendered OUTSIDE <header> to avoid backdrop-filter containing block */}
            {actions && !mobileActionsInline && (
                <div className={styles.fab}>{actions}</div>
            )}
        </>
    );
}
