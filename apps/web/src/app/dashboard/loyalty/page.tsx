'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ---- Types ----
interface LoyaltyMember {
    id: string;
    name: string;
    phone: string;
    points: number;
    tier: 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINO';
    visits: number;
    stamps: number;
    totalSpent: number;
    lastVisit: Date;
    referrals: number;
}

interface Reward {
    id: string;
    name: string;
    pointsCost: number;
    category: string;
    isActive: boolean;
    timesRedeemed: number;
}

interface LoyaltyProgram {
    id: string;
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
    settings: Record<string, string | number | boolean>;
}

type RewardForm = { name: string; pointsCost: number; category: string; isActive: boolean };

// ---- Mock Data: Configurable Programs ----
const INITIAL_PROGRAMS: LoyaltyProgram[] = [
    { id: 'points', name: 'Puntos por Compra', description: 'Los clientes acumulan puntos por cada peso gastado. Los puntos se canjean por recompensas.', icon: '💎', enabled: true, settings: { pointsPerPeso: 1, minRedemption: 100, expirationMonths: 12, welcomeBonus: 50 } },
    { id: 'stamps', name: 'Tarjeta de Sellos', description: 'Después de X servicios, el cliente recibe uno gratis. Ideal para servicios frecuentes.', icon: '🎫', enabled: true, settings: { stampsRequired: 10, reward: 'Servicio gratis', resetAfterReward: true, eligibleServices: 'Todos' } },
    { id: 'visits', name: 'Recompensa por Visitas', description: 'Descuentos escalonados según frecuencia de visitas. Más visitas = mejores beneficios.', icon: '📅', enabled: false, settings: { visit5Discount: 10, visit10Discount: 15, visit20Discount: 20, monthlyVisitGoal: 2 } },
    { id: 'referrals', name: 'Programa de Referidos', description: 'El cliente invita amigos y ambos reciben beneficios cuando el referido agenda su primera cita.', icon: '🤝', enabled: false, settings: { referrerBonus: 200, referredBonus: 100, maxReferralsPerMonth: 5, requireFirstPurchase: true } },
    { id: 'birthday', name: 'Bonus de Cumpleaños', description: 'Descuento o servicio especial durante el mes de cumpleaños del cliente.', icon: '🎂', enabled: true, settings: { discountPercent: 20, freeService: 'Ninguno', activeDays: 7, autoNotify: true } },
    { id: 'vip', name: 'Acceso VIP', description: 'Clientes de alto valor acceden a servicios exclusivos, horarios prioritarios y precios especiales.', icon: '👑', enabled: false, settings: { minSpendToQualify: 5000, vipDiscount: 10, priorityBooking: true, exclusiveProducts: true } },
    { id: 'gamification', name: 'Retos y Desafíos', description: 'Misiones semanales y mensuales que los clientes completan para ganar puntos extra y badges. Ejemplo: "Visita 3 veces esta semana".', icon: '🎮', enabled: false, settings: { weeklyChallenge: 'Visita 3 veces', monthlyChallenge: 'Gasta $2,000', weeklyRewardPts: 150, monthlyRewardPts: 500, leaderboard: true, badgesEnabled: true } },
    { id: 'cashback', name: 'Cashback Inteligente', description: 'Devuelve un porcentaje de cada compra como crédito para la siguiente visita. Se ajusta según tier del cliente.', icon: '💸', enabled: false, settings: { bronzeCashback: 3, silverCashback: 5, goldCashback: 7, platinumCashback: 10, minSpend: 200, maxCashbackPerVisit: 100, autoApply: true, expirationDays: 30 } },
];

const TIER_CONFIG: Record<string, { label: string; color: string; icon: string; minPoints: number }> = {
    BRONCE: { label: 'Bronce', color: '#cd7f32', icon: '🥉', minPoints: 0 },
    PLATA: { label: 'Plata', color: '#9ca3af', icon: '🥈', minPoints: 500 },
    ORO: { label: 'Oro', color: '#f59e0b', icon: '🥇', minPoints: 1500 },
    PLATINO: { label: 'Platino', color: '#8b5cf6', icon: '💎', minPoints: 3000 },
};

