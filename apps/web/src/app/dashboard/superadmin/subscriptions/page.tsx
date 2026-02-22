'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from '../page.module.css';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Subscription {
    id: string;
    plan: string;
    status: string;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
    business: { id: string; name: string; slug: string; status: string };
}

const planColors: Record<string, string> = {
    FREE: '#94a3b8', STARTER: '#60a5fa', PRO: '#a78bfa', BUSINESS: '#f59e0b',
};
const statusColors: Record<string, string> = {
    ACTIVE: '#10b981', TRIAL: '#f59e0b', PAST_DUE: '#ef4444', CANCELLED: '#94a3b8',
};

export default function SubscriptionsPage() {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterPlan, setFilterPlan] = useState('ALL');
    const [changingId, setChangingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/subscriptions`);
            if (res.ok) setSubs(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleChangePlan = async (sub: Subscription, plan: string) => {
        setChangingId(sub.id);
        try {
            const res = await fetchWithAuth(`${API}/superadmin/subscriptions/${sub.business.id}/plan`, {
                method: 'PATCH', body: JSON.stringify({ plan }),
            });
            if (res.ok) {
                setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, plan, status: 'ACTIVE' } : s));
                toast.success(`${sub.business.name} → ${plan}`);
            }
        } catch { toast.error('Error al cambiar plan'); }
        finally { setChangingId(null); }
    };

    const filtered = subs.filter(s => filterPlan === 'ALL' || s.plan === filterPlan);

    const planCounts: Record<string, number> = {
        ALL: subs.length, FREE: subs.filter(s => s.plan === 'FREE').length,
        STARTER: subs.filter(s => s.plan === 'STARTER').length,
        PRO: subs.filter(s => s.plan === 'PRO').length,
        BUSINESS: subs.filter(s => s.plan === 'BUSINESS').length,
    };

    // MRR calculation
    const planPrices: Record<string, number> = { FREE: 0, STARTER: 299, PRO: 699, BUSINESS: 1499 };
    const mrr = subs.reduce((sum, s) => sum + (planPrices[s.plan] || 0), 0);

    return (
        <>
            <Header title="Suscripciones" subtitle={`${subs.length} suscripciones — MRR: $${mrr.toLocaleString()} MXN`} />
            <div className={styles.content}>
                {/* Revenue Stats */}
                <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-4)' }}>
                    {(['FREE', 'STARTER', 'PRO', 'BUSINESS'] as const).map(plan => (
                        <div key={plan} className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <span className={styles.statLabel} style={{ color: planColors[plan] }}>{plan}</span>
                                <span className={styles.statIcon}>💎</span>
                            </div>
                            <span className={styles.statValue}>{planCounts[plan]}</span>
                            <span className={styles.statChange}>${planPrices[plan]}/mes por negocio</span>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                    <div className={styles.feedbackTabs}>
                        {(['ALL', 'FREE', 'STARTER', 'PRO', 'BUSINESS'] as const).map(p => (
                            <span key={p} className={`${styles.feedbackTab} ${filterPlan === p ? styles.feedbackTabActive : ''}`}
                                onClick={() => setFilterPlan(p)}>
                                {p === 'ALL' ? 'Todos' : p} <span className={styles.tabCount}>{planCounts[p]}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className={styles.panel}>
                    <div className={styles.feedbackList}>
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando...</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Sin suscripciones</div>
                        ) : filtered.map(sub => (
                            <div key={sub.id} className={styles.feedbackItem}>
                                <div className={styles.feedbackIcon}>
                                    <span style={{ fontSize: '1.4rem' }}>💎</span>
                                </div>
                                <div className={styles.feedbackBody}>
                                    <div className={styles.feedbackTitle}>{sub.business.name}</div>
                                    <div className={styles.feedbackMeta}>
                                        <span className={styles.feedbackBusiness}>/{sub.business.slug}</span>
                                        {sub.trialEndsAt && (
                                            <span style={{ color: '#f59e0b', fontSize: 'var(--font-size-xs)' }}>
                                                Trial hasta {new Date(sub.trialEndsAt).toLocaleDateString('es-MX')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                    <span className={styles.statusBadge} style={{ color: statusColors[sub.status], background: `${statusColors[sub.status]}15` }}>
                                        {sub.status}
                                    </span>
                                    <select value={sub.plan} onChange={e => handleChangePlan(sub, e.target.value)}
                                        disabled={changingId === sub.id}
                                        style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', color: planColors[sub.plan], fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer', minHeight: '44px', minWidth: '110px' }}>
                                        <option value="FREE">FREE</option>
                                        <option value="STARTER">STARTER</option>
                                        <option value="PRO">PRO</option>
                                        <option value="BUSINESS">BUSINESS</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
