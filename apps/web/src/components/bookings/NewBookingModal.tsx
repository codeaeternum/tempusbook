import { useState, useEffect } from 'react';
import { useAuth, fetchWithAuth } from '@/providers/AuthProvider';
import { bookingsApi } from '@/lib/api/bookings';
import { X, Calendar, Clock, User, Scissors } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface NewBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function NewBookingModal({ isOpen, onClose, onSuccess }: NewBookingModalProps) {
    const { activeBusinessId } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form state
    const [clientId, setClientId] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [staffId, setStaffId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');

    // Data lists
    const [clients, setClients] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [staffs, setStaffs] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen || !activeBusinessId) return;

        const fetchData = async () => {
            try {
                const [clientsRes, servicesRes, staffRes] = await Promise.all([
                    fetchWithAuth(`${API_URL}/api/v1/businesses/${activeBusinessId}/clients`),
                    fetchWithAuth(`${API_URL}/api/v1/services/business/${activeBusinessId}`),
                    fetchWithAuth(`${API_URL}/api/v1/business-members/business/${activeBusinessId}`),
                ]);

                if (clientsRes.ok) setClients(await clientsRes.json());
                if (servicesRes.ok) setServices(await servicesRes.json());
                if (staffRes.ok) setStaffs(await staffRes.json());
            } catch (error) {
                console.error('Error fetching data for modal', error);
            }
        };

        fetchData();

        // Reset form
        setDate(new Date().toISOString().split('T')[0]);
        setTime('');
        setClientId('');
        setServiceId('');
        setStaffId('');
        setNotes('');
    }, [isOpen, activeBusinessId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBusinessId || !clientId || !serviceId || !date || !time) return;

        setLoading(true);
        try {
            // Combine date and time
            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);
            const startTime = new Date(year, month - 1, day, hours, minutes);

            await bookingsApi.create({
                businessId: activeBusinessId,
                clientId,
                serviceId,
                staffId: staffId || undefined,
                startTime,
                clientNotes: notes
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating booking:', error);
            alert(error.message || 'Error al crear la cita. Revisa la disponibilidad.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Nueva Cita Manual
                        </h3>
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">

                        {/* Cliente */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" /> Cliente <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                            >
                                <option value="">Selecciona un cliente</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Servicio */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-gray-400" /> Servicio <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={serviceId}
                                onChange={e => setServiceId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                            >
                                <option value="">Selecciona un servicio</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.durationMinutes} min)</option>
                                ))}
                            </select>
                        </div>

                        {/* Staff */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" /> Miembro del Equipo (Opcional)
                            </label>
                            <select
                                value={staffId}
                                onChange={e => setStaffId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                            >
                                <option value="">Cualquier disponible</option>
                                {staffs.map(st => (
                                    <option key={st.id} value={st.id}>{st.user.firstName} {st.user.lastName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fecha y Hora */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" /> Fecha <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" /> Hora <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={time}
                                    onChange={e => setTime(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                                />
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Notas Adicionales</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Peticiones especiales..."
                            />
                        </div>

                        <div className="pt-4 flex gap-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 min-h-[44px]"
                            >
                                {loading ? 'Creando...' : 'Agendar Cita'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