const INITIAL_MEMBERS: LoyaltyMember[] = [
    { id: 'l1', name: 'María García', phone: '+52 55 1234 5678', points: 3450, tier: 'PLATINO', visits: 48, stamps: 8, totalSpent: 28500, lastVisit: new Date(2026, 1, 19), referrals: 5 },
    { id: 'l2', name: 'Juan Pérez', phone: '+52 55 9876 5432', points: 1820, tier: 'ORO', visits: 32, stamps: 2, totalSpent: 18200, lastVisit: new Date(2026, 1, 17), referrals: 3 },
    { id: 'l3', name: 'Roberto Díaz', phone: '+52 33 5555 1234', points: 980, tier: 'PLATA', visits: 15, stamps: 5, totalSpent: 9800, lastVisit: new Date(2026, 1, 15), referrals: 0 },
    { id: 'l4', name: 'Laura Méndez', phone: '+52 55 7777 3333', points: 2200, tier: 'ORO', visits: 28, stamps: 8, totalSpent: 22000, lastVisit: new Date(2026, 1, 18), referrals: 2 },
    { id: 'l5', name: 'Ana López', phone: '+52 55 2222 8888', points: 350, tier: 'BRONCE', visits: 5, stamps: 5, totalSpent: 3500, lastVisit: new Date(2026, 1, 10), referrals: 0 },
    { id: 'l6', name: 'Patricia Ruiz', phone: '+52 55 4444 6666', points: 620, tier: 'PLATA', visits: 9, stamps: 9, totalSpent: 6200, lastVisit: new Date(2026, 1, 14), referrals: 1 },
];

const INITIAL_REWARDS: Reward[] = [
    { id: 'rw1', name: 'Corte Gratis', pointsCost: 500, category: 'Servicios', isActive: true, timesRedeemed: 23 },
    { id: 'rw2', name: 'Producto 50% Off', pointsCost: 300, category: 'Productos', isActive: true, timesRedeemed: 45 },
    { id: 'rw3', name: 'Tratamiento Capilar Gratis', pointsCost: 800, category: 'Servicios', isActive: true, timesRedeemed: 12 },
    { id: 'rw4', name: 'Barba Gratis', pointsCost: 250, category: 'Servicios', isActive: true, timesRedeemed: 34 },
    { id: 'rw5', name: 'Sesión Masaje Facial', pointsCost: 600, category: 'Servicios', isActive: false, timesRedeemed: 8 },
    { id: 'rw6', name: 'Kit de Styling', pointsCost: 1000, category: 'Productos', isActive: true, timesRedeemed: 5 },
];

const EMPTY_REWARD: RewardForm = { name: '', pointsCost: 100, category: 'Servicios', isActive: true };

