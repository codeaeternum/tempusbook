export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Definición local de tipos para el Portal B2C
export interface PublicServiceData {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
    categoryId: string;
}

export interface PublicBusinessMember {
    id: string;
    role: string;
    user: {
        id: string;
        name: string;
        photoUrl?: string;
    };
}

export interface PublicBusinessProfile {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    coverUrl?: string;
    address?: string;
    city?: string;
    phone?: string;
    currency?: string;
    ratingsEnabled?: boolean;
    totalReviews?: number;
    avgRating?: number;
    services: PublicServiceData[];
    members: PublicBusinessMember[];
    businessHours: any[];
}

export interface CreateBookingData {
    serviceId: string;
    staffId?: string;
    startTime: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
}

export const publicApi = {
    /**
     * Obtiene la información pública de un negocio dado su slug.
     * Este endpoint es público y no requiere JWT.
     */
    async getBusinessProfileBySlug(slug: string): Promise<PublicBusinessProfile> {
        const response = await fetch(`${API_URL}/public/businesses/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            next: {
                revalidate: 60, // Revalida en el servidor cada 60 segundos para SEO (ISR)
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('BUSINESS_NOT_FOUND');
            }
            throw new Error(`Error fetching business: ${response.statusText}`);
        }

        return response.json();
    },

    /**
     * Crea una nueva reserva como usuario invitado (B2C)
     */
    async createBooking(slug: string, data: CreateBookingData) {
        const response = await fetch(`${API_URL}/public/businesses/${slug}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Error al crear la reserva: ${response.statusText}`);
        }

        return response.json();
    }
};
