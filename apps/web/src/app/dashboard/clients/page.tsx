'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './page.module.css';

// ---- Types ----
interface ClientVisit {
    id: string;
    date: Date;
    service: string;
    staff: string;
    amount: number;
    status: 'completed' | 'cancelled' | 'no_show';
}

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive' | 'vip';
    clientSince: Date;
    totalVisits: number;
    totalSpent: number;
    lastVisit: Date | null;
    notes: string;
    visits: ClientVisit[];
}

// ---- Mock Data ----
const MOCK_CLIENTS: Client[] = [
    {
        id: '1',
        firstName: 'María',
        lastName: 'García',
        email: 'maria.garcia@email.com',
        phone: '+52 55 1234 5678',
        status: 'vip',
        clientSince: new Date(2024, 5, 15),
        totalVisits: 32,
        totalSpent: 8640,
        lastVisit: new Date(2026, 1, 16),
        notes: 'Prefiere corte con Carlos. Alérgica a tintes con amoníaco. Cliente frecuente — siempre agenda los sábados.',
        visits: [
            { id: 'v1', date: new Date(2026, 1, 16), service: 'Corte + Barba', staff: 'Carlos', amount: 350, status: 'completed' },
            { id: 'v2', date: new Date(2026, 1, 2), service: 'Tratamiento Capilar', staff: 'Ana', amount: 520, status: 'completed' },
            { id: 'v3', date: new Date(2026, 0, 18), service: 'Corte + Barba', staff: 'Carlos', amount: 350, status: 'completed' },
            { id: 'v4', date: new Date(2025, 11, 28), service: 'Coloración', staff: 'Ana', amount: 780, status: 'completed' },
            { id: 'v5', date: new Date(2025, 11, 14), service: 'Corte', staff: 'Miguel', amount: 200, status: 'completed' },
        ],
    },
    {
        id: '2',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+52 55 9876 5432',
        status: 'active',
        clientSince: new Date(2025, 2, 10),
        totalVisits: 12,
        totalSpent: 3240,
        lastVisit: new Date(2026, 1, 18),
        notes: 'Prefiere corte clásico. Siempre llega 10 min antes.',
        visits: [
            { id: 'v6', date: new Date(2026, 1, 18), service: 'Corte Clásico', staff: 'Miguel', amount: 250, status: 'completed' },
            { id: 'v7', date: new Date(2026, 1, 4), service: 'Corte Clásico', staff: 'Miguel', amount: 250, status: 'completed' },
            { id: 'v8', date: new Date(2026, 0, 20), service: 'Corte + Barba', staff: 'Carlos', amount: 350, status: 'completed' },
        ],
    },
    {
        id: '3',
        firstName: 'Ana',
        lastName: 'López',
        email: 'ana.lopez@email.com',
        phone: '+52 33 5555 1234',
        status: 'active',
        clientSince: new Date(2025, 7, 22),
        totalVisits: 8,
        totalSpent: 4120,
        lastVisit: new Date(2026, 1, 15),
        notes: 'Interesada en tratamientos capilares mensuales.',
        visits: [
            { id: 'v9', date: new Date(2026, 1, 15), service: 'Tratamiento Capilar', staff: 'Ana', amount: 520, status: 'completed' },
            { id: 'v10', date: new Date(2026, 0, 28), service: 'Coloración + Corte', staff: 'Ana', amount: 950, status: 'completed' },
        ],
    },
    {
        id: '4',
        firstName: 'Carlos',
        lastName: 'Ruiz',
        email: 'carlos.ruiz@email.com',
        phone: '+52 81 4444 9999',
        status: 'active',
        clientSince: new Date(2025, 10, 5),
        totalVisits: 5,
        totalSpent: 1500,
        lastVisit: new Date(2026, 1, 12),
        notes: '',
        visits: [
            { id: 'v11', date: new Date(2026, 1, 12), service: 'Barba', staff: 'Carlos', amount: 180, status: 'completed' },
            { id: 'v12', date: new Date(2026, 0, 29), service: 'Corte Fade', staff: 'Miguel', amount: 300, status: 'completed' },
        ],
    },
    {
        id: '5',
        firstName: 'Roberto',
        lastName: 'Díaz',
        email: 'roberto.diaz@email.com',
        phone: '+52 55 7777 3333',
        status: 'vip',
        clientSince: new Date(2024, 1, 20),
        totalVisits: 48,
        totalSpent: 14400,
        lastVisit: new Date(2026, 1, 17),
        notes: 'VIP — cliente fundador. Descuento del 10% permanente. Siempre solicita a Miguel.',
        visits: [
            { id: 'v13', date: new Date(2026, 1, 17), service: 'Corte Fade + Barba', staff: 'Miguel', amount: 400, status: 'completed' },
            { id: 'v14', date: new Date(2026, 1, 3), service: 'Corte Fade', staff: 'Miguel', amount: 280, status: 'completed' },
            { id: 'v15', date: new Date(2026, 0, 20), service: 'Corte Fade + Barba', staff: 'Miguel', amount: 400, status: 'completed' },
            { id: 'v16', date: new Date(2025, 11, 30), service: 'Coloración', staff: 'Ana', amount: 780, status: 'completed' },
        ],
    },
    {
        id: '6',
        firstName: 'Laura',
        lastName: 'Méndez',
        email: 'laura.mendez@email.com',
        phone: '+52 55 2222 8888',
        status: 'active',
        clientSince: new Date(2025, 9, 1),
        totalVisits: 6,
        totalSpent: 2100,
        lastVisit: new Date(2026, 1, 10),
        notes: 'Prefiere citas por la tarde.',
        visits: [
            { id: 'v17', date: new Date(2026, 1, 10), service: 'Corte + Cejas', staff: 'Ana', amount: 320, status: 'completed' },
            { id: 'v18', date: new Date(2026, 0, 15), service: 'Tratamiento Capilar', staff: 'Ana', amount: 520, status: 'completed' },
        ],
    },
    {
        id: '7',
        firstName: 'Pedro',
        lastName: 'Sánchez',
        email: 'pedro.sanchez@email.com',
        phone: '+52 33 6666 4444',
        status: 'inactive',
        clientSince: new Date(2025, 4, 12),
        totalVisits: 3,
        totalSpent: 750,
        lastVisit: new Date(2025, 9, 20),
        notes: 'No ha regresado desde octubre. Enviar recordatorio.',
        visits: [
            { id: 'v19', date: new Date(2025, 9, 20), service: 'Coloración', staff: 'Ana', amount: 350, status: 'completed' },
            { id: 'v20', date: new Date(2025, 7, 5), service: 'Corte', staff: 'Miguel', amount: 200, status: 'completed' },
        ],
    },
    {
        id: '8',
        firstName: 'Sofía',
        lastName: 'Torres',
        email: 'sofia.torres@email.com',
        phone: '+52 55 1111 5555',
        status: 'active',
        clientSince: new Date(2026, 0, 8),
        totalVisits: 2,
        totalSpent: 600,
        lastVisit: new Date(2026, 1, 14),
        notes: 'Nueva clienta referida por María García.',
        visits: [
            { id: 'v21', date: new Date(2026, 1, 14), service: 'Corte + Cejas', staff: 'Ana', amount: 320, status: 'completed' },
            { id: 'v22', date: new Date(2026, 0, 8), service: 'Corte', staff: 'Carlos', amount: 280, status: 'completed' },
        ],
    },
];