// ---- Integration Map: How each program connects to other modules ----
const INTEGRATION_MAP: Record<string, { module: string; icon: string; how: string }[]> = {
    points: [
        { module: 'POS', icon: '🛒', how: 'Cada venta otorga puntos automáticamente según el monto cobrado' },
        { module: 'Clientes', icon: '👥', how: 'El saldo de puntos se muestra en el perfil del cliente' },
        { module: 'Recompensas', icon: '🎁', how: 'Los puntos se canjean por recompensas configuradas aquí' },
    ],
    stamps: [
        { module: 'POS', icon: '🛒', how: 'Cada servicio cobrado en POS agrega un sello automáticamente' },
        { module: 'Servicios', icon: '💼', how: 'Los sellos aplican solo a los servicios elegibles configurados' },
        { module: 'Clientes', icon: '👥', how: 'La tarjeta de sellos se muestra en el perfil del cliente' },
    ],
    visits: [
        { module: 'Calendario', icon: '📅', how: 'Cuenta citas completadas para calcular nivel de descuento' },
        { module: 'POS', icon: '🛒', how: 'El descuento por visitas se aplica automáticamente al cobrar' },
        { module: 'Citas', icon: '🕐', how: 'Citas confirmadas incrementan el contador de visitas' },
    ],
    referrals: [
        { module: 'Clientes', icon: '👥', how: 'Cada cliente tiene un código de referido único en su perfil' },
        { module: 'Citas', icon: '🕐', how: 'El bonus se activa cuando el referido agenda su primera cita' },
        { module: 'Notificaciones', icon: '🔔', how: 'Notifica a ambos cuando el bonus es acreditado' },
    ],
    birthday: [
        { module: 'Clientes', icon: '👥', how: 'Lee la fecha de cumpleaños del perfil del cliente' },
        { module: 'POS', icon: '🛒', how: 'Genera código de descuento automático para usar al cobrar' },
        { module: 'Notificaciones', icon: '🔔', how: 'Envía felicitación + código por WhatsApp/email/push' },
    ],
    vip: [
        { module: 'POS', icon: '🛒', how: 'Aplica descuento VIP automáticamente al cobrar' },
        { module: 'Calendario', icon: '📅', how: 'Habilita horarios prioritarios exclusivos para VIP' },
        { module: 'Servicios', icon: '💼', how: 'Desbloquea servicios marcados como "exclusivos VIP"' },
        { module: 'Clientes', icon: '👥', how: 'Badge VIP visible en perfil cuando totalSpent ≥ umbral' },
    ],
    gamification: [
        { module: 'Citas', icon: '🕐', how: 'Cuenta visitas para retos como "Visita 3 veces esta semana"' },
        { module: 'POS', icon: '🛒', how: 'Monitorea gastos para retos como "Gasta $2,000"' },
        { module: 'Clientes', icon: '👥', how: 'Muestra badges ganados y posición en leaderboard' },
    ],
    cashback: [
        { module: 'POS', icon: '🛒', how: 'Calcula cashback automáticamente en cada venta según tier' },
        { module: 'Clientes', icon: '👥', how: 'Muestra saldo de cashback disponible en perfil' },
        { module: 'Pagos', icon: '💳', how: 'El crédito de cashback se aplica como descuento en siguiente compra' },
    ],
};

const ROI_HINTS: Record<string, (settings: Record<string, string | number | boolean>, members: number) => string> = {
    cashback: (s, m) => {
        const avg = 400; // average ticket
        const pct = Number(s.silverCashback || 5) / 100;
        const monthly = Math.round(avg * 4 * pct * m);
        return `Con ${m} clientes activos y ticket promedio de $${avg}, tu inversión en cashback sería ~$${monthly.toLocaleString()}/mes`;
    },
    points: (s, m) => {
        const pts = Number(s.pointsPerPeso || 1);
        const avg = 400;
        const monthlyPts = avg * 4 * pts * m;
        return `Abonarías ~${monthlyPts.toLocaleString()} puntos/mes entre ${m} clientes. Con costo de canje ≈$1/punto, tu inversión potencial es ~$${(monthlyPts * 0.5).toLocaleString()}/mes`;
    },
    stamps: (s, m) => {
        const needed = Number(s.stampsRequired || 10);
        const freePerMonth = Math.round(m * 4 / needed);
        return `Con ${m} clientes a 4 visitas/mes y ${needed} sellos para premio, darías ~${freePerMonth} servicios gratis/mes`;
    },
};

// ---- Component ----
type Tab = 'programs' | 'members' | 'rewards';

