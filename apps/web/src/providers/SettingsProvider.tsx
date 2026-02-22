'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { fetchWithAuth, useAuth } from './AuthProvider';
// ---- Module Keys ----
export type ModuleKey =
    | 'calendar'
    | 'appointments'
    | 'clients'
    | 'services'
    | 'inventory'
    | 'team'
    | 'payments'
    | 'gallery'
    | 'reviews'
    | 'loyalty'
    | 'intake_forms'
    | 'reports'
    | 'quotes'
    | 'cashflow'
    | 'pos'
    | 'reception'
    | 'vehicles'
    | 'devices'
    | 'work_orders'
    | 'packages'
    | 'gift_cards'
    | 'inspections'
    | 'dental_chart'
    | 'body_chart'
    | 'medical_records'
    | 'prescriptions';

export const ALL_MODULES: { key: ModuleKey; icon: string; labelKey: string }[] = [
    { key: 'calendar', icon: '📅', labelKey: 'calendar' },
    { key: 'appointments', icon: '🕐', labelKey: 'appointments' },
    { key: 'clients', icon: '👥', labelKey: 'clients' },
    { key: 'services', icon: '💼', labelKey: 'services' },
    { key: 'inventory', icon: '📦', labelKey: 'inventory' },
    { key: 'team', icon: '🤝', labelKey: 'team' },
    { key: 'payments', icon: '💳', labelKey: 'payments' },
    { key: 'gallery', icon: '🖼️', labelKey: 'gallery' },
    { key: 'reviews', icon: '⭐', labelKey: 'reviews' },
    { key: 'loyalty', icon: '🎁', labelKey: 'loyalty' },
    { key: 'intake_forms', icon: '📋', labelKey: 'intake_forms' },
    { key: 'reports', icon: '📈', labelKey: 'reports' },
    { key: 'quotes', icon: '📝', labelKey: 'quotes' },
    { key: 'cashflow', icon: '💰', labelKey: 'cashflow' },
    { key: 'pos', icon: '🛒', labelKey: 'pos' },
    { key: 'reception', icon: '🖥️', labelKey: 'reception' },
    { key: 'vehicles', icon: '🚗', labelKey: 'vehicles' },
    { key: 'devices', icon: '📱', labelKey: 'devices' },
    { key: 'work_orders', icon: '🔧', labelKey: 'work_orders' },
    { key: 'packages', icon: '🎟️', labelKey: 'packages' },
    { key: 'gift_cards', icon: '💌', labelKey: 'gift_cards' },
    { key: 'inspections', icon: '📋', labelKey: 'inspections' },
    { key: 'dental_chart', icon: '🦷', labelKey: 'dental_chart' },
    { key: 'body_chart', icon: '🫀', labelKey: 'body_chart' },
    { key: 'medical_records', icon: '🏥', labelKey: 'medical_records' },
    { key: 'prescriptions', icon: '💊', labelKey: 'prescriptions' },
];

// ---- Social Networks ----
export const SOCIAL_NETWORKS = [
    { id: 'instagram', label: 'Instagram', icon: '📸', placeholder: '@usuario' },
    { id: 'facebook', label: 'Facebook', icon: '📘', placeholder: 'facebook.com/...' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: '@usuario' },
    { id: 'twitter', label: 'X (Twitter)', icon: '🐦', placeholder: '@usuario' },
    { id: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'youtube.com/...' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'linkedin.com/in/...' },
    { id: 'pinterest', label: 'Pinterest', icon: '📌', placeholder: 'pinterest.com/...' },
    { id: 'threads', label: 'Threads', icon: '🧵', placeholder: '@usuario' },
    { id: 'whatsapp', label: 'WhatsApp Business', icon: '💬', placeholder: '+52 55 ...' },
] as const;

export interface SocialLink { network: string; url: string; }

export interface BusinessAddress {
    street: string; extNum: string; intNum: string; colonia: string;
    city: string; state: string; zip: string; country: string;
}

export interface DaySchedule { open: string; close: string; enabled: boolean; }

