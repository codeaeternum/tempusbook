'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ---- Types ----
interface StaffSchedule {
    day: string;
    start: string;
    end: string;
    isOff: boolean;
}

interface StaffMember {
    id: string;
    firstName: string;
    lastName: string;
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    email: string;
    phone: string;
    avatarColor: string;
    specialties: string[];
    schedule: StaffSchedule[];
    isActive: boolean;
    totalBookings: number;
    completionRate: number;
    avgRating: number;
    revenueGenerated: number;
    joinedAt: Date;
}

type StaffForm = {
    firstName: string;
    lastName: string;
    role: StaffMember['role'];
    email: string;
    phone: string;
    specialtiesText: string;
    schedule: StaffSchedule[];
    isActive: boolean;
};

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const AVATAR_COLORS = ['hsl(262, 60%, 55%)', 'hsl(340, 60%, 55%)', 'hsl(160, 50%, 45%)', 'hsl(40, 55%, 50%)', 'hsl(210, 60%, 50%)', 'hsl(0, 55%, 50%)', 'hsl(280, 50%, 50%)'];
const DEFAULT_SCHEDULE = DAYS.map((d, i) => ({ day: d, start: '09:00', end: '18:00', isOff: i >= 5 }));

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
    OWNER: { label: 'Dueño', color: '#f59e0b' },
    ADMIN: { label: 'Admin', color: '#8b5cf6' },
    MANAGER: { label: 'Gerente', color: '#3b82f6' },
    EMPLOYEE: { label: 'Empleado', color: '#6b7280' },
};

const EMPTY_FORM: StaffForm = {
    firstName: '', lastName: '', role: 'EMPLOYEE', email: '', phone: '', specialtiesText: '', schedule: [...DEFAULT_SCHEDULE.map(s => ({ ...s }))], isActive: true,
};

// ---- Helpers ----
function getInitials(first: string, last: string): string { return `${first[0]}${last[0]}`.toUpperCase(); }
function formatCurrency(amount: number): string { return `$${amount.toLocaleString('es-MX')}`; }
function formatDate(date: Date): string { return date.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }); }

