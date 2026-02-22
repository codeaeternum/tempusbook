import { fetchWithAuth } from '@/providers/AuthProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const posApi = {
    /**
     * Obtiene el catálogo de servicios y productos para una cuenta de negocios.
     */
    async getCatalog(businessId: string) {
        const response = await fetchWithAuth(`${API_URL}/pos/catalog?businessId=${businessId}`);
        if (!response.ok) throw new Error('Failed to fetch POS catalog');
        return response.json();
    },

    /**
     * Sinergia: Convierte una Reservación finalizada directamente a un Draft en el Cash Register POS.
     * @param payload Información de la cuenta, empleado y cita origen.
     */
    async createDraftFromBooking(payload: {
        businessId: string;
        staffId: string;
        bookingId: string;
        shiftId?: string;
    }) {
        const response = await fetchWithAuth(`${API_URL}/pos/sales/from-booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Falló al crear la venta borrador en el Punto de Venta.');
        return response.json();
    }
};
