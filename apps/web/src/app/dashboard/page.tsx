'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { TranslationKey } from '@/lib/i18n';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { useAuth, fetchWithAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';

// ---- KPI Data with 4-week sparkline trends ----
const KPI_DATA = [
    { key: 'total_revenue', value: '$48,250', change: '+12.3%', positive: true, icon: '💰', sparkline: [32, 38, 35, 41, 44, 48, 48], label: 'Ingresos del mes' },
    { key: 'total_bookings', value: '156', change: '+8%', positive: true, icon: '📅', sparkline: [28, 31, 29, 34, 36, 38, 39], label: 'Citas este mes' },
    { key: 'new_clients', value: '23', change: '+15%', positive: true, icon: '👥', sparkline: [4, 5, 3, 6, 7, 5, 6], label: 'Nuevos clientes' },
    { key: 'avg_ticket', value: '$309', change: '+5.2%', positive: true, icon: '🎫', sparkline: [280, 290, 295, 300, 305, 308, 309], label: 'Ticket promedio' },
];

// ---- Occupancy (today) ----
const HOURS = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const OCCUPANCY: Record<string, number> = { '09': 100, '10': 75, '11': 100, '12': 50, '13': 0, '14': 75, '15': 100, '16': 100, '17': 50, '18': 75, '19': 25, '20': 0 };

// ---- Today's appointments ----
const TODAY_APPOINTMENTS = [
    { id: 1, time: '09:00', client: 'María García', service: 'Corte + Barba', status: 'completed', avatar: '🟣', amount: 470 },
    { id: 2, time: '10:00', client: 'Juan Pérez', service: 'Corte Clásico', status: 'confirmed', avatar: '🔵', amount: 250 },
    { id: 3, time: '11:30', client: 'Ana López', service: 'Tratamiento Capilar', status: 'confirmed', avatar: '🟢', amount: 650 },
    { id: 4, time: '13:00', client: 'Carlos Ruiz', service: 'Barba Completa', status: 'in_progress', avatar: '🟠', amount: 220 },
    { id: 5, time: '14:30', client: 'Roberto Díaz', service: 'Corte Fade', status: 'pending', avatar: '🔴', amount: 300 },
    { id: 6, time: '16:00', client: 'Sofía Hernández', service: 'Coloración', status: 'pending', avatar: '🟡', amount: 650 },
    { id: 7, time: '17:30', client: 'Diego Morales', service: 'Keratina', status: 'pending', avatar: '🟤', amount: 890 },
];

// ---- Recent client activity (SYNERGY) ----
const RECENT_ACTIVITY = [
    { icon: '💰', text: 'María García pagó $470 — Corte + Barba', time: 'Hace 12 min', type: 'payment' },
    { icon: '📅', text: 'Diego Morales agendó cita para 17:30', time: 'Hace 25 min', type: 'booking' },
    { icon: '⭐', text: 'Ana López dejó reseña 5 estrellas', time: 'Hace 1h', type: 'review' },
    { icon: '🎁', text: 'Juan Pérez canjeó Corte Gratis (500 pts)', time: 'Hace 2h', type: 'loyalty' },
    { icon: '👤', text: 'Valentina López se registró como nueva clienta', time: 'Hace 3h', type: 'client' },
    { icon: '📦', text: 'Stock bajo: Aceite para Barba (9 unidades)', time: 'Hace 4h', type: 'inventory' },
];

// ---- Top services this month ----
const TOP_SERVICES = [
    { name: 'Corte Clásico', count: 42, revenue: 10500, pct: 100 },
    { name: 'Corte Fade', count: 35, revenue: 10500, pct: 83 },
    { name: 'Barba Completa', count: 28, revenue: 6160, pct: 67 },
    { name: 'Coloración', count: 15, revenue: 9750, pct: 36 },
    { name: 'Keratina', count: 12, revenue: 10680, pct: 29 },
];

function fmt(n: number) { return `$${n.toLocaleString('es-MX')}`; }

// ---- Sparkline SVG Component ----
function Sparkline({ data, color = 'var(--color-primary)' }: { data: number[]; color?: string }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 80; const h = 28;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={styles.sparkline}>
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
        </svg>
    );
}

// ---- Status Badge — clickable dropdown ----
const STATUSES = [
    { key: 'confirmed', label: 'Confirmar', icon: '✅' },
    { key: 'in_progress', label: 'Llegó', icon: '🏃' },
    { key: 'completed', label: 'Completada', icon: '✓' },
    { key: 'no_show', label: 'No Llegó', icon: '👻' },
];

