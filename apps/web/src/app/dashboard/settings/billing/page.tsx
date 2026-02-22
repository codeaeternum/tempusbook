'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { Check, Star, Zap, Building2, CreditCard, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const PLAN_FEATURES = {
    FREE: ['Gestión Básica B2B', 'Máximo 50 Clientes', 'Soporte Comunitario'],
    STARTER: ['Gestión Completa', 'Agendamiento Web', 'Hasta 5 Empleados', 'Soporte Email'],
    PRO: ['Todo en Starter', 'Módulo POS / Caja', 'Integración WhatsApp', 'Soporte Prioritario', 'Empleados Ilimitados'],
    BUSINESS: ['Todo en Pro', 'API y Webhooks', 'Reportes Avanzados', 'Suscripciones B2C', 'Account Manager Dedicado']
};

function BillingContent() {
    const { dbUser } = useAuth();
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const searchParams = useSearchParams();

    const businessId = dbUser?.businessMembers?.[0]?.business?.id;

    useEffect(() => {
        if (businessId) {
            loadSubscription();
        }
    }, [businessId]);

    const loadSubscription = async () => {
        try {
            if (!businessId) return;
            const data = await subscriptionsApi.getCurrent(businessId);
            setSubscription(data);
        } catch (error) {
            console.error('Failed to load subscription', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan: string) => {
        try {
            if (!businessId) return;
            setActionLoading(plan);
            const { init_point } = await subscriptionsApi.createCheckout({
                businessId,
                plan
            });
            window.location.href = init_point;
        } catch (error) {
            alert('Error al procesar el pago. Por favor intenta de nuevo.');
            setActionLoading(null);
        }
    };

    const renderPaymentStatus = () => {
        const mpStatus = searchParams.get('status');
        if (!mpStatus) return null;

        if (mpStatus === 'success') {
            return (
                <div className="mb-6 p-4 bg-green-50 text-green-800 border-l-4 border-green-500 flex flex-col rounded shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Check className="w-5 h-5" />
                        <h4 className="font-bold">¡Pago Exitoso!</h4>
                    </div>
                    <p className="text-sm">Tu suscripción ha sido actualizada. Tu nuevo plan ya está activo.</p>
                </div>
            );
        }

        if (mpStatus === 'failure') {
            return (
                <div className="mb-6 p-4 bg-red-50 text-red-800 border-l-4 border-red-500 flex flex-col rounded shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-5 h-5" />
                        <h4 className="font-bold">El pago fue rechazado</h4>
                    </div>
                    <p className="text-sm">Tuvimos un problema procesando tu pago en MercadoPago. Intenta con otra tarjeta.</p>
                </div>
            );
        }

        return null;
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando detalles de facturación...</div>;

    const currentPlan = subscription?.plan || 'FREE';

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-indigo-600" />
                    Facturación y Planes
                </h1>
                <p className="text-gray-500 mt-2">Gestiona tu suscripción SaaS de AeternaSuite y expande las capacidades de tu negocio.</p>
            </header>

            {renderPaymentStatus()}

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Plan Actual</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xl font-bold text-gray-900">{currentPlan}</span>
                        {subscription?.status === 'ACTIVE' && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Activo</span>
                        )}
                        {subscription?.status === 'TRIAL' && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Prueba Gratuita</span>
                        )}
                    </div>
                    {subscription?.currentPeriodEnd && (
                        <p className="text-sm text-gray-500 mt-2">Próxima renovación: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
                    )}
                </div>
            </section>

            <section className="mt-12">
                <h2 className="text-2xl font-bold text-center mb-8">Mejora tu AeternaSuite</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Starter Plan */}
                    <div className={`p-6 rounded-2xl border-2 hover:shadow-lg transition-all ${currentPlan === 'STARTER' ? 'border-indigo-600 shadow-md relative' : 'border-gray-200'}`}>
                        {currentPlan === 'STARTER' && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-xl font-bold">Tu Plan</div>}
                        <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-4">
                            <Star className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Starter</h3>
                        <p className="text-gray-500 text-sm mt-1 h-10">Ideal para profesionales independientes.</p>
                        <div className="my-6">
                            <span className="text-4xl font-extrabold">$299</span>
                            <span className="text-gray-500">/mes</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {PLAN_FEATURES.STARTER.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                    <Check className="w-4 h-4 text-green-500" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={currentPlan === 'STARTER' || currentPlan === 'PRO' || currentPlan === 'BUSINESS' || actionLoading === 'STARTER'}
                            onClick={() => handleUpgrade('STARTER')}
                            className="w-full py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {actionLoading === 'STARTER' ? 'Redirigiendo...' : currentPlan === 'STARTER' ? 'Plan Actual' : 'Adquirir Starter'}
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className={`p-6 rounded-2xl border-2 transform scale-105 shadow-xl relative ${currentPlan === 'PRO' ? 'border-amber-500' : 'border-indigo-600'}`}>
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs px-4 py-1 rounded-bl-xl rounded-tr-xl font-bold uppercase tracking-wide">Popular</div>
                        {currentPlan === 'PRO' && <div className="absolute top-0 left-0 bg-amber-500 text-white text-xs px-3 py-1 rounded-br-lg rounded-tl-xl font-bold">Tu Plan</div>}

                        <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-4 text-indigo-600">
                            <Zap className="w-6 h-6" fill="currentColor" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                        <p className="text-gray-500 text-sm mt-1 h-10">Para PYMES y centros establecidos.</p>
                        <div className="my-6">
                            <span className="text-4xl font-extrabold text-indigo-600">$699</span>
                            <span className="text-gray-500">/mes</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {PLAN_FEATURES.PRO.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                    <Check className="w-4 h-4 text-indigo-600" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={currentPlan === 'PRO' || currentPlan === 'BUSINESS' || actionLoading === 'PRO'}
                            onClick={() => handleUpgrade('PRO')}
                            className="w-full py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 hover:bg-black text-white"
                        >
                            {actionLoading === 'PRO' ? 'Redirigiendo...' : currentPlan === 'PRO' ? 'Plan Actual' : 'Comenzar Pro'}
                        </button>
                    </div>

                    {/* Business Plan */}
                    <div className={`p-6 rounded-2xl border-2 hover:shadow-lg transition-all ${currentPlan === 'BUSINESS' ? 'border-gray-900 shadow-md relative' : 'border-gray-200'}`}>
                        {currentPlan === 'BUSINESS' && <div className="absolute top-0 right-0 bg-gray-900 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-xl font-bold">Tu Plan</div>}
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4">
                            <Building2 className="w-6 h-6 text-gray-900" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Business</h3>
                        <p className="text-gray-500 text-sm mt-1 h-10">Franquicias y operaciones masivas.</p>
                        <div className="my-6">
                            <span className="text-4xl font-extrabold">$1,499</span>
                            <span className="text-gray-500">/mes</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {PLAN_FEATURES.BUSINESS.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                    <Check className="w-4 h-4 text-gray-600" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled={currentPlan === 'BUSINESS' || actionLoading === 'BUSINESS'}
                            onClick={() => handleUpgrade('BUSINESS')}
                            className="w-full py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-gray-800 text-white"
                        >
                            {actionLoading === 'BUSINESS' ? 'Redirigiendo...' : currentPlan === 'BUSINESS' ? 'Plan Actual' : 'Contactar Ventas'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500 animate-pulse">Cargando facturación...</div>}>
            <BillingContent />
        </Suspense>
    );
}
