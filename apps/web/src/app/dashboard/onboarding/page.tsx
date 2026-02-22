'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Category {
    id: string;
    name: string;
    slug: string;
}

const categoryIcons: Record<string, string> = {
    'belleza-bienestar': '💆‍♀️',
    'salud-medicina': '⚕️',
    'deportes-fitness': '🏋️',
    'mascotas': '🐾',
    'automotriz': '🚗',
    'hogar-mantenimiento': '🛠️',
    'servicios-profesionales': '💼',
    'educacion-clases': '🎓',
};

const DEFAULT_HOURS = [
    { dayOfWeek: 'MONDAY', label: 'Lunes', isActive: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 'TUESDAY', label: 'Martes', isActive: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 'WEDNESDAY', label: 'Miércoles', isActive: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 'THURSDAY', label: 'Jueves', isActive: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 'FRIDAY', label: 'Viernes', isActive: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 'SATURDAY', label: 'Sábado', isActive: true, openTime: '10:00', closeTime: '14:00' },
    { dayOfWeek: 'SUNDAY', label: 'Domingo', isActive: false, openTime: '10:00', closeTime: '14:00' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { token, isLoading } = useAuth();

    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCat, setLoadingCat] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        categoryId: '',
        city: '',
        phone: '',
    });

    const [hours, setHours] = useState(DEFAULT_HOURS);

    const [firstService, setFirstService] = useState({
        name: '',
        price: '',
        durationMinutes: 30,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API}/categories`);
                if (res.ok) setCategories(await res.json());
            } catch (err) {
                console.error('Failed to load categories', err);
            } finally {
                setLoadingCat(false);
            }
        };
        fetchCategories();
    }, []);

    if (isLoading) return null;

    const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const handleHourToggle = (index: number) => {
        const newHours = [...hours];
        newHours[index].isActive = !newHours[index].isActive;
        setHours(newHours);
    };

    const handleHourChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
        const newHours = [...hours];
        newHours[index][field] = value;
        setHours(newHours);
    };

    const handleSubmit = async () => {
        if (!token) return;
        setIsSubmitting(true);

        // Build Prisma Nested Create Payload
        const payload = {
            name: formData.name,
            slug: formData.slug,
            categoryId: formData.categoryId,
            city: formData.city,
            phone: formData.phone,
            businessHours: {
                create: hours.map(h => ({
                    dayOfWeek: h.dayOfWeek,
                    isActive: h.isActive,
                    openTime: h.openTime,
                    closeTime: h.closeTime
                }))
            },
            services: {
                create: [{
                    name: firstService.name || 'Servicio General',
                    durationMinutes: Number(firstService.durationMinutes) || 60,
                    price: Number(firstService.price) || 0,
                    isActive: true
                }]
            }
        };

        try {
            const res = await fetch(`${API}/businesses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('¡Negocio creado! Preparando tu Dashboard...');
                setTimeout(() => window.location.href = '/dashboard', 1500);
            } else {
                const err = await res.json();
                toast.error(err.message || 'Error al crear negocio');
                setIsSubmitting(false);
            }
        } catch (error) {
            toast.error('Error de red');
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.onboardingContainer}>
            <div className={styles.blob1}></div>
            <div className={styles.blob2}></div>

            <div className={styles.onboardingCard}>
                <div className={styles.logoMark}>Æ</div>
                <h1 className={styles.title}>Configura tu Negocio</h1>
                <p className={styles.subtitle}>En menos de 2 minutos estarás listo para recibir reservas y cobrar.</p>

                <div className={styles.stepIndicator}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`${styles.stepDot} ${step >= s ? styles.stepDotActive : ''}`} />
                    ))}
                </div>

                {/* STEP 1 */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h2>¿A qué se dedica tu negocio?</h2>
                        {loadingCat ? (
                            <div style={{ textAlign: 'center', color: '#64748b' }}>Cargando rubros...</div>
                        ) : (
                            <div className={styles.grid}>
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className={`${styles.categoryCard} ${formData.categoryId === cat.id ? styles.categoryCardActive : ''}`}
                                        onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                                    >
                                        <div className={styles.categoryIcon}>{categoryIcons[cat.slug] || '✨'}</div>
                                        <div className={styles.categoryName}>{cat.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className={styles.btnGroup} style={{ justifyContent: 'flex-end' }}>
                            <button className={styles.btnNext} onClick={() => setStep(2)} disabled={!formData.categoryId}>
                                Continuar →
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <h2>Detalles Principales</h2>
                        <div className={styles.formGroup}>
                            <label>Nombre del Negocio</label>
                            <input
                                className={styles.input}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                                placeholder="Ej. Aeterna Studio"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Enlace personalizado (URL)</label>
                            <input
                                className={styles.input}
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                            />
                            <p className={styles.hint}>aeternasuite.com/reserva/<strong>{formData.slug || 'tu-negocio'}</strong></p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label>Ciudad</label>
                                <input className={styles.input} value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="CDMX" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Teléfono</label>
                                <input className={styles.input} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="55 1234..." />
                            </div>
                        </div>
                        <div className={styles.btnGroup}>
                            <button className={styles.btnPrev} onClick={() => setStep(1)}>← Regresar</button>
                            <button className={styles.btnNext} onClick={() => setStep(3)} disabled={!formData.name || !formData.slug}>Continuar →</button>
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className={styles.stepContent}>
                        <h2>Horarios de Atención</h2>
                        <p className={styles.hint} style={{ marginBottom: '1.5rem' }}>Define cuándo estarás abierto para recibir citas.</p>
                        <div className={styles.hoursList}>
                            {hours.map((h, i) => (
                                <div key={h.dayOfWeek} className={styles.hourRow}>
                                    <label className={styles.checkboxLabel}>
                                        <input type="checkbox" checked={h.isActive} onChange={() => handleHourToggle(i)} />
                                        <span>{h.label}</span>
                                    </label>
                                    {h.isActive ? (
                                        <div className={styles.timeInputs}>
                                            <input type="time" value={h.openTime} onChange={e => handleHourChange(i, 'openTime', e.target.value)} className={styles.timeInput} />
                                            <span>a</span>
                                            <input type="time" value={h.closeTime} onChange={e => handleHourChange(i, 'closeTime', e.target.value)} className={styles.timeInput} />
                                        </div>
                                    ) : (
                                        <div className={styles.closedBadge}>Cerrado</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={styles.btnGroup}>
                            <button className={styles.btnPrev} onClick={() => setStep(2)}>← Regresar</button>
                            <button className={styles.btnNext} onClick={() => setStep(4)}>Continuar →</button>
                        </div>
                    </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                    <div className={styles.stepContent}>
                        <h2>Tu Primer Servicio</h2>
                        <p className={styles.hint} style={{ marginBottom: '1.5rem' }}>Añade el servicio principal que ofreces para que tus clientes puedan empezar a agendarte de inmediato.</p>

                        <div className={styles.formGroup}>
                            <label>Nombre del Servicio</label>
                            <input
                                className={styles.input}
                                value={firstService.name}
                                onChange={e => setFirstService({ ...firstService, name: e.target.value })}
                                placeholder="Ej. Corte de Cabello, Consulta Medica..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label>Precio ($)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={firstService.price}
                                    onChange={e => setFirstService({ ...firstService, price: e.target.value })}
                                    placeholder="250"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Duración (Minutos)</label>
                                <select
                                    className={styles.input}
                                    value={firstService.durationMinutes}
                                    onChange={e => setFirstService({ ...firstService, durationMinutes: Number(e.target.value) })}
                                >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>1 hora</option>
                                    <option value={90}>1.5 horas</option>
                                    <option value={120}>2 horas</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.btnGroup} style={{ marginTop: '2rem' }}>
                            <button className={styles.btnPrev} onClick={() => setStep(3)} disabled={isSubmitting}>← Regresar</button>
                            <button className={styles.btnNext} onClick={handleSubmit} disabled={isSubmitting || !firstService.name}>
                                {isSubmitting ? 'Construyendo...' : '¡Terminar y Lanzar! 🚀'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
