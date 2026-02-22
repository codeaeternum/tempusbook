import { fetchWithAuth } from '@/providers/AuthProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const subscriptionsApi = {
    /**
     * Obtiene la suscripción actual del negocio.
     */
    async getCurrent(businessId: string) {
        const response = await fetchWithAuth(`${API_URL}/api/v1/subscriptions/current?businessId=${businessId}`);
        if (!response.ok) throw new Error('Failed to fetch current subscription');
        return response.json();
    },

    /**
     * Crea una sesión de Checkout en MercadoPago para cambiar/mejorar el plan.
     */
    async createCheckout(params: { businessId: string; plan: string }) {
        const response = await fetchWithAuth(`${API_URL}/api/v1/billing/${params.businessId}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: params.plan }),
        });

        if (!response.ok) throw new Error('Failed to create MercadoPago checkout session');
        return response.json();
    }
};
