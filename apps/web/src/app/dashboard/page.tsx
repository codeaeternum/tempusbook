'use client';

import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './page.module.css';

// Sample data for demo
const mockStats = [
    { key: 'total_bookings', value: '156', change: '+12%', positive: true, icon: '📅' },
    { key: 'total_revenue', value: '$4,280', change: '+8%', positive: true, icon: '💰' },
    { key: 'new_clients', value: '23', change: '+15%', positive: true, icon: '👥' },
    { key: 'avg_rating', value: '4.8', change: '+0.2', positive: true, icon: '⭐' },
];

const mockAppointments = [
    { id: 1, time: '09:00', client: 'María García', service: 'Corte + Barba', status: 'confirmed', avatar: '🟣' },
    { id: 2, time: '10:00', client: 'Juan Pérez', service: 'Corte Clásico', status: 'pending', avatar: '🔵' },
    { id: 3, time: '11:30', client: 'Ana López', service: 'Tratamiento Capilar', status: 'confirmed', avatar: '🟢' },
    { id: 4, time: '13:00', client: 'Carlos Ruiz', service: 'Barba', status: 'in_progress', avatar: '🟠' },
    { id: 5, time: '14:30', client: 'Roberto Díaz', service: 'Corte Fade', status: 'pending', avatar: '🔴' },
];

function StatusBadge({ status }: { status: string }) {
    const { t } = useLocale();
    const statusMap: Record<string, { class: string; key: string }> = {
        pending: { class: 'badge-warning', key: 'status_pending' },
        confirmed: { class: 'badge-success', key: 'status_confirmed' },
        in_progress: { class: 'badge-info', key: 'status_in_progress' },
        completed: { class: 'badge-primary', key: 'status_completed' },
        cancelled: { class: 'badge-error', key: 'status_cancelled' },
        no_show: { class: 'badge-error', key: 'status_no_show' },
    };
    const { class: cls, key } = statusMap[status] || statusMap.pending;
    return <span className={`badge ${cls}`}>{t(key as any)}</span>;
}

export default function DashboardPage() {
    const { t } = useLocale();

    return (
        <>
            <Header
                title={t('dashboard')}
                subtitle={t('overview')}
                actions={
                    <button className="btn btn-primary btn-sm">
                        + {t('schedule_appointment')}
                    </button>
                }
            />

            <div className={styles.content}>
                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    {mockStats.map((stat) => (
                        <div key={stat.key} className="card card-stat">
                            <div className={styles.statHeader}>
                                <span className="stat-label">{t(stat.key as any)}</span>
                                <span className={styles.statIcon}>{stat.icon}</span>
                            </div>
                            <span className="stat-value">{stat.value}</span>
                            <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                                {stat.positive ? '↑' : '↓'} {stat.change} {t('this_month')}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className={styles.mainGrid}>
                    {/* Today's Appointments */}
                    <div className={`card ${styles.appointmentsCard}`}>
                        <div className={styles.cardHeader}>
                            <h3 className="heading-4">{t('appointments')} — {t('today')}</h3>
                            <span className={styles.countBadge}>{mockAppointments.length}</span>
                        </div>

                        <div className={styles.appointmentsList}>
                            {mockAppointments.map((apt) => (
                                <div key={apt.id} className={styles.appointmentItem}>
                                    <div className={styles.aptTime}>{apt.time}</div>
                                    <div className={styles.aptDivider}></div>
                                    <div className={styles.aptInfo}>
                                        <div className={styles.aptClient}>
                                            <span className={styles.aptAvatar}>{apt.avatar}</span>
                                            <div>
                                                <div className={styles.aptName}>{apt.client}</div>
                                                <div className={styles.aptService}>{apt.service}</div>
                                            </div>
                                        </div>
                                        <StatusBadge status={apt.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.quickActions}>
                        <div className={`card ${styles.actionCard}`}>
                            <span className={styles.actionIcon}>📅</span>
                            <span className={styles.actionLabel}>{t('calendar')}</span>
                        </div>
                        <div className={`card ${styles.actionCard}`}>
                            <span className={styles.actionIcon}>👥</span>
                            <span className={styles.actionLabel}>{t('clients')}</span>
                        </div>
                        <div className={`card ${styles.actionCard}`}>
                            <span className={styles.actionIcon}>💼</span>
                            <span className={styles.actionLabel}>{t('services')}</span>
                        </div>
                        <div className={`card ${styles.actionCard}`}>
                            <span className={styles.actionIcon}>📈</span>
                            <span className={styles.actionLabel}>{t('reports')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
