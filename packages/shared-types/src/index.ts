// =============================================
// AeternaSuite Shared Types
// =============================================

// --- Enums ---

export enum UserRole {
    PLATFORM_ADMIN = 'PLATFORM_ADMIN',
    CLIENT = 'CLIENT',
    BUSINESS_USER = 'BUSINESS_USER',
}

export enum BusinessRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE',
}

export enum BusinessStatus {
    ONBOARDING = 'ONBOARDING',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
}

export enum CalendarMode {
    INDIVIDUAL = 'INDIVIDUAL',
    SHARED = 'SHARED',
}

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export enum PaymentType {
    DEPOSIT = 'DEPOSIT',
    FULL = 'FULL',
    TIP = 'TIP',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    REFUNDED = 'REFUNDED',
    FAILED = 'FAILED',
}

export enum SubscriptionPlan {
    FREE = 'FREE',
    STARTER = 'STARTER',
    PRO = 'PRO',
    BUSINESS = 'BUSINESS',
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    TRIAL = 'TRIAL',
    PAST_DUE = 'PAST_DUE',
    CANCELLED = 'CANCELLED',
}

export enum DayOfWeek {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY',
}

export enum NotificationType {
    BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
    BOOKING_REMINDER = 'BOOKING_REMINDER',
    BOOKING_CANCELLED = 'BOOKING_CANCELLED',
    BOOKING_RESCHEDULED = 'BOOKING_RESCHEDULED',
    SLOT_AVAILABLE = 'SLOT_AVAILABLE',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    REVIEW_REQUEST = 'REVIEW_REQUEST',
    LOYALTY_REWARD = 'LOYALTY_REWARD',
    PROMOTION = 'PROMOTION',
}

export enum NotificationChannel {
    PUSH = 'PUSH',
    EMAIL = 'EMAIL',
    WHATSAPP = 'WHATSAPP',
    IN_APP = 'IN_APP',
}

// --- Interfaces ---

export interface IUser {
    id: string;
    firebaseUid: string;
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    preferredLang: 'es' | 'en';
    role: UserRole;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBusiness {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    description: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    timezone: string;
    currency: string;
    ratingsEnabled: boolean;
    settings: IBusinessSettings;
    calendarMode: CalendarMode;
    status: BusinessStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBusinessSettings {
    cancelationHours: number;
    noShowPenaltyPercent: number;
    maxReschedules: number;
    minRescheduleHours: number;
    waitlistOfferMinutes: number;
    nearbyOfferMinutes: number;
    cascadeEnabled: boolean;
    confirmationRequired: boolean;
    confirmationHoursBefore: number;
    autoCancelOnNoConfirm: boolean;
    darkMode: boolean;
    animationsEnabled: boolean;
}

export interface ICategory {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string | null;
    defaultSettings: Record<string, unknown>;
    enabledModules: string[];
}

export interface IService {
    id: string;
    businessId: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: number;
    currency: string;
    requiresDeposit: boolean;
    depositAmount: number | null;
    isGroup: boolean;
    maxCapacity: number | null;
    isActive: boolean;
    sortOrder: number;
}

export interface IBooking {
    id: string;
    businessId: string;
    clientId: string;
    serviceId: string;
    staffId: string | null;
    branchId: string | null;
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
    clientNotes: string | null;
    staffNotes: string | null;
    categoryData: Record<string, unknown>;
    intakeFormData: Record<string, unknown> | null;
    reminderSent: boolean;
    confirmedByClient: boolean;
    rescheduleCount: number;
}

export interface IPayment {
    id: string;
    bookingId: string | null;
    businessId: string;
    amount: number;
    currency: string;
    type: PaymentType;
    status: PaymentStatus;
    mpPaymentId: string | null;
    mpPreferenceId: string | null;
}

export interface ISubscription {
    id: string;
    businessId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trialEndsAt: Date | null;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    mpSubscriptionId: string | null;
}

export interface IReview {
    id: string;
    businessId: string;
    clientId: string;
    bookingId: string | null;
    rating: number;
    comment: string | null;
    reply: string | null;
    createdAt: Date;
}

export interface IBusinessHours {
    id: string;
    businessId: string;
    staffId: string | null;
    dayOfWeek: DayOfWeek;
    openTime: string; // HH:mm
    closeTime: string; // HH:mm
    isActive: boolean;
}

export interface IIntakeFormSchema {
    categorySlug: string;
    fields: IIntakeFormField[];
}

export interface IIntakeFormField {
    name: string;
    label: Record<string, string>; // { es: '...', en: '...' }
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'number' | 'boolean' | 'scale' | 'upload' | 'body-selector' | 'tooth-selector' | 'color-picker';
    required: boolean;
    options?: Array<{ value: string; label: Record<string, string> }>;
    min?: number;
    max?: number;
    placeholder?: Record<string, string>;
    dependsOn?: { field: string; value: unknown };
}

// --- API Response Types ---

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    };
}

export interface ApiError {
    success: false;
    message: string;
    code: string;
    details?: Record<string, unknown>;
}
