'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
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

const bottomItems: NavItem[] = [
    { key: 'settings', icon: '⚙️', path: '/dashboard/settings' },
    { key: 'subscription', icon: '💎', path: '/dashboard/subscription' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { t } = useLocale();

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(path);
    };

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
            {/* Logo */}
            <div className={styles.logo}>
                <div className={styles.logoIcon}>T</div>
                {!collapsed && <span className={styles.logoText}>TempusBook</span>}
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

            {/* Bottom section */}
            <div className={styles.bottom}>
                {/* Theme toggle */}
                <button
                    className={styles.navItem}
                    onClick={toggleTheme}
                    title={theme === 'light' ? t('dark_mode') : t('light_mode')}
                >
                    <span className={styles.navIcon}>{theme === 'light' ? '🌙' : '☀️'}</span>
                    {!collapsed && (
                        <span className={styles.navLabel}>
                            {theme === 'light' ? t('dark_mode') : t('light_mode')}
                        </span>
                    )}
                </button>

                {/* Bottom nav items */}
                {bottomItems.map((item) => (
                    <Link
                        key={item.key}
                        href={item.path}
                        className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                        title={collapsed ? t(item.key as any) : undefined}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        {!collapsed && <span className={styles.navLabel}>{t(item.key as any)}</span>}
                    </Link>
                ))}
            </div>
        </aside>
    );
}
