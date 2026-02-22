'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { publicApi } from '@/lib/api/public';
import { Loader2, Plus, Users, Clock, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

interface Service {
    id: string;
    name: string;
    durationMinutes: number;
    price: string | number;
}

interface QueuedEntry {
    estimatedWaitMinutes: number;
    peopleAhead: number;
    message: string;
}

export default function KioskQueuePage() {
    const params = useParams();
    const slug = params.slug as string;

    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [step, setStep] = useState<'welcome' | 'service' | 'name' | 'success'>('welcome');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [clientName, setClientName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Response payload after successfully joining the waitlist
    const [queuedData, setQueuedData] = useState<QueuedEntry | null>(null);

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                const data = await publicApi.getBusinessProfileBySlug(slug);
                setBusiness(data);
            } catch (err: any) {
                setError('Negocio no encontrado');
            } finally {
                setLoading(false);
            }
        };
        fetchBusiness();
    }, [slug]);

    if (loading) return <div className={styles.centerContainer}><Loader2 className="animate-spin w-12 h-12 text-primary" /></div>;
    if (error || !business) return <div className={styles.centerContainer}><h2>{error}</h2></div>;

    const handleServiceSelect = (svc: Service) => {
        setSelectedService(svc);
        setStep('name');
    };

    const handleJoinQueue = async () => {
        if (!clientName.trim() || !selectedService) return;

        setIsSubmitting(true);
        try {
            // Note: Kiosk uses the public API abstraction we created previously 
            // but points to the new /walk-in endpoint
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/walk-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: business.id,
                    serviceId: selectedService.id,
                    firstName: clientName.trim(),
                })
            });

            if (!res.ok) throw new Error(await res.text());

            const result = await res.json();
            setQueuedData({
                estimatedWaitMinutes: result.estimatedWaitMinutes,
                peopleAhead: result.peopleAhead,
                message: result.message
            });

            setStep('success');

            // Auto-reset kiosk for the next walk-in person after 10 seconds
            setTimeout(() => {
                setStep('welcome');
                setSelectedService(null);
                setClientName('');
                setQueuedData(null);
            }, 10000);

        } catch (err) {
            console.error(err);
            alert('Error al registrar turno. Por favor intente en caja.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.kioskLayout}>
            {/* Split Screen Design for Tablet */}
            <div className={styles.brandPanel}>
                <div className={styles.brandContent}>
                    {business.logoUrl ? (
                        <div className={styles.logoWrapper}>
                            <Image src={business.logoUrl} alt={business.name} fill className="object-cover" />
                        </div>
                    ) : (
                        <div className={styles.logoPlaceholder}>{business.name.charAt(0)}</div>
                    )}
                    <h1 className={styles.brandName}>{business.name}</h1>
                    <p className={styles.brandSubtitle}>Kiosco de Auto-Recepción</p>

                    <div className={styles.liveClock}>
                        {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Decorative blob */}
                <div className={styles.ambientBlob}></div>
            </div>

            <div className={styles.actionPanel}>

                {/* STEP 1: WELCOME SCREEN */}
                {step === 'welcome' && (
                    <div className={`${styles.stepContainer} animate-fade-in`}>
                        <h2 className={styles.welcomeTitle}>Bienvenido</h2>
                        <p className={styles.welcomeText}>Regístrate en la fila virtual y te llamaremos cuando sea tu turno.</p>

                        <button
                            className={styles.giganticButton}
                            onClick={() => setStep('service')}
                        >
                            <Plus className="w-8 h-8 mr-3" />
                            Tomar un Turno
                        </button>
                    </div>
                )}

                {/* STEP 2: SERVICE SELECTION */}
                {step === 'service' && (
                    <div className={`${styles.stepContainer} animate-slide-up`}>
                        <button className={styles.backButton} onClick={() => setStep('welcome')}>← Cancelar</button>
                        <h2>¿Qué servicio buscas hoy?</h2>

                        <div className={styles.servicesGrid}>
                            {business.services?.map((svc: Service) => (
                                <button
                                    key={svc.id}
                                    className={styles.serviceCard}
                                    onClick={() => handleServiceSelect(svc)}
                                >
                                    <span className={styles.serviceName}>{svc.name}</span>
                                    <div className={styles.serviceMeta}>
                                        <span className={styles.priceTag}>${Number(svc.price).toFixed(2)}</span>
                                        <span className={styles.durationTag}>{svc.durationMinutes} min</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: NAME INPUT */}
                {step === 'name' && (
                    <div className={`${styles.stepContainer} animate-slide-up`}>
                        <button className={styles.backButton} onClick={() => setStep('service')}>← Atrás</button>
                        <h2>¿Cuál es tu nombre?</h2>
                        <p className={styles.subtitleContext}>Para llamarte cuando sea tu turno de <strong>{selectedService?.name}</strong>.</p>

                        <input
                            type="text"
                            className={styles.massiveInput}
                            placeholder="Ej. Juan Pérez"
                            autoFocus
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinQueue()}
                        />

                        <button
                            className={styles.primaryButton}
                            onClick={handleJoinQueue}
                            disabled={!clientName.trim() || isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Entrar a la Fila 👉'}
                        </button>
                    </div>
                )}

                {/* STEP 4: SUCCESS / QUEUE STATUS */}
                {step === 'success' && queuedData && (
                    <div className={`${styles.stepContainer} ${styles.successContainer} animate-scale-up`}>
                        <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
                        <h2 className={styles.successTitle}>¡Estás en la fila, {clientName}!</h2>

                        <div className={styles.etaCard}>
                            <div className={styles.etaStat}>
                                <Clock className="w-8 h-8 text-blue-500 mb-2" />
                                <span className={styles.etaValue}>
                                    {queuedData.estimatedWaitMinutes === 0 ? 'AHORA' : `${queuedData.estimatedWaitMinutes} min`}
                                </span>
                                <span className={styles.etaLabel}>Tiempo Estimado</span>
                            </div>

                            <div className={styles.etaDivider}></div>

                            <div className={styles.etaStat}>
                                <Users className="w-8 h-8 text-indigo-500 mb-2" />
                                <span className={styles.etaValue}>{queuedData.peopleAhead}</span>
                                <span className={styles.etaLabel}>Personas Delante</span>
                            </div>
                        </div>

                        <p className={styles.reassureText}>Toma asiento en la sala de espera. {queuedData.message}</p>

                        <div className={styles.progressBar}>
                            <div className={styles.progressFill}></div>
                        </div>
                        <p className={styles.autoResetText}>Esta pantalla se reiniciará automáticamente...</p>
                    </div>
                )}

            </div>
        </div>
    );
}