// ---- Business Settings ----
export interface BusinessSettings {
    // Profile
    businessName: string;
    businessAddress: BusinessAddress;
    businessRubro: string;
    logoUrl: string;  // base64 data URL or URL
    businessPhone: string;
    businessEmail: string;
    businessDescription: string;
    businessWebsite: string;
    socialLinks: SocialLink[];

    // Modules + Order
    enabledModules: ModuleKey[];
    moduleOrder: ModuleKey[];
    favoriteModules: ModuleKey[];

    // Subscription
    currentPlan: 'free' | 'starter' | 'pro' | 'business';
    trialDaysLeft: number;

    // Fiscal
    emiteFactura: boolean;
    rfcNegocio: string;
    razonSocial: string;
    regimenFiscal: string;
    tasaIVA: number;
    incluyeImpuestos: boolean;
    manejaEfectivo: boolean;
    requiereDatosFiscalesCliente: 'nunca' | 'opcional' | 'obligatorio';

    // Appearance
    primaryColor: string;

    // Booking / Scheduling
    bookingEnabled: boolean;
    bookingInterval: number;
    bookingOpenTime: string;
    bookingCloseTime: string;
    bookingBuffer: number;
    bookingMaxAdvanceDays: number;
    bookingAutoConfirm: boolean;
    bookingCancellationHours: number;
    bookingPaymentRequirement: 'none' | 'deposit' | 'full';
    depositType: 'percent' | 'fixed';
    bookingDepositPercent: number;
    depositFixedAmount: number;
    // Per-day schedule
    daySchedules: DaySchedule[];  // 7 entries: Sun(0)..Sat(6)
    timezone: string;
    // Date opening
    dateOpeningMode: 'weekly' | 'monthly' | 'custom';
    dateOpeningDay: number; // Day of week (0-6) for weekly; day of month (1-31) for monthly
    restDays: number[];
    lunchBreakEnabled: boolean;
    lunchBreakStart: string;
    lunchBreakEnd: string;
    closedDates: string[];

    // Notifications
    notifEmail: boolean;
    notifPush: boolean;
    notifWhatsApp: boolean;
    notifSMS: boolean;
    reminderHoursBefore: number;
    notifAppointmentReminder: boolean;
    notifNewClientWelcome: boolean;
    notifNoShowFollowUp: boolean;
    notifMarketingEnabled: boolean;
    notifReviewRequest: boolean;
}

const DEFAULT_MODULE_ORDER: ModuleKey[] = [
    'calendar', 'appointments', 'clients', 'services', 'packages', 'gift_cards', 'inventory',
    'team', 'payments', 'pos', 'reception', 'gallery', 'reviews', 'loyalty',
    'intake_forms', 'reports', 'quotes', 'cashflow', 'vehicles', 'devices', 'work_orders', 'inspections'
];

const DEFAULT_DAY_SCHEDULES: DaySchedule[] = [
    { open: '', close: '', enabled: false },       // Sun - off
    { open: '09:00', close: '21:00', enabled: true },  // Mon
    { open: '09:00', close: '21:00', enabled: true },  // Tue
    { open: '09:00', close: '21:00', enabled: true },  // Wed
    { open: '09:00', close: '21:00', enabled: true },  // Thu
    { open: '09:00', close: '21:00', enabled: true },  // Fri
    { open: '10:00', close: '18:00', enabled: true },  // Sat
];

