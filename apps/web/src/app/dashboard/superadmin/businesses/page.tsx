'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from '../page.module.css';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface BusinessItem {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    subscription?: { plan: string; status: string; trialEndsAt?: string };
    _count?: { bookings: number; members: number; services: number };
}

const planColors: Record<string, string> = {
    FREE: '#94a3b8', STARTER: '#60a5fa', PRO: '#a78bfa', BUSINESS: '#f59e0b',
};

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
}

export default function BusinessesPage() {
    const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadBusinesses = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/businesses`);
            if (res.ok) setBusinesses(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadBusinesses(); }, [loadBusinesses]);

    const handleSuspend = async (biz: BusinessItem) => {
        const newStatus = biz.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        setActionLoading(biz.id);
        try {
            const res = await fetchWithAuth(`${API}/superadmin/businesses/${biz.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setBusinesses(prev => prev.map(b => b.id === biz.id ? { ...b, status: newStatus } : b));
                toast.success(`${biz.name} → ${newStatus === 'SUSPENDED' ? 'Suspendido' : 'Reactivado'}`);
            }
        } catch { toast.error('Error al cambiar estado'); }
        finally { setActionLoading(null); }
    };

    const handleChangePlan = async (biz: BusinessItem, plan: string) => {
        setActionLoading(biz.id);
        try {
            const res = await fetchWithAuth(`${API}/superadmin/subscriptions/${biz.id}/plan`, {
                method: 'PATCH',
                body: JSON.stringify({ plan }),
            });
            if (res.ok) {
                setBusinesses(prev => prev.map(b =>
                    b.id === biz.id ? { ...b, subscription: { ...b.subscription!, plan, status: 'ACTIVE' } } : b
                ));
                toast.success(`${biz.name} → Plan ${plan}`);
            }
        } catch { toast.error('Error al cambiar plan'); }
        finally { setActionLoading(null); }
    };

    const filtered = businesses
        .filter(b => filterStatus === 'ALL' || b.status === filterStatus)
        .filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.slug.includes(search.toLowerCase()));

    const statusCounts = {
        ALL: businesses.length,
        ACTIVE: businesses.filter(b => b.status === 'ACTIVE').length,
        ONBOARDING: businesses.filter(b => b.status === 'ONBOARDING').length,
        SUSPENDED: businesses.filter(b => b.status === 'SUSPENDED').length,
    };

    return (
        <>
            <Header
                title="Gestión de Negocios"
                subtitle={`${businesses.length} negocios registrados en la plataforma`}
            />
            <div className={styles.content}>
                {/* Filter Tabs + Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div className={styles.feedbackTabs}>
                        {(['ALL', 'ACTIVE', 'ONBOARDING', 'SUSPENDED'] as const).map(s => (
                            <span
                                key={s}
                                className={`${styles.feedbackTab} ${filterStatus === s ? styles.feedbackTabActive : ''}`}
                                onClick={() => setFilterStatus(s)}
                            >
                                {s === 'ALL' ? 'Todos' : s === 'ACTIVE' ? '🟢 Activos' : s === 'ONBOARDING' ? '🟡 Onboarding' : '🔴 Suspendidos'}
                                <span className={styles.tabCount}> {statusCounts[s]}</span>
                            </span>
                        ))}
                    </div>
                    <input
                        type="search"
                        placeholder="Buscar negocio..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                            color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', width: 240, minHeight: '44px'
                        }}
                    />
                </div>

                {/* Businesses List */}
                <div className={styles.panel}>
                    <div className={styles.feedbackList}>
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando negocios...</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No se encontraron negocios</div>
                        ) : filtered.map((biz) => (
                            <div key={biz.id} className={styles.feedbackItem}>
                                <div className={styles.feedbackIcon}>
                                    <span style={{ fontSize: '1.4rem' }}>
                                        {biz.status === 'ACTIVE' ? '🟢' : biz.status === 'SUSPENDED' ? '🔴' : '🟡'}
                                    </span>
                                </div>
                                <div className={styles.feedbackBody}>
                                    <div className={styles.feedbackTitle}>{biz.name}</div>
                                    <div className={styles.feedbackMeta}>
                                        <span className={styles.feedbackBusiness}>/{biz.slug}</span>
                                        <span className={styles.feedbackTime}>{timeAgo(biz.createdAt)}</span>
                                        {biz._count && (
                                            <span className={styles.feedbackBusiness}>
                                                📅 {biz._count.bookings} · 👥 {biz._count.members} · 💼 {biz._count.services}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexShrink: 0 }}>
                                    {/* Plan Selector */}
                                    <select
                                        value={biz.subscription?.plan || 'FREE'}
                                        onChange={(e) => handleChangePlan(biz, e.target.value)}
                                        disabled={actionLoading === biz.id}
                                        style={{
                                            padding: '4px 12px', borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                                            color: planColors[biz.subscription?.plan || 'FREE'], minHeight: '44px',
                                            fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer',
                                        }}
                                    >
                                        <option value="FREE">FREE</option>
                                        <option value="STARTER">STARTER</option>
                                        <option value="PRO">PRO</option>
                                        <option value="BUSINESS">BUSINESS</option>
                                    </select>
                                    {/* Suspend/Reactivate Button */}
                                    <button
                                        onClick={() => handleSuspend(biz)}
                                        disabled={actionLoading === biz.id}
                                        style={{
                                            padding: '4px 16px', borderRadius: 'var(--radius-sm)',
                                            minHeight: '44px', border: '1px solid',
                                            borderColor: biz.status === 'SUSPENDED' ? '#10b981' : '#ef4444',
                                            background: biz.status === 'SUSPENDED' ? '#10b98115' : '#ef444415',
                                            color: biz.status === 'SUSPENDED' ? '#10b981' : '#ef4444',
                                            fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer',
                                            opacity: actionLoading === biz.id ? 0.5 : 1,
                                        }}
                                    >
                                        {biz.status === 'SUSPENDED' ? '✅ Reactivar' : '🚫 Suspender'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
