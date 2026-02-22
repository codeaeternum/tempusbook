'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ---- Types ----
interface PlatformOverview {
    totalBusinesses: number;
    activeBusinesses: number;
    totalUsers: number;
    totalBookings: number;
    featureFlags: { enabled: number; total: number };
    activeAds: number;
    planDistribution: { plan: string; count: number }[];
}

interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    environment: string;
    targetPlans: string[];
    targetCategories: string[];
}

interface BusinessItem {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
    subscription?: { plan: string; status: string; trialEndsAt?: string };
    _count?: { bookings: number; members: number; services: number };
}

interface AuditEntry {
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
}

// ---- Config Maps ----
const planColors: Record<string, string> = {
    FREE: '#94a3b8', STARTER: '#60a5fa', PRO: '#a78bfa', BUSINESS: '#f59e0b',
};

const statusIcons: Record<string, string> = {
    ACTIVE: '🟢', ONBOARDING: '🟡', SUSPENDED: '🔴',
};

const auditIcons: Record<string, string> = {
    TOGGLE_FLAG: '🔀', CREATE_AD: '📢', RESOLVE_FEEDBACK: '✅', SUSPEND_BUSINESS: '🚫',
    CREATE_FLAG: '🚩', TOGGLE_AD: '📣',
};

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Ahora';
    if (diffSec < 3600) return `Hace ${Math.floor(diffSec / 60)}m`;
    if (diffSec < 86400) return `Hace ${Math.floor(diffSec / 3600)}h`;
    return `Hace ${Math.floor(diffSec / 86400)}d`;
}

