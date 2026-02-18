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
    status: 'active' | 'inactive' | 'vip' | 'blocked';
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

function phoneToDigits(phone: string): string {
    return phone.replace(/[^\d]/g, '');
}

function getWhatsAppUrl(phone: string, name?: string): string {
    const digits = phoneToDigits(phone);
    const text = name ? encodeURIComponent(`Hola ${name}, `) : '';
    return `https://wa.me/${digits}${text ? `?text=${text}` : ''}`;
}

function getCallUrl(phone: string): string {
    return `tel:${phoneToDigits(phone)}`;
}

function getEmailUrl(email: string): string {
    return `mailto:${email}`;
}

// ---- Component ----
type FilterStatus = 'all' | 'active' | 'inactive' | 'vip' | 'blocked';

interface ClientForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive' | 'vip' | 'blocked';
    notes: string;
}

const EMPTY_FORM: ClientForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
    notes: '',
};

export default function ClientsPage() {
    const { t, locale } = useLocale();
    const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterStatus>('all');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [form, setForm] = useState<ClientForm>(EMPTY_FORM);

    // Toast
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
    };

    // Confirmation dialog
    const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);

    const filtered = useMemo(() => {
        let list = clients;

        // Status filter
        if (filter !== 'all') {
            list = list.filter(c => c.status === filter);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q)
            );
        }

        return list;
    }, [search, filter, clients]);

    const stats = useMemo(() => {
        const total = clients.length;
        const active = clients.filter(c => c.status === 'active' || c.status === 'vip').length;
        const vip = clients.filter(c => c.status === 'vip').length;
        const blocked = clients.filter(c => c.status === 'blocked').length;
        const revenue = clients.reduce((s, c) => s + c.totalSpent, 0);
        return { total, active, vip, blocked, revenue };
    }, [clients]);

    const openCreateModal = () => {
        setEditingClient(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setForm({
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            status: client.status,
            notes: client.notes,
        });
        setShowModal(true);
    };

    const handleSave = () => {
        if (editingClient) {
            setClients(prev => prev.map(c =>
                c.id === editingClient.id ? { ...c, ...form } : c
            ));
        } else {
            const newClient: Client = {
                id: Date.now().toString(),
                ...form,
                clientSince: new Date(),
                totalVisits: 0,
                totalSpent: 0,
                lastVisit: null,
                visits: [],
            };
            setClients(prev => [...prev, newClient]);
        }
        setShowModal(false);
        setEditingClient(null);
        setForm(EMPTY_FORM);
    };

    const updateField = (field: keyof ClientForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const blockClient = (clientId: string) => {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                const newStatus = c.status === 'blocked' ? 'active' : 'blocked';
                showToast(newStatus === 'blocked' ? t('client_blocked') : t('client_unblocked'));
                return { ...c, status: newStatus } as Client;
            }
            return c;
        }));
        setSelectedClient(null);
    };

    const deleteClient = (clientId: string) => {
        setConfirm({
            message: t('confirm_delete_client'),
            action: () => {
                setClients(prev => prev.filter(c => c.id !== clientId));
                setSelectedClient(null);
                showToast(t('client_deleted'));
                setConfirm(null);
            },
        });
    };

    return (
        <>
            <Header
                title={t('clients')}
                subtitle={`${stats.total} ${t('total_clients')}`}
                actions={
                    <button className="btn btn-primary" onClick={openCreateModal}>
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
                            <div className={styles.statValue}>{stats.total}</div>
                            <div className={styles.statLabel}>{t('total_clients')}</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.green}`}>✓</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.active}</div>
                            <div className={styles.statLabel}>{t('active')}</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.amber}`}>⭐</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.vip}</div>
                            <div className={styles.statLabel}>VIP</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.blue}`}>💰</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{formatCurrency(stats.revenue)}</div>
                            <div className={styles.statLabel}>{t('total_revenue')}</div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            className={styles.searchInput}
                            placeholder={t('search_clients')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        {(['all', 'active', 'vip', 'inactive', 'blocked'] as FilterStatus[]).map(f => (
                            <button
                                key={f}
                                className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''} ${f === 'blocked' ? styles.filterBtnBlocked : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'blocked' ? `🚫 ${t('blocked')}` : f === 'all' ? t('all') : t(f)}
                                {f === 'blocked' && stats.blocked > 0 && ` (${stats.blocked})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className={`card ${styles.tableCard} ${styles.desktopOnly}`}>
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
                                        <td>
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
                                        <td>
                                            <span className={`${styles.statusBadge} ${client.status === 'active' ? styles.statusActive :
                                                client.status === 'vip' ? styles.statusVip :
                                                    client.status === 'blocked' ? styles.statusBlocked :
                                                        styles.statusInactive
                                                }`}>
                                                <span className={styles.statusDot} />
                                                {t(client.status as any)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.contactCell}>
                                                <span>{client.phone}</span>
                                                <div className={styles.contactActions}>
                                                    <a
                                                        href={getWhatsAppUrl(client.phone, client.firstName)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`${styles.contactBtn} ${styles.whatsapp}`}
                                                        title="WhatsApp"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                    </a>
                                                    <a
                                                        href={getCallUrl(client.phone)}
                                                        className={`${styles.contactBtn} ${styles.call}`}
                                                        title={t('call')}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                                                    </a>
                                                    <a
                                                        href={getEmailUrl(client.email)}
                                                        className={`${styles.contactBtn} ${styles.email}`}
                                                        title="Email"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.visitCount}>{client.totalVisits}</span>
                                        </td>
                                        <td>
                                            <span className={styles.spentAmount}>{formatCurrency(client.totalSpent)}</span>
                                        </td>
                                        <td>
                                            {formatDate(client.lastVisit, locale)}
                                        </td>
                                        <td>
                                            <div className={styles.tableActions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                                                >
                                                    {t('view_profile')}
                                                </button>
                                                <button
                                                    className={`${styles.actionBtnIcon} ${client.status === 'blocked' ? styles.unblockBtn : styles.blockBtn}`}
                                                    title={client.status === 'blocked' ? t('unblock_client') : t('block_client')}
                                                    onClick={(e) => { e.stopPropagation(); blockClient(client.id); }}
                                                >
                                                    {client.status === 'blocked' ? '✅' : '🚫'}
                                                </button>
                                                <button
                                                    className={`${styles.actionBtnIcon} ${styles.deleteBtn}`}
                                                    title={t('delete_client')}
                                                    onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.tableFooter}>
                        <span>{t('showing_results')}: {filtered.length} {t('of')} {clients.length}</span>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className={styles.mobileOnly}>
                    {filtered.map(client => (
                        <div
                            key={client.id}
                            className={`card ${styles.mobileCard}`}
                            onClick={() => setSelectedClient(client)}
                        >
                            <div className={styles.mobileCardHeader}>
                                <div className={styles.avatar}>
                                    {getInitials(client.firstName, client.lastName)}
                                </div>
                                <div className={styles.mobileCardInfo}>
                                    <div className={styles.clientName}>
                                        {client.firstName} {client.lastName}
                                    </div>
                                    <div className={styles.clientEmail}>{client.email}</div>
                                </div>
                                <span className={`${styles.statusBadge} ${client.status === 'active' ? styles.statusActive :
                                    client.status === 'vip' ? styles.statusVip :
                                        client.status === 'blocked' ? styles.statusBlocked :
                                            styles.statusInactive
                                    }`}>
                                    <span className={styles.statusDot} />
                                    {t(client.status as any)}
                                </span>
                            </div>
                            <div className={styles.mobileCardStats}>
                                <div className={styles.mobileStatItem}>
                                    <span className={styles.mobileStatLabel}>{t('total_visits')}</span>
                                    <span className={styles.mobileStatValue}>{client.totalVisits}</span>
                                </div>
                                <div className={styles.mobileStatItem}>
                                    <span className={styles.mobileStatLabel}>{t('total_spent')}</span>
                                    <span className={`${styles.mobileStatValue} ${styles.spentAmount}`}>{formatCurrency(client.totalSpent)}</span>
                                </div>
                                <div className={styles.mobileStatItem}>
                                    <span className={styles.mobileStatLabel}>{t('last_visit')}</span>
                                    <span className={styles.mobileStatValue}>{formatDate(client.lastVisit, locale)}</span>
                                </div>
                            </div>
                            <div className={styles.mobileCardActions}>
                                <a
                                    href={getWhatsAppUrl(client.phone, client.firstName)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.mobileActionBtn} ${styles.whatsappBtn}`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                </a>
                                <a
                                    href={getCallUrl(client.phone)}
                                    className={`${styles.mobileActionBtn} ${styles.callBtn}`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                                </a>
                                <a
                                    href={getEmailUrl(client.email)}
                                    className={`${styles.mobileActionBtn} ${styles.emailBtn}`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                </a>
                                <button
                                    className={styles.mobileEditBtn}
                                    onClick={(e) => { e.stopPropagation(); openEditModal(client); }}
                                >
                                    ✏️
                                </button>
                                <button
                                    className={`${styles.mobileEditBtn} ${client.status === 'blocked' ? styles.unblockBtn : styles.blockBtn}`}
                                    onClick={(e) => { e.stopPropagation(); blockClient(client.id); }}
                                >
                                    {client.status === 'blocked' ? '✅' : '🚫'}
                                </button>
                                <button
                                    className={`${styles.mobileEditBtn} ${styles.deleteBtn}`}
                                    onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className={styles.mobileFooter}>
                        {t('showing_results')}: {filtered.length} {t('of')} {clients.length}
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
                                        selectedClient.status === 'blocked' ? styles.statusBlocked :
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
                                    <div className={styles.profileStatLabel}>{t('average')}</div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className={styles.contactInfo}>
                                <div className={styles.contactRow}>
                                    <span className={styles.contactRowIcon}>📧</span>
                                    <a href={getEmailUrl(selectedClient.email)} className={styles.contactLink}>
                                        {selectedClient.email}
                                    </a>
                                </div>
                                <div className={styles.contactRow}>
                                    <span className={styles.contactRowIcon}>📱</span>
                                    <a href={getCallUrl(selectedClient.phone)} className={styles.contactLink}>
                                        {selectedClient.phone}
                                    </a>
                                </div>
                            </div>

                            {/* Quick contact buttons */}
                            <div className={styles.quickContactRow}>
                                <a
                                    href={getWhatsAppUrl(selectedClient.phone, selectedClient.firstName)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.quickContactBtn} ${styles.whatsappBtn}`}
                                >
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    WhatsApp
                                </a>
                                <a
                                    href={getCallUrl(selectedClient.phone)}
                                    className={`${styles.quickContactBtn} ${styles.callBtn}`}
                                >
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                                    {t('call')}
                                </a>
                                <a
                                    href={getEmailUrl(selectedClient.email)}
                                    className={`${styles.quickContactBtn} ${styles.emailBtn}`}
                                >
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    Email
                                </a>
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
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setSelectedClient(null); openEditModal(selectedClient); }}
                            >
                                ✏️ {t('edit_client')}
                            </button>
                            <button className="btn btn-primary">{t('schedule_appointment')}</button>
                            <button
                                className={`${styles.panelBlockBtn} ${selectedClient.status === 'blocked' ? styles.unblockBtn : ''}`}
                                onClick={() => blockClient(selectedClient.id)}
                            >
                                {selectedClient.status === 'blocked' ? `✅ ${t('unblock_client')}` : `🚫 ${t('block_client')}`}
                            </button>
                            <button
                                className={styles.panelDeleteBtn}
                                onClick={() => deleteClient(selectedClient.id)}
                            >
                                🗑️ {t('delete_client')}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowModal(false)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingClient ? t('edit_client') : t('add_client')}
                            </h2>
                            <button className={styles.panelCloseBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('first_name')}</label>
                                    <input
                                        className={styles.formInput}
                                        value={form.firstName}
                                        onChange={e => updateField('firstName', e.target.value)}
                                        placeholder="María"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('last_name')}</label>
                                    <input
                                        className={styles.formInput}
                                        value={form.lastName}
                                        onChange={e => updateField('lastName', e.target.value)}
                                        placeholder="García"
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('email_address')}</label>
                                    <input
                                        className={styles.formInput}
                                        type="email"
                                        value={form.email}
                                        onChange={e => updateField('email', e.target.value)}
                                        placeholder="maria@email.com"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('phone_number')}</label>
                                    <input
                                        className={styles.formInput}
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => updateField('phone', e.target.value)}
                                        placeholder="+52 55 1234 5678"
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('status')}</label>
                                <div className={styles.statusSelect}>
                                    {(['active', 'vip', 'inactive', 'blocked'] as const).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={`${styles.statusOption} ${form.status === s ? styles.statusOptionActive : ''} ${s === 'active' ? styles.statusOptGreen :
                                                s === 'vip' ? styles.statusOptAmber : s === 'blocked' ? styles.statusOptRed : styles.statusOptGray
                                                }`}
                                            onClick={() => updateField('status', s)}
                                        >
                                            {t(s)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('notes')}</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={form.notes}
                                    onChange={e => updateField('notes', e.target.value)}
                                    rows={3}
                                    placeholder={t('notes_placeholder')}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                {t('cancel')}
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {editingClient ? t('save_changes') : t('add_client')}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Confirmation Dialog */}
            {confirm && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setConfirm(null)} />
                    <div className={styles.confirmDialog}>
                        <div className={styles.confirmIcon}>⚠️</div>
                        <p className={styles.confirmMessage}>{confirm.message}</p>
                        <div className={styles.confirmActions}>
                            <button className="btn btn-secondary" onClick={() => setConfirm(null)}>
                                {t('cancel')}
                            </button>
                            <button className={styles.confirmDeleteBtn} onClick={confirm.action}>
                                🗑️ {t('delete')}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Toast */}
            <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
                {toast.message}
            </div>
        </>
    );
}
