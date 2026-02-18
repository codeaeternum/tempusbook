'use client';

import React from 'react';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './Header.module.css';

interface HeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
    const { t, locale, setLocale } = useLocale();

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