const DEFAULT_SETTINGS: BusinessSettings = {
    businessName: 'Mi Barbería Premium',
    businessAddress: { street: 'Av. Reforma', extNum: '123', intNum: '', colonia: 'Juárez', city: 'Ciudad de México', state: 'CDMX', zip: '06600', country: 'México' },
    businessRubro: 'barbershop',
    logoUrl: '',
    businessPhone: '+52 55 1234 5678',
    businessEmail: 'contacto@mibarberia.com',
    businessDescription: 'Barbería de cortes modernos y clásicos con ambiente premium.',
    businessWebsite: '',
    socialLinks: [],

    enabledModules: [
        'calendar', 'appointments', 'clients', 'services', 'packages', 'gift_cards', 'inventory',
        'team', 'payments', 'gallery', 'reviews', 'loyalty',
        'intake_forms', 'reports', 'pos', 'reception'
    ],
    moduleOrder: DEFAULT_MODULE_ORDER,
    favoriteModules: [],

    currentPlan: 'pro',
    trialDaysLeft: 12,

    emiteFactura: false,
    rfcNegocio: '',
    razonSocial: '',
    regimenFiscal: '',
    tasaIVA: 16,
    incluyeImpuestos: true,
    manejaEfectivo: true,
    requiereDatosFiscalesCliente: 'nunca',

    primaryColor: '#6C5CE7',

    bookingEnabled: false,
    bookingInterval: 30,
    bookingOpenTime: '09:00',
    bookingCloseTime: '21:00',
    bookingBuffer: 10,
    bookingMaxAdvanceDays: 30,
    bookingAutoConfirm: false,
    bookingCancellationHours: 24,
    bookingPaymentRequirement: 'none',
    depositType: 'percent',
    bookingDepositPercent: 30,
    depositFixedAmount: 100,
    daySchedules: DEFAULT_DAY_SCHEDULES,
    timezone: 'America/Mexico_City',
    dateOpeningMode: 'weekly',
    dateOpeningDay: 6, // Saturday for weekly
    restDays: [0],
    lunchBreakEnabled: false,
    lunchBreakStart: '14:00',
    lunchBreakEnd: '15:00',
    closedDates: [],

    notifEmail: true,
    notifPush: true,
    notifWhatsApp: false,
    notifSMS: false,
    reminderHoursBefore: 24,
    notifAppointmentReminder: true,
    notifNewClientWelcome: true,
    notifNoShowFollowUp: false,
    notifMarketingEnabled: false,
    notifReviewRequest: true,
};

const STORAGE_KEY = 'aeternasuite-settings';

