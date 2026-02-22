'use client';

import React, { useEffect, useState } from 'react';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerPortalDirectory() {
    const { logout, dbUser } = useAuth();
    const router = useRouter();

    const [myBusinesses, setMyBusinesses] = useState<any[]>([]);
    const [directory, setDirectory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

                // 1. Fetch my personal history to extract "Mis Lugares"
                const resHub = await fetchWithAuth(`${API}/users/me/b2c-hub`);
                if (resHub.status === 401) {
                    router.push('/portal/login');
                    return;
                }

                if (resHub.ok) {
                    const data = await resHub.json();
                    const busMap = new Map();

                    const processBusiness = (b: any) => {
                        if (b && b.id && !busMap.has(b.id)) {
                            busMap.set(b.id, b);
                        }
                    };

                    data.upcomingBookings.forEach((x: any) => processBusiness(x.business));
                    data.pastBookings.forEach((x: any) => processBusiness(x.business));
                    data.loyaltyCards.forEach((x: any) => processBusiness(x.business));

                    setMyBusinesses(Array.from(busMap.values()));
                }

                // 2. Fetch Global Directory (Marketplace)
                const resDir = await fetch(`${API}/businesses?perPage=20`);
                if (resDir.ok) {
                    const dirData = await resDir.json();
                    setDirectory(dirData.data || []);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [router]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-black/60">Cargando Directorio Inteligente...</p>
            </div>
        );
    }

    // Filtrar los que ya son "Mios" del directorio general
    const myBusinessIds = new Set(myBusinesses.map(b => b.id));
    const discoverBusinesses = directory.filter(b => !myBusinessIds.has(b.id));

    return (
        <div className="w-full flex flex-col gap-10 fade-in pb-12">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-serif text-black tracking-tight">
                        Bienvenido, {dbUser?.firstName || 'Invitado'}.
                    </h2>
                    <p className="text-black/50 mt-1">Explora tus lugares frecuentes o descubre nuevos servicios extraordinarios.</p>
                </div>
                <button
                    onClick={logout}
                    className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-red-100/50 min-h-[44px] flex justify-center items-center"
                >
                    Cerrar Sesión
                </button>
            </div>

            {/* MIS LUGARES (Frequent Businesses) */}
            {myBusinesses.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        <h3 className="text-xl font-semibold text-black tracking-tight">Tus Franquicias</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 gap-5">
                        {myBusinesses.map((b) => (
                            <Link key={b.id} href={`/portal/n/${b.slug}`} className="block group relative">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[1.25rem] blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                                <div className="relative bg-white border border-black/5 shadow-sm rounded-2xl p-5 hover:shadow-md transition-all flex items-center justify-between h-full">
                                    <div className="flex items-center gap-4">
                                        {b.logoUrl ? (
                                            <img src={b.logoUrl} alt={b.name} className="w-16 h-16 rounded-full object-cover shadow-sm ring-2 ring-emerald-500/20" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-stone-800 to-black text-white flex items-center justify-center font-bold text-xl shadow-sm ring-2 ring-emerald-500/20">
                                                {b.name.substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-semibold text-lg text-black group-hover:text-emerald-700 transition-colors">{b.name}</h4>
                                            <p className="text-xs font-medium text-black/50 mt-0.5 mb-1 flex items-center gap-1">
                                                {b.avgRating > 0 ? (
                                                    <span className="flex items-center gap-0.5 text-amber-500">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                        {b.avgRating.toFixed(1)}
                                                    </span>
                                                ) : <span className="text-black/30">Sin Calificar</span>}
                                                <span className="text-black/20 mx-1">•</span>
                                                Entrar al Santuario
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all text-black/40">
                                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* DIRECTORIO GLOBAL (Marketplace Riche) */}
            <section className="mb-10 pt-4 border-t border-black/5">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
                        <h3 className="text-xl font-semibold text-black tracking-tight">Directorio AeternaSuite</h3>
                    </div>
                </div>

                {discoverBusinesses.length === 0 ? (
                    <div className="bg-white/50 border border-black/5 border-dashed rounded-3xl p-16 text-center">
                        <p className="text-black/40 text-sm font-medium">No hay nuevos comercios disponibles en el directorio por ahora.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {discoverBusinesses.map((b) => (
                            <Link key={b.id} href={`/portal/n/${b.slug}`} className="block group/card h-full">
                                <div className="bg-white border border-black/5 rounded-[2rem] overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col relative group-hover/card:border-blue-500/20">

                                    {/* Cover & Hero Section */}
                                    <div className="h-44 bg-zinc-100 relative overflow-hidden shrink-0">
                                        {b.coverUrl ? (
                                            <img src={b.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-100"></div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                                        {/* Rating Pill */}
                                        {b.avgRating > 0 && (
                                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                                                <span className="text-amber-500">★</span> {b.avgRating.toFixed(1)}
                                                {b.totalReviews > 0 && <span className="text-black/50 font-medium ml-1">({b.totalReviews})</span>}
                                            </div>
                                        )}

                                        {/* Logo Absolute */}
                                        {b.logoUrl ? (
                                            <img src={b.logoUrl} alt={b.name} className="absolute -bottom-6 left-6 w-16 h-16 rounded-[1rem] ring-4 ring-white object-cover bg-white shadow-md z-10" />
                                        ) : (
                                            <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-[1rem] ring-4 ring-white bg-black text-white flex items-center justify-center font-bold text-xl shadow-md z-10">
                                                {b.name.substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Core Information */}
                                    <div className="px-6 pt-10 pb-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-xl text-black group-hover/card:text-blue-600 transition-colors line-clamp-1">{b.name}</h4>
                                        </div>

                                        {b.category && (
                                            <div className="mb-4">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100/50 px-2 py-1.5 rounded-md">
                                                    {b.category.name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Quick Info Points */}
                                        <div className="flex flex-col gap-2.5 mb-5">
                                            {(b.city || b.address) && (
                                                <div className="flex items-center gap-2.5 text-xs text-black/60 font-medium w-full">
                                                    <svg className="w-4 h-4 text-black/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    <span className="truncate">{b.city ? b.city : ''} {b.address ? `• ${b.address}` : ''}</span>
                                                </div>
                                            )}
                                            {b.phone && (
                                                <div className="flex items-center gap-2.5 text-xs text-black/60 font-medium w-full">
                                                    <svg className="w-4 h-4 text-black/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    <span>{b.phone}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto flex flex-col gap-4">
                                            {/* Mini Gallery Carousel Simulator */}
                                            {b.galleryItems && b.galleryItems.length > 0 && (
                                                <div className="flex gap-2 pt-4 border-t border-black/5">
                                                    {b.galleryItems.slice(0, 4).map((img: any, i: number) => (
                                                        <div key={i} className="flex-1 aspect-square rounded-[0.5rem] bg-zinc-200 overflow-hidden shadow-sm border border-black/5 relative group-hover/card:shadow-md transition-shadow">
                                                            <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                                                            {i === 3 && b.galleryItems.length > 4 && (
                                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                                                    +{b.galleryItems.length - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Featured Review */}
                                            {b.reviews && b.reviews.length > 0 && (
                                                <div className="bg-gradient-to-br from-zinc-50 to-white p-4 rounded-2xl border border-black/5 relative mt-2 group-hover/card:bg-blue-50/10 transition-colors">
                                                    <span className="absolute -top-1 -left-1 text-4xl font-serif text-amber-500/20 leading-none">"</span>
                                                    <p className="text-xs text-black/70 italic line-clamp-2 leading-relaxed relative z-10 font-medium">
                                                        {b.reviews[0].comment}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-3 pl-1">
                                                        {b.reviews[0].client?.avatarUrl ? (
                                                            <img src={b.reviews[0].client.avatarUrl} alt="" className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[8px] font-bold text-black/60 ring-2 ring-white shadow-sm">
                                                                {b.reviews[0].client?.firstName?.substring(0, 1) || 'U'}
                                                            </div>
                                                        )}
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-black/40">{b.reviews[0].client?.firstName || 'Usuario Local'}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
