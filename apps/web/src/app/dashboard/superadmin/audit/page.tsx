'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from '../page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface AuditEntry {
    id: string;
    actorId: string;
    action: string;
    targetType: string;
    targetId: string;
    details: Record<string, unknown>;
    ipAddress: string | null;
    createdAt: string;
}

const actionIcons: Record<string, string> = {
    TOGGLE_FLAG: '🔀', CREATE_FLAG: '🚩', CREATE_AD: '📢', TOGGLE_AD: '📣',
    SUSPEND_BUSINESS: '🚫', REACTIVATE_BUSINESS: '✅', CHANGE_PLAN: '💎',
    RESOLVE_FEEDBACK: '🗣️',
};

const actionColors: Record<string, string> = {
    SUSPEND_BUSINESS: '#ef4444', REACTIVATE_BUSINESS: '#10b981', CHANGE_PLAN: '#a78bfa',
    TOGGLE_FLAG: '#f59e0b', CREATE_FLAG: '#60a5fa', CREATE_AD: '#f59e0b',
};

export default function AuditPage() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAudit = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/audit-log`);
            if (res.ok) setEntries(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAudit(); }, [loadAudit]);

    return (
        <>
            <Header
                title="Registro de Auditoría"
                subtitle={`${entries.length} eventos registrados — Últimas 50 acciones del SuperAdmin`}
            />
            <div className={styles.content}>
                <div className={styles.panel}>
                    <div className={styles.auditList}>
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando...</div>
                        ) : entries.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                                Sin eventos de auditoría. Las acciones que realices aquí se registrarán automáticamente.
                            </div>
                        ) : entries.map((entry) => (
                            <div key={entry.id} className={styles.auditItem} style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)' }}>
                                <div className={styles.auditAction}>
                                    <span style={{ fontSize: '1.2rem' }}>{actionIcons[entry.action] || '📝'}</span>
                                    <span style={{ color: actionColors[entry.action] || 'var(--color-text)', fontWeight: 600 }}>
                                        {entry.action}
                                    </span>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                    <div className={styles.auditTarget} style={{ overflow: 'visible', whiteSpace: 'normal' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>{entry.targetType}</span>
                                        {' → '}
                                        <code style={{ fontSize: 10 }}>{entry.targetId.substring(0, 12)}...</code>
                                    </div>
                                    {entry.details && Object.keys(entry.details).length > 0 && (
                                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                            {Object.entries(entry.details).map(([k, v]) => (
                                                <span key={k} style={{ marginRight: 12 }}>
                                                    {k}: <strong>{String(v)}</strong>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.auditTime}>
                                    {new Date(entry.createdAt).toLocaleString('es-MX', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
