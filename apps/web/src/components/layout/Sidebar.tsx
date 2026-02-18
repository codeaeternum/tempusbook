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
    badge?: string;
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
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const { t } = useLocale();

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(path);
    };

    const handleNavClick = () => {
        // Close mobile drawer on navigation
        setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                className={styles.hamburger}
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <span className={styles.hamburgerLine}></span>
                <span className={styles.hamburgerLine}></span>
                <span className={styles.hamburgerLine}></span>
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
                {/* Logo + Plan badge */}
                <div className={styles.logoArea}>
                    <div className={styles.logoRow}>
                        <div className={styles.logo}>
                            <div className={styles.logoIcon}>T</div>
                            {!collapsed && <span className={styles.logoText}>TempusBook</span>}
                        </div>
                        {/* Mobile close button */}
                        <button
                            className={styles.closeBtn}
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close menu"
                        >
                            ✕
                        </button>
                    </div>
                    {!collapsed && (
                        <Link href="/dashboard/subscription" className={styles.planChip} onClick={handleNavClick}>
                            <span className={styles.planDot}></span>
                            Pro Trial · 12d
                        </Link>
                    )}
                </div>

                {/* Desktop toggle */}
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
                                    onClick={handleNavClick}
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

                {/* Bottom */}
                <div className={styles.bottom}>
                    <Link
                        href="/dashboard/settings"
                        className={`${styles.navItem} ${isActive('/dashboard/settings') ? styles.active : ''}`}
                        title={collapsed ? t('settings') : undefined}
                        onClick={handleNavClick}
                    >
                        <span className={styles.navIcon}>⚙️</span>
                        {!collapsed && <span className={styles.navLabel}>{t('settings')}</span>}
                    </Link>
                </div>
            </aside>
        </>
    );
}
