'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './Sidebar.module.css';

interface NavItem {
    key: string;
    icon: string;
    path: string;
    badge?: string; // plan badge
}

const navItems: NavItem[] = [
    { key: 'overview', icon: '📊', path: '/dashboard' },
    { key: 'calendar', icon: '📅', path: '/dashboard/calendar' },
    { key: 'appointments', icon: '🕐', path: '/dashboard/appointments' },
    { key: 'clients', icon: '👥', path: '/dashboard/clients' },
    { key: 'services', icon: '💼', path: '/dashboard/services' },
    { key: 'team', icon: '🤝', path: '/dashboard/team' },
    { key: 'payments', icon: '💳', path: '/dashboard/payments' },
    { key: 'gallery', icon: '🖼️', path: '/dashboard/gallery' },
    { key: 'reviews', icon: '⭐', path: '/dashboard/reviews' },
    { key: 'loyalty', icon: '🎁', path: '/dashboard/loyalty', badge: 'Starter' },
    { key: 'intake_forms', icon: '📋', path: '/dashboard/forms' },
    { key: 'reports', icon: '📈', path: '/dashboard/reports', badge: 'Pro' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { t } = useLocale();

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(path);
    };

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
            {/* Logo + Plan badge */}
            <div className={styles.logoArea}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>T</div>
                    {!collapsed && <span className={styles.logoText}>TempusBook</span>}
                </div>
                {!collapsed && (
                    <Link href="/dashboard/subscription" className={styles.planChip}>
                        <span className={styles.planDot}></span>
                        Pro Trial · 12d
                    </Link>
                )}
            </div>

            {/* Toggle */}
            <button
                className={styles.toggle}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <span className={styles.toggleIcon}>{collapsed ? '→' : '←'}</span>
            </button>

            {/* Navigation */}
            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navItems.map((item) => (
                        <li key={item.key}>
                            <Link
                                href={item.path}
                                className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                                title={collapsed ? t(item.key as any) : undefined}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                {!collapsed && (
                                    <>
                                        <span className={styles.navLabel}>{t(item.key as any)}</span>
                                        {item.badge && (
                                            <span className={styles.planBadge}>{item.badge}</span>
                                        )}
                                    </>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Bottom — only settings */}
            <div className={styles.bottom}>
                <Link
                    href="/dashboard/settings"
                    className={`${styles.navItem} ${isActive('/dashboard/settings') ? styles.active : ''}`}
                    title={collapsed ? t('settings') : undefined}
                >
                    <span className={styles.navIcon}>⚙️</span>
                    {!collapsed && <span className={styles.navLabel}>{t('settings')}</span>}
                </Link>
            </div>
        </aside>
    );
}