// ---- Component ----
type ViewMode = 'grid' | 'list';
type FilterRole = 'all' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export default function TeamPage() {
    const { t } = useLocale();
    const { activeBusinessId } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<FilterRole>('all');
    const [showInactive, setShowInactive] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
    const [toast, setToast] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    useEffect(() => {
        if (!activeBusinessId) { setIsLoading(false); return; }
        // Fetch Real Database Members via NextJS / NestJS Tunnel
        fetchWithAuth(`${API_URL}/api/v1/business-members/business/${activeBusinessId}`)
            .then(res => res.ok ? res.json() : [])
            .then((data: any[]) => {
                const mapped: StaffMember[] = data.map(m => ({
                    id: m.id,
                    firstName: m.user?.firstName || 'Staff',
                    lastName: m.user?.lastName || '',
                    role: m.role || 'EMPLOYEE',
                    email: m.user?.email || '',
                    phone: m.user?.phone || '',
                    avatarColor: m.user?.avatarUrl || m.color || '#3b82f6',
                    specialties: [], // Specialties are a Phase 2 visual feature
                    schedule: Array.isArray(m.schedule) && m.schedule.length === 7 ? m.schedule : DEFAULT_SCHEDULE,
                    isActive: m.status !== 'INACTIVE' && m.isActive,
                    totalBookings: 0,
                    completionRate: 100,
                    avgRating: 0,
                    revenueGenerated: 0,
                    joinedAt: new Date(m.createdAt)
                }));
                setStaff(mapped);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [activeBusinessId]);

    const filtered = useMemo(() => {
        return staff.filter(m => {
            const matchSearch = `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase());
            const matchRole = filterRole === 'all' || m.role === filterRole;
            const matchActive = showInactive || m.isActive;
            return matchSearch && matchRole && matchActive;
        });
    }, [staff, search, filterRole, showInactive]);

    const teamStats = useMemo(() => {
        const active = staff.filter(m => m.isActive);
        return {
            totalActive: active.length,
            totalBookings: staff.reduce((s, m) => s + m.totalBookings, 0),
            avgRating: active.length ? +(active.reduce((s, m) => s + m.avgRating, 0) / active.length).toFixed(1) : 0,
            totalRevenue: staff.reduce((s, m) => s + m.revenueGenerated, 0),
        };
    }, [staff]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, schedule: DEFAULT_SCHEDULE.map(s => ({ ...s })) });
        setModalOpen(true);
    };

    const openEdit = (member: StaffMember) => {
        setEditingId(member.id);
        setForm({
            firstName: member.firstName, lastName: member.lastName, role: member.role,
            email: member.email, phone: member.phone, specialtiesText: member.specialties.join(', '),
            schedule: member.schedule.map(s => ({ ...s })), isActive: member.isActive,
        });
        setSelectedMember(null);
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.firstName || !form.lastName || !form.email) return;
        const specialties = form.specialtiesText.split(',').map(s => s.trim()).filter(Boolean);

        try {
            if (editingId) {
                const res = await fetchWithAuth(`${API_URL}/api/v1/business-members/${editingId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        role: form.role,
                        isActive: form.isActive,
                    })
                });
                if (res.ok) {
                    setStaff(prev => prev.map(m => m.id === editingId ? {
                        ...m, firstName: form.firstName, lastName: form.lastName, role: form.role,
                        email: form.email, phone: form.phone, specialties, schedule: form.schedule, isActive: form.isActive,
                    } : m));
                    showToast('Miembro actualizado correctamente en BD');
                }
            } else {
                const payload = {
                    businessId: activeBusinessId,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    role: form.role,
                    isActive: form.isActive,
                    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
                };
                const res = await fetchWithAuth(`${API_URL}/api/v1/business-members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const created = await res.json();
                    const newMember: StaffMember = {
                        id: created.id, firstName: form.firstName, lastName: form.lastName, role: created.role,
                        email: form.email, phone: form.phone, specialties, schedule: form.schedule, isActive: created.isActive,
                        avatarColor: created.color || payload.color,
                        totalBookings: 0, completionRate: 100, avgRating: 0, revenueGenerated: 0, joinedAt: new Date(created.createdAt),
                    };
                    setStaff(prev => [...prev, newMember]);
                    showToast('Miembro creado y persistido en DB');
                }
            }
        } catch (e) {
            console.error('Save failed', e);
            showToast('Error de conexión a Servidor');
        } finally {
            setModalOpen(false);
        }
    };

    const toggleActive = async (id: string) => {
        const member = staff.find(m => m.id === id);
        if (!member) return;

        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/business-members/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !member.isActive })
            });

            if (res.ok) {
                setStaff(prev => prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
                showToast(`${member.firstName} ${!member.isActive ? 'activado' : 'desactivado'} en Base de Datos`);
            } else {
                showToast('Error al actualizar estado en BD');
            }
        } catch (e) {
            console.error('Failed to toggle active status', e);
            showToast('Error de conexión a Servidor');
        }
    };

    const deleteMember = async (id: string) => {
        const member = staff.find(m => m.id === id);
        if (!member) return;

        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/business-members/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setStaff(prev => prev.filter(m => m.id !== id));
                setSelectedMember(null);
                setConfirmDelete(null);
                showToast(`${member.firstName} ${member.lastName} eliminado de BD`);
            } else {
                showToast('Error al eliminar en BD');
            }
        } catch (e) {
            console.error('Failed to delete member', e);
            showToast('Error de conexión a Servidor');
        }
    };

    const updateScheduleDay = (index: number, field: 'start' | 'end' | 'isOff', value: string | boolean) => {
        setForm(prev => {
            const newSchedule = [...prev.schedule];
            newSchedule[index] = { ...newSchedule[index], [field]: value };
            return { ...prev, schedule: newSchedule };
        });
    };

    return (
        <>
            <Header title={t('team')} subtitle="Gestión de equipo, horarios y rendimiento" />

            <div className={styles.content}>
                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Cargando catálogo de Empleados...
                    </div>
                ) : (
                    <>
                        {/* Team Stats */}
                        <div className={styles.statsRow}>
                            <div className={styles.miniStat}><span className={styles.miniStatIcon}>👥</span><div><span className={styles.miniStatValue}>{teamStats.totalActive}</span><span className={styles.miniStatLabel}>Miembros activos</span></div></div>
                            <div className={styles.miniStat}><span className={styles.miniStatIcon}>📅</span><div><span className={styles.miniStatValue}>{teamStats.totalBookings.toLocaleString()}</span><span className={styles.miniStatLabel}>Total reservas</span></div></div>
                            <div className={styles.miniStat}><span className={styles.miniStatIcon}>⭐</span><div><span className={styles.miniStatValue}>{teamStats.avgRating}</span><span className={styles.miniStatLabel}>Calificación promedio</span></div></div>
                            <div className={styles.miniStat}><span className={styles.miniStatIcon}>💰</span><div><span className={styles.miniStatValue}>{formatCurrency(teamStats.totalRevenue)}</span><span className={styles.miniStatLabel}>Ingresos generados</span></div></div>
                        </div>

                        {/* Toolbar */}
                        <div className={styles.toolbar}>
                            <div className={styles.searchGroup}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input className={styles.searchInput} type="text" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                            <div className={styles.filters}>
                                {(['all', 'OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as FilterRole[]).map(role => (
                                    <button key={role} className={`${styles.filterBtn} ${filterRole === role ? styles.filterActive : ''}`} onClick={() => setFilterRole(role)}>
                                        {role === 'all' ? 'Todos' : ROLE_CONFIG[role].label}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.toolbarRight}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={showInactive} onChange={() => setShowInactive(!showInactive)} />
                                    Inactivos
                                </label>
                                <div className={styles.viewToggle}>
                                    <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`} onClick={() => setViewMode('grid')}>▦</button>
                                    <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`} onClick={() => setViewMode('list')}>☰</button>
                                </div>
                                <button className={styles.addBtn} onClick={openCreate}>+</button>
                            </div>
                        </div>

                        {/* Grid / List */}
                        {viewMode === 'grid' ? (
                            <div className={styles.grid}>
                                {filtered.map(member => {
                                    const role = ROLE_CONFIG[member.role];
                                    return (
                                        <div key={member.id} className={`${styles.card} ${!member.isActive ? styles.cardInactive : ''}`} onClick={() => setSelectedMember(member)}>
                                            <div className={styles.cardTop}>
                                                <div className={styles.avatar} style={{ background: member.avatarColor }}>{getInitials(member.firstName, member.lastName)}</div>
                                                <div className={styles.cardInfo}>
                                                    <h3 className={styles.cardName}>{member.firstName} {member.lastName}</h3>
                                                    <span className={styles.roleBadge} style={{ color: role.color, background: `${role.color}15` }}>{role.label}</span>
                                                </div>
                                                {!member.isActive && <span className={styles.inactiveBadge}>Inactivo</span>}
                                            </div>
                                            <div className={styles.specialties}>{member.specialties.map(s => <span key={s} className={styles.specialty}>{s}</span>)}</div>
                                            <div className={styles.schedulePreview}>{member.schedule.map(day => (<div key={day.day} className={`${styles.dayDot} ${day.isOff ? styles.dayOff : ''}`} title={day.isOff ? `${day.day}: Descanso` : `${day.day}: ${day.start}-${day.end}`}>{day.day[0]}</div>))}</div>
                                            <div className={styles.cardStats}>
                                                <div className={styles.cardStat}><span className={styles.statNum}>{member.totalBookings}</span><span className={styles.statLbl}>Reservas</span></div>
                                                <div className={styles.cardStat}><span className={styles.statNum}>⭐ {member.avgRating}</span><span className={styles.statLbl}>Rating</span></div>
                                                <div className={styles.cardStat}><span className={styles.statNum}>{member.completionRate}%</span><span className={styles.statLbl}>Cumplimiento</span></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.list}>
                                <div className={styles.listHeader}><span>Miembro</span><span>Rol</span><span>Reservas</span><span>Rating</span><span>Ingresos</span><span>Estado</span></div>
                                {filtered.map(member => {
                                    const role = ROLE_CONFIG[member.role];
                                    return (
                                        <div key={member.id} className={`${styles.listRow} ${!member.isActive ? styles.listRowInactive : ''}`} onClick={() => setSelectedMember(member)}>
                                            <div className={styles.listMember}><div className={styles.avatarSm} style={{ background: member.avatarColor }}>{getInitials(member.firstName, member.lastName)}</div><div><span className={styles.listName}>{member.firstName} {member.lastName}</span><span className={styles.listEmail}>{member.email}</span></div></div>
                                            <span className={styles.roleBadge} style={{ color: role.color, background: `${role.color}15` }}>{role.label}</span>
                                            <span>{member.totalBookings}</span>
                                            <span>⭐ {member.avgRating}</span>
                                            <span>{formatCurrency(member.revenueGenerated)}</span>
                                            <span className={member.isActive ? styles.statusActive : styles.statusInactive}>{member.isActive ? '● Activo' : '○ Inactivo'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Member Detail Panel */}
            {selectedMember && (
                <>
                    <div className={styles.panelOverlay} onClick={() => setSelectedMember(null)} />
                    <div className={styles.detailPanel}>
                        <div className={styles.panelHeader}>
                            <button className={styles.panelClose} onClick={() => setSelectedMember(null)}>✕</button>
                        </div>
                        <div className={styles.panelProfile}>
                            <div className={styles.avatarLg} style={{ background: selectedMember.avatarColor }}>{getInitials(selectedMember.firstName, selectedMember.lastName)}</div>
                            <h2>{selectedMember.firstName} {selectedMember.lastName}</h2>
                            <span className={styles.roleBadge} style={{ color: ROLE_CONFIG[selectedMember.role].color, background: `${ROLE_CONFIG[selectedMember.role].color}15` }}>{ROLE_CONFIG[selectedMember.role].label}</span>
                        </div>
                        {/* Actions Row */}
                        <div className={styles.panelActions}>
                            <button className={styles.editBtn} onClick={() => openEdit(selectedMember)}>✏️ Editar</button>
                            <button className={styles.toggleBtn} onClick={() => { toggleActive(selectedMember.id); setSelectedMember(null); }}>
                                {selectedMember.isActive ? '⏸ Desactivar' : '▶ Activar'}
                            </button>
                            {confirmDelete === selectedMember.id ? (
                                <div className={styles.confirmRow}>
                                    <span>¿Seguro?</span>
                                    <button className={styles.confirmYes} onClick={() => deleteMember(selectedMember.id)}>Sí, eliminar</button>
                                    <button className={styles.confirmNo} onClick={() => setConfirmDelete(null)}>No</button>
                                </div>
                            ) : (
                                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(selectedMember.id)}>🗑 Eliminar</button>
                            )}
                        </div>
                        <div className={styles.panelSection}><h4>📧 Contacto</h4><div className={styles.contactRow}><span>{selectedMember.email}</span></div><div className={styles.contactRow}><span>{selectedMember.phone}</span></div><div className={styles.contactRow}><span>Desde {formatDate(selectedMember.joinedAt)}</span></div></div>
                        <div className={styles.panelSection}><h4>💼 Especialidades</h4><div className={styles.specialties}>{selectedMember.specialties.map(s => <span key={s} className={styles.specialty}>{s}</span>)}</div></div>
                        <div className={styles.panelSection}>
                            <h4>📊 Rendimiento</h4>
                            <div className={styles.perfGrid}>
                                <div className={styles.perfItem}><span className={styles.perfValue}>{selectedMember.totalBookings}</span><span className={styles.perfLabel}>Reservas</span></div>
                                <div className={styles.perfItem}><span className={styles.perfValue}>⭐ {selectedMember.avgRating}</span><span className={styles.perfLabel}>Rating</span></div>
                                <div className={styles.perfItem}><span className={styles.perfValue}>{selectedMember.completionRate}%</span><span className={styles.perfLabel}>Tasa</span></div>
                                <div className={styles.perfItem}><span className={styles.perfValue}>{formatCurrency(selectedMember.revenueGenerated)}</span><span className={styles.perfLabel}>Ingresos</span></div>
                            </div>
                        </div>
                        <div className={styles.panelSection}>
                            <h4>🕐 Horario Semanal</h4>
                            <div className={styles.scheduleGrid}>{selectedMember.schedule.map(day => (<div key={day.day} className={`${styles.scheduleDay} ${day.isOff ? styles.scheduleDayOff : ''}`}><span className={styles.scheduleDayName}>{day.day}</span><span className={styles.scheduleDayTime}>{day.isOff ? 'Descanso' : `${day.start} — ${day.end}`}</span></div>))}</div>
                        </div>
                    </div>
                </>
            )}

            {/* Create/Edit Modal */}
            {modalOpen && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setModalOpen(false)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{editingId ? 'Editar Miembro' : 'Nuevo Miembro'}</h3>
                            <button className={styles.modalClose} onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formRow}><label>Nombre *</label><input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Nombre" /></div>
                                <div className={styles.formRow}><label>Apellido *</label><input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Apellido" /></div>
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.formRow}><label>Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" /></div>
                                <div className={styles.formRow}><label>Teléfono</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+52 55 ..." /></div>
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.formRow}>
                                    <label>Rol</label>
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as StaffMember['role'] })}>
                                        <option value="EMPLOYEE">Empleado</option>
                                        <option value="MANAGER">Gerente</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="OWNER">Dueño</option>
                                    </select>
                                </div>
                                <div className={styles.formRow}>
                                    <label>Estado</label>
                                    <select value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}>
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <label>Especialidades (separadas por coma)</label>
                                <input type="text" value={form.specialtiesText} onChange={e => setForm({ ...form, specialtiesText: e.target.value })} placeholder="Corte, Color, Barba..." />
                            </div>
                            <div className={styles.formRow}>
                                <label>🕐 Horario Semanal</label>
                                <div className={styles.scheduleForm}>
                                    {form.schedule.map((day, i) => (
                                        <div key={day.day} className={styles.scheduleFormRow}>
                                            <span className={styles.scheduleFormDay}>{day.day}</span>
                                            <label className={styles.offToggle}>
                                                <input type="checkbox" checked={day.isOff} onChange={e => updateScheduleDay(i, 'isOff', e.target.checked)} />
                                                Desc.
                                            </label>
                                            {!day.isOff && (
                                                <>
                                                    <input type="time" value={day.start} onChange={e => updateScheduleDay(i, 'start', e.target.value)} className={styles.timeInput} />
                                                    <span>—</span>
                                                    <input type="time" value={day.end} onChange={e => updateScheduleDay(i, 'end', e.target.value)} className={styles.timeInput} />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancelar</button>
                            <button className={styles.saveBtn} onClick={handleSave}>{editingId ? 'Guardar Cambios' : 'Crear Miembro'}</button>
                        </div>
                    </div>
                </>
            )}

            {/* Toast */}
            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
}
