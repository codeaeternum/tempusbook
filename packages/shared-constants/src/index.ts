import { SubscriptionPlan } from '@tempusbook/shared-types';

// =============================================
// TempusBook Shared Constants
// =============================================

// --- Business Categories ---

export const CATEGORIES = [
    { slug: 'medical', icon: '🏥', nameEs: 'Médicos', nameEn: 'Medical' },
    { slug: 'dental', icon: '🦷', nameEs: 'Dentistas', nameEn: 'Dental' },
    { slug: 'nails', icon: '💅', nameEs: 'Manicuristas', nameEn: 'Nail Salon' },
    { slug: 'barbershop', icon: '💈', nameEs: 'Barberías', nameEn: 'Barbershop' },
    { slug: 'spa', icon: '💆', nameEs: 'Spas', nameEn: 'Spa & Wellness' },
    { slug: 'gym', icon: '🏋️', nameEs: 'Gimnasios', nameEn: 'Gym & Fitness' },
    { slug: 'veterinary', icon: '🐾', nameEs: 'Veterinarias', nameEn: 'Veterinary' },
    { slug: 'yoga', icon: '🧘', nameEs: 'Yoga / Pilates', nameEn: 'Yoga / Pilates' },
    { slug: 'optometry', icon: '👁️', nameEs: 'Ópticas', nameEn: 'Optometry' },
    { slug: 'psychology', icon: '🧠', nameEs: 'Psicólogos', nameEn: 'Psychology' },
    { slug: 'home-services', icon: '🏠', nameEs: 'Servicios a domicilio', nameEn: 'Home Services' },
    { slug: 'chiropractic', icon: '💆', nameEs: 'Quiroprácticos', nameEn: 'Chiropractic' },
    { slug: 'tutoring', icon: '📚', nameEs: 'Tutores', nameEn: 'Tutoring' },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'];

// --- Subscription Plan Limits ---

export const PLAN_LIMITS: Record<SubscriptionPlan, {
    maxBookingsPerMonth: number | null;
    maxEmployees: number | null;
    maxBranches: number | null;
    maxGalleryItems: number | null;
    whatsappRemindersPerMonth: number | null;
    hasAds: boolean;
    hasOnlinePayments: boolean;
    hasLoyalty: boolean;
    hasAdvancedReports: boolean;
    hasExport: boolean;
    hasChatInApp: boolean;
    hasQrCheckin: boolean;
    hasDigitalTips: boolean;
    hasWaitlist: boolean;
    hasRecurringBookings: boolean;
    hasCalendarSync: boolean;
    hasCustomBranding: boolean;
    hasApiAccess: boolean;
}> = {
    [SubscriptionPlan.FREE]: {
        maxBookingsPerMonth: 30,
        maxEmployees: 1,
        maxBranches: 1,
        maxGalleryItems: 10,
        whatsappRemindersPerMonth: 0,
        hasAds: true,
        hasOnlinePayments: false,
        hasLoyalty: false,
        hasAdvancedReports: false,
        hasExport: false,
        hasChatInApp: false,
        hasQrCheckin: false,
        hasDigitalTips: false,
        hasWaitlist: false,
        hasRecurringBookings: false,
        hasCalendarSync: false,
        hasCustomBranding: false,
        hasApiAccess: false,
    },
    [SubscriptionPlan.STARTER]: {
        maxBookingsPerMonth: 200,
        maxEmployees: 3,
        maxBranches: 1,
        maxGalleryItems: 50,
        whatsappRemindersPerMonth: 50,
        hasAds: false,
        hasOnlinePayments: true,
        hasLoyalty: true,
        hasAdvancedReports: false,
        hasExport: false,
        hasChatInApp: false,
        hasQrCheckin: false,
        hasDigitalTips: false,
        hasWaitlist: true,
        hasRecurringBookings: true,
        hasCalendarSync: true,
        hasCustomBranding: false,
        hasApiAccess: false,
    },
    [SubscriptionPlan.PRO]: {
        maxBookingsPerMonth: null, // unlimited
        maxEmployees: 10,
        maxBranches: 3,
        maxGalleryItems: null, // unlimited
        whatsappRemindersPerMonth: null, // unlimited
        hasAds: false,
        hasOnlinePayments: true,
        hasLoyalty: true,
        hasAdvancedReports: true,
        hasExport: false,
        hasChatInApp: true,
        hasQrCheckin: true,
        hasDigitalTips: true,
        hasWaitlist: true,
        hasRecurringBookings: true,
        hasCalendarSync: true,
        hasCustomBranding: true,
        hasApiAccess: false,
    },
    [SubscriptionPlan.BUSINESS]: {
        maxBookingsPerMonth: null,
        maxEmployees: null,
        maxBranches: null,
        maxGalleryItems: null,
        whatsappRemindersPerMonth: null,
        hasAds: false,
        hasOnlinePayments: true,
        hasLoyalty: true,
        hasAdvancedReports: true,
        hasExport: true,
        hasChatInApp: true,
        hasQrCheckin: true,
        hasDigitalTips: true,
        hasWaitlist: true,
        hasRecurringBookings: true,
        hasCalendarSync: true,
        hasCustomBranding: true,
        hasApiAccess: true,
    },
};

// --- Default Business Settings ---

export const DEFAULT_BUSINESS_SETTINGS = {
    cancelationHours: 24,
    noShowPenaltyPercent: 100,
    maxReschedules: 2,
    minRescheduleHours: 4,
    waitlistOfferMinutes: 30,
    nearbyOfferMinutes: 20,
    cascadeEnabled: true,
    confirmationRequired: true,
    confirmationHoursBefore: 24,
    autoCancelOnNoConfirm: false,
    darkMode: false,
    animationsEnabled: true,
} as const;

// --- Supported Currencies ---

export const SUPPORTED_CURRENCIES = [
    { code: 'MXN', symbol: '$', nameEs: 'Peso Mexicano', nameEn: 'Mexican Peso' },
    { code: 'USD', symbol: '$', nameEs: 'Dólar Americano', nameEn: 'US Dollar' },
    { code: 'ARS', symbol: '$', nameEs: 'Peso Argentino', nameEn: 'Argentine Peso' },
    { code: 'COP', symbol: '$', nameEs: 'Peso Colombiano', nameEn: 'Colombian Peso' },
    { code: 'CLP', symbol: '$', nameEs: 'Peso Chileno', nameEn: 'Chilean Peso' },
    { code: 'BRL', symbol: 'R$', nameEs: 'Real Brasileño', nameEn: 'Brazilian Real' },
    { code: 'EUR', symbol: '€', nameEs: 'Euro', nameEn: 'Euro' },
] as const;

// --- Supported Languages ---

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// --- Trial Duration ---

export const TRIAL_DURATION_DAYS = 14;

// --- Subscription Prices (USD cents) ---

export const SUBSCRIPTION_PRICES = {
    [SubscriptionPlan.FREE]: { monthly: 0, yearly: 0 },
    [SubscriptionPlan.STARTER]: { monthly: 699, yearly: 6710 }, // $6.99/mo or $67.10/yr (20% off)
    [SubscriptionPlan.PRO]: { monthly: 1499, yearly: 14390 }, // $14.99/mo or $143.90/yr
    [SubscriptionPlan.BUSINESS]: { monthly: 2999, yearly: 28790 }, // $29.99/mo or $287.90/yr
} as const;