function StatusBadge({ status, onChangeStatus }: { status: string; onChangeStatus?: (s: string) => void }) {
    const { t } = useLocale();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const map: Record<string, { cls: string; key: string }> = {
        pending: { cls: styles.badgeWarning, key: 'status_pending' },
        confirmed: { cls: styles.badgeSuccess, key: 'status_confirmed' },
        in_progress: { cls: styles.badgeInfo, key: 'status_in_progress' },
        completed: { cls: styles.badgePrimary, key: 'status_completed' },
        no_show: { cls: styles.badgeDanger, key: 'status_no_show' },
    };
    const { cls, key } = map[status] || map.pending;

    return (
        <div className={styles.statusWrapper} ref={ref}>
            <button className={`${styles.badge} ${cls} ${onChangeStatus ? styles.badgeClickable : ''}`} onClick={() => onChangeStatus && setOpen(!open)}>
                {t(key as TranslationKey)}
            </button>
            {open && onChangeStatus && (
                <div className={styles.statusDropdown}>
                    {STATUSES.filter(s => s.key !== status).map(s => (
                        <button key={s.key} className={styles.statusOption} onClick={() => { onChangeStatus(s.key); setOpen(false); }}>
                            <span>{s.icon}</span> {s.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const { t } = useLocale();
    const { token, dbUser, isLoading } = useAuth();
    const [showFab, setShowFab] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // Live State
    const [loadingData, setLoadingData] = useState(true);
    const [kpis, setKpis] = useState<any>(null);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [topServices, setTopServices] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        if (!isLoading && token && dbUser?.businessMembers?.length) {
            const businessId = dbUser.businessMembers[0].business.id;
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

            Promise.all([
                fetchWithAuth(`${API}/dashboard/stats/${businessId}`),
                fetchWithAuth(`${API}/dashboard/upcoming-bookings/${businessId}`)
            ])
                .then(async ([resStats, resBookings]) => {
                    const dataStats = resStats.ok ? await resStats.json() : null;
                    const dataBookings = resBookings.ok ? await resBookings.json() : [];

                    if (dataStats) {
                        setKpis({
                            total_revenue: dataStats.revenueToday || 0,
                            total_bookings: dataStats.bookingsCount || 0,
                            new_clients: dataStats.newClients || 0,
                            avg_ticket: dataStats.avgTicket || 0
                        });
                    }

                    const mappedAppointments = dataBookings.map((b: any) => {
                        const date = new Date(b.startTime);
                        const h = String(date.getHours()).padStart(2, '0');
                        const m = String(date.getMinutes()).padStart(2, '0');

                        return {
                            id: b.id,
                            time: `${h}:${m}`,
                            client: b.client ? `${b.client.firstName} ${b.client.lastName}`.trim() : 'Anónimo',
                            clientPhone: b.client?.phone || '',
                            service: b.service?.name || 'Servicio',
                            amount: b.service?.price || 0,
                            status: b.status.toLowerCase(),
                            avatar: b.client?.firstName ? b.client.firstName[0].toUpperCase() : '👤',
                            staff: b.staff?.user ? `${b.staff.user.firstName} ${b.staff.user.lastName}`.trim() : 'Sin asignar',
                            staffColor: '#6366f1'
                        };
                    });

                    setAppointments(mappedAppointments || []);
                    setTopServices([]); // TBD
                    setRecentActivity([]); // TBD
                    setLoadingData(false);
                })
                .catch(err => {
                    console.error('Failed to load real dashboard metrics', err);
                    setLoadingData(false);
                });
        } else if (!isLoading) {
            setLoadingData(false);
        }
    }, [isLoading, token, dbUser]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const updateApptStatus = async (id: string, status: string) => {
        const labels: Record<string, string> = { confirmed: 'Confirmada', in_progress: 'Llegó', completed: 'Completada', no_show: 'No Llegó' };

        try {
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
            const res = await fetchWithAuth(`${API}/bookings/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: status.toUpperCase() })
            });

            if (res.ok) {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
                const appt = appointments.find(a => a.id === id);
                showToast(`${labels[status] || status} — ${appt?.client}`);
            } else {
                showToast('Error al actualizar la cita');
            }
        } catch (err) {
            console.error('Failed to patch status', err);
            showToast('Error de red al actualizar la cita');
        }
    };

    if (isLoading || loadingData) {
        return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Cargando métricas...</div>;
    }

    const completedToday = appointments.filter(a => a.status === 'completed').length;
    const revenueToday = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + a.amount, 0);

    const LIVE_KPI_DATA = [
        { key: 'total_revenue', value: fmt(kpis?.total_revenue || 0), change: `Hoy`, positive: true, icon: '💰', sparkline: [0, 0, 0, 0, 0, 0, 0], label: 'Ingresos de Hoy' },
        { key: 'total_bookings', value: `${kpis?.total_bookings || 0}`, change: 'Hoy', positive: true, icon: '📅', sparkline: [0, 0, 0, 0, 0, 0, 0], label: 'Citas de Hoy' },
        { key: 'new_clients', value: `${kpis?.new_clients || 0}`, change: 'Mes', positive: true, icon: '👥', sparkline: [0, 0, 0, 0, 0, 0, 0], label: 'Nuevos clientes' },
        { key: 'avg_ticket', value: fmt(kpis?.avg_ticket || 0), change: 'Mes', positive: true, icon: '🎫', sparkline: [0, 0, 0, 0, 0, 0, 0], label: 'Ticket promedio' },
    ];

    const isNewUser = appointments.length === 0 && (kpis?.total_revenue === 0 && kpis?.total_bookings === 0);

    const openWhatsApp = (appt: any) => {
        if (!appt.clientPhone) return;
        const msg = `¡Hola ${appt.client}! 👋 Somos AeternaSuite.\n\nTe escribimos para recordarte tu cita de *${appt.service}* hoy a las *${appt.time}* con ${appt.staff}.\n\n¡Te esperamos! ✨`;
        const encodedMsg = encodeURIComponent(msg);
        let phone = appt.clientPhone.replace(/\D/g, '');
        // Default to Mexico code if 10 digits
        if (phone.length === 10) phone = `52${phone}`;
        window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
    };

    if (isNewUser) {
        return (
            <>
                <Header title={t('dashboard')} subtitle="Centro de Comando B2B" />
                <div className={styles.content}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginTop: '2rem' }}>
                        <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>👋</span>
                        <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)' }}>¡Te damos la bienvenida a AeternaSuite!</h2>
                        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '1rem auto' }}>
                            Tu negocio está configurado, pero aún no tiene datos suficientes para generar estadísticas. Empieza programando tu primera cita o explorando tus módulos.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                            <Link href="/dashboard/calendar" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                                📅 Agendar Primera Cita
                            </Link>
                            <Link href="/dashboard/settings/business" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                                ⚙️ Configurar Negocio
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title={t('dashboard')} subtitle={t('overview')} />
            <div className={styles.content}>
                {/* KPI Cards */}
                <div className={styles.kpiGrid}>
                    {LIVE_KPI_DATA.map(kpi => (
                        <div key={kpi.key} className={styles.kpiCard}>
                            <div className={styles.kpiTop}>
                                <span className={styles.kpiIcon}>{kpi.icon}</span>
                                <Sparkline data={kpi.sparkline} />
                            </div>
                            <div className={styles.kpiValue}>{kpi.value}</div>
                            <div className={styles.kpiBottom}>
                                <span className={styles.kpiLabel}>{kpi.label}</span>
                                <span className={`${styles.kpiChange} ${kpi.positive ? styles.positive : styles.negative}`}>
                                    {kpi.positive ? '↑' : '↓'} {kpi.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Today summary bar */}
                <div className={styles.todayBar}>
                    <div className={styles.todayLeft}>
                        <span className={styles.todayIcon}>📋</span>
                        <span>Hoy: <strong>{appointments.length} citas</strong> · {completedToday} completadas · {fmt(revenueToday)} cobrados</span>
                    </div>
                    <div className={styles.occupancyMini}>
                        {HOURS.map(h => (
                            <div key={h} className={styles.occBar} style={{ height: `${Math.max(4, (OCCUPANCY[h] || 0) / 100 * 24)}px`, background: OCCUPANCY[h] === 100 ? 'var(--color-error)' : OCCUPANCY[h] >= 75 ? 'var(--color-warning)' : OCCUPANCY[h] > 0 ? 'var(--color-success)' : 'var(--color-border)' }} title={`${h}:00 — ${OCCUPANCY[h]}%`} />
                        ))}
                    </div>
                </div>

                <div className={styles.mainGrid}>
                    {/* Left: Today's Appointments */}
                    <div className={styles.appointmentsCard}>
                        <div className={styles.cardHeader}>
                            <h3>📅 Citas de Hoy</h3>
                            <span className={styles.countBadge}>{appointments.length}</span>
                        </div>
                        <div className={styles.appointmentsList}>
                            {appointments.length === 0 ? (
                                <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    No hay citas agendadas para hoy.
                                </div>
                            ) : (
                                appointments.map(apt => (
                                    <div key={apt.id} className={styles.appointmentItem}>
                                        <div className={styles.aptTime}>{apt.time}</div>
                                        <div className={styles.aptDivider} />
                                        <div className={styles.aptInfo}>
                                            <div className={styles.aptClient}>
                                                <span className={styles.aptAvatar}>
                                                    {apt.avatar.startsWith('http') ? <img src={apt.avatar} width={40} height={40} style={{ borderRadius: '50%' }} /> : apt.avatar}
                                                </span>
                                                <div>
                                                    <div className={styles.aptName}>{apt.client}</div>
                                                    <div className={styles.aptService}>{apt.service} · {fmt(apt.amount)}</div>
                                                </div>
                                            </div>
                                            <StatusBadge status={apt.status} onChangeStatus={(s) => updateApptStatus(apt.id, s)} />
                                        </div>
                                        <div className={styles.apptCardBottom}>
                                            <div className={styles.apptDetails}>
                                                <span>📅 {apt.time}</span>
                                                <span>⚙️ {apt.service}</span>
                                                {apt.clientPhone && <span>📱 {apt.clientPhone}</span>}
                                            </div>
                                            <div className={styles.apptStaff}>
                                                <div className={styles.staffAvatar} style={{ background: apt.staffColor || '#ddd' }} />
                                                <span>{apt.staff}</span>
                                            </div>
                                            <div className={styles.apptActions}>
                                                {apt.status === 'confirmed' && (
                                                    <>
                                                        <button onClick={() => updateApptStatus(apt.id, 'in_progress')} className="btn btn-primary btn-sm">Marcar Llegada</button>
                                                        {apt.clientPhone && (
                                                            <button onClick={() => openWhatsApp(apt)} className="btn btn-outline btn-sm" style={{ borderColor: '#25D366', color: '#25D366' }}>
                                                                💬 Enviar WhatsApp
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {apt.status === 'in_progress' && (
                                                    <button onClick={() => updateApptStatus(apt.id, 'completed')} className="btn btn-success btn-sm">Finalizar Servicio</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className={styles.rightColumn}>
                        {/* Top Services */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideTitle}>🏆 Servicios Top</h4>
                            {topServices.length === 0 ? (
                                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No hay ventas completadas aún.</div>
                            ) : (
                                topServices.map(s => (
                                    <div key={s.name} className={styles.topService}>
                                        <div className={styles.topServiceHeader}>
                                            <span className={styles.topServiceName}>{s.name}</span>
                                            <span className={styles.topServiceCount}>{s.count}×</span>
                                        </div>
                                        <div className={styles.topServiceBarBg}>
                                            <div className={styles.topServiceBar} style={{ width: `${s.pct}%` }} />
                                        </div>
                                        <span className={styles.topServiceRevenue}>{fmt(s.revenue)}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Activity Feed */}
                        <div className={styles.sideCard}>
                            <h4 className={styles.sideTitle}>⚡ Actividad Reciente</h4>
                            <div className={styles.activityFeed}>
                                {recentActivity.length === 0 ? (
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No hay actividad reciente registrada en el sistema.</div>
                                ) : (
                                    recentActivity.map((a, i) => {
                                        // Formatear la hora bonita
                                        const d = new Date(a.time);
                                        const h = d.getHours() > 12 ? d.getHours() - 12 : d.getHours() === 0 ? 12 : d.getHours();
                                        const m = d.getMinutes().toString().padStart(2, '0');
                                        const ampm = d.getHours() >= 12 ? 'PM' : 'AM';

                                        return (
                                            <div key={i} className={styles.activityItem}>
                                                <span className={styles.activityIcon}>{a.icon}</span>
                                                <div className={styles.activityContent}>
                                                    <span className={styles.activityText}>{a.text}</span>
                                                    <span className={styles.activityTime}>{`${h}:${m} ${ampm}`}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div className={styles.fabContainer}>
                <button className={styles.fabMain} onClick={() => setShowFab(p => !p)} aria-label="Acciones rápidas">
                    {showFab ? '✕' : '⚡'}
                </button>
                {showFab && (
                    <div className={styles.fabMenu}>
                        <Link href="/dashboard/pos" className={styles.fabAction} onClick={() => setShowFab(false)}>
                            <span>🛒</span><span>Nueva Venta</span>
                        </Link>
                        <Link href="/dashboard/appointments" className={styles.fabAction} onClick={() => setShowFab(false)}>
                            <span>📅</span><span>Agendar Cita</span>
                        </Link>
                        <Link href="/dashboard/clients" className={styles.fabAction} onClick={() => setShowFab(false)}>
                            <span>👤</span><span>Nuevo Cliente</span>
                        </Link>
                        <Link href="/dashboard/inventory" className={styles.fabAction} onClick={() => setShowFab(false)}>
                            <span>📦</span><span>Inventario</span>
                        </Link>
                        <button className={styles.fabAction} onClick={() => { setShowFab(false); setToast('📷 Escáner QR próximamente'); setTimeout(() => setToast(null), 2500); }}>
                            <span>📷</span><span>Check-in QR</span>
                        </button>
                    </div>
                )}
            </div>

            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
}
