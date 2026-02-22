'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from '../page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface PlatformConfig {
    totalBusinesses: number;
    activeBusinesses: number;
    totalUsers: number;
    totalBookings: number;
    featureFlags: { enabled: number; total: number };
    activeAds: number;
}

export default function ConfigPage() {
    const [overview, setOverview] = useState<PlatformConfig | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/overview`);
            if (res.ok) setOverview(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const configSections = [
        {
            title: '🏗️ Plataforma',
            items: [
                { label: 'Nombre de Plataforma', value: 'AeternaSuite', editable: false },
                { label: 'Dominio', value: 'aeternasuite.com', editable: false },
                { label: 'Versión', value: 'v0.1.0 (Early Development)', editable: false },
                { label: 'Ambiente', value: process.env.NODE_ENV || 'development', editable: false },
                { label: 'API URL', value: API, editable: false },
            ],
        },
        {
            title: '📊 Estado del Sistema',
            items: [
                { label: 'Negocios Registrados', value: overview ? `${overview.totalBusinesses} (${overview.activeBusinesses} activos)` : '…', editable: false },
                { label: 'Usuarios Totales', value: overview?.totalUsers?.toLocaleString() || '…', editable: false },
                { label: 'Reservas Históricas', value: overview?.totalBookings?.toLocaleString() || '…', editable: false },
                { label: 'Feature Flags', value: overview ? `${overview.featureFlags.enabled}/${overview.featureFlags.total} activos` : '…', editable: false },
                { label: 'Anuncios Activos', value: overview?.activeAds?.toLocaleString() || '…', editable: false },
            ],
        },
        {
            title: '💎 Planes Disponibles',
            items: [
                { label: 'Free', value: '$0/mes — Básico, con anuncios', editable: false },
                { label: 'Starter', value: '$299/mes — Core features', editable: false },
                { label: 'Pro', value: '$699/mes — Full features + analytics', editable: false },
                { label: 'Business', value: '$1,499/mes — Enterprise + soporte dedicado', editable: false },
            ],
        },
        {
            title: '🔐 Seguridad',
            items: [
                { label: 'Autenticación', value: 'Firebase Auth (JWT)', editable: false },
                { label: 'Role Guard', value: 'PLATFORM_ADMIN (en desarrollo)', editable: false },
                { label: 'Rate Limiting', value: 'Pendiente — por implementar', editable: false },
                { label: 'CSRF Protection', value: 'Pendiente — por implementar', editable: false },
            ],
        },
        {
            title: '🔗 Integraciones',
            items: [
                { label: 'Payment Gateway', value: 'MercadoPago (pendiente)', editable: false },
                { label: 'Email Service', value: 'Pendiente', editable: false },
                { label: 'Push Notifications', value: 'Firebase FCM (parcial)', editable: false },
                { label: 'WhatsApp', value: 'Twilio (pendiente)', editable: false },
                { label: 'Storage', value: 'S3/CloudStorage (pendiente)', editable: false },
            ],
        },
    ];

    return (
        <>
            <Header title="Configuración de Plataforma" subtitle="Parámetros del sistema — Solo lectura por ahora" />
            <div className={styles.content}>
                {loading ? (
                    <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando configuración...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {configSections.map(section => (
                            <div key={section.title} className={styles.panel}>
                                <div className={styles.panelHeader}>
                                    <h3>{section.title}</h3>
                                </div>
                                <div style={{ padding: 0 }}>
                                    {section.items.map((item, i) => (
                                        <div key={item.label} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: 'var(--space-3) var(--space-5)',
                                            borderBottom: i < section.items.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                                        }}>
                                            <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                                {item.label}
                                            </span>
                                            <span style={{
                                                fontSize: 'var(--font-size-sm)', color: 'var(--color-text)',
                                                fontFamily: 'var(--font-mono, monospace)',
                                                padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                                background: 'var(--color-bg-hover)',
                                            }}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
