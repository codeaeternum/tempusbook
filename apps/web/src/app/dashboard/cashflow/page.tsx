'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useAuth, fetchWithAuth } from '@/providers/AuthProvider';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, Calendar, FileText, ChevronRight, Activity, X } from 'lucide-react';

export default function CashflowPage() {
    const { activeBusinessId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [activeShift, setActiveShift] = useState<any>(null);

    // Modal state for mobile viewing
    const [selectedPayment, setSelectedPayment] = useState<any>(null);

    useEffect(() => {
        if (!activeBusinessId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

                // Fetch reports KPIs
                const reportsRes = await fetchWithAuth(`${API}/reports/dashboard/${activeBusinessId}`);
                const reportsData = await reportsRes.json();

                // Fetch recent payments
                const paymentsRes = await fetchWithAuth(`${API}/payments?businessId=${activeBusinessId}`);
                const paymentsData = await paymentsRes.json();

                // Fetch active shift
                try {
                    const shiftRes = await fetchWithAuth(`${API}/pos/shift/active?businessId=${activeBusinessId}`);
                    if (shiftRes.ok) {
                        const shiftData = await shiftRes.json();
                        setActiveShift(shiftData);
                    }
                } catch (e) {
                    console.log('No active shift found');
                }

                setKpis(reportsData.kpis || {});
                // Filter to get only completed/refunded, sort by newest
                const sortedPayments = (Array.isArray(paymentsData) ? paymentsData : [])
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 15); // Show last 15

                setPayments(sortedPayments);
            } catch (error) {
                console.error("Error fetching cashflow data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeBusinessId]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return new Intl.DateTimeFormat('es-MX', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'CASH': return <Wallet className="text-emerald-500" size={24} />;
            case 'CARD': return <CreditCard className="text-blue-500" size={24} />;
            case 'TRANSFER': return <Activity className="text-purple-500" size={24} />;
            default: return <DollarSign className="text-gray-500" size={24} />;
        }
    };

    const getPaymentLabel = (method: string) => {
        switch (method) {
            case 'CASH': return 'Efectivo';
            case 'CARD': return 'Tarjeta';
            case 'TRANSFER': return 'Transferencia';
            default: return 'Otro';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-gray-50/50 dark:bg-zinc-950 overflow-hidden animate-pulse">
                <Header title="Flujo de Caja" subtitle="Cargando métricas..." />
                <div className="flex-1 p-4 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-zinc-900 rounded-2xl"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] md:h-full bg-gray-50/50 dark:bg-zinc-950 overflow-hidden">
            <Header
                title="Flujo de Caja"
                subtitle="El corazón financiero de tu negocio"
            />

            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32 md:pb-8">

                    {/* Búnker Financiero: KPI Grid (Responsive + Densidad en Desktop) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

                        {/* KPI 1: Ingresos de Citas */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-black/5 dark:border-white/5 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Ingresos Totales (Citas)</p>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(kpis?.totalRevenue)}
                                    </h2>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                    <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={24} />
                                </div>
                            </div>
                            <div className="flex items-center text-sm font-medium">
                                <span className="text-emerald-600 dark:text-emerald-400">+{kpis?.growth || 0}%</span>
                                <span className="text-gray-400 ml-2">vs mes anterior</span>
                            </div>
                        </div>

                        {/* KPI 2: Ticket Promedio */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-black/5 dark:border-white/5 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Ticket Promedio</p>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(kpis?.avgTicket)}
                                    </h2>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                    <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                                </div>
                            </div>
                            <div className="flex items-center text-sm font-medium">
                                <span className="text-gray-400">Basado en {kpis?.totalBookings || 0} compras</span>
                            </div>
                        </div>

                        {/* KPI 3: Estado de POS/Shift */}
                        <div className={`rounded-3xl p-6 shadow-sm border flex flex-col justify-between transition-colors ${activeShift ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white dark:bg-zinc-900 dark:border-white/5 border-black/5'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className={`text-sm font-semibold ${activeShift ? 'text-zinc-400' : 'text-gray-500 dark:text-gray-400'}`}>Caja Activa (POS)</p>
                                    <h2 className={`text-3xl md:text-4xl font-extrabold mt-1 ${activeShift ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {activeShift ? formatCurrency(activeShift.currentCash) : 'Cerrada'}
                                    </h2>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeShift ? 'bg-white/10' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                                    <Wallet className={activeShift ? 'text-white' : 'text-gray-400'} size={24} />
                                </div>
                            </div>
                            <div className="flex items-center text-sm font-medium">
                                {activeShift ? (
                                    <span className="text-zinc-300">Turno abierto por {formatCurrency(activeShift.openingAmount)}</span>
                                ) : (
                                    <span className="text-gray-400">Inicia turno en la vista POS</span>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Transacciones — Lista Híbrida (Densidad Desktop vs Gestos Mobile) */}
                    <div>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transacciones Recientes</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Últimos movimientos registrados en el negocio</p>
                            </div>
                        </div>

                        {payments.length === 0 ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-black/5 dark:border-white/5">
                                <span className="text-4xl block mb-4">💳</span>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">Sin movimientos recientes</h4>
                                <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">Cuando cobres citas o ventas de POS, aparecerán aquí.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden">
                                {/* Desktop/Tablet Table Header */}
                                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-950/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <div className="col-span-1 text-center">Tipo</div>
                                    <div className="col-span-5">Detalle / Fecha</div>
                                    <div className="col-span-2 text-right">Método</div>
                                    <div className="col-span-2 text-center">Estado</div>
                                    <div className="col-span-2 text-right">Monto</div>
                                </div>

                                {/* List Iteration */}
                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                    {payments.map((p: any) => (
                                        <div
                                            key={p.id}
                                            // Ergonomía Touch: Hit target >= 44px (p-4 + padding general da mucho más), action directa en click
                                            onClick={() => setSelectedPayment(p)}
                                            className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer active:bg-gray-100"
                                        >
                                            {/* Icon */}
                                            <div className="col-span-2 md:col-span-1 flex justify-center">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center border border-black/5 dark:border-white/5">
                                                    {getPaymentIcon(p.method)}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="col-span-7 md:col-span-5 flex flex-col justify-center">
                                                <span className="font-semibold text-gray-900 dark:text-white truncate">
                                                    Pago de {p.booking ? 'Cita' : 'POS'} {p.invoiceKey ? `#${p.invoiceKey}` : ''}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Calendar size={12} /> {formatDate(p.createdAt)}
                                                </span>
                                            </div>

                                            {/* Método (Desktop Only) */}
                                            <div className="hidden md:flex col-span-2 justify-end items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                                {getPaymentLabel(p.method)}
                                            </div>

                                            {/* Status (Desktop Only) */}
                                            <div className="hidden md:flex col-span-2 justify-center items-center">
                                                {p.status === 'COMPLETED' ? (
                                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                                                        Completado
                                                    </span>
                                                ) : p.status === 'REFUNDED' ? (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                                                        Devuelto
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </div>

                                            {/* Amount & Actions */}
                                            <div className="col-span-3 md:col-span-2 flex justify-end items-center gap-2">
                                                <span className={`font-bold text-base md:text-lg ${p.status === 'REFUNDED' ? 'text-red-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                    {formatCurrency(p.amount)}
                                                </span>
                                                {/* Mobile chevron cue */}
                                                <ChevronRight className="md:hidden text-gray-300" size={20} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile Context Bottom Sheet (Native Modal Feel) for Payment Details */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
                        onClick={() => setSelectedPayment(null)}
                    />
                    <div className="bg-white dark:bg-zinc-900 w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl relative z-10 animate-in slide-in-from-bottom flex flex-col max-h-[90vh]">
                        {/* Drag Handle purely visual for mobile */}
                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mt-4 md:hidden" />

                        <div className="flex justify-between items-start p-6 pb-2">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center border border-black/5 dark:border-white/5">
                                {getPaymentIcon(selectedPayment.method)}
                            </div>
                            {/* Hit target 44x44 */}
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 pt-2 overflow-y-auto">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {formatCurrency(selectedPayment.amount)}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                Pago {selectedPayment.status === 'COMPLETED' ? 'Completado' : 'Devuelto'} via {getPaymentLabel(selectedPayment.method)}
                            </p>

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between text-sm py-3 border-b border-black/5 dark:border-white/5">
                                    <span className="text-gray-500">ID de Transacción</span>
                                    <span className="font-mono font-medium text-gray-900 dark:text-white">{selectedPayment.stripePaymentIntentId || selectedPayment.id.split('-')[0]}</span>
                                </div>
                                <div className="flex justify-between text-sm py-3 border-b border-black/5 dark:border-white/5">
                                    <span className="text-gray-500">Fecha</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedPayment.createdAt)}</span>
                                </div>
                                <div className="flex justify-between text-sm py-3 border-b border-black/5 dark:border-white/5">
                                    <span className="text-gray-500">Origen</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {selectedPayment.bookingId ? 'Reserva Online / POS Cita' : 'POS Directo'}
                                    </span>
                                </div>
                            </div>

                            <button className="w-full mt-8 h-14 bg-black dark:bg-white text-white dark:text-black font-bold rounded-2xl flex items-center justify-center hover:bg-gray-800 transition-colors">
                                Enviar Recibo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
