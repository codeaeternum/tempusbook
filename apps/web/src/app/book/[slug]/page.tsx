import { publicApi } from '@/lib/api/public';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Clock, Phone, Globe, Star } from 'lucide-react';
import BookingWizard from './BookingWizard';

interface PageProps {
    params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
    try {
        const business = await publicApi.getBusinessProfileBySlug(params.slug);
        return {
            title: `Reservar en ${business.name}`,
            description: business.description || `Agenda tu cita en ${business.name}`,
        };
    } catch (error) {
        return {
            title: 'Negocio no encontrado',
        };
    }
}

export default async function PublicBusinessPage({ params }: PageProps) {
    let business;

    try {
        business = await publicApi.getBusinessProfileBySlug(params.slug);
    } catch (error: any) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            notFound();
        }
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    Error al cargar el perfil. Por favor, intenta de nuevo más tarde.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto w-full pb-20">
            {/* Portada / Header */}
            <div className="w-full h-48 sm:h-64 bg-slate-800 relative">
                {business.coverUrl ? (
                    <Image src={business.coverUrl} alt="Cover" fill className="object-cover opacity-80" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-800" />
                )}
            </div>

            {/* Info del Negocio (Montado sobre la portada) */}
            <div className="px-4 sm:px-8 -mt-16 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">

                    <div className="h-24 w-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shrink-0 relative shadow-md">
                        {business.logoUrl ? (
                            <Image src={business.logoUrl} alt={business.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 bg-gray-50">
                                {business.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
                                <p className="text-gray-500 text-sm mt-1 max-w-lg">{business.description || 'Bienvenido a nuestro portal de reservas.'}</p>
                            </div>

                            {business.ratingsEnabled && (business.totalReviews || 0) > 0 && (
                                <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full shrink-0">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
                                    <span className="font-semibold text-amber-700 text-sm">{(business.avgRating || 0).toFixed(1)}</span>
                                    <span className="text-xs text-amber-600/70 ml-1">({business.totalReviews})</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                            {business.address && (
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                                    {business.address}, {business.city}
                                </div>
                            )}
                            {business.phone && (
                                <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-1.5 text-gray-400" />
                                    {business.phone}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Componente Interactivo de Reserva (El Wizard de 5 pasos) */}
            <div className="mt-8 px-4 sm:px-8">
                <BookingWizard business={business} />
            </div>
        </div>
    );
}
