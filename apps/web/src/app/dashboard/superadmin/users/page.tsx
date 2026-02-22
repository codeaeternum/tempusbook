'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import styles from '../page.module.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface UserItem {
    id: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: string;
    avatarUrl: string | null;
    phone: string | null;
    createdAt: string;
    businessMembers: { role: string; business: { id: string; name: string; slug: string } }[];
    _count: { bookings: number };
}

const roleColors: Record<string, string> = {
    PLATFORM_ADMIN: '#ef4444',
    BUSINESS_OWNER: '#a78bfa',
    STAFF: '#60a5fa',
    CLIENT: '#94a3b8',
};

const roleLabels: Record<string, string> = {
    PLATFORM_ADMIN: '👑 Admin',
    BUSINESS_OWNER: '🏢 Dueño',
    STAFF: '👔 Staff',
    CLIENT: '👤 Cliente',
};

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${API}/superadmin/users`);
            if (res.ok) setUsers(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const filtered = users
        .filter(u => filterRole === 'ALL' || u.role === filterRole)
        .filter(u => {
            const name = `${u.firstName} ${u.lastName}`.toLowerCase();
            const q = search.toLowerCase();
            return name.includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
        });

    const roleCounts: Record<string, number> = {
        ALL: users.length,
        PLATFORM_ADMIN: users.filter(u => u.role === 'PLATFORM_ADMIN').length,
        BUSINESS_OWNER: users.filter(u => u.role === 'BUSINESS_OWNER').length,
        STAFF: users.filter(u => u.role === 'STAFF').length,
        CLIENT: users.filter(u => u.role === 'CLIENT').length,
    };

    return (
        <>
            <Header
                title="Gestión de Usuarios"
                subtitle={`${users.length} usuarios registrados en la plataforma`}
            />
            <div className={styles.content}>
                {/* Filter Tabs + Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <div className={styles.feedbackTabs}>
                        {(['ALL', 'PLATFORM_ADMIN', 'BUSINESS_OWNER', 'STAFF', 'CLIENT'] as const).map(r => (
                            <span
                                key={r}
                                className={`${styles.feedbackTab} ${filterRole === r ? styles.feedbackTabActive : ''}`}
                                onClick={() => setFilterRole(r)}
                            >
                                {r === 'ALL' ? 'Todos' : roleLabels[r]}
                                <span className={styles.tabCount}> {roleCounts[r]}</span>
                            </span>
                        ))}
                    </div>
                    <input
                        type="search"
                        placeholder="Buscar usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
                            color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', width: 240, minHeight: '44px',
                        }}
                    />
                </div>

                {/* Users Table */}
                <div className={styles.panel}>
                    <div className={styles.feedbackList}>
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando usuarios...</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No se encontraron usuarios</div>
                        ) : filtered.map((user) => (
                            <div key={user.id}>
                                <div
                                    className={styles.feedbackItem}
                                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.feedbackIcon}>
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt=""
                                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: `${roleColors[user.role]}20`,
                                                color: roleColors[user.role],
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 'var(--font-size-sm)',
                                            }}>
                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.feedbackBody}>
                                        <div className={styles.feedbackTitle}>
                                            {user.firstName} {user.lastName}
                                        </div>
                                        <div className={styles.feedbackMeta}>
                                            <span className={styles.feedbackBusiness}>{user.email || 'Sin email'}</span>
                                            {user.phone && <span className={styles.feedbackBusiness}>📱 {user.phone}</span>}
                                            <span className={styles.feedbackTime}>{timeAgo(user.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.feedbackBadges}>
                                        <span
                                            className={styles.statusBadge}
                                            style={{
                                                color: roleColors[user.role],
                                                background: `${roleColors[user.role]}15`,
                                            }}
                                        >
                                            {roleLabels[user.role] || user.role}
                                        </span>
                                        <span
                                            className={styles.priorityBadge}
                                            style={{ color: 'var(--color-text-tertiary)', background: 'var(--color-bg-hover)' }}
                                        >
                                            📅 {user._count.bookings} citas
                                        </span>
                                    </div>
                                </div>
                                {/* Expanded Details */}
                                {expandedUser === user.id && (
                                    <div style={{
                                        padding: 'var(--space-3) var(--space-5) var(--space-4)',
                                        paddingLeft: 'calc(var(--space-5) + 36px + var(--space-3))',
                                        background: 'var(--color-bg-hover)',
                                        borderBottom: '1px solid var(--color-border-light)',
                                        fontSize: 'var(--font-size-xs)',
                                        display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
                                    }}>
                                        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                            <div>
                                                <span style={{ color: 'var(--color-text-tertiary)' }}>ID: </span>
                                                <code style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{user.id}</code>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--color-text-tertiary)' }}>Registrado: </span>
                                                {new Date(user.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>
                                        {user.businessMembers.length > 0 && (
                                            <div>
                                                <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Negocios asociados:</span>
                                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4, flexWrap: 'wrap' }}>
                                                    {user.businessMembers.map((m, i) => (
                                                        <span key={i} style={{
                                                            padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                                                            background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                                                            fontWeight: 500, fontSize: 11
                                                        }}>
                                                            🏢 {m.business.name} ({m.role})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
