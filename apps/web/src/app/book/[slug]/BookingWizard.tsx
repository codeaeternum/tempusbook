'use client';

import { useState } from 'react';
import { ChevronRight, ArrowLeft, CheckCircle2, User, Clock, CalendarDays, MapPin } from 'lucide-react';
import Image from 'next/image';
import { publicApi, PublicServiceData, PublicBusinessMember } from '@/lib/api/public';

interface BookingWizardProps {
    business: any; // We receive the populated public profile
}

type Step = 1 | 2 | 3 | 4 | 5;

export default function BookingWizard({ business }: BookingWizardProps) {
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [selectedService, setSelectedService] = useState<PublicServiceData | null>(null);
    const [selectedMember, setSelectedMember] = useState<PublicBusinessMember | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Detalle del cliente y estado de carga
    const [clientInfo, setClientInfo] = useState({ name: '', phone: '', email: '' });
    const [isLoading, setIsLoading] = useState(false);

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 5) as Step);
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: business.currency || 'MXN' }).format(amount);
    };

    const handleBookingSubmit = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return;

        setIsLoading(true);
        try {
            // Formateo de la hora combinada (mock para el MVP)
            const mockDateObj = new Date();
            mockDateObj.setHours(parseInt(selectedTime), 0, 0, 0); // simplificado

            await publicApi.createBooking(business.slug, {
                serviceId: selectedService.id,
                staffId: selectedMember?.id,
                startTime: mockDateObj.toISOString(),
                clientName: clientInfo.name,
                clientPhone: clientInfo.phone,
                clientEmail: clientInfo.email
            });
            nextStep(); // Mueve al paso 5 (éxito)
        } catch (error) {
            console.error('Error al agendar cita:', error);
            alert('Hubo un error al reservar tu cita. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {/* Progress Bar Header */}
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    {currentStep > 1 && currentStep < 5 && (
                        <button onClick={prevStep} className="p-1.5 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Paso {currentStep} de 5</span>
                        <h2 className="text-lg font-bold text-gray-900">
                            {currentStep === 1 && 'Selecciona un Servicio'}
                            {currentStep === 2 && 'Elige a tu Profesional'}
                            {currentStep === 3 && 'Fecha y Hora'}
                            {currentStep === 4 && 'Tus Datos'}
                            {currentStep === 5 && '¡Cita Confirmada!'}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* STEP 1: SERVICES */}
                {currentStep === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {business.services.length === 0 ? (
                            <p className="text-gray-500 col-span-full text-center py-8">Este negocio aún no tiene servicios públicos.</p>
                        ) : (
                            business.services.map((service: any) => (
                                <button
                                    key={service.id}
                                    onClick={() => {
                                        setSelectedService(service);
                                        nextStep();
                                    }}
                                    className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between h-full ${selectedService?.id === service.id
                                        ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                                            <span className="bg-white px-2 py-1 rounded-md text-sm font-bold text-indigo-700 shadow-sm border border-indigo-100">
                                                {formatPrice(service.price)}
                                            </span>
                                        </div>
                                        {service.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
                                        )}
                                    </div>
                                    <div className="mt-4 flex items-center text-xs text-gray-400 font-medium">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        {service.duration} minutos
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* STEP 2: STAFF MEMBERS */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                setSelectedMember(null); // Null implies "Anyone available"
                                nextStep();
                            }}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${!selectedMember ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'
                                }`}
                        >
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Sin preferencia</h3>
                                <p className="text-sm text-gray-500">Asignar cualquier profesional disponible</p>
                            </div>
                            <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                        </button>

                        {business.members.map((member: any) => (
                            <button
                                key={member.id}
                                onClick={() => {
                                    setSelectedMember(member);
                                    nextStep();
                                }}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selectedMember?.id === member.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 relative">
                                    {member.user?.photoUrl ? (
                                        <Image src={member.user.photoUrl} alt={member.user.name} fill className="object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 m-auto mt-3 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{member.user?.name || 'Staff'}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{member.role.toLowerCase()}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                            </button>
                        ))}
                    </div>
                )}

                {/* STEP 3: DATE & TIME (Placeholder UI for now) */}
                {currentStep === 3 && (
                    <div className="text-center py-10">
                        <CalendarDays className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona Fecha y Hora</h3>
                        <p className="text-gray-500 mb-6">Elige el momento perfecto para tu {selectedService?.name}</p>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 max-w-sm mx-auto mb-6">
                            <p className="text-sm text-gray-400 mb-2">Demostración UI</p>
                            <div className="grid grid-cols-3 gap-2">
                                {['10:00 AM', '11:00 AM', '01:00 PM', '03:30 PM', '05:00 PM'].map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => {
                                            setSelectedTime(time);
                                            setSelectedDate(new Date()); // Mock today
                                            nextStep();
                                        }}
                                        className="py-2 px-3 text-sm rounded-lg border border-gray-200 bg-white hover:border-indigo-600 hover:text-indigo-600 transition-colors"
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4: CLIENT INFO */}
                {currentStep === 4 && (
                    <div className="max-w-md mx-auto">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Juan Pérez"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                                    value={clientInfo.name}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (WhatsApp)</label>
                                <input
                                    type="tel"
                                    placeholder="Ej. 55 1234 5678"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                                    value={clientInfo.phone}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    placeholder="juan@ejemplo.com"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                                    value={clientInfo.email}
                                    onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleBookingSubmit}
                                    disabled={!clientInfo.name || !clientInfo.phone || !clientInfo.email || isLoading}
                                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                >
                                    {isLoading ? 'Procesando...' : 'Confirmar Reserva'}
                                    {!isLoading && <ChevronRight className="w-5 h-5 ml-1" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5: SUCCESS */}
                {currentStep === 5 && (
                    <div className="text-center py-10 px-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Cita Confirmada!</h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                            Hemos enviado un mensaje de confirmación a tu WhatsApp con los detalles de la reserva.
                        </p>

                        <div className="bg-gray-50 rounded-2xl p-6 text-left max-w-sm mx-auto border border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-4 border-b pb-2">Resumen de tu cita</h4>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Servicio</span>
                                    <span className="font-medium text-gray-900 text-right">{selectedService?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Especialista</span>
                                    <span className="font-medium text-gray-900 text-right">{selectedMember?.user?.name || 'Asignado al llegar'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Día</span>
                                    <span className="font-medium text-gray-900 text-right">Hoy</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Hora</span>
                                    <span className="font-medium text-gray-900 text-right">{selectedTime}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 mt-2">
                                    <span className="text-gray-500">Total a pagar en sucursal</span>
                                    <span className="font-bold text-indigo-600">{selectedService ? formatPrice(selectedService.price) : '-'}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-8 text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                        >
                            Hacer otra reserva
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
