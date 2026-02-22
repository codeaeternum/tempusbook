'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from '../page.module.css';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface FeedbackItem {
    id: string;
    type: string;
    priority: string;
    status: string;
    title: string;
    description: string;
    businessId: string | null;
    adminNotes: string | null;
    resolvedAt: string | null;
    createdAt: string;
}

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
    BUG_REPORT: { icon: '🐛', label: 'Bug', color: '#ef4444' },
    FEATURE_REQUEST: { icon: '💡', label: 'Feature', color: '#8b5cf6' },
    GENERAL: { icon: '💬', label: 'General', color: '#64748b' },
    COMPLAINT: { icon: '⚠️', label: 'Queja', color: '#f59e0b' },
    PRAISE: { icon: '⭐', label: 'Elogio', color: '#10b981' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    CRITICAL: { label: 'Crítico', color: '#dc2626' },
    HIGH: { label: 'Alto', color: '#f97316' },
    MEDIUM: { label: 'Medio', color: '#eab308' },
    LOW: { label: 'Bajo', color: '#94a3b8' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    OPEN: { label: 'Abierto', color: '#3b82f6' },
    IN_PROGRESS: { label: 'En Curso', color: '#f59e0b' },
    RESOLVED: { label: 'Resuelto', color: '#10b981' },
    WONT_FIX: { label: 'No Fix', color: '#94a3b8' },
    DUPLICATE: { label: 'Duplicado', color: '#6b7280' },
};

export default function FeedbackPage() {
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('ALL');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [newItem, setNewItem] = useState({ title: '', description: '', type: 'BUG_REPORT', priority: 'MEDIUM' });

    const load = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/feedback`);
            if (res.ok) setItems(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/feedback`, {
                method: 'POST', body: JSON.stringify(newItem),
            });
            if (res.ok) {
                const created = await res.json();
                setItems(prev => [created, ...prev]);
                setShowCreate(false);
                setNewItem({ title: '', description: '', type: 'BUG_REPORT', priority: 'MEDIUM' });
                toast.success('Feedback registrado');
            }
        } catch { toast.error('Error al crear'); }
    };

    const handleStatusChange = async (item: FeedbackItem, newStatus: string) => {
        setUpdatingId(item.id);
        try {
            const res = await fetchWithAuth(`${API}/superadmin/feedback/${item.id}/status`, {
                method: 'PATCH', body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
                toast.success(`${item.title.substring(0, 30)}... → ${statusConfig[newStatus]?.label}`);
            }
        } catch { toast.error('Error'); }
        finally { setUpdatingId(null); }
    };

    const filtered = items.filter(i => filterType === 'ALL' || i.type === filterType);

    const typeCounts: Record<string, number> = {
        ALL: items.length,
        BUG_REPORT: items.filter(i => i.type === 'BUG_REPORT').length,
        FEATURE_REQUEST: items.filter(i => i.type === 'FEATURE_REQUEST').length,
        GENERAL: items.filter(i => i.type === 'GENERAL').length,
        COMPLAINT: items.filter(i => i.type === 'COMPLAINT').length,
        PRAISE: items.filter(i => i.type === 'PRAISE').length,
    };

    const openCount = items.filter(i => i.status === 'OPEN').length;

    return (
        <>
            <Header title="Feedback & Reportes" subtitle={`${items.length} total — ${openCount} abiertos`} />
            <div className={styles.content}>
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div className={styles.feedbackTabs}>
                        {(['ALL', 'BUG_REPORT', 'FEATURE_REQUEST', 'COMPLAINT', 'GENERAL', 'PRAISE'] as const).map(t => (
                            <span key={t} className={`${styles.feedbackTab} ${filterType === t ? styles.feedbackTabActive : ''}`}
                                onClick={() => setFilterType(t)}>
                                {t === 'ALL' ? 'Todos' : `${typeConfig[t]?.icon} ${typeConfig[t]?.label}`}
                                <span className={styles.tabCount}> {typeCounts[t]}</span>
                            </span>
                        ))}
                    </div>
                    <button onClick={() => setShowCreate(!showCreate)}
                        style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {showCreate ? '✕' : '+ Registrar'}
                    </button>
                </div>

                {/* Create Form */}
                {showCreate && (
                    <div className={styles.panel} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            <input placeholder="Título" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1' }} />
                            <textarea placeholder="Descripción detallada..." value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                rows={3} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', gridColumn: '1 / -1', resize: 'vertical' }} />
                            <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>
                                <option value="BUG_REPORT">🐛 Bug Report</option>
                                <option value="FEATURE_REQUEST">💡 Feature Request</option>
                                <option value="GENERAL">💬 General</option>
                                <option value="COMPLAINT">⚠️ Queja</option>
                                <option value="PRAISE">⭐ Elogio</option>
                            </select>
                            <select value={newItem.priority} onChange={e => setNewItem({ ...newItem, priority: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>
                                <option value="CRITICAL">🔴 Crítico</option>
                                <option value="HIGH">🟠 Alto</option>
                                <option value="MEDIUM">🟡 Medio</option>
                                <option value="LOW">⚪ Bajo</option>
                            </select>
                            <button onClick={handleCreate} disabled={!newItem.title || !newItem.description}
                                style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', background: 'var(--color-success)', color: 'white', fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer', gridColumn: '1 / -1', opacity: (!newItem.title || !newItem.description) ? 0.5 : 1 }}>
                                ✅ Registrar Feedback
                            </button>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className={styles.panel}>
                    <div className={styles.feedbackList}>
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando...</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                                Sin reportes de feedback. Los negocios enviarán aquí sus bugs, requests y comentarios.
                            </div>
                        ) : filtered.map(item => {
                            const type = typeConfig[item.type] || typeConfig.GENERAL;
                            const priority = priorityConfig[item.priority] || priorityConfig.MEDIUM;
                            const status = statusConfig[item.status] || statusConfig.OPEN;
                            return (
                                <div key={item.id}>
                                    <div className={styles.feedbackItem} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} style={{ cursor: 'pointer' }}>
                                        <div className={styles.feedbackIcon}><span>{type.icon}</span></div>
                                        <div className={styles.feedbackBody}>
                                            <div className={styles.feedbackTitle}>{item.title}</div>
                                            <div className={styles.feedbackMeta}>
                                                <span style={{ color: type.color, fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>{type.label}</span>
                                                <span className={styles.feedbackTime}>
                                                    {new Date(item.createdAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.feedbackBadges}>
                                            <span className={styles.priorityBadge} style={{ color: priority.color, background: `${priority.color}15` }}>
                                                {priority.label}
                                            </span>
                                            <select value={item.status} onClick={e => e.stopPropagation()}
                                                onChange={e => handleStatusChange(item, e.target.value)}
                                                disabled={updatingId === item.id}
                                                style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: `${status.color}10`, color: status.color, fontWeight: 600, fontSize: 10, cursor: 'pointer' }}>
                                                <option value="OPEN">Abierto</option>
                                                <option value="IN_PROGRESS">En Curso</option>
                                                <option value="RESOLVED">Resuelto</option>
                                                <option value="WONT_FIX">No Fix</option>
                                                <option value="DUPLICATE">Duplicado</option>
                                            </select>
                                        </div>
                                    </div>
                                    {expandedId === item.id && (
                                        <div style={{ padding: 'var(--space-3) var(--space-5)', paddingLeft: 'calc(var(--space-5) + 1.2rem + var(--space-3))', background: 'var(--color-bg-hover)', borderBottom: '1px solid var(--color-border-light)', fontSize: 'var(--font-size-xs)' }}>
                                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', whiteSpace: 'pre-wrap' }}>{item.description}</p>
                                            {item.adminNotes && (
                                                <p style={{ color: 'var(--color-primary)', fontWeight: 500 }}>📝 Notas admin: {item.adminNotes}</p>
                                            )}
                                            <div style={{ color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>
                                                ID: <code style={{ fontSize: 10 }}>{item.id}</code>
                                                {item.resolvedAt && ` · Resuelto: ${new Date(item.resolvedAt).toLocaleDateString('es-MX')}`}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
