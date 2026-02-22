import { fetchWithAuth } from '@/providers/AuthProvider';

export interface Booking {
    id: string;
    businessId: string;
    clientId: string;
    serviceId: string;
    staffId?: string | null;
    branchId?: string | null;
    startTime: string | Date;
    endTime: string | Date;
    status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    clientNotes?: string | null;
    client?: { firstName: string; lastName: string; phone: string; email?: string };
    service?: { id: string; name: string; durationMinutes: number; price: number | string };
    staff?: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const bookingsApi = {
    /**
     * Obtiene todas las citas de un negocio específico (Dashboard B2B).
     */
    async getByBusinessId(businessId: string, params?: { date?: string; status?: string; staffId?: string }): Promise<Booking[]> {
        const query = new URLSearchParams(params as any).toString();
        const url = `${API_URL}/bookings/business/${businessId}${query ? `?${query}` : ''}`;

        const response = await fetchWithAuth(url);
        if (!response.ok) throw new Error('Failed to fetch bookings');
        return response.json();
    },

    /**
     * Crea una cita de forma administrativa (Dashboard B2B).
     */
    async create(data: {
        businessId: string;
        clientId: string;
        serviceId: string;
        staffId?: string;
        startTime: string | Date;
        clientNotes?: string;
    }): Promise<Booking> {
        const response = await fetchWithAuth(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create booking');
        return response.json();
    },

    /**
     * Actualiza el estado de una cita.
     */
    async updateStatus(bookingId: string, status: string, reason?: string): Promise<Booking> {
        const response = await fetchWithAuth(`${API_URL}/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, reason }),
        });
        if (!response.ok) throw new Error('Failed to update booking status');
        return response.json();
    },

    /**
     * Reprograma una cita a una nueva fecha/hora.
     */
    async reschedule(bookingId: string, startTime: string): Promise<Booking> {
        const response = await fetchWithAuth(`${API_URL}/bookings/${bookingId}/reschedule`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startTime }),
        });
        if (!response.ok) throw new Error('Failed to reschedule booking');
        return response.json();
    },
};
