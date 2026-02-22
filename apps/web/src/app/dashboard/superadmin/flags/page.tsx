'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from '../page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    environment: string;
    targetPlans: string[];
    targetCategories: string[];
    createdAt: string;
}

export default function FlagsPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '', environment: 'production', targetPlans: '' });

    const loadFlags = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/flags`);
            if (res.ok) setFlags(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadFlags(); }, [loadFlags]);

    const handleToggle = async (flag: FeatureFlag) => {
        setTogglingId(flag.id);
        try {
            const res = await fetchWithAuth(`${API}/superadmin/flags/${flag.id}/toggle`, {
                method: 'PATCH',
                body: JSON.stringify({ enabled: !flag.enabled }),
            });
            if (res.ok) setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
        } catch { /* */ }
        finally { setTogglingId(null); }
    };

    const handleCreate = async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/flags`, {
                method: 'POST',
                body: JSON.stringify({
                    key: newFlag.key,
                    name: newFlag.name,
                    description: newFlag.description || undefined,
                    environment: newFlag.environment,
                    targetPlans: newFlag.targetPlans ? newFlag.targetPlans.split(',').map(s => s.trim()) : [],
                }),
            });
            if (res.ok) {
                const created = await res.json();
                setFlags(prev => [created, ...prev]);
                setShowCreate(false);
                setNewFlag({ key: '', name: '', description: '', environment: 'production', targetPlans: '' });
            }
        } catch { /* */ }
    };

    return (
        <>
            <Header
                title="Feature Flags"
                subtitle={`${flags.filter(f => f.enabled).length} de ${flags.length} activos — Controla módulos Beta remotamente`}
            />
            <div className={styles.content}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        style={{
                            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary)', color: 'white', fontWeight: 600,
                            fontSize: 'var(--font-size-sm)', cursor: 'pointer', minHeight: '44px'
                        }}
                    >
                        {showCreate ? '✕ Cancelar' : '+ Crear Flag'}
                    </button>
                </div>

                {/* Create Form */}
                {showCreate && (
                    <div className={styles.panel} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            <input placeholder="Key (e.g. module_dental_charts)" value={newFlag.key} onChange={e => setNewFlag({ ...newFlag, key: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', minHeight: '44px' }} />
                            <input placeholder="Nombre visible" value={newFlag.name} onChange={e => setNewFlag({ ...newFlag, name: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', minHeight: '44px' }} />
                            <input placeholder="Descripción (opcional)" value={newFlag.description} onChange={e => setNewFlag({ ...newFlag, description: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', minHeight: '44px' }} />
                            <select value={newFlag.environment} onChange={e => setNewFlag({ ...newFlag, environment: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', minHeight: '44px' }}>
                                <option value="production">Production</option>
                                <option value="staging">Staging</option>
                                <option value="development">Development</option>
                            </select>
                            <input placeholder="Planes (PRO, BUSINESS)" value={newFlag.targetPlans} onChange={e => setNewFlag({ ...newFlag, targetPlans: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', minHeight: '44px' }} />
                            <button onClick={handleCreate} disabled={!newFlag.key || !newFlag.name}
                                style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', background: 'var(--color-success)', color: 'white', fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer', opacity: (!newFlag.key || !newFlag.name) ? 0.5 : 1, minHeight: '44px' }}>
                                ✅ Crear Feature Flag
                            </button>
                        </div>
                    </div>
                )}

                {/* Flags List */}
                <div className={styles.panel}>
                    <div className={styles.flagsList}>
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando...</div>
                        ) : flags.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                                No hay Feature Flags. Crea el primero para controlar módulos remotamente.
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
                                            <span className={styles.plansBadge}>{flag.targetPlans.join(', ')}</span>
                                        )}
                                        {flag.description && (
                                            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>{flag.description}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className={`${styles.toggle} ${flag.enabled ? styles.toggleOn : ''}`}
                                    onClick={() => handleToggle(flag)}
                                    disabled={togglingId === flag.id}
                                    style={togglingId === flag.id ? { opacity: 0.5 } : {}}
                                >
                                    <span className={styles.toggleKnob} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
