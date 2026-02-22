'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SuperAdminSidebar.module.css';

interface SuperAdminNavItem {
    label: string;
    icon: string;
    path: string;
    badge?: string;
}

const navSections = [
    {
        title: 'Plataforma',
        items: [
            { label: 'Command Center', icon: '🎛️', path: '/dashboard/superadmin' },
            { label: 'Negocios', icon: '🏢', path: '/dashboard/superadmin/businesses' },
            { label: 'Usuarios', icon: '👤', path: '/dashboard/superadmin/users' },
            { label: 'Suscripciones', icon: '💎', path: '/dashboard/superadmin/subscriptions' },
        ] as SuperAdminNavItem[],
    },
    {
        title: 'Configuración',
        items: [
            { label: 'Feature Flags', icon: '🚩', path: '/dashboard/superadmin/flags' },
            { label: 'Anuncios', icon: '📢', path: '/dashboard/superadmin/ads' },
        ] as SuperAdminNavItem[],
    },
    {
        title: 'Soporte',
        items: [
            { label: 'Feedback', icon: '💬', path: '/dashboard/superadmin/feedback' },
            { label: 'Bug Reports', icon: '🐛', path: '/dashboard/superadmin/feedback?type=BUG_REPORT' },
            { label: 'Feature Requests', icon: '💡', path: '/dashboard/superadmin/feedback?type=FEATURE_REQUEST' },
        ] as SuperAdminNavItem[],
    },
    {
        title: 'Sistema',
        items: [
            { label: 'Auditoría', icon: '📋', path: '/dashboard/superadmin/audit' },
            { label: 'Configuración', icon: '⚙️', path: '/dashboard/superadmin/config' },
        ] as SuperAdminNavItem[],
    },
];

export default function SuperAdminSidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/dashboard/superadmin') return pathname === '/dashboard/superadmin';
        return pathname.startsWith(path);
    };

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className={styles.hamburger}
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
                {/* Logo Area */}
                <div className={styles.logoArea}>
                    <div className={styles.logoRow}>
                        <div className={styles.logo}>
                            <div className={styles.logoIcon}>Æ</div>
                            <span className={styles.logoText}>Code Aeternum</span>
                        </div>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close menu"
                        >
                            ✕
                        </button>
                    </div>
                    <div className={styles.roleBadge}>
                        <span className={styles.roleDot} />
                        PLATFORM_ADMIN
                    </div>
                </div>

                {/* Navigation Sections */}
                <nav className={styles.nav}>
                    {navSections.map((section) => (
                        <div key={section.title} className={styles.section}>
                            <div className={styles.sectionTitle}>{section.title}</div>
                            <ul className={styles.navList}>
                                {section.items.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            href={item.path}
                                            className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            <span className={styles.navIcon}>{item.icon}</span>
                                            <span className={styles.navLabel}>{item.label}</span>
                                            {item.badge && (
                                                <span className={styles.navBadge}>{item.badge}</span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Bottom: Back to Dashboard */}
                <div className={styles.bottom}>
                    <Link href="/dashboard" className={styles.backLink}>
                        <span className={styles.navIcon}>← </span>
                        <span className={styles.navLabel}>Volver al Dashboard</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
