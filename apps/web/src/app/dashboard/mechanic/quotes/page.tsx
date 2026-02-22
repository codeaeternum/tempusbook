'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import { ROOT_BUSINESS_ID as BUSINESS_ID } from '@aeternasuite/shared-constants';
import styles from './page.module.css';

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    licensePlate: string;
    clientId: string;
}

interface QuoteItem {
    name: string;
    quantity: number;
    price: number;
}

interface Quotation {
    id: string;
    magicLinkToken: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    totalAmount: number;
    clientId: string;
    client?: Client;
    vehicleId?: string;
    vehicle?: Vehicle;
    notes?: string;
    items: any[];
    createdAt: string;
}

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<Quotation[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState(false);

    // Form state
    const [clientId, setClientId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<QuoteItem[]>([]);

    const [toast, setToast] = useState({ message: '', visible: false });
    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
    };

    useEffect(() => {
        Promise.all([
            fetchWithAuth(`http://localhost:3001/api/v1/quotations/business/${BUSINESS_ID}`),
            fetchWithAuth(`http://localhost:3001/api/v1/businesses/${BUSINESS_ID}/clients`),
            fetchWithAuth(`http://localhost:3001/api/v1/vehicles/business/${BUSINESS_ID}`)
        ])
            .then(async ([resQ, resC, resV]) => {
                if (resQ.ok) setQuotes(await resQ.json());
                if (resC.ok) setClients(await resC.json());
                if (resV.ok) setVehicles(await resV.json());
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return quotes;
        const q = search.toLowerCase();
        return quotes.filter(quote =>
            quote.id.toLowerCase().includes(q) ||
            (quote.client && `${quote.client.firstName} ${quote.client.lastName}`.toLowerCase().includes(q))
        );
    }, [search, quotes]);

    const openCreateModal = () => {
        setClientId('');
        setVehicleId('');
        setNotes('');
        setItems([{ name: '', quantity: 1, price: 0 }]);
        setShowModal(true);
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { name: '', quantity: 1, price: 0 }]);
    };

    const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
        setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const totalCalculated = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

    const handleSave = async () => {
        if (!clientId) {
            showToast('Selecciona un cliente'); return;
        }
        if (items.some(i => !i.name || i.price < 0)) {
            showToast('Nombres y precios son obligatorios en los ítems'); return;
        }

        const payload = {
            businessId: BUSINESS_ID,
            clientId,
            vehicleId: vehicleId || undefined,
            totalAmount: totalCalculated,
            items,
            notes
        };

        const res = await fetchWithAuth('http://localhost:3001/api/v1/quotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const created = await res.json();
            created.client = clients.find(c => c.id === clientId);
            created.vehicle = vehicles.find(v => v.id === vehicleId);
            setQuotes(prev => [created, ...prev]);
            showToast('Cotización Generada Exitosamente');
            setShowModal(false);
        } else {
            showToast('Falla al registrar cotización');
        }
    };

    // Construct Magic Link
    const sendWhatsApp = (quote: Quotation) => {
        if (!quote.client?.phone) {
            showToast('El cliente no tiene teléfono registrado'); return;
        }
        const baseUrl = window.location.origin;
        const magicLink = `${baseUrl}/q/${quote.magicLinkToken}`;
        const msg = encodeURIComponent(`Hola ${quote.client.firstName}, hemos generado una cotización de los servicios solicitados para tu vehículo. Puedes revisarla y aprobarla de forma segura en el siguiente enlace:\n\n${magicLink}\n\nQuedamos a tus órdenes.`);
        const phoneDigits = quote.client.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${phoneDigits}?text=${msg}`, '_blank');
    };

    return (
        <>
            <Header
                title="Cotizaciones"
                subtitle={`${quotes.length} expedidas`}
                actions={
                    <button className="btn btn-primary" onClick={openCreateModal}>+ Nueva Cotización</button>
                }
            />

            <div className={styles.content}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>Cargando Motor...</div>
                ) : (
                    <>
                        <div className={styles.toolbar}>
                            <div className={styles.searchBox}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input
                                    className={styles.searchInput}
                                    placeholder="Buscar por ID o Cliente..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={`card ${styles.tableCard}`}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Cliente</th>
                                            <th>Vehículo</th>
                                            <th>Monto (MXN)</th>
                                            <th>Status</th>
                                            <th>Fecha</th>
                                            <th>PWA Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(q => (
                                            <tr key={q.id}>
                                                <td>
                                                    <div className={styles.clientCell}>
                                                        <div className={styles.avatar}>
                                                            {q.client ? `${q.client.firstName[0]}${q.client.lastName?.[0] || ''}`.toUpperCase() : '?'}
                                                        </div>
                                                        <div>
                                                            <div className={styles.clientName}>
                                                                {q.client ? `${q.client.firstName} ${q.client.lastName}` : 'N/A'}
                                                            </div>
                                                            <div className={styles.clientEmail}>
                                                                {q.client?.phone || 'Sin WhatsApp'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{q.vehicle ? `${q.vehicle.make} ${q.vehicle.model}` : 'General'}</td>
                                                <td><span className={styles.spentAmount}>${q.totalAmount.toLocaleString()}</span></td>
                                                <td>
                                                    <span className={styles.statusBadge} style={{
                                                        background: q.status === 'APPROVED' ? 'var(--color-success-bg)' : q.status === 'REJECTED' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                                                        color: q.status === 'APPROVED' ? 'var(--color-success)' : q.status === 'REJECTED' ? 'var(--color-danger)' : 'var(--color-warning)'
                                                    }}>
                                                        {q.status === 'PENDING' ? '⏳ PENDIENTE' : q.status === 'APPROVED' ? '✅ APROBADA' : '❌ RECHAZADA'}
                                                    </span>
                                                </td>
                                                <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className={styles.tableActions}>
                                                        <button
                                                            className={styles.actionBtn}
                                                            style={{ border: '1px solid #25D366', color: '#25D366', fontWeight: 600 }}
                                                            onClick={(e) => { e.stopPropagation(); sendWhatsApp(q); }}
                                                        >
                                                            💬 Enviar vía WA
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay cotizaciones registradas.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create Quote Modal */}
            {showModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowModal(false)} />
                    <div className={styles.modal} style={{ maxWidth: '800px' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Constructor de Presupuesto</h2>
                            <button className={styles.panelCloseBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Destinatario (Cliente)</label>
                                    <select className={styles.formInput} value={clientId} onChange={e => setClientId(e.target.value)}>
                                        <option value="" disabled>Seleccionar...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Vehículo Involucrado (Opcional)</label>
                                    <select className={styles.formInput} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                                        <option value="">Aplicación General</option>
                                        {vehicles.filter(v => !clientId || v.clientId === clientId).map(v => (
                                            <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <hr style={{ borderColor: 'var(--color-border-light)', margin: '1rem 0' }} />
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Partes y Refacciones</h3>

                            {items.map((it, idx) => (
                                <div key={idx} className={styles.quoteItemRow}>
                                    <input
                                        className={styles.formInput}
                                        placeholder="Descripción de la pieza o servicio..."
                                        value={it.name}
                                        onChange={e => handleItemChange(idx, 'name', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        className={styles.formInput}
                                        placeholder="Cant."
                                        value={it.quantity}
                                        onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-tertiary)' }}>$</span>
                                        <input
                                            type="number"
                                            className={styles.formInput}
                                            style={{ paddingLeft: '24px' }}
                                            placeholder="Precio Unit."
                                            value={it.price === 0 ? '' : it.price}
                                            onChange={e => handleItemChange(idx, 'price', Number(e.target.value))}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(idx)}
                                        className={styles.removeItemBtn}
                                    >✕</button>
                                </div>
                            ))}

                            <button onClick={handleAddItem} style={{ alignSelf: 'flex-start', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px', cursor: 'pointer' }}>
                                + Agregar Fila
                            </button>

                            <div style={{ textAlign: 'right', fontSize: '18px', fontWeight: 600, marginTop: '1rem' }}>
                                Total a Pagar: <span style={{ color: 'var(--color-primary)' }}>${totalCalculated.toLocaleString()} MXN</span>
                            </div>

                            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                <label className={styles.formLabel}>Condiciones o Notas (Visibles para el cliente)</label>
                                <textarea className={styles.formTextarea} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Los precios de refacciones pueden variar sin previo aviso. Vigencia de 5 días." />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Atrás</button>
                            <button className="btn btn-primary" onClick={handleSave}>Generar & Sellar</button>
                        </div>
                    </div>
                </>
            )}

            <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
                {toast.message}
            </div>
        </>
    );
}
