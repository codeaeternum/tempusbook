'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2, MonitorUp, User, Clock, CheckCircle, RefreshCcw, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceptionMonitorPage() {
    const { token, dbUser } = useAuth();
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Obtenemos el Business ID del perfil del usuario (simplificado)
    const businessId = dbUser?.businessMembers?.[0]?.business?.id;

    const fetchWaitlist = async () => {
        if (!token || !businessId) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/waitlist/business/${businessId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar la sala de espera');
            const data = await res.json();
            setWaitlist(data);
            setLastRefresh(new Date());
        } catch (error) {
            toast.error('Error de red al actualizar Monitor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dbUser && businessId) {
            fetchWaitlist();
            // Polling auto-refresh every 30 seconds for live feel
            const interval = setInterval(fetchWaitlist, 30000);
            return () => clearInterval(interval);
        }
    }, [dbUser, businessId]);

    const handleCallClient = async (entryId: string) => {
        if (!token) return;
        try {
            // Optimistic Update: Change status locally first
            setWaitlist(prev => prev.map(item => item.id === entryId ? { ...item, status: 'OFFERED' } : item));

            // Note: End-point for explicitly "calling" pending creation on Backend, 
            // Here we reuse a direct PATCH to update status logic we'll map below
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/waitlist/${entryId}/call`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(await res.text());
            toast.success('Cliente llamado con éxito');
        } catch (error: any) {
            toast.error(error.message || 'Fallo de red');
            fetchWaitlist(); // rollback
        }
    };

    if (!dbUser || !businessId) {
        return <div className="p-8 flex items-center justify-center min-h-[500px]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    // Filtrar los que siguen esperando
    const activeWaitlist = waitlist.filter(item => item.status === 'WAITING' || item.status === 'OFFERED');

    return (
        <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
            {/* Cabecera del Monitor */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-3 text-primary mb-2">
                        <MonitorUp className="w-8 h-8" />
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Monitor de Recepción</h1>
                    </div>
                    <p className="text-slate-500">
                        Gestiona los clientes físicos que se registraron en el Kiosco (Fila Virtual).
                    </p>
                </div>

                <div className="flex items-center space-x-4 mt-6 md:mt-0 relative z-10">
                    <span className="text-sm text-slate-500 font-mono">
                        Últ. Actualización: {lastRefresh.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={() => fetchWaitlist()}
                        disabled={loading}
                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Panel Principal */}
            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 min-h-[500px]">
                {activeWaitlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-[400px]">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                            <MonitorUp className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">Pista Despejada</h3>
                        <p className="text-slate-500 max-w-md">
                            No hay clientes esperando actualmente en la Fila Virtual. Los clientes que utilicen el Kiosco IPad (Tableta de Puerta) aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeWaitlist.map((entry, idx) => (
                            <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md hover:border-primary/30">

                                {/* Info Panel */}
                                <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100 relative">
                                    <div className="absolute top-0 right-0 m-4 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                                        Turno #{idx + 1}
                                    </div>

                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                                            {entry.client.firstName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{entry.client.firstName} {entry.client.lastName}</h3>
                                            <p className="text-sm text-slate-500 flex items-center mt-1">
                                                <Clock className="w-3.5 h-3.5 mr-1" /> Llegó a las {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center border border-slate-100">
                                        <span className="font-medium text-slate-700">{entry.service.name}</span>
                                        <span className="text-sm font-bold text-primary">{entry.service.durationMinutes} min</span>
                                    </div>
                                </div>

                                {/* Action Panel */}
                                <div className="p-6 md:w-48 bg-slate-50/50 flex flex-col justify-center items-center space-y-3">
                                    {entry.status === 'WAITING' ? (
                                        <>
                                            <button
                                                onClick={() => handleCallClient(entry.id)}
                                                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-sm shadow-primary/30 transition-all flex items-center justify-center group"
                                            >
                                                <Bell className="w-4 h-4 mr-2 group-hover:animate-wiggle" />
                                                Llamar
                                            </button>
                                            <span className="text-xs text-slate-400 text-center uppercase tracking-wider font-semibold">En Fila</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <span className="text-sm font-bold text-green-700">En Atención</span>
                                            <button className="text-xs text-slate-500 hover:text-slate-700 underline mt-2">Convertir a Cobro</button>
                                        </>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
