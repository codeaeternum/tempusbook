'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { useAuth } from '@/providers/AuthProvider';
import { bookingsApi, Booking } from '@/lib/api/bookings';
import { posApi } from '@/lib/api/pos';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, CheckCircle, XCircle, ChevronRight, Check, ShoppingCart } from 'lucide-react';
import NewBookingModal from '@/components/bookings/NewBookingModal';

export default function BookingsPage() {
    const { t, locale } = useLocale();
    const { activeBusinessId } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchBookings = async () => {
        if (!activeBusinessId) { setIsLoading(false); return; }
        setIsLoading(true);
        try {
            const data = await bookingsApi.getByBusinessId(activeBusinessId);
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [activeBusinessId]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await bookingsApi.updateStatus(id, newStatus);
            fetchBookings(); // Refrescar la lista
        } catch (error) {
            console.error('Error actualizando cita:', error);
            alert('No se pudo actualizar la cita.');
        }
    };

    const formatDate = (dateString: string | Date) => {
        return new Date(dateString).toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredBookings = bookings.filter(b => statusFilter === 'ALL' ? true : b.status === statusFilter);

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            <Header
                title="Citas"
                subtitle={`${filteredBookings.length} Citas totales`}
                actions={
                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-indigo-500 min-h-[44px]"
                        >
                            <option value="ALL">Todas</option>
                            <option value="PENDING">Pendientes</option>
                            <option value="CONFIRMED">Confirmadas</option>
                            <option value="COMPLETED">Completadas</option>
                            <option value="CANCELLED">Canceladas</option>
                        </select>
                        <button
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
                            onClick={() => setIsModalOpen(true)}
                        >
                            + Nueva Cita
                        </button>
                    </div>
                }
            />

            <NewBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchBookings();
                }}
            />

            <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-12 mt-4">
                        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Sin citas</h3>
                        <p className="text-gray-500 text-center max-w-sm">
                            No hay citas que coincidan con tu búsqueda. Comparte tu Link-in-Bio para empezar a recibir reservaciones.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.id}
                                onClick={() => setSelectedBooking(booking)}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 justify-end">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {formatDate(booking.startTime)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{booking.client?.firstName} {booking.client?.lastName}</p>
                                            <p className="text-xs text-gray-500">{booking.client?.phone || 'Sin teléfono'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <p className="text-sm font-medium text-gray-800">{booking.service?.name}</p>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {booking.service?.durationMinutes} min
                                        </p>
                                        {booking.clientNotes && (
                                            <div className="mt-2 text-xs italic text-gray-600 border-l-2 border-indigo-200 pl-2">
                                                "{booking.clientNotes}"
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Acciones Rápidas */}
                                {booking.status === 'PENDING' && (
                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                                            className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                                            className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                                        >
                                            <XCircle className="w-4 h-4" /> Rechazar
                                        </button>
                                    </div>
                                )}
                                {booking.status === 'CONFIRMED' && (
                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
                                            className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Check className="w-4 h-4" /> Marcar Completada
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Detalle de Cita */}
            {selectedBooking && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setSelectedBooking(null)}
                    />

                    {/* Contenido (Centrado en pantalla) */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header del Modal */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    Detalle de Cita
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedBooking.status)}`}>
                                        {selectedBooking.status}
                                    </span>
                                </h3>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Cuerpo Scrollable */}
                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="space-y-6">

                                    {/* Info del Cliente */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</h4>
                                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{selectedBooking.client?.firstName} {selectedBooking.client?.lastName}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{selectedBooking.client?.email || 'Sin email registrado'}</p>
                                                <p className="text-xs text-gray-500">{selectedBooking.client?.phone || 'Sin teléfono'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info del Servicio */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Servicio Solicitado</h4>
                                        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                                            <p className="text-sm font-semibold text-indigo-900">{selectedBooking.service?.name}</p>

                                            <div className="flex flex-col gap-1.5 mt-3">
                                                <p className="text-xs text-indigo-700 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 opacity-70" />
                                                    {new Date(selectedBooking.startTime).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-indigo-700 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 opacity-70" />
                                                    {new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <span className="opacity-70">({selectedBooking.service?.durationMinutes} min) - ${Number(selectedBooking.service?.price).toFixed(2)}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notas del Cliente */}
                                    {selectedBooking.clientNotes && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notas del Cliente</h4>
                                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm text-amber-900 italic">
                                                "{selectedBooking.clientNotes}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer con Acciones (si no está completada/cancelada) */}
                            {['PENDING', 'CONFIRMED'].includes(selectedBooking.status) && (
                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex gap-3">
                                    {selectedBooking.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => { handleStatusChange(selectedBooking.id, 'CANCELLED'); setSelectedBooking(null); }}
                                                className="px-4 py-2 border border-red-200 text-red-600 font-medium text-sm rounded-lg hover:bg-red-50 flex-1 transition-colors bg-white font-medium flex justify-center items-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" /> Rechazar
                                            </button>
                                            <button
                                                onClick={() => { handleStatusChange(selectedBooking.id, 'CONFIRMED'); setSelectedBooking(null); }}
                                                className="px-4 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 flex-1 transition-all shadow-sm flex justify-center items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Confirmar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                const btn = document.getElementById('checkout-btn');
                                                if (btn) { btn.innerHTML = '<span class="animate-spin mr-2">⟳</span> Facturando...'; btn.setAttribute('disabled', 'true'); }

                                                try {
                                                    const draft = await posApi.createDraftFromBooking({
                                                        businessId: activeBusinessId || '',
                                                        staffId: selectedBooking.staffId || 'admin_or_owner_id',
                                                        bookingId: selectedBooking.id,
                                                    });

                                                    // 2. Redirigir al Cajero directamente con el Draft
                                                    router.push(`/dashboard/pos?cartId=${draft.id}`);
                                                } catch (err) {
                                                    alert('Error conectando con la Caja Registradora. Verifica si hay un Turno Activo (Cajas).');
                                                    if (btn) { btn.innerHTML = 'Facturar y Cobrar'; btn.removeAttribute('disabled'); }
                                                }
                                            }}
                                            id="checkout-btn"
                                            className="px-4 py-2 w-full bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-700 transition-all shadow-sm flex justify-center items-center gap-2 disabled:bg-green-400 disabled:cursor-not-allowed"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> Finalizar y Cobrar en POS
                                        </button>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
