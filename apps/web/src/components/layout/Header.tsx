'use client';

import React from 'react';
import { useLocale } from '@/providers/LocaleProvider';
import { useTheme } from '@/providers/ThemeProvider';
import styles from './Header.module.css';

interface HeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
    const { t, locale, setLocale } = useLocale();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <h1 className={styles.title}>{title}</h1>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>

            <div className={styles.right}>
                {actions}

                {/* Language toggle */}
                <div className={styles.langToggle}>
                    <button
                        className={`${styles.langBtn} ${locale === 'es' ? styles.langActive : ''}`}
                        onClick={() => setLocale('es')}
                    >
                        ES
                    </button>
                    <button
                        className={`${styles.langBtn} ${locale === 'en' ? styles.langActive : ''}`}
                        onClick={() => setLocale('en')}
                    >
                        EN
                    </button>
                </div>

                {/* Theme toggle — compact icon */}
                <button
                    className={styles.iconBtn}
                    onClick={toggleTheme}
                    aria-label={theme === 'light' ? t('dark_mode') : t('light_mode')}
                    title={theme === 'light' ? t('dark_mode') : t('light_mode')}
                >
                    <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                </button>

                {/* Notifications bell */}
                <button className={styles.iconBtn} aria-label={t('notifications')}>
                    <span>🔔</span>
                    <span className={styles.notifDot}></span>
                </button>

                {/* Profile avatar */}
                <button className={styles.profileBtn}>
                    <div className={styles.avatar}>D</div>
                </button>
            </div>
        </header>
    );
}
