'use client';

import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/providers/AuthProvider';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

export default function ContextualBusinessPortal({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();

    const [business, setBusiness] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'MI_ESPACIO' | 'EXPLORAR'>('MI_ESPACIO');
    const [hubData, setHubData] = useState<{
        upcomingBookings: any[];
        pastBookings: any[];
        loyaltyCards: any[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;

        try {
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const res = await fetchWithAuth(`${API}/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED', reason: 'Cancelado por el Cliente desde el Hub' })
            });

            if (res.ok) {
                setHubData(prev => {
                    if (!prev) return prev;
                    const cancelled = prev.upcomingBookings.find(b => b.id === bookingId);
                    if (!cancelled) return prev;
                    return {
                        ...prev,
                        upcomingBookings: prev.upcomingBookings.filter(b => b.id !== bookingId),
                        pastBookings: [{ ...cancelled, status: 'CANCELLED' }, ...prev.pastBookings]
                    };
                });
            } else {
                alert('No se pudo cancelar la cita. Intenta más tarde.');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
        }
    };

    useEffect(() => {
        const fetchContextualHub = async () => {
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

                // 1. Fetch Business by Slug (Public)
                const resBus = await fetch(`${API}/businesses/${resolvedParams.slug}`);
                if (!resBus.ok) {
                    router.push('/portal');
                    return;
                }
                const businessData = await resBus.json();
                setBusiness(businessData);

                // 2. Fetch Isolated B2C Data using Business ID (Protected)
                const resHub = await fetchWithAuth(`${API}/users/me/b2c-hub/${businessData.id}`);
                if (resHub.ok) {
                    const data = await resHub.json();
                    setHubData(data);
                } else if (resHub.status === 401) {
                    router.push('/portal/login');
                }

            } catch (err) {
                console.error(err);
                router.push('/portal');
            } finally {
                setLoading(false);
            }
        };

        fetchContextualHub();
    }, [resolvedParams.slug, router]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-black/60">Cargando tu perfil en esta franquicia...</p>
            </div>
        );
    }

    if (!business || !hubData) return null;

    // Tomamos la primera tarjeta de lealtad (si existe) para este negocio
    const loyaltyCard = hubData.loyaltyCards[0];

    return (
        <div className="w-full flex flex-col gap-8 fade-in pb-10">
            {/* Breadcrumb Navigation */}
            <div>
                <Link href="/portal" className="text-xs font-semibold text-black/50 hover:text-black hover:underline flex items-center gap-1 w-fit min-h-[44px] px-2 -ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Volver al Directorio
                </Link>
            </div>

            {/* Contextual Header */}
            <header className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm relative">
                <div className="h-40 relative">
                    {business.coverUrl ? (
                        <img src={business.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-emerald-100 to-emerald-50"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                <div className="px-6 sm:px-10 pb-8 pt-0 relative flex flex-col sm:flex-row gap-6 sm:items-end justify-between">
                    <div className="flex items-end gap-5 -mt-10 sm:-mt-12">
                        {business.logoUrl ? (
                            <img src={business.logoUrl} alt={business.name} className="w-24 h-24 rounded-full ring-4 ring-white object-cover bg-white z-10" />
                        ) : (
                            <div className="w-24 h-24 rounded-full ring-4 ring-white bg-black text-white flex items-center justify-center font-bold text-3xl z-10">
                                {business.name.substring(0, 1).toUpperCase()}
                            </div>
                        )}
                        <div className="mb-2">
                            <h1 className="text-3xl font-bold tracking-tight text-black">{business.name}</h1>
                            {business.category && (
                                <p className="text-sm font-medium text-black/50 uppercase tracking-widest">{business.category.name}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 sm:mt-0">
                        <Link
                            href={`/reserva/${business.slug}`}
                            className="bg-black text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-zinc-800 transition-all flex items-center gap-2"
                        >
                            Reservar Ahora
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </Link>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-6 px-6 sm:px-10 border-t border-black/5 bg-black/[0.01]">
                    <button
                        onClick={() => setActiveTab('MI_ESPACIO')}
                        className={`py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'MI_ESPACIO' ? 'border-black text-black' : 'border-transparent text-black/40 hover:text-black/70'}`}
                    >
                        Mi Espacio
                    </button>
                    <button
                        onClick={() => setActiveTab('EXPLORAR')}
                        className={`py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'EXPLORAR' ? 'border-black text-black' : 'border-transparent text-black/40 hover:text-black/70'}`}
                    >
                        Explorar Negocio
                    </button>
                </div>
            </header>

            {/* TAB 1: MI ESPACIO (Bookings & Loyalty) */}
            {activeTab === 'MI_ESPACIO' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
                    {/* Panel Izquierdo: Citas Vigentes & Historial */}
                    <div className="lg:col-span-2 flex flex-col gap-8">

                        {/* UPCOMING BOOKINGS */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <h3 className="text-lg font-semibold text-black tracking-tight">Citas Programadas Aquí</h3>
                                </div>
                            </div>

                            {hubData.upcomingBookings.length === 0 ? (
                                <div className="bg-white/50 border border-black/5 border-dashed rounded-2xl p-8 text-center flex flex-col items-center">
                                    <span className="text-4xl mb-3">📅</span>
                                    <p className="text-black/50 text-sm">No tienes reservaciones futuras en {business.name}.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {hubData.upcomingBookings.map(b => (
                                        <div key={b.id} className="bg-white border border-emerald-100 shadow-sm rounded-2xl p-5 group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-bold text-emerald-700">{format(new Date(b.startTime), 'EEEE, d de MMMM')}</p>
                                                <p className="text-2xl font-mono font-bold tracking-tighter text-black mt-1 mb-2">{format(new Date(b.startTime), 'HH:mm')}</p>
                                                <p className="text-sm font-medium">{b.service.name}</p>
                                                <p className="text-xs text-black/50 mt-1">Con el profesional {b.staff?.user?.firstName || 'Local Staff'}</p>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => handleCancelBooking(b.id)}
                                                    className="text-xs font-semibold text-red-500 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors w-full sm:w-auto min-h-[44px] flex justify-center items-center"
                                                >
                                                    Cancelar Cita
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* HISTORY */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-black/20"></div>
                                <h3 className="text-lg font-semibold text-black tracking-tight">Historial Pasado</h3>
                            </div>

                            <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
                                {hubData.pastBookings.length === 0 ? (
                                    <div className="p-8 text-center text-black/50 text-sm">Aún no has consumido servicios aquí.</div>
                                ) : (
                                    <ul className="divide-y divide-black/5">
                                        {hubData.pastBookings.map(b => (
                                            <li key={b.id} className="p-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors">
                                                <div>
                                                    <h4 className="font-medium text-sm text-black">{b.service.name}</h4>
                                                    <p className="text-xs text-black/40">{format(new Date(b.startTime), 'd MMM yyyy, HH:mm')}</p>
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-black/5 text-black/60'}`}>
                                                    {b.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Panel Derecho: Tarjeta de Lealtad Aisalda */}
                    <div className="lg:col-span-1">
                        <section className="sticky top-28">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                <h3 className="text-lg font-semibold text-black tracking-tight">Tu Lealtad</h3>
                            </div>

                            {!loyaltyCard ? (
                                <div className="bg-white border border-black/5 rounded-2xl p-6 text-center shadow-sm">
                                    <span className="text-4xl mb-3 block">💎</span>
                                    <p className="text-black/80 text-sm font-medium mb-1">Únete al Programa</p>
                                    <p className="text-xs text-black/50 leading-relaxed">Programa una cita para que {business.name} te asigne tu primera tarjeta magnética.</p>
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col h-56 justify-between">
                                    {/* Holographic Decorator */}
                                    <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>

                                    <div className="relative z-10 flex justify-between items-start">
                                        <h4 className="font-bold text-lg text-white/90 leading-tight w-2/3">{loyaltyCard.program.name}</h4>
                                        <span className="text-xs font-bold text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 rounded flex items-center gap-1">
                                            TIPO {loyaltyCard.program.config?.type || 'STAMPS'}
                                        </span>
                                    </div>

                                    <div className="relative z-10 flex justify-between items-end mt-auto">
                                        <div>
                                            <p className="text-xs text-white/50 mb-1 uppercase tracking-widest font-semibold">{loyaltyCard.tier}</p>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-5xl font-mono font-bold tracking-tighter">
                                                    {loyaltyCard.program.config?.type === 'STAMPS' ? loyaltyCard.stamps : loyaltyCard.points}
                                                </p>
                                                <span className="text-sm font-medium text-white/40">{loyaltyCard.program.config?.type === 'STAMPS' ? '/ SELLOS' : '/ PTS'}</span>
                                            </div>
                                        </div>
                                        {business.logoUrl && (
                                            <img src={business.logoUrl} alt="Logo" className="w-8 h-8 rounded-full opacity-50 grayscale" />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Business Info Blurb */}
                            <div className="mt-6 bg-white border border-black/5 rounded-2xl p-5">
                                <h4 className="font-semibold text-sm mb-2">Contacto Local</h4>
                                {business.phone && (
                                    <p className="text-xs text-black/60 flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        {business.phone}
                                    </p>
                                )}
                                {business.address && (
                                    <p className="text-xs text-black/60 flex items-start gap-2">
                                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {business.address}, {business.city}
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* TAB 2: EXPLORAR (About, Gallery, Reviews, Staff, Hours) */}
            {activeTab === 'EXPLORAR' && (
                <div className="flex flex-col gap-10 fade-in">

                    {/* INFO & DESCRIPTION */}
                    <section className="bg-white p-8 rounded-3xl border border-black/5">
                        <h3 className="text-xl font-serif text-black mb-4">Sobre Nosotros</h3>
                        <p className="text-black/70 leading-relaxed text-sm">
                            {business.description || 'Bienvenido a nuestro centro. Nos enorgullece ofrecerte la más alta calidad en servicios, priorizando siempre tu satisfacción y bienestar. Explora todo lo que tenemos preparado para ti.'}
                        </p>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* GALLERY */}
                        {business.galleryItems && business.galleryItems.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    <h3 className="text-lg font-semibold text-black tracking-tight">Galería</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {business.galleryItems.slice(0, 4).map((item: any) => (
                                        <div key={item.id} className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 hover:opacity-90 transition-opacity cursor-pointer">
                                            <img src={item.url} alt="Gallery item" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* REVIEWS */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <h3 className="text-lg font-semibold text-black tracking-tight">Opiniones Exclusivas</h3>
                            </div>

                            {(!business.reviews || business.reviews.length === 0) ? (
                                <div className="bg-white/50 border border-black/5 border-dashed rounded-2xl p-6 text-center">
                                    <p className="text-black/50 text-sm">Aún no hay reseñas publicadas.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {business.reviews.slice(0, 3).map((rev: any) => (
                                        <div key={rev.id} className="bg-white border border-black/5 p-5 rounded-2xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                {rev.client?.avatarUrl ? (
                                                    <img src={rev.client.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold text-black/60">
                                                        {rev.client?.firstName?.substring(0, 1) || 'U'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-semibold">{rev.client?.firstName || 'Usuario'}</p>
                                                    <div className="flex text-amber-500 text-xs">
                                                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-black/70 italic">"{rev.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* BUSINESS HOURS */}
                        {business.businessHours && business.businessHours.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <h3 className="text-lg font-semibold text-black tracking-tight">Horario de Operación</h3>
                                </div>
                                <div className="bg-white border border-black/5 rounded-2xl overflow-hidden divide-y divide-black/5">
                                    {business.businessHours.map((h: any) => {
                                        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                                        return (
                                            <div key={h.id} className="px-5 py-3 flex justify-between items-center text-sm">
                                                <span className="font-medium text-black/70">{days[h.dayOfWeek]}</span>
                                                {h.isClosed ? (
                                                    <span className="text-red-500 font-semibold px-2 py-1 bg-red-50 rounded-md text-xs">CERRADO</span>
                                                ) : (
                                                    <span className="text-black font-mono">{h.openTime} - {h.closeTime}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* STAFF */}
                        {business.members && business.members.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <h3 className="text-lg font-semibold text-black tracking-tight">Nuestro Equipo</h3>
                                </div>
                                <div className="bg-white border border-black/5 rounded-2xl p-5 flex flex-wrap gap-4">
                                    {business.members.filter((m: any) => m.role !== 'PLATFORM_ADMIN').map((m: any, idx: number) => (
                                        <div key={idx} className="flex flex-col items-center gap-2 w-20">
                                            {m.user?.avatarUrl ? (
                                                <img src={m.user.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-transparent hover:ring-indigo-500 transition-all cursor-pointer" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-lg">
                                                    {m.user?.firstName?.substring(0, 1) || 'S'}
                                                </div>
                                            )}
                                            <span className="text-xs font-medium text-center truncate w-full">{m.user?.firstName}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