export default function SuperAdminPage() {
    const [overview, setOverview] = useState<PlatformOverview | null>(null);
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
    const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [overviewRes, flagsRes, bizRes, auditRes] = await Promise.all([
                fetchWithAuth(`${API}/superadmin/overview`),
                fetchWithAuth(`${API}/superadmin/flags`),
                fetchWithAuth(`${API}/superadmin/businesses`),
                fetchWithAuth(`${API}/superadmin/audit-log`),
            ]);

            if (overviewRes.ok) setOverview(await overviewRes.json());
            if (flagsRes.ok) setFlags(await flagsRes.json());
            if (bizRes.ok) setBusinesses(await bizRes.json());
            if (auditRes.ok) setAuditLog(await auditRes.json());
        } catch (err) {
            console.error('SuperAdmin load error:', err);
            toast.error('Error cargando datos del Command Center');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Toggle a feature flag ON/OFF
    const handleToggleFlag = async (flag: FeatureFlag) => {
        setTogglingFlag(flag.id);
        try {
            const res = await fetchWithAuth(`${API}/superadmin/flags/${flag.id}/toggle`, {
                method: 'PATCH',
                body: JSON.stringify({ enabled: !flag.enabled }),
            });
            if (res.ok) {
                setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
                toast.success(`${flag.name} → ${!flag.enabled ? 'Activado' : 'Desactivado'}`);
            }
        } catch { toast.error('Error al cambiar flag'); }
        finally { setTogglingFlag(null); }
    };

    // ---- Derived stats ----
    const stats = overview ? [
        { label: 'Negocios', value: overview.totalBusinesses.toLocaleString(), icon: '🏢', change: `${overview.activeBusinesses} activos` },
        { label: 'Usuarios', value: overview.totalUsers.toLocaleString(), icon: '👤', change: 'Registrados' },
        { label: 'Reservas', value: overview.totalBookings.toLocaleString(), icon: '📅', change: 'Total histórico' },
        { label: 'Feature Flags', value: `${overview.featureFlags.enabled}/${overview.featureFlags.total}`, icon: '🚩', change: `${overview.featureFlags.enabled} activos` },
        { label: 'Ads Activos', value: overview.activeAds.toLocaleString(), icon: '📢', change: 'En plataforma' },
        { label: 'Planes', value: overview.planDistribution.reduce((a, b) => a + b.count, 0).toLocaleString(), icon: '💎', change: 'Suscripciones' },
    ] : [];

    const planDistribution = overview?.planDistribution?.map(p => ({
        ...p, color: planColors[p.plan] || '#94a3b8',
    })) || [];

    if (loading) {
        return (
            <>
                <Header title="Command Center" subtitle="Code Aeternum — Cargando..." />
                <div className={styles.content}>
                    <div className={styles.statsGrid}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={styles.statCard} style={{ opacity: 0.5, minHeight: 100 }}>
                                <div className={styles.statLabel}>Cargando...</div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                title="Command Center"
                subtitle="Code Aeternum — Panel de Administración de Plataforma"
            />

            <div className={styles.content}>
                {/* Platform Stats — REAL DATA */}
                <div className={styles.statsGrid}>
                    {stats.map((stat) => (
                        <div key={stat.label} className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <span className={styles.statLabel}>{stat.label}</span>
                                <span className={styles.statIcon}>{stat.icon}</span>
                            </div>
                            <span className={styles.statValue}>{stat.value}</span>
                            <span className={styles.statChange}>{stat.change}</span>
                        </div>
                    ))}
                </div>

                {/* Businesses Table — REAL DATA */}
                <div className={styles.panel} style={{ marginBottom: 'var(--space-6)' }}>
                    <div className={styles.panelHeader}>
                        <h3>🏢 Negocios Registrados</h3>
                        <span className={styles.panelBadge}>{businesses.length}</span>
                    </div>
                    <div className={styles.feedbackList}>
                        {businesses.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                                No hay negocios registrados aún. El primer negocio aparecerá aquí.
                            </div>
                        ) : businesses.map((biz) => (
                            <div key={biz.id} className={styles.feedbackItem}>
                                <div className={styles.feedbackIcon}>
                                    <span>{statusIcons[biz.status] || '⚪'}</span>
                                </div>
                                <div className={styles.feedbackBody}>
                                    <div className={styles.feedbackTitle}>{biz.name}</div>
                                    <div className={styles.feedbackMeta}>
                                        <span className={styles.feedbackBusiness}>/{biz.slug}</span>
                                        <span className={styles.feedbackTime}>{timeAgo(biz.createdAt)}</span>
                                        {biz._count && (
                                            <span className={styles.feedbackBusiness}>
                                                {biz._count.bookings} citas · {biz._count.members} staff · {biz._count.services} servicios
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.feedbackBadges}>
                                    <span
                                        className={styles.statusBadge}
                                        style={{
                                            color: planColors[biz.subscription?.plan || 'FREE'],
                                            background: `${planColors[biz.subscription?.plan || 'FREE']}15`,
                                        }}
                                    >
                                        {biz.subscription?.plan || 'FREE'}
                                    </span>
                                    <span
                                        className={styles.priorityBadge}
                                        style={{
                                            color: biz.status === 'ACTIVE' ? '#10b981' : biz.status === 'SUSPENDED' ? '#ef4444' : '#f59e0b',
                                            background: biz.status === 'ACTIVE' ? '#10b98115' : biz.status === 'SUSPENDED' ? '#ef444415' : '#f59e0b15',
                                        }}
                                    >
                                        {biz.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.mainGrid}>
                    {/* Feature Flags Panel — REAL DATA + INTERACTIVE TOGGLES */}
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h3>🚩 Feature Flags</h3>
                            <span className={styles.panelBadge}>
                                {flags.filter((f) => f.enabled).length}/{flags.length}
                            </span>
                        </div>
                        <div className={styles.flagsList}>
                            {flags.length === 0 ? (
                                <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                    No hay Feature Flags creados. Crea uno desde la API: <code>POST /superadmin/flags</code>
                                </div>
                            ) : flags.map((flag) => (
                                <div key={flag.id} className={styles.flagItem}>
                                    <div className={styles.flagInfo}>
                                        <div className={styles.flagName}>{flag.name}</div>
                                        <div className={styles.flagMeta}>
                                            <code className={styles.flagKey}>{flag.key}</code>
                                            <span className={`${styles.envBadge} ${styles[`env_${flag.environment}`]}`}>
                                                {flag.environment}
                                            </span>
                                            {flag.targetPlans.length > 0 && (
                                                <span className={styles.plansBadge}>
                                                    {flag.targetPlans.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className={`${styles.toggle} ${flag.enabled ? styles.toggleOn : ''}`}
                                        aria-label={`Toggle ${flag.name}`}
                                        onClick={() => handleToggleFlag(flag)}
                                        disabled={togglingFlag === flag.id}
                                        style={togglingFlag === flag.id ? { opacity: 0.5 } : {}}
                                    >
                                        <span className={styles.toggleKnob} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className={styles.rightColumn}>
                        {/* Plan Distribution — REAL DATA */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h3>📊 Distribución de Planes</h3>
                            </div>
                            <div className={styles.planChart}>
                                {planDistribution.length > 0 ? (
                                    <>
                                        <div className={styles.planBar}>
                                            {planDistribution.map((plan) => (
                                                <div
                                                    key={plan.plan}
                                                    className={styles.planSegment}
                                                    style={{
                                                        flex: plan.count || 0.1,
                                                        backgroundColor: plan.color,
                                                    }}
                                                    title={`${plan.plan}: ${plan.count}`}
                                                />
                                            ))}
                                        </div>
                                        <div className={styles.planLegend}>
                                            {planDistribution.map((plan) => (
                                                <div key={plan.plan} className={styles.legendItem}>
                                                    <span className={styles.legendDot} style={{ backgroundColor: plan.color }} />
                                                    <span className={styles.legendLabel}>{plan.plan}</span>
                                                    <span className={styles.legendCount}>{plan.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                        Sin datos de suscripciones
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit Log — REAL DATA */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h3>📋 Auditoría Reciente</h3>
                            </div>
                            <div className={styles.auditList}>
                                {auditLog.length === 0 ? (
                                    <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                                        Sin eventos de auditoría
                                    </div>
                                ) : auditLog.map((entry) => (
                                    <div key={entry.id} className={styles.auditItem}>
                                        <div className={styles.auditAction}>
                                            {auditIcons[entry.action] || '📝'}
                                            <span>{entry.action}</span>
                                        </div>
                                        <div className={styles.auditTarget}>{entry.targetType}: {entry.targetId?.substring(0, 8)}...</div>
                                        <div className={styles.auditTime}>{timeAgo(entry.createdAt)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