export default function LoyaltyPage() {
    const { t } = useLocale();
    const { activeBusinessId } = useAuth();
    const [tab, setTab] = useState<Tab>('programs');
    const [programs, setPrograms] = useState<LoyaltyProgram[]>(INITIAL_PROGRAMS);
    const [members, setMembers] = useState<LoyaltyMember[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [search, setSearch] = useState('');
    const [filterTier, setFilterTier] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<RewardForm>(EMPTY_REWARD);
    const [configOpen, setConfigOpen] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // --- Backend Sync ---
    const loadLoyaltyData = async () => {
        if (!activeBusinessId) return;
        try {
            const [progRes, memRes, rewRes] = await Promise.all([
                fetchWithAuth(`${API_URL}/api/v1/loyalty/programs?businessId=${activeBusinessId}`),
                fetchWithAuth(`${API_URL}/api/v1/loyalty/members?businessId=${activeBusinessId}`),
                fetchWithAuth(`${API_URL}/api/v1/loyalty/rewards?businessId=${activeBusinessId}`)
            ]);

            if (progRes.ok) {
                const apiPrograms = await progRes.json();
                // Merge DB settings into the visual mock cards to preserve UI icons/descriptions 
                setPrograms(INITIAL_PROGRAMS.map(p => {
                    const dbProg = apiPrograms.find((ap: any) => ap.name === p.name);
                    return dbProg ? { ...p, id: dbProg.id, enabled: dbProg.enabled, settings: dbProg.config } : p;
                }));
            }
            if (memRes.ok) {
                const apiMembers = await memRes.json();
                setMembers(apiMembers.map((m: any) => ({
                    id: m.id,
                    name: `${m.client.firstName} ${m.client.lastName}`.trim() || 'Desconocido',
                    phone: m.client.phone || '-',
                    points: m.points,
                    tier: m.tier,
                    visits: m.visits,
                    stamps: m.stamps,
                    totalSpent: m.totalSpent,
                    lastVisit: m.lastVisit ? new Date(m.lastVisit) : new Date(),
                    referrals: m.referrals
                })));
            }
            if (rewRes.ok) {
                setRewards(await rewRes.json());
            }
        } catch (e) {
            console.error('Failed to load loyalty data', e);
        }
    };

    useEffect(() => { loadLoyaltyData(); }, [activeBusinessId]);

    const filteredMembers = useMemo(() => members.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
        const matchTier = filterTier === 'all' || m.tier === filterTier;
        return matchSearch && matchTier;
    }).sort((a, b) => b.points - a.points), [members, search, filterTier]);

    const stats = useMemo(() => ({
        activePrograms: programs.filter(p => p.enabled).length,
        totalMembers: members.length,
        totalPoints: members.reduce((s, m) => s + m.points, 0),
        totalRedeemed: rewards.reduce((s, r) => s + r.timesRedeemed, 0),
    }), [members, rewards, programs]);

    const toggleProgram = async (id: string, currentEnabled: boolean) => {
        const prog = programs.find(p => p.id === id);
        if (!prog) return;

        // If it's a UUID, it means it's tracked in DB (enabled). If it's short string (e.g. 'stamps'), it doesn't exist yet
        const isDbTracked = id.length > 20;

        try {
            if (isDbTracked) {
                await fetchWithAuth(`${API_URL}/api/v1/loyalty/programs/${id}?businessId=${activeBusinessId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ enabled: !currentEnabled })
                });
            } else {
                await fetchWithAuth(`${API_URL}/api/v1/loyalty/programs`, {
                    method: 'POST',
                    body: JSON.stringify({
                        businessId: activeBusinessId,
                        name: prog.name,
                        description: prog.description,
                        type: 'POINTS', // Simplification for UI
                        config: prog.settings,
                        enabled: true
                    })
                });
            }
            showToast(`${prog.name} ${!currentEnabled ? 'activado' : 'desactivado'}`);
            loadLoyaltyData();
        } catch (e) {
            console.error(e);
        }
    };

    const updateProgramSetting = (programId: string, key: string, value: string | number | boolean) => {
        setPrograms(prev => prev.map(p => p.id === programId ? { ...p, settings: { ...p.settings, [key]: value } } : p));
    };

    const persistProgramConfig = async (prog: LoyaltyProgram) => {
        setConfigOpen(null);
        if (prog.id.length > 20) {
            await fetchWithAuth(`${API_URL}/api/v1/loyalty/programs/${prog.id}?businessId=${activeBusinessId}`, {
                method: 'PATCH',
                body: JSON.stringify({ config: prog.settings })
            });
            showToast('Configuración guardada en DB');
            loadLoyaltyData();
        } else {
            showToast('Activa el programa primero');
        }
    };

    const openCreateReward = () => { setEditingId(null); setForm(EMPTY_REWARD); setModalOpen(true); };
    const openEditReward = (rw: Reward) => { setEditingId(rw.id); setForm({ name: rw.name, pointsCost: rw.pointsCost, category: rw.category, isActive: rw.isActive }); setModalOpen(true); };

    const saveReward = async () => {
        if (!form.name) return;
        const payload = { ...form, businessId: activeBusinessId };

        if (editingId) {
            const res = await fetchWithAuth(`${API_URL}/api/v1/loyalty/rewards/${editingId}?businessId=${activeBusinessId}`, { method: 'PATCH', body: JSON.stringify(payload) });
            if (res.ok) showToast('Recompensa actualizada');
        } else {
            const res = await fetchWithAuth(`${API_URL}/api/v1/loyalty/rewards`, { method: 'POST', body: JSON.stringify(payload) });
            if (res.ok) showToast('Recompensa creada');
        }
        setModalOpen(false);
        loadLoyaltyData();
    };

    const deleteReward = async (id: string) => {
        if (confirm('¿Seguro que deseas eliminar este premio?')) {
            await fetchWithAuth(`${API_URL}/api/v1/loyalty/rewards/${id}?businessId=${activeBusinessId}`, { method: 'DELETE' });
            showToast('Recompensa eliminada');
            loadLoyaltyData();
        }
    };
    const toggleRewardActive = async (id: string, currentState: boolean) => {
        await fetchWithAuth(`${API_URL}/api/v1/loyalty/rewards/${id}?businessId=${activeBusinessId}`, { method: 'PATCH', body: JSON.stringify({ isActive: !currentState }) });
        loadLoyaltyData();
    };

    const renderSettingLabel = (key: string): string => {
        const labels: Record<string, string> = {
            pointsPerPeso: 'Puntos por peso', minRedemption: 'Mínimo para canjear', expirationMonths: 'Expiración (meses)', welcomeBonus: 'Bonus de bienvenida',
            stampsRequired: 'Sellos necesarios', reward: 'Recompensa', resetAfterReward: 'Reiniciar después', eligibleServices: 'Servicios elegibles',
            visit5Discount: 'Descuento 5 visitas (%)', visit10Discount: 'Descuento 10 visitas (%)', visit20Discount: 'Descuento 20 visitas (%)', monthlyVisitGoal: 'Meta mensual',
            referrerBonus: 'Bonus referidor (pts)', referredBonus: 'Bonus referido (pts)', maxReferralsPerMonth: 'Máx referidos/mes', requireFirstPurchase: 'Requiere 1ra compra',
            discountPercent: 'Descuento (%)', freeService: 'Servicio gratis', activeDays: 'Días activo', autoNotify: 'Notificar automáticamente',
            minSpendToQualify: 'Gasto mín. para calificar ($)', vipDiscount: 'Descuento VIP (%)', priorityBooking: 'Reserva prioritaria', exclusiveProducts: 'Productos exclusivos',
            weeklyChallenge: 'Reto semanal', monthlyChallenge: 'Reto mensual', weeklyRewardPts: 'Puntos reto semanal', monthlyRewardPts: 'Puntos reto mensual', leaderboard: 'Tabla de líderes', badgesEnabled: 'Insignias activas',
            bronzeCashback: 'Cashback Bronce (%)', silverCashback: 'Cashback Plata (%)', goldCashback: 'Cashback Oro (%)', platinumCashback: 'Cashback Platino (%)', minSpend: 'Gasto mínimo ($)', maxCashbackPerVisit: 'Máx cashback/visita ($)', autoApply: 'Aplicar automáticamente', expirationDays: 'Expiración (días)',
        };
        return labels[key] || key;
    };

    return (
        <>
            <Header title={t('loyalty')} subtitle="Programa de fidelización configurable para tu negocio" />
            <div className={styles.content}>
                <div className={styles.statsRow}>
                    <div className={styles.stat}><span className={styles.statIcon}>⚡</span><div><span className={styles.statValue}>{stats.activePrograms}/{programs.length}</span><span className={styles.statLabel}>Programas activos</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>👥</span><div><span className={styles.statValue}>{stats.totalMembers}</span><span className={styles.statLabel}>Miembros</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>💎</span><div><span className={styles.statValue}>{stats.totalPoints.toLocaleString()}</span><span className={styles.statLabel}>Puntos en circulación</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>🎁</span><div><span className={styles.statValue}>{stats.totalRedeemed}</span><span className={styles.statLabel}>Canjes realizados</span></div></div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button className={`${styles.tabBtn} ${tab === 'programs' ? styles.tabActive : ''}`} onClick={() => setTab('programs')}>⚙️ Programas</button>
                    <button className={`${styles.tabBtn} ${tab === 'members' ? styles.tabActive : ''}`} onClick={() => setTab('members')}>👥 Miembros</button>
                    <button className={`${styles.tabBtn} ${tab === 'rewards' ? styles.tabActive : ''}`} onClick={() => setTab('rewards')}>🎁 Recompensas</button>
                </div>

                {/* PROGRAMS TAB */}
                {tab === 'programs' && (
                    <div className={styles.programsGrid}>
                        {programs.map(prog => (
                            <div key={prog.id} className={`${styles.programCard} ${!prog.enabled ? styles.programDisabled : ''}`}>
                                <div className={styles.programHeader}>
                                    <div className={styles.programTitle}>
                                        <span className={styles.programIcon}>{prog.icon}</span>
                                        <div>
                                            <span className={styles.programName}>{prog.name}</span>
                                            <span className={styles.programDesc}>{prog.description}</span>
                                        </div>
                                    </div>
                                    <div className={styles.toggleSwitch} onClick={() => toggleProgram(prog.id, prog.enabled)}>
                                        <div className={`${styles.toggleTrack} ${prog.enabled ? styles.toggleOn : ''}`}>
                                            <div className={styles.toggleThumb} />
                                        </div>
                                    </div>
                                </div>

                                {/* Integration explainer — always visible */}
                                <div className={styles.integrationSection}>
                                    <div className={styles.integrationTitle}>💡 Integración con módulos</div>
                                    <div className={styles.integrationList}>
                                        {(INTEGRATION_MAP[prog.id] || []).map((conn, i) => (
                                            <div key={i} className={styles.integrationItem}>
                                                <span className={styles.integrationIcon}>{conn.icon}</span>
                                                <div>
                                                    <strong>{conn.module}</strong>
                                                    <span className={styles.integrationHow}>{conn.how}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {
                                        ROI_HINTS[prog.id] && (
                                            <div className={styles.roiBox}>
                                                <span className={styles.roiIcon}>📊</span>
                                                <span className={styles.roiText}>{ROI_HINTS[prog.id](prog.settings, members.length)}</span>
                                            </div>
                                        )
                                    }
                                </div>

                                {prog.enabled && (
                                    <>
                                        <button className={styles.configToggle} onClick={() => setConfigOpen(configOpen === prog.id ? null : prog.id)}>
                                            {configOpen === prog.id ? '▲ Ocultar configuración' : '▼ Configurar ajustes'}
                                        </button>
                                        {configOpen === prog.id && (
                                            <div className={styles.configPanel}>
                                                {Object.entries(prog.settings).map(([key, value]) => (
                                                    <div key={key} className={styles.configRow}>
                                                        <label className={styles.configLabel}>{renderSettingLabel(key)}</label>
                                                        {typeof value === 'boolean' ? (
                                                            <div className={styles.miniToggle} onClick={() => updateProgramSetting(prog.id, key, !value)}>
                                                                <div className={`${styles.miniTrack} ${value ? styles.miniOn : ''}`}><div className={styles.miniThumb} /></div>
                                                                <span>{value ? 'Sí' : 'No'}</span>
                                                            </div>
                                                        ) : typeof value === 'number' ? (
                                                            <input type="number" className={styles.configInput} value={value} onChange={e => updateProgramSetting(prog.id, key, +e.target.value)} />
                                                        ) : (
                                                            <input type="text" className={styles.configInput} value={value} onChange={e => updateProgramSetting(prog.id, key, e.target.value)} />
                                                        )}
                                                    </div>
                                                ))}
                                                <button className={styles.saveConfigBtn} onClick={() => persistProgramConfig(prog)}>💾 Guardar Configuración</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div >
                )
                }

                {/* MEMBERS TAB */}
                {
                    tab === 'members' && (
                        <>
                            {/* Tier Overview */}
                            <div className={styles.tierOverview}>
                                {Object.entries(TIER_CONFIG).map(([key, tier]) => {
                                    const count = members.filter(m => m.tier === key).length;
                                    return (<div key={key} className={styles.tierCard} style={{ borderColor: tier.color }}>
                                        <span className={styles.tierIcon}>{tier.icon}</span>
                                        <span className={styles.tierName} style={{ color: tier.color }}>{tier.label}</span>
                                        <span className={styles.tierCount}>{count} miembros</span>
                                        <span className={styles.tierReq}>{tier.minPoints}+ pts</span>
                                    </div>);
                                })}
                            </div>

                            <div className={styles.toolbar}>
                                <div className={styles.searchGroup}><span className={styles.sIcon}>🔍</span><input className={styles.searchInput} type="text" placeholder="Buscar miembro..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                                <div className={styles.filterBtns}>
                                    {['all', ...Object.keys(TIER_CONFIG)].map(k => (<button key={k} className={`${styles.fBtn} ${filterTier === k ? styles.fActive : ''}`} onClick={() => setFilterTier(k)}>{k === 'all' ? 'Todos' : TIER_CONFIG[k].icon + ' ' + TIER_CONFIG[k].label}</button>))}
                                </div>
                            </div>
                            <div className={styles.memberList}>
                                {filteredMembers.map(m => {
                                    const tier = TIER_CONFIG[m.tier];
                                    const stampsReq = (programs.find(p => p.id === 'stamps')?.settings.stampsRequired as number) || 10;
                                    return (
                                        <div key={m.id} className={styles.memberCard}>
                                            <div className={styles.memberAvatar} style={{ background: tier.color }}>{m.name[0]}</div>
                                            <div className={styles.memberInfo}>
                                                <span className={styles.memberName}>{m.name}</span>
                                                <span className={styles.memberMeta}>{tier.icon} {tier.label} · {m.visits} visitas · 🎫 {m.stamps}/{stampsReq} sellos · 🤝 {m.referrals} refs</span>
                                            </div>
                                            <div className={styles.memberPoints}>
                                                <span className={styles.pointsNum}>{m.points.toLocaleString()}</span>
                                                <span className={styles.pointsLabel}>puntos</span>
                                            </div>
                                            <div className={styles.memberSpent}>${m.totalSpent.toLocaleString()}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )
                }

                {/* REWARDS TAB */}
                {
                    tab === 'rewards' && (
                        <>
                            <div className={styles.rewardToolbar}>
                                <button className={styles.addBtn} onClick={openCreateReward}>+</button>
                            </div>
                            <div className={styles.rewardGrid}>
                                {rewards.map(rw => (
                                    <div key={rw.id} className={`${styles.rewardCard} ${!rw.isActive ? styles.rewardInactive : ''}`}>
                                        <div className={styles.rewardHeader}>
                                            <span className={styles.rewardName}>{rw.name}</span>
                                            <span className={styles.rewardCat}>{rw.category}</span>
                                        </div>
                                        <div className={styles.rewardCost}>{rw.pointsCost} pts</div>
                                        <div className={styles.rewardMeta}>{rw.timesRedeemed} canjes · {rw.isActive ? '✅ Activa' : '⏸ Pausada'}</div>
                                        <div className={styles.rewardActions}>
                                            <button className={styles.rwActBtn} onClick={() => openEditReward(rw)}>✏️</button>
                                            <button className={styles.rwActBtn} onClick={() => toggleRewardActive(rw.id, rw.isActive)}>{rw.isActive ? '⏸' : '▶'}</button>
                                            <button className={styles.rwActBtnDel} onClick={() => deleteReward(rw.id)}>🗑</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )
                }
            </div >

            {/* Reward Modal */}
            {
                modalOpen && (
                    <>
                        <div className={styles.overlay} onClick={() => setModalOpen(false)} />
                        <div className={styles.modal}>
                            <div className={styles.modalHeader}><h3>{editingId ? 'Editar Recompensa' : 'Nueva Recompensa'}</h3><button className={styles.modalClose} onClick={() => setModalOpen(false)}>✕</button></div>
                            <div className={styles.modalBody}>
                                <div className={styles.formRow}><label>Nombre *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Corte Gratis" /></div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formRow}><label>Costo (puntos)</label><input type="number" value={form.pointsCost} onChange={e => setForm({ ...form, pointsCost: +e.target.value })} min={10} step={10} /></div>
                                    <div className={styles.formRow}><label>Categoría</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>Servicios</option><option>Productos</option><option>Experiencias</option></select></div>
                                </div>
                                <label className={styles.checkLabel}><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Activa</label>
                            </div>
                            <div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancelar</button><button className={styles.saveBtn} onClick={saveReward}>{editingId ? 'Guardar' : 'Crear'}</button></div>
                        </div>
                    </>
                )
            }

            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
}
