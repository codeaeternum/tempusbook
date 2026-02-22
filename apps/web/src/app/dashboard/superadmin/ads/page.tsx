'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from '../page.module.css';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface PlatformAd {
    id: string;
    title: string;
    body: string | null;
    imageUrl: string | null;
    linkUrl: string | null;
    placement: string;
    isActive: boolean;
    targetPlans: string[];
    targetCategories: string[];
    impressionCount: number;
    clickCount: number;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
}

const placementLabels: Record<string, string> = {
    DASHBOARD_BANNER: '📊 Dashboard Banner',
    SIDEBAR_WIDGET: '📌 Sidebar Widget',
    BOOKING_CONFIRMATION: '✅ Post-Booking',
    CALENDAR_INTERSTITIAL: '📅 Calendar',
};

export default function AdsPage() {
    const [ads, setAds] = useState<PlatformAd[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newAd, setNewAd] = useState({ title: '', body: '', imageUrl: '', linkUrl: '', placement: 'DASHBOARD_BANNER', targetPlans: 'FREE,STARTER' });

    const load = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/ads`);
            if (res.ok) setAds(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleToggle = async (ad: PlatformAd) => {
        setTogglingId(ad.id);
        try {
            const res = await fetchWithAuth(`${API}/superadmin/ads/${ad.id}/toggle`, {
                method: 'PATCH', body: JSON.stringify({ isActive: !ad.isActive }),
            });
            if (res.ok) {
                setAds(prev => prev.map(a => a.id === ad.id ? { ...a, isActive: !a.isActive } : a));
                toast.success(`${ad.title} → ${!ad.isActive ? 'Activo' : 'Pausado'}`);
            }
        } catch { toast.error('Error'); }
        finally { setTogglingId(null); }
    };

    const handleCreate = async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/ads`, {
                method: 'POST',
                body: JSON.stringify({
                    title: newAd.title, body: newAd.body || undefined,
                    imageUrl: newAd.imageUrl || undefined, linkUrl: newAd.linkUrl || undefined,
                    placement: newAd.placement,
                    targetPlans: newAd.targetPlans.split(',').map(s => s.trim()),
                }),
            });
            if (res.ok) {
                const created = await res.json();
                setAds(prev => [created, ...prev]);
                setShowCreate(false);
                setNewAd({ title: '', body: '', imageUrl: '', linkUrl: '', placement: 'DASHBOARD_BANNER', targetPlans: 'FREE,STARTER' });
                toast.success('Anuncio creado');
            }
        } catch { toast.error('Error al crear'); }
    };

    return (
        <>
            <Header title="Anuncios de Plataforma" subtitle={`${ads.filter(a => a.isActive).length} activos de ${ads.length} — Monetiza el tier Free/Starter`} />
            <div className={styles.content}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
                    <button onClick={() => setShowCreate(!showCreate)}
                        style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', color: 'white', fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer', minHeight: '44px' }}>
                        {showCreate ? '✕ Cancelar' : '+ Crear Anuncio'}
                    </button>
                </div>

                {showCreate && (
                    <div className={styles.panel} style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                            {[{ label: 'Título', key: 'title' as const, ph: 'Banner Q1 2026' },
                            { label: 'Texto', key: 'body' as const, ph: 'Texto del anuncio (opcional)' },
                            { label: 'URL Imagen', key: 'imageUrl' as const, ph: 'https://...' },
                            { label: 'URL Destino', key: 'linkUrl' as const, ph: 'https://...' }].map(f => (
                                <input key={f.key} placeholder={f.ph} value={newAd[f.key]} onChange={e => setNewAd({ ...newAd, [f.key]: e.target.value })}
                                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', minHeight: '44px' }} />
                            ))}
                            <select value={newAd.placement} onChange={e => setNewAd({ ...newAd, placement: e.target.value })}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', minHeight: '44px' }}>
                                <option value="DASHBOARD_BANNER">Dashboard Banner</option>
                                <option value="SIDEBAR_WIDGET">Sidebar Widget</option>
                                <option value="BOOKING_CONFIRMATION">Post-Booking</option>
                                <option value="CALENDAR_INTERSTITIAL">Calendar Interstitial</option>
                            </select>
                            <button onClick={handleCreate} disabled={!newAd.title}
                                style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', background: 'var(--color-success)', color: 'white', fontWeight: 600, fontSize: 'var(--font-size-sm)', cursor: 'pointer', opacity: !newAd.title ? 0.5 : 1, minHeight: '44px' }}>
                                ✅ Crear Anuncio
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.panel}>
                    <div className={styles.flagsList}>
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando...</div>
                        ) : ads.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                                No hay anuncios. Crea uno para monetizar businesses en plan Free/Starter.
                            </div>
                        ) : ads.map(ad => (
                            <div key={ad.id} className={styles.flagItem}>
                                <div className={styles.flagInfo}>
                                    <div className={styles.flagName}>{ad.title}</div>
                                    <div className={styles.flagMeta}>
                                        <span className={styles.flagKey}>{placementLabels[ad.placement] || ad.placement}</span>
                                        <span className={styles.plansBadge}>{ad.targetPlans.join(', ')}</span>
                                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>
                                            👁 {ad.impressionCount} impressions · 🖱 {ad.clickCount} clicks
                                        </span>
                                    </div>
                                </div>
                                <button className={`${styles.toggle} ${ad.isActive ? styles.toggleOn : ''}`}
                                    onClick={() => handleToggle(ad)} disabled={togglingId === ad.id}
                                    style={togglingId === ad.id ? { opacity: 0.5 } : {}}>
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
