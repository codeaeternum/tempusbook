'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface QuotationFull {
    id: string;
    businessId: string;
    clientId: string;
    vehicleId?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    totalAmount: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    notes?: string;
    createdAt: string;
    business: { name: string; phone: string; currency: string };
    client: { firstName: string; lastName: string };
    vehicle?: { make: string; model: string; licensePlate: string };
}

export default function MagicLinkPage() {
    const params = useParams();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState<QuotationFull | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (!token) return;

        fetch(`${API}/quotations/magic/${token}`)
            .then(res => {
                if (!res.ok) throw new Error('Enlace expirado o inválido');
                return res.json();
            })
            .then(data => {
                setQuote(data);
                setLoading(false);
            })
            .catch(err => {
                setErrorMsg(err.message);
                setLoading(false);
            });
    }, [token]);

    const handleAction = async (newStatus: 'APPROVED' | 'REJECTED') => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API}/quotations/magic/${token}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Fallo al actualizar el presupuesto');

            if (newStatus === 'APPROVED') {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }

            setQuote(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            alert('Temporalmente indisponible. Por favor, contacte a su sucursal.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className={styles.loadingScreen}><div className={styles.spinner}></div>Cargando Presupuesto...</div>;

    if (errorMsg || !quote) {
        return (
            <div className={styles.loadingScreen}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
                <h2>Este enlace no es válido</h2>
                <p style={{ maxWidth: '300px', textAlign: 'center' }}>
                    Puede que haya caducado o el enlace fue copiado incorrectamente.
                    Por favor solicita uno nuevo a tu taller.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {showConfetti && (
                <div className={styles.confetti} style={{ background: 'url("https://cdn.jsdelivr.net/gh/danielgindi/confetti@master/confetti.gif") stretch' }} />
            )}

            <header className={styles.header}>
                <h1 className={styles.businessName}>{quote.business.name}</h1>
                <div className={styles.docType}>Cotización Folio #{quote.id.split('-')[0].toUpperCase()}</div>
            </header>

            <main className={styles.content}>

                {quote.status !== 'PENDING' && (
                    <div className={`${styles.statusBar} ${quote.status === 'APPROVED' ? styles.statusApproved : styles.statusRejected}`}>
                        {quote.status === 'APPROVED' ? '✅ Presupuesto Aprobado' : '❌ Presupuesto Declinado'}
                    </div>
                )}

                <div className={styles.card}>
                    <div className={styles.metadataRow}>
                        <span className={styles.metaLabel}>Propietario</span>
                        <span className={styles.metaValue}>{quote.client.firstName} {quote.client.lastName}</span>
                    </div>
                    <div className={styles.metadataRow}>
                        <span className={styles.metaLabel}>Fecha</span>
                        <span className={styles.metaValue}>{new Date(quote.createdAt).toLocaleDateString()}</span>
                    </div>
                    {quote.vehicle && (
                        <div className={styles.metadataRow}>
                            <span className={styles.metaLabel}>Vehículo</span>
                            <span className={styles.metaValue}>{quote.vehicle.make} {quote.vehicle.model} ({quote.vehicle.licensePlate})</span>
                        </div>
                    )}

                    <div className={styles.divider} />

                    <h2 className={styles.itemsTitle}>Servicios y Refacciones Sugeridas</h2>

                    <div>
                        {quote.items.map((item, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <div>
                                    <div className={styles.itemName}>{item.name}</div>
                                    <div className={styles.itemQty}>{item.quantity} Unidad{item.quantity > 1 ? 'es' : ''}</div>
                                </div>
                                <div className={styles.itemPrice}>
                                    ${(item.price * item.quantity).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Importe Total</span>
                        <span className={styles.totalAmount}>${quote.totalAmount.toLocaleString()} {quote.business.currency}</span>
                    </div>

                    {quote.notes && (
                        <div className={styles.notesBox}>
                            <strong>Notas e info:</strong><br />
                            {quote.notes}
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '20px', paddingBottom: '100px' }}>
                    Este es un enlace cifrado end-to-end.<br />Emitido por plataforma AeternaSuite.
                </div>
            </main>

            {quote.status === 'PENDING' && (
                <div className={styles.actions}>
                    <button
                        className={`${styles.btn} ${styles.btnReject}`}
                        onClick={() => handleAction('REJECTED')}
                        disabled={actionLoading}
                    >
                        Dejar Pendiente
                    </button>
                    <button
                        className={`${styles.btn} ${styles.btnApprove}`}
                        onClick={() => handleAction('APPROVED')}
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Procesando...' : 'Autorizar'}
                    </button>
                </div>
            )}
        </div>
    );
}
