'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLocale } from '@/providers/LocaleProvider';
import Header from '@/components/layout/Header';
import { Gift, Plus, CreditCard, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.css';

interface GiftCard {
    id: string;
    code: string;
    initialBalance: string | number;
    currentBalance: string | number;
    status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
    recipientName?: string;
    expiresAt?: string;
    purchaser?: { firstName: string, lastName: string };
    createdAt: string;
}

export default function GiftCardsAdminPage() {
    const { token, dbUser } = useAuth();
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState<'cards' | 'issue'>('cards');

    // Data State
    const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forms
    const [issueForm, setIssueForm] = useState({ initialBalance: 500, recipientName: '', purchaserId: '' });
    const [redeemForm, setRedeemForm] = useState({ code: '', amountToDeduct: 0 });

    // App Clients (to link purchaser)
    const [clients, setClients] = useState<any[]>([]);

    const businessId = dbUser?.businessMembers?.[0]?.business?.id;

    const fetchData = async () => {
        if (!token || !businessId) return;
        setLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

            const resCards = await fetch(`${apiBase}/gift-cards/business/${businessId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resCards.ok) setGiftCards(await resCards.json());

            const resClients = await fetch(`${apiBase}/clients/business/${businessId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resClients.ok) setClients(await resClients.json());

        } catch (error) {
            toast.error('Error al cargar datos de Tarjetas de Regalo');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, businessId]);

    const handleIssueCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !businessId) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/gift-cards/issue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    businessId,
                    initialBalance: Number(issueForm.initialBalance),
                    recipientName: issueForm.recipientName || undefined,
                    purchaserId: issueForm.purchaserId || undefined,
                    expiresInDays: 365 // Default 1 year validity
                })
            });

            if (!res.ok) throw new Error(await res.text());
            const newCard = await res.json();
            toast.success(`Tarjeta Genedara Exitosamente: ${newCard.code}`);
            setShowIssueModal(false);
            setIssueForm({ initialBalance: 500, recipientName: '', purchaserId: '' });
            fetchData();
        } catch (err: any) {
            toast.error(err.message || 'Error al emitir tarjeta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRedeemCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !businessId) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/gift-cards/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    businessId,
                    code: redeemForm.code,
                    amountToDeduct: Number(redeemForm.amountToDeduct)
                })
            });

            if (!res.ok) throw new Error((JSON.parse(await res.text())).message || 'Error al procesar cobro');
            const data = await res.json();

            toast.success(`Cobro aplicado. Saldo actual: $${data.currentBalance} MXN`);
            setShowRedeemModal(false);
            setRedeemForm({ code: '', amountToDeduct: 0 });
            fetchData();
        } catch (err: any) {
            toast.error(err.message || 'Error al cobrar con tarjeta');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!dbUser || !businessId) return <div className={styles.pageContainer}><Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--color-primary)' }} /></div>;

    const headerActions = (
        <>
            <button className="btn btnOutline" onClick={() => setShowRedeemModal(true)}>
                <CreditCard size={18} /> Cobrar
            </button>
            <button className="btn btnPrimary" onClick={() => setShowIssueModal(true)}>
                <Plus size={18} /> Emitir
            </button>
        </>
    );

    return (
        <div className={styles.pageContainer}>
            <Header title="Tarjetas de Regalo" subtitle="Emite saldo prepagado que tus clientes pueden regalar o utilizar en futuras visitas." actions={headerActions} />

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin w-8 h-8 text-primary mx-auto" /></div>
            ) : (
                <div className={styles.grid}>
                    {giftCards.length === 0 ? (
                        <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                            <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3>Sin Tarjetas Emitidas</h3>
                            <p style={{ color: '#64748b' }}>Comienza vendiendo Gift Cards a tus clientes para fidelizar ingresos adelantados.</p>
                        </div>
                    ) : giftCards.map(gc => (
                        <div key={gc.id} className={styles.giftCardItem}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardBrand}>{dbUser.businessMembers?.[0]?.business?.name || 'AeternaSuite'}</div>
                                <div className={`${styles.statusBadge} ${styles[`status${gc.status}`]}`}>
                                    {gc.status === 'ACTIVE' ? 'ACTIVA' : gc.status === 'DEPLETED' ? 'AGOTADA' : 'EXPIRADA'}
                                </div>
                            </div>

                            <div className={styles.cardBalance}>
                                ${Number(gc.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>

                            <div className={styles.cardDetails}>
                                <div className={styles.cardCode}>{gc.code}</div>
                                {gc.recipientName ? (
                                    <div className={styles.cardRecipient}>Para: {gc.recipientName}</div>
                                ) : gc.purchaser ? (
                                    <div className={styles.cardRecipient}>Comprador: {gc.purchaser.firstName} {gc.purchaser.lastName}</div>
                                ) : (
                                    <div className={styles.cardRecipient}>Tarjeta al Portador</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE TEMPLATE MODAL */}
            {showIssueModal && (
                <div className={styles.modalOverlay} onClick={() => setShowIssueModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Emitir Nueva Gift Card</h3>
                            <button onClick={() => setShowIssueModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#94a3b8' }}>✕</button>
                        </div>
                        <form onSubmit={handleIssueCard} className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Saldo Inicial ($)</label>
                                <input required type="number" min="1" step="0.01" className={styles.formInput} value={issueForm.initialBalance} onChange={e => setIssueForm({ ...issueForm, initialBalance: Number(e.target.value) })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nombre del Destinatario (Opcional)</label>
                                <input className={styles.formInput} value={issueForm.recipientName} onChange={e => setIssueForm({ ...issueForm, recipientName: e.target.value })} placeholder="Ej. Ana Martínez" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Vincular a un Cliente Comprador (Opcional)</label>
                                <select className={styles.formInput} value={issueForm.purchaserId} onChange={e => setIssueForm({ ...issueForm, purchaserId: e.target.value })}>
                                    <option value="">-- Consumidor Final (Mostrador) --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" disabled={isSubmitting} className={styles.actionBtn} style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>
                                {isSubmitting ? 'Generando Criptograma...' : 'Emitir y Activar Tarjeta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* REDEEM / CHARGE MODAL */}
            {showRedeemModal && (
                <div className={styles.modalOverlay} onClick={() => setShowRedeemModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Cobro con Tarjeta de Regalo</h3>
                            <button onClick={() => setShowRedeemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#94a3b8' }}>✕</button>
                        </div>
                        <form onSubmit={handleRedeemCard} className={styles.modalBody}>
                            <div className={styles.formGroup} style={{ position: 'relative' }}>
                                <label className={styles.formLabel}>Código de Vales (16 Caracteres)</label>
                                <input required className={styles.formInput} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} placeholder="AE-XXXX-XXXX" value={redeemForm.code} onChange={e => setRedeemForm({ ...redeemForm, code: e.target.value.toUpperCase() })} />
                                <Search className="w-5 h-5 text-slate-400" style={{ position: 'absolute', right: '1rem', top: '2.4rem' }} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Monto a Deducir ($ MXN)</label>
                                <input required type="number" min="0.01" step="0.01" className={styles.formInput} value={redeemForm.amountToDeduct} onChange={e => setRedeemForm({ ...redeemForm, amountToDeduct: Number(e.target.value) })} />
                            </div>

                            <button type="submit" disabled={isSubmitting} className={styles.actionBtn} style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
                                {isSubmitting ? 'Verificando Fondos...' : 'Cargo Seguro al Saldo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
