'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useSettings, type ModuleKey } from '@/providers/SettingsProvider';
import { useBusinessVertical } from '@/hooks/useBusinessVertical';
import styles from './Sidebar.module.css';

import type { TranslationKey } from '@/lib/i18n';
import { ShoppingCart, Car, ClipboardCheck, Smartphone, Wrench, ClipboardList, MonitorUp } from 'lucide-react';

interface NavItem {
    key: TranslationKey;
    icon: string | any;
    path: string;
    badge?: string;
    moduleKey?: ModuleKey;
    labelKey?: string;
}

const navItems: NavItem[] = [
    { key: 'overview', icon: '📊', path: '/dashboard' },
    { key: 'calendar', icon: '📅', path: '/dashboard/calendar', moduleKey: 'calendar' },
    { key: 'appointments', icon: '🕐', path: '/dashboard/appointments', moduleKey: 'appointments' },
    { key: 'clients', icon: '👥', path: '/dashboard/clients', moduleKey: 'clients' },
    { key: 'services', icon: '💇', path: '/dashboard/services', moduleKey: 'services' },
    { key: 'inventory', icon: '📦', path: '/dashboard/inventory', moduleKey: 'inventory' },
    { key: 'team', icon: '🤝', path: '/dashboard/team', moduleKey: 'team' },
    { key: 'payments', icon: '💰', path: '/dashboard/payments', moduleKey: 'payments' },
    { key: 'gallery', icon: '🖼️', path: '/dashboard/gallery', moduleKey: 'gallery' },
    { key: 'reviews', icon: '⭐', path: '/dashboard/reviews', moduleKey: 'reviews' },
    { key: 'loyalty', icon: '🎁', path: '/dashboard/loyalty', moduleKey: 'loyalty' },
    { key: 'packages', icon: '🎟️', labelKey: 'Paquetes', path: '/dashboard/packages', moduleKey: 'packages' },
    { key: 'intake_forms', icon: '📋', path: '/dashboard/forms', moduleKey: 'intake_forms' },
    { key: 'reports', icon: '📈', path: '/dashboard/reports', moduleKey: 'reports' },
    { key: 'gift_cards', icon: '💌', path: '/dashboard/gift-cards', moduleKey: 'gift_cards' },
    { key: 'cashflow', icon: '💸', path: '/dashboard/cashflow', moduleKey: 'cashflow' },
    { key: 'pos', icon: <ShoppingCart size={20} />, labelKey: 'pos', path: '/dashboard/pos', moduleKey: 'pos' },
    { key: 'reception', icon: <MonitorUp size={20} />, labelKey: 'Recepción', path: '/dashboard/reception', moduleKey: 'reception' },

    // Mechanic Vertical
    { key: 'vehicles', icon: <Car size={20} />, labelKey: 'vehicles', path: '/dashboard/mechanic/vehicles', moduleKey: 'vehicles' },
    { key: 'inspections', icon: <ClipboardCheck size={20} />, labelKey: 'inspections', path: '/dashboard/mechanic/inspections', moduleKey: 'inspections' },
    // Tech Repair Vertical
    { key: 'devices', icon: <Smartphone size={20} />, labelKey: 'devices', path: '/dashboard/repair/devices', moduleKey: 'devices' },
    // Shared Verticals (Mech + Repair)
    { key: 'work_orders', icon: <Wrench size={20} />, labelKey: 'work_orders', path: '/dashboard/mechanic/work-orders', moduleKey: 'work_orders' },
    { key: 'quotes', icon: <ClipboardList size={20} />, labelKey: 'quotes', path: '/dashboard/mechanic/quotes', moduleKey: 'quotes' },

    // Clinical Vertical (Dental, MedSpa, Veterinary, Psychology, etc.)
    { key: 'dental_chart' as any, icon: '🦷', path: '/dashboard/clinical/dental-chart', moduleKey: 'dental_chart' as any },
    { key: 'body_chart' as any, icon: '🫀', path: '/dashboard/clinical/body-chart', moduleKey: 'body_chart' as any },
    { key: 'medical_records' as any, icon: '🏥', path: '/dashboard/clinical/medical-records', moduleKey: 'medical_records' as any },
    { key: 'prescriptions' as any, icon: '💊', path: '/dashboard/clinical/prescriptions', moduleKey: 'prescriptions' as any },
];

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const { dbUser, activeBusinessId, setActiveBusinessId } = useAuth();
    const { t, locale, setLocale } = useLocale();
    const { theme, toggleTheme } = useTheme();
    const { settings, enabledModules } = useSettings();
    const {
        isTechRepair,
        hasVehicles,
        hasDevices,
        isClinical,
        isAutomotive
    } = useBusinessVertical();
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    // Swipe gesture: left-edge swipe to open, swipe-left to close
    useEffect(() => {
        const onTouchStart = (e: TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };
        const onTouchEnd = (e: TouchEvent) => {
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
            // Only horizontal swipes (dx much larger than dy)
            if (dy > 80) return;
            // Swipe right from left edge → open
            if (!mobileOpen && touchStartX.current < 30 && dx > 60) {
                setMobileOpen(true);
            }
            // Swipe left when open → close
            if (mobileOpen && dx < -60) {
                setMobileOpen(false);
            }
        };
        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchend', onTouchEnd, { passive: true });
        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, [mobileOpen]);

    // Filter visible items, sort by moduleOrder, favorites pinned first
    const visibleItems = useMemo(() => {
        let filtered = navItems.filter(item => !item.moduleKey || enabledModules.has(item.moduleKey));

        // Filtro condicional estricto por vertical de negocio usando el Motor de Contexto Universal
        filtered = filtered.filter(item => {
            if (item.key === 'vehicles' && !hasVehicles) return false;
            if (item.key === 'inspections' && !hasVehicles) return false;
            if (item.key === 'devices' && !hasDevices) return false;
            if (['work_orders', 'quotes'].includes(item.key) && (!hasVehicles && !hasDevices)) return false;
            // Clinical modules: only visible for clinical verticals
            if (['dental_chart', 'body_chart', 'medical_records', 'prescriptions'].includes(item.key) && !isClinical) return false;
            return true;
        });

        // Patch Paths for shared modules depending on the active vertical
        filtered = filtered.map(item => {
            if (item.key === 'work_orders' && isTechRepair) return { ...item, path: '/dashboard/repair/work-orders' };
            if (item.key === 'quotes' && isTechRepair) return { ...item, path: '/dashboard/repair/quotes' };
            return item;
        });

        const order = settings.moduleOrder || [];
        const favs = new Set(settings.favoriteModules || []);

        // Overview always first
        const overview = filtered.find(i => i.key === 'overview');
        const rest = filtered.filter(i => i.key !== 'overview');

        // Sort by moduleOrder
        const sorted = rest.sort((a, b) => {
            const aIdx = a.moduleKey ? order.indexOf(a.moduleKey) : -1;
            const bIdx = b.moduleKey ? order.indexOf(b.moduleKey) : -1;
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });

        // Group: favorites first, then rest
        const favItems = sorted.filter(i => i.moduleKey && favs.has(i.moduleKey));
        const nonFavItems = sorted.filter(i => !i.moduleKey || !favs.has(i.moduleKey));
        const hasFavs = favItems.length > 0;

        return { overview, favItems, nonFavItems, hasFavs };
    }, [enabledModules, settings.moduleOrder, settings.favoriteModules, hasVehicles, hasDevices, isClinical, isTechRepair]);

    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(path);
    };

    const handleNavClick = () => {
        // Close mobile drawer on navigation
        setMobileOpen(false);
    };

    const renderNavItem = (item: NavItem) => (
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
                        {item.badge && <span className={styles.planBadge}>{item.badge}</span>}
                    </>
                )}
            </Link>
        </li>
    );

    return (
        <>
            {/* Mobile hamburger button — hidden when sidebar is open */}
            {!mobileOpen && (
                <button
                    className={styles.hamburger}
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open menu"
                >
                    <span className={styles.hamburgerLine}></span>
                    <span className={styles.hamburgerLine}></span>
                    <span className={styles.hamburgerLine}></span>
                </button>
            )}

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
                        <Link href="/dashboard" className={styles.logo} onClick={handleNavClick}>
                            <div className={styles.logoIcon}>Æ</div>
                            {!collapsed && <span className={styles.logoText}>AeternaSuite</span>}
                        </Link>
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
                        <Link href="/dashboard/settings/billing" className={styles.planChip} onClick={handleNavClick}>
                            <span className={styles.planDot}></span>
                            Plan
                        </Link>
                    )}
                </div>

                {/* Business Switcher Multi-Tenant */}
                {!collapsed && dbUser && dbUser.businessMembers && dbUser.businessMembers.length > 0 && (
                    <div className={styles.businessSwitcher}>
                        <select
                            value={activeBusinessId || ''}
                            onChange={(e) => setActiveBusinessId(e.target.value)}
                            className={styles.businessSelect}
                            aria-label="Seleccionar Sucursal"
                        >
                            {dbUser.businessMembers.map((member: any) => (
                                <option key={member.business.id} value={member.business.id}>
                                    {member.business.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Desktop toggle — centered on right edge */}
                <button
                    className={styles.toggle}
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <span className={styles.toggleIcon}>{collapsed ? '›' : '‹'}</span>
                </button>

                {/* Navigation */}
                <nav className={styles.nav}>
                    <ul className={styles.navList}>
                        {visibleItems.overview && renderNavItem(visibleItems.overview)}
                        {visibleItems.favItems.map(renderNavItem)}
                        {visibleItems.hasFavs && <li className={styles.navDivider} />}
                        {visibleItems.nonFavItems.map(renderNavItem)}
                    </ul>
                </nav>

                {/* Bottom — Settings + Language + Theme */}
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

                    {/* Quick controls — language + theme */}
                    <div className={styles.quickControls}>
                        <button
                            className={styles.quickBtn}
                            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
                            title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                            aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                        >
                            <span>{locale === 'es' ? '🇲🇽' : '🇺🇸'}</span>
                            {!collapsed && <span className={styles.quickLabel}>{locale === 'es' ? 'ES' : 'EN'}</span>}
                        </button>
                        <button
                            className={styles.quickBtn}
                            onClick={toggleTheme}
                            title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
                            aria-label={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
                        >
                            <span>{theme === 'light' ? '🌙' : '☀️'}</span>
                            {!collapsed && <span className={styles.quickLabel}>{theme === 'light' ? 'Oscuro' : 'Claro'}</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAVIGATION (NATIVE FEEL) - CONTEXTUAL MENU */}
            <div className={styles.mobileBottomNav}>
                <Link href="/dashboard" className={`${styles.bottomNavItem} ${isActive('/dashboard') && pathname === '/dashboard' ? styles.activeBottom : ''}`} onClick={() => setMobileOpen(false)}>
                    <span className={styles.bottomNavIcon}>📊</span>
                    <span className={styles.bottomNavLabel}>Inicio</span>
                </Link>
                <Link href="/dashboard/calendar" className={`${styles.bottomNavItem} ${isActive('/dashboard/calendar') ? styles.activeBottom : ''}`} onClick={() => setMobileOpen(false)}>
                    <span className={styles.bottomNavIcon}>📅</span>
                    <span className={styles.bottomNavLabel}>Citas</span>
                </Link>
                {/* Switch dinámico central dependiendo de la vertical de negocio */}
                {isAutomotive || isTechRepair ? (
                    <Link href="/dashboard/mechanic/work-orders" className={`${styles.bottomNavItem} ${isActive('/dashboard/mechanic/work-orders') || isActive('/dashboard/repair/work-orders') ? styles.activeBottom : ''}`} onClick={() => setMobileOpen(false)}>
                        <span className={styles.bottomNavIcon}><Wrench size={22} /></span>
                        <span className={styles.bottomNavLabel}>Taller</span>
                    </Link>
                ) : (
                    <Link href="/dashboard/pos" className={`${styles.bottomNavItem} ${isActive('/dashboard/pos') ? styles.activeBottom : ''}`} onClick={() => setMobileOpen(false)}>
                        <span className={styles.bottomNavIcon}><ShoppingCart size={22} /></span>
                        <span className={styles.bottomNavLabel}>Caja</span>
                    </Link>
                )}

                <Link href="/dashboard/clients" className={`${styles.bottomNavItem} ${isActive('/dashboard/clients') ? styles.activeBottom : ''}`} onClick={() => setMobileOpen(false)}>
                    <span className={styles.bottomNavIcon}>👥</span>
                    <span className={styles.bottomNavLabel}>{isClinical ? 'Pacientes' : 'Clientes'}</span>
                </Link>
                <button className={styles.bottomNavItem} onClick={() => setMobileOpen(!mobileOpen)}>
                    <span className={styles.bottomNavIcon}>
                        <div className={styles.hamburgerIconMini}>
                            <span className={styles.hamburgerLineMini} />
                            <span className={styles.hamburgerLineMini} />
                            <span className={styles.hamburgerLineMini} />
                        </div>
                    </span>
                    <span className={styles.bottomNavLabel}>Menú</span>
                </button>
            </div>
        </>
    );
}
