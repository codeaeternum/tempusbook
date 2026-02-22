'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Business {
    id: string;
    name: string;
    slug: string;
    description: string;
    currency: string;
    category?: { name: string, icon: string };
    services: Service[];
    businessHours: BusinessHour[];
    // ...other fields
}

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
    isActive: boolean;
    isGroup: boolean;
}

interface BusinessHour {
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
    isActive: boolean;
}

export default function PublicBookingPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Booking Funnel State
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Contact Form
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Initial Load
    useEffect(() => {
        if (!slug) return;
        fetch(`${API_URL}/businesses/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error('No se encontró el negocio');
                return res.json();
            })
            .then(data => {
                setBusiness(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [slug]);

    // Fetch Slots when Date changes
    useEffect(() => {
        if (!selectedService || !selectedDate || !business) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            setSelectedTime(null);

            // Format to YYYY-MM-DD local
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            try {
                const res = await fetch(`${API_URL}/bookings/available-slots?businessId=${business.id}&serviceId=${selectedService.id}&date=${dateStr}`);
                if (res.ok) {
                    const slots = await res.json();
                    setAvailableSlots(slots);
                } else {
                    setAvailableSlots([]);
                }
            } catch (err) {
                console.error(err);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDate, selectedService, business]);

    // Helpers
    const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    };

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        // Default select today
        setSelectedDate(new Date());
    };

    const handleCloseModal = () => {
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setIsSuccess(false);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService || !selectedDate || !selectedTime || !business) return;

        setIsSubmitting(true);
        // Construct full start time
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        const startTimeStr = `${y}-${m}-${d}T${selectedTime}:00`;

        try {
            const res = await fetch(`${API_URL}/bookings/public`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: business.id,
                    serviceId: selectedService.id,
                    startTime: startTimeStr,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    clientNotes: formData.notes
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Error al procesar la cita');
            }

            setIsSuccess(true);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // UI Builders
    const renderDateStrip = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d);
        }

        const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

        return (
            <div className={styles.dateScroll}>
                {dates.map((d, i) => {
                    const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                    return (
                        <div
                            key={i}
                            className={`${styles.dateBox} ${isSelected ? styles.dateBoxActive : ''}`}
                            onClick={() => setSelectedDate(d)}
                        >
                            <span className={styles.dayLabel}>{days[d.getDay()]}</span>
                            <span className={styles.dayNum}>{d.getDate()}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) return <div className={styles.pageContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className={styles.loader} style={{ borderColor: '#2563eb' }}></div></div>;
    if (error || !business) return <div className={styles.pageContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h3>{error || 'Negocio no encontrado'}</h3></div>;

    return (
        <div className={styles.pageContainer}>
            {/* HERO */}
            <header className={styles.hero}>
                <div className={styles.heroOverlay}>
                    <div className={styles.heroContent}>
                        <div className={styles.businessLogo} style={{ backgroundImage: 'url(https://ui-avatars.com/api/?name=' + encodeURIComponent(business.name) + '&background=random&size=128)', backgroundSize: 'cover' }} />
                        <div className={styles.businessInfo}>
                            <h1 className={styles.businessName}>{business.name}</h1>
                            <div className={styles.businessRating}>
                                <span className={styles.ratingStar}>★</span> 4.9 (120 Reseñas) • {business.category?.name || 'Local Negocio'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.mainContent}>
                {/* INFO CARD */}
                <div className={styles.glassCard}>
                    <p className={styles.businessDescription}>{business.description || 'Bienvenido a nuestro portal de reservas en línea. Selecciona un servicio para comenzar.'}</p>
                    <div className={styles.badgesRow}>
                        <span className={styles.badge}>📅 Reserva Inmediata</span>
                        <span className={styles.badge}>💳 Pago Seguro</span>
                    </div>
                </div>

                <h2 className={styles.sectionTitle}>Nuestros Servicios</h2>
                <div className={styles.servicesGrid}>
                    {business.services.map(srv => {
                        const priceFmt = srv.price > 0 ? formatCurrency(srv.price) : 'Gratis / Variable';
                        return (
                            <div key={srv.id} className={styles.serviceCard} onClick={() => handleServiceSelect(srv)}>
                                <div className={styles.serviceHeader}>
                                    <h3 className={styles.serviceName}>{srv.name}</h3>
                                    <span className={styles.servicePrice}>{priceFmt}</span>
                                </div>
                                <p className={styles.serviceDesc}>{srv.description}</p>
                                <div className={styles.serviceFooter}>
                                    <div className={styles.serviceMeta}>
                                        <span>⏱️ {srv.durationMinutes} min</span>
                                        {srv.isGroup && <span style={{ marginLeft: '0.8rem', color: '#6366f1' }}>👥 Clase Grupal</span>}
                                    </div>
                                    <button className={styles.bookBtn}>Agendar →</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>

            {/* BOOKING MODAL FUNNEL */}
            {selectedService && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>{isSuccess ? '¡Reserva Confirmada!' : 'Agendar ' + selectedService.name}</h3>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>✕</button>
                        </div>

                        <div className={styles.modalBody}>
                            {isSuccess ? (
                                <div className={styles.successWrapper}>
                                    <div className={styles.successIcon}>✓</div>
                                    <h3>¡Todo Listo, {formData.firstName}!</h3>
                                    <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                                        Tu reservación para <strong>{selectedService.name}</strong> el {selectedDate?.toLocaleDateString('es-MX')} a las {selectedTime} hr ha sido confirmada.
                                    </p>
                                    <button className={styles.actionBtn} onClick={handleCloseModal} style={{ marginTop: '2rem' }}>Volver al Catálogo</button>
                                </div>
                            ) : selectedTime ? (
                                /* STEP 3: CONTACT FORM */
                                <form onSubmit={handleSubmit}>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                        🗓️ {selectedDate?.toLocaleDateString('es-MX')} • ⏰ {selectedTime} hr • 💸 {selectedService.price > 0 ? formatCurrency(selectedService.price) : 'Gratis'}
                                    </p>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>Nombre</label>
                                            <input required type="text" className={styles.formInput} value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="Tu nombre" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Apellido</label>
                                            <input required type="text" className={styles.formInput} value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Tu apellido" />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Correo Electrónico (Obligatorio)</label>
                                        <input required type="email" className={styles.formInput} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="ejemplo@correo.com" />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Teléfono / WhatsApp (Opcional)</label>
                                        <input type="tel" className={styles.formInput} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="55 1234 5678" />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Notas para el negocio (Opcional)</label>
                                        <textarea className={styles.formInput} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="¿Algún detalle especial?" rows={2} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                        <button type="button" className={styles.actionBtn} style={{ background: '#f1f5f9', color: '#475569' }} onClick={() => setSelectedTime(null)}>
                                            ← Atrás
                                        </button>
                                        <button type="submit" className={styles.actionBtn} disabled={isSubmitting} style={{ flex: 2 }}>
                                            {isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* STEP 2: DATE & TIME SELECTION */
                                <>
                                    <h4 style={{ marginBottom: '1rem', color: '#334155' }}>1. Selecciona el Día</h4>
                                    {renderDateStrip()}

                                    <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#334155' }}>2. Horarios Disponibles</h4>
                                    {loadingSlots ? (
                                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                                            <div className={styles.loader} style={{ borderColor: '#cbd5e1', borderTopColor: '#2563eb' }}></div>
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                            <p style={{ color: '#64748b', margin: 0 }}>No hay disponibilidad este día. Intenta con otra fecha.</p>
                                        </div>
                                    ) : (
                                        <div className={styles.slotsGrid}>
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    className={styles.slotBtn}
                                                    onClick={() => setSelectedTime(slot)}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