// ---- Context ----
interface SettingsContextType {
    settings: BusinessSettings;
    updateSettings: (partial: Partial<BusinessSettings>) => void;
    enabledModules: Set<ModuleKey>;
    toggleModule: (key: ModuleKey) => void;
    moveModule: (key: ModuleKey, direction: 'up' | 'down') => void;
    toggleFavorite: (key: ModuleKey) => void;
    resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateSettings: () => { },
    enabledModules: new Set(DEFAULT_SETTINGS.enabledModules),
    toggleModule: () => { },
    moveModule: () => { },
    toggleFavorite: () => { },
    resetSettings: () => { },
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { activeBusinessId } = useAuth();
    const [settings, setSettings] = useState<BusinessSettings>(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const merged = { ...DEFAULT_SETTINGS, ...parsed };

                    // ── Migration: merge in any NEW default modules missing from stale cache ──
                    if (parsed.enabledModules && Array.isArray(parsed.enabledModules)) {
                        const cachedSet = new Set<string>(parsed.enabledModules);
                        for (const mod of DEFAULT_SETTINGS.enabledModules) {
                            if (!cachedSet.has(mod)) cachedSet.add(mod);
                        }
                        merged.enabledModules = Array.from(cachedSet);
                    }
                    if (parsed.moduleOrder && Array.isArray(parsed.moduleOrder)) {
                        const orderSet = new Set<string>(parsed.moduleOrder);
                        for (const mod of DEFAULT_MODULE_ORDER) {
                            if (!orderSet.has(mod)) parsed.moduleOrder.push(mod);
                        }
                        merged.moduleOrder = parsed.moduleOrder;
                    }

                    return merged;
                }
            } catch (e) {
                console.warn('Failed to parse settings from localStorage', e);
            }
        }
        return DEFAULT_SETTINGS;
    });
    const [isHydrated, setIsHydrated] = useState(false);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        setIsHydrated(true);
        if (!activeBusinessId) return;

        // Sync root settings from Postgres
        fetchWithAuth(`http://localhost:3001/api/v1/businesses/${activeBusinessId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    // Try parsing JSON if settings from Prisma comes as string, or use as object
                    const backendSettings: any = (data.settings && Object.keys(data.settings).length > 0)
                        ? (typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings)
                        : {};

                    // ── Core Sync: Overwrite defaults with actual database table fields ──
                    if (data.name) backendSettings.businessName = data.name;
                    if (data.email) backendSettings.businessEmail = data.email;
                    if (data.phone) backendSettings.businessPhone = data.phone;
                    if (data.category && data.category.slug) backendSettings.businessRubro = data.category.slug;
                    if (data.logoUrl) backendSettings.logoUrl = data.logoUrl;

                    // ── Migration: ensure NEW default modules are never lost by stale DB data ──
                    const finalEnabledModules = backendSettings.enabledModules && Array.isArray(backendSettings.enabledModules) && backendSettings.enabledModules.length > 0
                        ? backendSettings.enabledModules
                        : (data.category && data.category.enabledModules ? data.category.enabledModules : DEFAULT_SETTINGS.enabledModules);

                    const dbSet = new Set<string>(finalEnabledModules);
                    for (const mod of DEFAULT_SETTINGS.enabledModules) {
                        if (!dbSet.has(mod)) dbSet.add(mod); // Add missing base modules
                    }
                    backendSettings.enabledModules = Array.from(dbSet);

                    // ── Migration: ensure moduleOrder contains all known keys ──
                    if (backendSettings.moduleOrder && Array.isArray(backendSettings.moduleOrder)) {
                        const orderSet = new Set<string>(backendSettings.moduleOrder);
                        for (const mod of DEFAULT_MODULE_ORDER) {
                            if (!orderSet.has(mod)) {
                                backendSettings.moduleOrder.push(mod);
                            }
                        }
                    }

                    setSettings(prev => ({ ...prev, ...backendSettings }));
                }
            })
            .catch(e => console.error('Failed to load settings from DB:', e));
    }, [activeBusinessId]);

    useEffect(() => {
        if (isHydrated && activeBusinessId) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            // Persist to Postgres Debounced
            const timer = setTimeout(() => {
                fetchWithAuth(`http://localhost:3001/api/v1/businesses/${activeBusinessId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings })
                }).catch(e => console.error('Failed writing DB Settings:', e));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [settings, isHydrated, activeBusinessId]);

    // Apply primary color to CSS custom properties
    useEffect(() => {
        if (typeof document !== 'undefined' && settings.primaryColor) {
            document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
            // Generate transparent background variant
            document.documentElement.style.setProperty('--color-primary-bg', `${settings.primaryColor}14`);
        }
    }, [settings.primaryColor]);

    const updateSettings = useCallback((partial: Partial<BusinessSettings>) => {
        setSettings(prev => ({ ...prev, ...partial }));
    }, []);

    const enabledModules = new Set<ModuleKey>(settings.enabledModules);

    const toggleModule = useCallback((key: ModuleKey) => {
        setSettings(prev => {
            const current = new Set(prev.enabledModules);
            if (current.has(key)) { current.delete(key); } else { current.add(key); }
            return { ...prev, enabledModules: Array.from(current) };
        });
    }, []);

    const moveModule = useCallback((key: ModuleKey, direction: 'up' | 'down') => {
        setSettings(prev => {
            const order = [...(prev.moduleOrder || DEFAULT_MODULE_ORDER)];
            const idx = order.indexOf(key);
            if (idx === -1) return prev;
            const swap = direction === 'up' ? idx - 1 : idx + 1;
            if (swap < 0 || swap >= order.length) return prev;
            [order[idx], order[swap]] = [order[swap], order[idx]];
            return { ...prev, moduleOrder: order };
        });
    }, []);

    const toggleFavorite = useCallback((key: ModuleKey) => {
        setSettings(prev => {
            const favs = new Set(prev.favoriteModules || []);
            if (favs.has(key)) { favs.delete(key); } else { favs.add(key); }
            return { ...prev, favoriteModules: Array.from(favs) };
        });
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, enabledModules, toggleModule, moveModule, toggleFavorite, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
