// =============================================
// TempusBook Shared Utilities
// =============================================

/**
 * Generate a URL-safe slug from a string.
 */
export function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Format a price in the given currency.
 */
export function formatPrice(
    amount: number,
    currency: string,
    locale: string = 'es-MX',
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format a date in a human-readable format.
 */
export function formatDate(
    date: Date | string,
    locale: string = 'es-MX',
    options?: Intl.DateTimeFormatOptions,
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    });
}

/**
 * Format a time in HH:mm format.
 */
export function formatTime(
    date: Date | string,
    locale: string = 'es-MX',
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Calculate duration in human-readable format.
 */
export function formatDuration(minutes: number, lang: 'es' | 'en' = 'es'): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (lang === 'es') {
        if (hours === 0) return `${mins} min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}min`;
    }

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
}

/**
 * Calculate distance between two coordinates in km (Haversine formula).
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // rounded to 1 decimal
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Format distance in a human-readable way.
 */
export function formatDistance(km: number, lang: 'es' | 'en' = 'es'): string {
    if (km < 1) {
        const meters = Math.round(km * 1000);
        return `${meters} m`;
    }
    return `${km} km`;
}

/**
 * Generate initials from a name.
 */
export function getInitials(firstName: string, lastName?: string): string {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate phone number (basic LATAM format).
 */
export function isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s()-]/g, '');
    return /^\+?\d{10,15}$/.test(cleaned);
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a random color from a seed (for avatars).
 */
export function seedColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
}
