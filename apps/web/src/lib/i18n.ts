// =============================================
// TempusBook i18n — Spanish & English translations
// =============================================

export type Locale = 'es' | 'en';

const translations = {
    es: {
        // General
        app_name: 'TempusBook',
        loading: 'Cargando...',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        search: 'Buscar',
        filter: 'Filtrar',
        export: 'Exportar',
        back: 'Volver',
        next: 'Siguiente',
        previous: 'Anterior',
        confirm: 'Confirmar',
        close: 'Cerrar',
        yes: 'Sí',
        no: 'No',
        or: 'o',
        of: 'de',
        all: 'Todos',
        none: 'Ninguno',
        more: 'Más',

        // Auth
        login: 'Iniciar sesión',
        register: 'Registrarse',
        logout: 'Cerrar sesión',
        email: 'Correo electrónico',
        password: 'Contraseña',
        forgot_password: 'Olvidé mi contraseña',
        login_with_google: 'Continuar con Google',
        login_with_apple: 'Continuar con Apple',
        login_with_phone: 'Continuar con teléfono',
        create_account: 'Crear cuenta',
        already_have_account: '¿Ya tienes cuenta?',
        dont_have_account: '¿No tienes cuenta?',

        // Dashboard
        dashboard: 'Dashboard',
        overview: 'Resumen',
        today: 'Hoy',
        this_week: 'Esta semana',
        this_month: 'Este mes',
        appointments: 'Citas',
        clients: 'Clientes',
        services: 'Servicios',
        products: 'Productos',
        team: 'Equipo',
        reports: 'Reportes',
        settings: 'Configuración',
        profile: 'Perfil',
        notifications: 'Notificaciones',
        calendar: 'Calendario',
        gallery: 'Galería',
        reviews: 'Reseñas',
        loyalty: 'Fidelización',
        payments: 'Pagos',
        subscription: 'Suscripción',
        branches: 'Sucursales',
        intake_forms: 'Formularios',

        // Stats
        total_revenue: 'Ingresos totales',
        total_bookings: 'Total de citas',
        new_clients: 'Nuevos clientes',
        avg_rating: 'Calificación promedio',
        no_show_rate: 'Tasa de inasistencia',
        cancellation_rate: 'Tasa de cancelación',

        // Booking statuses
        status_pending: 'Pendiente',
        status_confirmed: 'Confirmada',
        status_in_progress: 'En curso',
        status_completed: 'Completada',
        status_cancelled: 'Cancelada',
        status_no_show: 'No asistió',

        // Business
        business_name: 'Nombre del negocio',
        category: 'Categoría',
        address: 'Dirección',
        phone: 'Teléfono',
        website: 'Sitio web',
        schedule: 'Horario',
        open: 'Abierto',
        closed: 'Cerrado',

        // Subscription
        free_plan: 'Gratis',
        starter_plan: 'Starter',
        pro_plan: 'Pro',
        business_plan: 'Business',
        upgrade: 'Mejorar plan',
        current_plan: 'Plan actual',
        trial_days_left: 'días de prueba restantes',

        // Settings
        general: 'General',
        appearance: 'Apariencia',
        dark_mode: 'Modo oscuro',
        light_mode: 'Modo claro',
        language: 'Idioma',
        animations: 'Animaciones',
        timezone: 'Zona horaria',
        currency: 'Moneda',

        // Empty states
        no_appointments_today: 'No hay citas para hoy',
        no_clients_yet: 'Aún no tienes clientes registrados',
        no_reviews_yet: 'Aún no tienes reseñas',
        schedule_appointment: 'Agendar una cita',

        // Time
        minutes: 'min',
        hours: 'horas',
        days: 'días',
    },

    en: {
        // General
        app_name: 'TempusBook',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        confirm: 'Confirm',
        close: 'Close',
        yes: 'Yes',
        no: 'No',
        or: 'or',
        of: 'of',
        all: 'All',
        none: 'None',
        more: 'More',

        // Auth
        login: 'Log in',
        register: 'Sign up',
        logout: 'Log out',
        email: 'Email',
        password: 'Password',
        forgot_password: 'Forgot password',
        login_with_google: 'Continue with Google',
        login_with_apple: 'Continue with Apple',
        login_with_phone: 'Continue with phone',
        create_account: 'Create account',
        already_have_account: 'Already have an account?',
        dont_have_account: "Don't have an account?",

        // Dashboard
        dashboard: 'Dashboard',
        overview: 'Overview',
        today: 'Today',
        this_week: 'This week',
        this_month: 'This month',
        appointments: 'Appointments',
        clients: 'Clients',
        services: 'Services',
        products: 'Products',
        team: 'Team',
        reports: 'Reports',
        settings: 'Settings',
        profile: 'Profile',
        notifications: 'Notifications',
        calendar: 'Calendar',
        gallery: 'Gallery',
        reviews: 'Reviews',
        loyalty: 'Loyalty',
        payments: 'Payments',
        subscription: 'Subscription',
        branches: 'Branches',
        intake_forms: 'Intake Forms',

        // Stats
        total_revenue: 'Total Revenue',
        total_bookings: 'Total Bookings',
        new_clients: 'New Clients',
        avg_rating: 'Average Rating',
        no_show_rate: 'No-show Rate',
        cancellation_rate: 'Cancellation Rate',

        // Booking statuses
        status_pending: 'Pending',
        status_confirmed: 'Confirmed',
        status_in_progress: 'In Progress',
        status_completed: 'Completed',
        status_cancelled: 'Cancelled',
        status_no_show: 'No Show',

        // Business
        business_name: 'Business Name',
        category: 'Category',
        address: 'Address',
        phone: 'Phone',
        website: 'Website',
        schedule: 'Schedule',
        open: 'Open',
        closed: 'Closed',

        // Subscription
        free_plan: 'Free',
        starter_plan: 'Starter',
        pro_plan: 'Pro',
        business_plan: 'Business',
        upgrade: 'Upgrade Plan',
        current_plan: 'Current Plan',
        trial_days_left: 'trial days left',

        // Settings
        general: 'General',
        appearance: 'Appearance',
        dark_mode: 'Dark Mode',
        light_mode: 'Light Mode',
        language: 'Language',
        animations: 'Animations',
        timezone: 'Timezone',
        currency: 'Currency',

        // Empty states
        no_appointments_today: 'No appointments for today',
        no_clients_yet: 'No clients registered yet',
        no_reviews_yet: 'No reviews yet',
        schedule_appointment: 'Schedule an appointment',

        // Time
        minutes: 'min',
        hours: 'hours',
        days: 'days',
    },
} as const;

export type TranslationKey = keyof typeof translations.es;

export function t(key: TranslationKey, locale: Locale = 'es'): string {
    return translations[locale][key] || key;
}

export function getTranslations(locale: Locale) {
    return translations[locale];
}

export default translations;