// ---- Helpers ----
function getInitials(firstName: string, lastName: string) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function formatDate(date: Date | null, locale: string): string {
    if (!date) return '—';
    return date.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-MX')}`;
}

// ---- Component ----
type FilterStatus = 'all' | 'active' | 'inactive' | 'vip';

export default function ClientsPage() {
    const { t, locale } = useLocale();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const filtered = useMemo(() => {
        let list = MOCK_CLIENTS;

        // Status filter
        if (filter !== 'all') {
            list = list.filter(c => c.status === filter);
        }

        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q)
            );
        }

        return list;
    }, [search, filter]);

    // Summary stats
    const stats = useMemo(() => ({
        total: MOCK_CLIENTS.length,
        active: MOCK_CLIENTS.filter(c => c.status === 'active').length,
        vip: MOCK_CLIENTS.filter(c => c.status === 'vip').length,
        totalRevenue: MOCK_CLIENTS.reduce((sum, c) => sum + c.totalSpent, 0),
    }), []);

    return (
        <>
            <Header
                title={t('clients')}
                subtitle={`${stats.total} ${t('all_clients').toLowerCase()}`}
                actions={
                    <button className="btn btn-primary btn-sm">
                        + {t('add_client')}
                    </button>
                }
            />

            <div className={styles.content}>
                {/* Stats Row */}
                <div className={styles.statsRow}>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.purple}`}>👥</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.total}</span>
                            <span className={styles.statLabel}>{t('all_clients')}</span>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.green}`}>✓</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.active}</span>
                            <span className={styles.statLabel}>{t('active')}</span>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.amber}`}>⭐</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{stats.vip}</span>
                            <span className={styles.statLabel}>{t('vip')}</span>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.blue}`}>💰</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</span>
                            <span className={styles.statLabel}>{t('total_spent')}</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar: Search + Filters */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder={t('search_clients')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        {(['all', 'active', 'vip', 'inactive'] as FilterStatus[]).map(f => (
                            <button
                                key={f}
                                className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {t(f === 'all' ? 'all' : f as any)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className={`card ${styles.tableCard}`}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{t('client_name')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('contact')}</th>
                                    <th>{t('total_visits')}</th>
                                    <th>{t('total_spent')}</th>
                                    <th>{t('last_visit')}</th>
                                    <th>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(client => (
                                    <tr key={client.id} onClick={() => setSelectedClient(client)}>
                                        <td data-label={t('client_name')}>
                                            <div className={styles.clientCell}>
                                                <div className={styles.avatar}>
                                                    {getInitials(client.firstName, client.lastName)}
                                                </div>
                                                <div>
                                                    <div className={styles.clientName}>
                                                        {client.firstName} {client.lastName}
                                                    </div>
                                                    <div className={styles.clientEmail}>{client.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label={t('status')}>
                                            <span className={`${styles.statusBadge} ${client.status === 'active' ? styles.statusActive :
                                                    client.status === 'vip' ? styles.statusVip :
                                                        styles.statusInactive
                                                }`}>
                                                <span className={styles.statusDot} />
                                                {t(client.status as any)}
                                            </span>
                                        </td>
                                        <td data-label={t('contact')}>
                                            <div className={styles.contactCell}>
                                                <span>{client.phone}</span>
                                            </div>
                                        </td>
                                        <td data-label={t('total_visits')}>
                                            <span className={styles.visitCount}>{client.totalVisits}</span>
                                        </td>
                                        <td data-label={t('total_spent')}>
                                            <span className={styles.spentAmount}>{formatCurrency(client.totalSpent)}</span>
                                        </td>
                                        <td data-label={t('last_visit')}>
                                            {formatDate(client.lastVisit, locale)}
                                        </td>
                                        <td>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                                            >
                                                {t('view_profile')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.tableFooter}>
                        <span>{t('showing_results')}: {filtered.length} {t('of')} {MOCK_CLIENTS.length}</span>
                    </div>
                </div>
            </div>

            {/* Profile Slide-over Panel */}
            {selectedClient && (
                <>
                    <div className={styles.panelOverlay} onClick={() => setSelectedClient(null)} />
                    <div className={styles.profilePanel}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelTitle}>{t('client_details')}</span>
                            <button className={styles.panelCloseBtn} onClick={() => setSelectedClient(null)}>✕</button>
                        </div>

                        <div className={styles.panelBody}>
                            {/* Hero */}
                            <div className={styles.profileHero}>
                                <div className={styles.profileAvatar}>
                                    {getInitials(selectedClient.firstName, selectedClient.lastName)}
                                </div>
                                <div className={styles.profileName}>
                                    {selectedClient.firstName} {selectedClient.lastName}
                                </div>
                                <span className={`${styles.statusBadge} ${selectedClient.status === 'active' ? styles.statusActive :
                                        selectedClient.status === 'vip' ? styles.statusVip :
                                            styles.statusInactive
                                    }`}>
                                    <span className={styles.statusDot} />
                                    {t(selectedClient.status as any)}
                                </span>
                                <span className={styles.profileMeta}>
                                    {t('client_since')} {formatDate(selectedClient.clientSince, locale)}
                                </span>
                            </div>

                            {/* Mini stats */}
                            <div className={styles.profileStats}>
                                <div className={styles.profileStatBox}>
                                    <div className={styles.profileStatValue}>{selectedClient.totalVisits}</div>
                                    <div className={styles.profileStatLabel}>{t('total_visits')}</div>
                                </div>
                                <div className={styles.profileStatBox}>
                                    <div className={styles.profileStatValue}>{formatCurrency(selectedClient.totalSpent)}</div>
                                    <div className={styles.profileStatLabel}>{t('total_spent')}</div>
                                </div>
                                <div className={styles.profileStatBox}>
                                    <div className={styles.profileStatValue}>
                                        {selectedClient.totalVisits > 0
                                            ? formatCurrency(Math.round(selectedClient.totalSpent / selectedClient.totalVisits))
                                            : '$0'}
                                    </div>
                                    <div className={styles.profileStatLabel}>Promedio</div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className={styles.contactInfo}>
                                <div className={styles.contactRow}>
                                    <span className={styles.contactRowIcon}>📧</span>
                                    {selectedClient.email}
                                </div>
                                <div className={styles.contactRow}>
                                    <span className={styles.contactRowIcon}>📱</span>
                                    {selectedClient.phone}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedClient.notes && (
                                <div>
                                    <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text)' }}>
                                        {t('client_notes')}
                                    </h4>
                                    <div className={styles.notesArea}>
                                        {selectedClient.notes}
                                    </div>
                                </div>
                            )}

                            {/* Visit History */}
                            <div className={styles.historySection}>
                                <h4>{t('visit_history')}</h4>
                                <div className={styles.timeline}>
                                    {selectedClient.visits.map(visit => (
                                        <div key={visit.id} className={styles.timelineItem}>
                                            <div className={styles.timelineDot} />
                                            <div className={styles.timelineContent}>
                                                <div className={styles.timelineService}>{visit.service}</div>
                                                <div className={styles.timelineDate}>
                                                    {formatDate(visit.date, locale)} · {visit.staff}
                                                </div>
                                                <div className={styles.timelineAmount}>
                                                    {formatCurrency(visit.amount)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Panel Actions */}
                        <div className={styles.panelActions}>
                            <button className="btn btn-secondary">{t('reschedule')}</button>
                            <button className="btn btn-primary">{t('schedule_appointment')}</button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
