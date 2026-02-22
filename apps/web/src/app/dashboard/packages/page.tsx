'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLocale } from '@/providers/LocaleProvider';
import Header from '@/components/layout/Header';
import { Plus, Package as PkgIcon, Users, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './page.module.css';

interface PackageDef {
    id: string;
    name: string;
    description: string;
    price: string | number;
    sessions: number;
    isActive: boolean;
}

interface ClientPackage {
    id: string;
    status: string;
    totalSessions: number;
    usedSessions: number;
    client: { firstName: string, lastName: string };
    packageDef: PackageDef;
}

export default function PackagesAdminPage() {
    const { token, dbUser } = useAuth();
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState<'templates' | 'tracking'>('tracking');

    // Data State
    const [packages, setPackages] = useState<PackageDef[]>([]);
    const [clientPackages, setClientPackages] = useState<ClientPackage[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form: Create Template
    const [formDef, setFormDef] = useState({ name: '', description: '', price: 0, sessions: 5 });

    // Form: Assign Client
    const [assignForm, setAssignForm] = useState({ packageId: '', clientId: '' });

    // App Clients (to assign to)
    const [clients, setClients] = useState<any[]>([]);

    const businessId = dbUser?.businessMembers?.[0]?.business?.id;

    const fetchData = async () => {
        if (!token || !businessId) return;
        setLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

            // 1. Fetch Package Templates
            const resPkg = await fetch(`${apiBase}/packages/business/${businessId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resPkg.ok) setPackages(await resPkg.json());

            // 2. Fetch Clients for mapping
            const resClients = await fetch(`${apiBase}/clients/business/${businessId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const clientList = resClients.ok ? await resClients.json() : [];
            setClients(clientList);

            // Note: In a production ideal state, tracking would fetch ALL active ClientPackages for the business.
            // For this UI, we assume a bulk endpoint or a map over clients. Let's mock the tracking array for now
            // since the API needs `/client/:id/business/:id` (which is client-centric). We will adapt it visually.
            // But we can map the first 5 clients to show their active packages:
            if (clientList.length > 0) {
                let allActive: ClientPackage[] = [];
                for (let c of clientList.slice(0, 10)) {
                    const rc = await fetch(`${apiBase}/packages/client/${c.id}/business/${businessId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (rc.ok) allActive = [...allActive, ...(await rc.json())];
                }
                setClientPackages(allActive);
            }

        } catch (error) {
            toast.error('Error al cargar datos de paquetes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, businessId]);

    const handleCreatePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !businessId) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/packages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    businessId,
                    name: formDef.name,
                    description: formDef.description || undefined,
                    price: Number(formDef.price),
                    sessions: Number(formDef.sessions)
                })
            });

            if (!res.ok) throw new Error(await res.text());
            toast.success('Plantilla de Paquete creada exitosamente');
            setShowCreateModal(false);
            setFormDef({ name: '', description: '', price: 0, sessions: 5 });
            fetchData();
        } catch (err: any) {
            toast.error(err.message || 'Error al crear');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignPackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !businessId) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/packages/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    businessId,
                    clientId: assignForm.clientId,
                    packageId: assignForm.packageId
                })
            });

            if (!res.ok) throw new Error(await res.text());
            toast.success('Paquete vendido y asignado al cliente');
            setShowAssignModal(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.message || 'Error al asignar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeductSession = async (clientPackageId: string) => {
        if (!token) return;
        try {
            // Optimistic update
            setClientPackages(prev => prev.map(cp => {
                if (cp.id === clientPackageId && cp.usedSessions < cp.totalSessions) {
                    const newUsed = cp.usedSessions + 1;
                    return { ...cp, usedSessions: newUsed, status: newUsed >= cp.totalSessions ? 'EXHAUSTED' : 'ACTIVE' };
                }
                return cp;
            }));

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/packages/client-package/${clientPackageId}/deduct`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ notes: 'Descontado desde Dashboard' })
            });

            if (!res.ok) throw new Error('Error al consumir sesión');
            toast.success('Sesión aplicada exitosamente');
        } catch (error) {
            toast.error('Fallo de Red. Revirtiendo.');
            fetchData(); // Rollback
        }
    };

    if (!dbUser || !businessId) return <div className={styles.pageContainer}><Loader2 className="animate-spin" style={{ width: 32, height: 32, color: 'var(--color-primary)' }} /></div>;

    const headerActions = (
        <>
            <button className="btn btnOutline" onClick={() => setShowAssignModal(true)}>
                <CreditCard size={18} /> Vender
            </button>
            <button className="btn btnPrimary" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} /> Nueva Plantilla
            </button>
        </>
    );

    return (
        <div className={styles.pageContainer}>
            <Header title="Venta de Paquetes" subtitle="Crea paquetes de sesiones, regístralos a tus clientes y descuenta sus visitas." actions={headerActions} />

            <div className={styles.tabsBar}>
                <div className={`${styles.tab} ${activeTab === 'tracking' ? styles.tabActive : ''}`} onClick={() => setActiveTab('tracking')}>
                    <Users className="w-4 h-4" /> Tracking de Sesiones
                </div>
                <div className={`${styles.tab} ${activeTab === 'templates' ? styles.tabActive : ''}`} onClick={() => setActiveTab('templates')}>
                    <PkgIcon className="w-4 h-4" /> Plantillas de Venta
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin w-8 h-8 text-primary mx-auto" /></div>
            ) : (
                <>
                    {/* EN PISTA: TRACKING */}
                    {activeTab === 'tracking' && (
                        <div>
                            {clientPackages.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3>Aún no hay clientes con paquetes prepagados</h3>
                                    <p style={{ color: '#64748b' }}>Las sesiones que vendas aparecerán aquí para ir descontándolas según asistan.</p>
                                </div>
                            ) : (
                                <div>
                                    {clientPackages.filter(cp => cp.status === 'ACTIVE').map(cp => {
                                        const progressPct = (cp.usedSessions / cp.totalSessions) * 100;
                                        return (
                                            <div key={cp.id} className={styles.clientRow}>
                                                <div className={styles.clientInfo}>
                                                    <div className={styles.avatar}>{cp.client.firstName.charAt(0)}</div>
                                                    <div>
                                                        <div className={styles.clientName}>{cp.client.firstName} {cp.client.lastName}</div>
                                                        <div className={styles.packageName}><PkgIcon className="w-3 h-3" /> {cp.packageDef.name}</div>
                                                    </div>
                                                </div>

                                                <div className={styles.progressContainer}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                                        <span style={{ fontWeight: 600, color: '#334155' }}>Sesiones Consumidas</span>
                                                        <span style={{ color: '#64748b' }}>{cp.usedSessions} de {cp.totalSessions}</span>
                                                    </div>
                                                    <div className={styles.progressBar}>
                                                        <div className={styles.progressFill} style={{ width: `${progressPct}%`, background: progressPct > 80 ? '#ef4444' : '#10b981' }} />
                                                    </div>
                                                </div>

                                                <button
                                                    className={styles.actionBtn}
                                                    style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.5rem 1rem' }}
                                                    onClick={() => handleDeductSession(cp.id)}
                                                    disabled={cp.usedSessions >= cp.totalSessions}
                                                >
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Quemar Sesión
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PLANTILLAS */}
                    {activeTab === 'templates' && (
                        <div className={styles.grid}>
                            {packages.length === 0 ? (
                                <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                                    <PkgIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3>Configura tu primer Paquete</h3>
                                    <p style={{ color: '#64748b' }}>Ofrece paquetes masivos a tus clientes (Ej. 10 Sesiones de Láser).</p>
                                </div>
                            ) : packages.map(pkg => (
                                <div key={pkg.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardTitle}>{pkg.name}</div>
                                        <div className={styles.cardPrice}>${Number(pkg.price).toLocaleString()}</div>
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>{pkg.description || 'Sin descripción'}</p>

                                    <div className={styles.cardStats}>
                                        <div className={styles.statBadge}>
                                            <span className={styles.statVal}>{pkg.sessions}</span>
                                            <span className={styles.statLabel}>Sesiones Totales</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* CREATE TEMPLATE MODAL */}
            {showCreateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Nuevo Paquete B2B</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#94a3b8' }}>✕</button>
                        </div>
                        <form onSubmit={handleCreatePackage} className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nombre Comercial (Ej. Paquete Depilación Piernas)</label>
                                <input required className={styles.formInput} value={formDef.name} onChange={e => setFormDef({ ...formDef, name: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Costo Total Paquete ($)</label>
                                <input required type="number" min="0" className={styles.formInput} value={formDef.price} onChange={e => setFormDef({ ...formDef, price: Number(e.target.value) })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Número de Sesiones Incluidas</label>
                                <input required type="number" min="1" className={styles.formInput} value={formDef.sessions} onChange={e => setFormDef({ ...formDef, sessions: Number(e.target.value) })} />
                            </div>

                            <button type="submit" disabled={isSubmitting} className={styles.actionBtn} style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>
                                {isSubmitting ? 'Guardando...' : 'Crear Plantilla'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN / SELL MODAL */}
            {showAssignModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAssignModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Vender / Asignar Paquete</h3>
                            <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#94a3b8' }}>✕</button>
                        </div>
                        <form onSubmit={handleAssignPackage} className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Seleccione el Cliente</label>
                                <select required className={styles.formInput} value={assignForm.clientId} onChange={e => setAssignForm({ ...assignForm, clientId: e.target.value })}>
                                    <option value="">-- Buscar Cliente --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Paquete a Vender</label>
                                <select required className={styles.formInput} value={assignForm.packageId} onChange={e => setAssignForm({ ...assignForm, packageId: e.target.value })}>
                                    <option value="">-- Base de Paquete --</option>
                                    {packages.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toLocaleString()} ({p.sessions} Sesiones)</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" disabled={isSubmitting} className={styles.actionBtn} style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                                {isSubmitting ? 'Procesando Venta...' : 'Ejecutar Venta y Asignar Sesiones'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
