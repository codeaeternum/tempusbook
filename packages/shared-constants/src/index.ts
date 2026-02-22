import { SubscriptionPlan } from '@aeternasuite/shared-types';

// =============================================
// AeternaSuite Shared Constants
// =============================================

export const ROOT_BUSINESS_ID = '6e62095e-615d-4ac7-b74a-033603c5c980'; // Global MVP Single Tenant ID

// --- Business Categories ---

export const CATEGORIES = [
    // 💆‍♀️ Belleza y Cuidado Personal
    { slug: 'barbershop', icon: '💈', nameEs: 'Barberías', nameEn: 'Barbershops' },
    { slug: 'beauty-salon', icon: '💇‍♀️', nameEs: 'Salones de Belleza', nameEn: 'Beauty Salons' },
    { slug: 'nails', icon: '💅', nameEs: 'Uñas y Manicura', nameEn: 'Nail Salons' },
    { slug: 'lashes-brows', icon: '👁️', nameEs: 'Cejas y Pestañas', nameEn: 'Lashes & Brows' },
    { slug: 'makeup', icon: '💄', nameEs: 'Maquillistas', nameEn: 'Makeup Artists' },
    { slug: 'waxing', icon: '✨', nameEs: 'Depilación y Láser', nameEn: 'Waxing & Laser' },
    { slug: 'spa', icon: '💆‍♀️', nameEs: 'Spas y Masajes', nameEn: 'Spas & Massage' },
    { slug: 'cosmetology', icon: '🧖‍♀️', nameEs: 'Cosmetología', nameEn: 'Cosmetology' },

    // 🏥 Salud y Bienestar
    { slug: 'medical', icon: '🏥', nameEs: 'Clínicas y Médicos', nameEn: 'Medical Clinics' },
    { slug: 'dental', icon: '🦷', nameEs: 'Dentistas', nameEn: 'Dental Clinics' },
    { slug: 'optometry', icon: '👓', nameEs: 'Ópticas', nameEn: 'Optometry' },
    { slug: 'podiatry', icon: '🦶', nameEs: 'Podólogos', nameEn: 'Podiatry' },
    { slug: 'psychology', icon: '🧠', nameEs: 'Psicólogos y Terapeutas', nameEn: 'Psychology & Therapy' },
    { slug: 'nutrition', icon: '🥗', nameEs: 'Nutriólogos', nameEn: 'Nutritionists' },
    { slug: 'physiotherapy', icon: '🦴', nameEs: 'Fisioterapia', nameEn: 'Physiotherapy' },
    { slug: 'chiropractic', icon: '💆‍♂️', nameEs: 'Quiroprácticos', nameEn: 'Chiropractors' },

    // 🏋️ Deportes y Fitness
    { slug: 'gym', icon: '🏋️', nameEs: 'Gimnasios y Crossfit', nameEn: 'Gyms & Crossfit' },
    { slug: 'yoga-pilates', icon: '🧘‍♀️', nameEs: 'Yoga y Pilates', nameEn: 'Yoga & Pilates' },

    // 🐾 Mascotas
    { slug: 'veterinary', icon: '🐾', nameEs: 'Veterinarias', nameEn: 'Veterinary Clinics' },
    { slug: 'pet-grooming', icon: '✂️', nameEs: 'Estéticas Caninas', nameEn: 'Pet Grooming' },

    // 💼 Servicios Profesionales y Finanzas
    { slug: 'legal', icon: '⚖️', nameEs: 'Abogados y Legal', nameEn: 'Lawyers & Legal' },
    { slug: 'accounting', icon: '📊', nameEs: 'Contadores y Asesoría', nameEn: 'Accounting & Tax' },

    // 🎨 Creatividad y Educación
    { slug: 'tattoo', icon: '🖋️', nameEs: 'Tatuajes y Piercings', nameEn: 'Tattoo & Piercings' },
    { slug: 'tutoring', icon: '📚', nameEs: 'Tutorías y Academias', nameEn: 'Tutoring & Academies' },

    // 🚗 Automotriz y Reparación
    { slug: 'mechanic', icon: '🔧', nameEs: 'Taller Mecánico', nameEn: 'Auto Mechanic Shop' },
    { slug: 'carwash', icon: '🚙', nameEs: 'Autolavado y Car Detail', nameEn: 'Carwash & Detailing' },
    { slug: 'electronics-repair', icon: '📱', nameEs: 'Reparación de Celulares y Clínicas de PC', nameEn: 'Electronics & Device Repair' },

    // 🎪 Eventos y Renta de Espacios
    { slug: 'party-rentals', icon: '🎪', nameEs: 'Renta de Mobiliario (Sillas/Brincolines)', nameEn: 'Party & Event Rentals' },
    { slug: 'apparel-rental', icon: '👗', nameEs: 'Renta de Vestidos y Trajes', nameEn: 'Dress & Suit Rentals' },

    // 📅 Otros
    { slug: 'general', icon: '📅', nameEs: 'General / Otros', nameEn: 'General / Others' },
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
        maxBookingsPerMonth: 100, // Buen gancho
        maxEmployees: 1,
        maxBranches: 1,
        maxGalleryItems: 10,
        whatsappRemindersPerMonth: 0,
        hasAds: true,
        hasOnlinePayments: false,
        hasLoyalty: false,
        hasAdvancedReports: false,
        hasExport: false,
        hasChatInApp: false, // Push notifications son distintas. Chat in-app es premium (Pro+)
        hasQrCheckin: true, // Disponible gratis desde la app cliente
        hasDigitalTips: false,
        hasWaitlist: false,
        hasRecurringBookings: false,
        hasCalendarSync: false,
        hasCustomBranding: false,
        hasApiAccess: false,
    },
    [SubscriptionPlan.STARTER]: {
        maxBookingsPerMonth: 500,
        maxEmployees: 3,
        maxBranches: 1,
        maxGalleryItems: 50,
        whatsappRemindersPerMonth: 0, // WhatsApp removido. Usan Push App.
        hasAds: false,
        hasOnlinePayments: true,
        hasLoyalty: true,
        hasAdvancedReports: false,
        hasExport: false,
        hasChatInApp: false,
        hasQrCheckin: true, // App client feature
        hasDigitalTips: false,
        hasWaitlist: true,
        hasRecurringBookings: true,
        hasCalendarSync: true,
        hasCustomBranding: false,
        hasApiAccess: false,
    },
    [SubscriptionPlan.PRO]: {
        maxBookingsPerMonth: null, // unlimited
        maxEmployees: 5, // ✅ Limitado a 5 (antes 10) para proteger infraestructura
        maxBranches: 2, // ✅ Limitado a 2 (antes 3)
        maxGalleryItems: 200, // ✅ Limitado a 200
        whatsappRemindersPerMonth: 50, // ✅ Incluye 50 al mes
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
        maxEmployees: 15, // ✅ Limitado a 15 (antes infinito)
        maxBranches: 5, // ✅ Limitado a 5 (antes infinito)
        maxGalleryItems: 1000,
        whatsappRemindersPerMonth: 500, // ✅ 500 incluidos
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
    [SubscriptionPlan.STARTER]: { monthly: 999, yearly: 9590 }, // $9.99/mo or $95.90/yr (20% off)
    [SubscriptionPlan.PRO]: { monthly: 1499, yearly: 14390 }, // $14.99/mo or $143.90/yr
    [SubscriptionPlan.BUSINESS]: { monthly: 3999, yearly: 38390 }, // $39.99/mo or $383.90/yr
} as const;
