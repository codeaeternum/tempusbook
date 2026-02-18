'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './page.module.css';

// ---- Types ----
interface StaffMember {
    id: string;
    name: string;
    initials: string;
    color: string;
}

interface Service {
    id: string;
    name: string;
    description: string;
    category: ServiceCategory;
    duration: number; // minutes
    price: number;
    isActive: boolean;
    isPopular: boolean;
    staff: StaffMember[];
    bookings: number; // total bookings count
}

type ServiceCategory = 'hair' | 'beard' | 'color' | 'treatment' | 'extras';

// ---- Mock Data ----
const STAFF: StaffMember[] = [
    { id: 's1', name: 'Carlos', initials: 'CA', color: 'hsl(210, 60%, 55%)' },
    { id: 's2', name: 'Ana', initials: 'AN', color: 'hsl(340, 60%, 55%)' },
    { id: 's3', name: 'Miguel', initials: 'MI', color: 'hsl(160, 50%, 45%)' },
    { id: 's4', name: 'Laura', initials: 'LA', color: 'hsl(40, 60%, 50%)' },
];

const MOCK_SERVICES: Service[] = [
    {
        id: '1', name: 'Corte Clásico', description: 'Corte tradicional con tijera y navaja. Incluye lavado y secado.',
        category: 'hair', duration: 30, price: 250, isActive: true, isPopular: true,
        staff: [STAFF[0], STAFF[2]], bookings: 184,
    },
    {
        id: '2', name: 'Corte Fade', description: 'Degradado con máquina, blend perfecto. Estilo moderno y definido.',
        category: 'hair', duration: 45, price: 300, isActive: true, isPopular: true,
        staff: [STAFF[0], STAFF[2], STAFF[3]], bookings: 156,
    },
    {
        id: '3', name: 'Corte + Barba', description: 'Combo completo de corte y perfilado de barba con toalla caliente.',
        category: 'hair', duration: 60, price: 350, isActive: true, isPopular: false,
        staff: [STAFF[0], STAFF[2]], bookings: 132,
    },
    {
        id: '4', name: 'Corte Infantil', description: 'Corte para niños menores de 12 años. Paciencia y buen trato garantizado.',
        category: 'hair', duration: 25, price: 180, isActive: true, isPopular: false,
        staff: [STAFF[2], STAFF[3]], bookings: 67,
    },
    {
        id: '5', name: 'Perfilado de Barba', description: 'Delineado y perfilado con navaja. Toalla caliente incluida.',
        category: 'beard', duration: 20, price: 150, isActive: true, isPopular: false,
        staff: [STAFF[0]], bookings: 98,
    },
    {
        id: '6', name: 'Barba Completa', description: 'Rasurado, perfilado y tratamiento con aceites esenciales.',
        category: 'beard', duration: 35, price: 220, isActive: true, isPopular: true,
        staff: [STAFF[0], STAFF[2]], bookings: 112,
    },
    {
        id: '7', name: 'Coloración Completa', description: 'Aplicación de color profesional. Incluye diagnóstico capilar.',
        category: 'color', duration: 90, price: 780, isActive: true, isPopular: false,
        staff: [STAFF[1]], bookings: 45,
    },
    {
        id: '8', name: 'Mechas / Highlights', description: 'Técnica de mechas con papel o gorra. Resultado natural.',
        category: 'color', duration: 120, price: 950, isActive: true, isPopular: false,
        staff: [STAFF[1]], bookings: 38,
    },
    {
        id: '9', name: 'Tratamiento Capilar', description: 'Hidratación profunda con keratina. Restaura y fortalece.',
        category: 'treatment', duration: 45, price: 520, isActive: true, isPopular: false,
        staff: [STAFF[1], STAFF[3]], bookings: 73,
    },
    {
        id: '10', name: 'Tratamiento Anticaída', description: 'Sesión con masaje y productos especializados contra la pérdida de cabello.',
        category: 'treatment', duration: 40, price: 450, isActive: true, isPopular: false,
        staff: [STAFF[1]], bookings: 29,
    },
    {
        id: '11', name: 'Cejas', description: 'Diseño y perfilado de cejas con cera o pinza.',
        category: 'extras', duration: 15, price: 100, isActive: true, isPopular: false,
        staff: [STAFF[1], STAFF[3]], bookings: 85,
    },
    {
        id: '12', name: 'Black Mask', description: 'Mascarilla facial de carbón activado. Limpieza profunda de poros.',
        category: 'extras', duration: 20, price: 180, isActive: false, isPopular: false,
        staff: [STAFF[1]], bookings: 18,
    },
];

// ---- Category config ----
const CATEGORIES: { key: ServiceCategory | 'all'; icon: string }[] = [
    { key: 'all', icon: '✨' },
    { key: 'hair', icon: '✂️' },
    { key: 'beard', icon: '🪒' },
    { key: 'color', icon: '🎨' },
    { key: 'treatment', icon: '💆' },
    { key: 'extras', icon: '🧴' },
];

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
    hair: 'hsl(262, 60%, 55%)',
    beard: 'hsl(210, 60%, 50%)',
    color: 'hsl(340, 60%, 55%)',
    treatment: 'hsl(160, 50%, 45%)',
    extras: 'hsl(40, 55%, 50%)',
};

// ---- Helpers ----
function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-MX')}`;
}

// ---- Component ----
interface ServiceForm {
    name: string;
    description: string;
    category: ServiceCategory;
    duration: number;
    price: number;
    isActive: boolean;
    staffIds: string[];
}

const EMPTY_FORM: ServiceForm = {
    name: '',
    description: '',
    category: 'hair',
    duration: 30,
    price: 0,
    isActive: true,
    staffIds: [],
};

export default function ServicesPage() {
    const { t, locale } = useLocale();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

    const categoryLabel = (key: ServiceCategory | 'all'): string => {
        if (key === 'all') return t('all_categories');
        const map: Record<ServiceCategory, string> = {
            hair: t('cat_hair'),
            beard: t('cat_beard'),
            color: t('cat_color'),
            treatment: t('cat_treatment'),
            extras: t('cat_extras'),
        };
        return map[key];
    };

    const filtered = useMemo(() => {
        let list = MOCK_SERVICES;
        if (activeCategory !== 'all') {
            list = list.filter(s => s.category === activeCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q)
            );
        }
        return list;
    }, [search, activeCategory]);

    const stats = useMemo(() => {
        const total = MOCK_SERVICES.length;
        const active = MOCK_SERVICES.filter(s => s.isActive).length;
        const prices = MOCK_SERVICES.filter(s => s.isActive).map(s => s.price);
        const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        const topService = [...MOCK_SERVICES].sort((a, b) => b.bookings - a.bookings)[0];
        return { total, active, avgPrice, topService };
    }, []);

    const openCreate = () => {
        setEditingService(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (service: Service) => {
        setEditingService(service);
        setForm({
            name: service.name,
            description: service.description,
            category: service.category,
            duration: service.duration,
            price: service.price,
            isActive: service.isActive,
            staffIds: service.staff.map(s => s.id),
        });
        setShowModal(true);
    };

    const handleSave = () => {
        setShowModal(false);
        setEditingService(null);
        setForm(EMPTY_FORM);
    };

    const updateField = (field: keyof ServiceForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const toggleStaff = (staffId: string) => {
        setForm(prev => ({
            ...prev,
            staffIds: prev.staffIds.includes(staffId)
                ? prev.staffIds.filter(id => id !== staffId)
                : [...prev.staffIds, staffId],
        }));
    };

    return (
        <>
            <Header
                title={t('services')}
                subtitle={`${stats.total} ${t('service_count')}`}
                actions={
                    <button className="btn btn-primary" onClick={openCreate}>
                        + {t('add_service')}
                    </button>
                }
            />

            <div className={styles.content}>
                {/* Stats Row */}
                <div className={styles.statsRow}>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.purple}`}>💼</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.total}</div>
                            <div className={styles.statLabel}>{t('services')}</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.green}`}>✓</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.active}</div>
                            <div className={styles.statLabel}>{t('active_services')}</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.blue}`}>💰</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{formatCurrency(stats.avgPrice)}</div>
                            <div className={styles.statLabel}>{t('avg_price')}</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.amber}`}>🏆</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.topService?.name}</div>
                            <div className={styles.statLabel}>{t('most_booked')}</div>
                        </div>
                    </div>
                </div>

                {/* Search + Categories */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            className={styles.searchInput}
                            placeholder={t('search_services')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.categoryTabs}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            className={`${styles.categoryTab} ${activeCategory === cat.key ? styles.categoryTabActive : ''}`}
                            onClick={() => setActiveCategory(cat.key)}
                        >
                            <span className={styles.categoryIcon}>{cat.icon}</span>
                            {categoryLabel(cat.key)}
                            {cat.key !== 'all' && (
                                <span className={styles.categoryCount}>
                                    {MOCK_SERVICES.filter(s => s.category === cat.key).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Service Cards Grid */}
                <div className={styles.serviceGrid}>
                    {filtered.map(service => (
                        <div
                            key={service.id}
                            className={`card ${styles.serviceCard} ${!service.isActive ? styles.serviceInactive : ''}`}
                        >
                            {/* Color accent strip */}
                            <div
                                className={styles.cardAccent}
                                style={{ background: CATEGORY_COLORS[service.category] }}
                            />

                            <div className={styles.cardBody}>
                                {/* Header */}
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitleRow}>
                                        <h3 className={styles.cardTitle}>{service.name}</h3>
                                        {service.isPopular && (
                                            <span className={styles.popularBadge}>
                                                🔥 {t('popular')}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={styles.categoryChip}
                                        style={{
                                            color: CATEGORY_COLORS[service.category],
                                            background: `${CATEGORY_COLORS[service.category]}18`,
                                        }}
                                    >
                                        {categoryLabel(service.category)}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className={styles.cardDesc}>{service.description}</p>

                                {/* Price + Duration row */}
                                <div className={styles.cardMetrics}>
                                    <div className={styles.priceTag}>
                                        {formatCurrency(service.price)}
                                    </div>
                                    <div className={styles.durationTag}>
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        {service.duration} {t('min_abbr')}
                                    </div>
                                </div>

                                {/* Staff + Actions */}
                                <div className={styles.cardFooter}>
                                    <div className={styles.staffRow}>
                                        {service.staff.slice(0, 3).map(member => (
                                            <div
                                                key={member.id}
                                                className={styles.staffAvatar}
                                                style={{ background: member.color }}
                                                title={member.name}
                                            >
                                                {member.initials}
                                            </div>
                                        ))}
                                        {service.staff.length > 3 && (
                                            <div className={styles.staffMore}>
                                                +{service.staff.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.cardActions}>
                                        <label className={styles.toggleSwitch} title={t('toggle_active')}>
                                            <input
                                                type="checkbox"
                                                checked={service.isActive}
                                                onChange={() => { }}
                                            />
                                            <span className={styles.toggleSlider} />
                                        </label>
                                        <button
                                            className={styles.editBtn}
                                            onClick={() => openEdit(service)}
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                </div>

                                {/* Bookings mini stat */}
                                <div className={styles.bookingsBar}>
                                    <span>{service.bookings} {t('bookings_count')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>💼</span>
                        <p>{t('no_services')}</p>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowModal(false)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingService ? t('edit_service') : t('add_service')}
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('service_name')}</label>
                                <input
                                    className={styles.formInput}
                                    value={form.name}
                                    onChange={e => updateField('name', e.target.value)}
                                    placeholder={t('name_placeholder')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('service_description')}</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={form.description}
                                    onChange={e => updateField('description', e.target.value)}
                                    rows={2}
                                    placeholder={t('description_placeholder')}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('category')}</label>
                                    <select
                                        className={styles.formSelect}
                                        value={form.category}
                                        onChange={e => updateField('category', e.target.value)}
                                    >
                                        {(['hair', 'beard', 'color', 'treatment', 'extras'] as ServiceCategory[]).map(cat => (
                                            <option key={cat} value={cat}>{categoryLabel(cat)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('duration')} ({t('min_abbr')})</label>
                                    <input
                                        className={styles.formInput}
                                        type="number"
                                        min={5}
                                        step={5}
                                        value={form.duration}
                                        onChange={e => updateField('duration', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('price')} (MXN)</label>
                                    <input
                                        className={styles.formInput}
                                        type="number"
                                        min={0}
                                        step={10}
                                        value={form.price}
                                        onChange={e => updateField('price', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('status')}</label>
                                    <div className={styles.toggleRow}>
                                        <label className={styles.toggleSwitch}>
                                            <input
                                                type="checkbox"
                                                checked={form.isActive}
                                                onChange={e => updateField('isActive', e.target.checked)}
                                            />
                                            <span className={styles.toggleSlider} />
                                        </label>
                                        <span className={styles.toggleLabel}>
                                            {form.isActive ? t('active') : t('inactive')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('assigned_staff')}</label>
                                <div className={styles.staffChips}>
                                    {STAFF.map(member => (
                                        <button
                                            key={member.id}
                                            type="button"
                                            className={`${styles.staffChip} ${form.staffIds.includes(member.id) ? styles.staffChipActive : ''}`}
                                            style={form.staffIds.includes(member.id) ? { background: `${member.color}22`, borderColor: member.color, color: member.color } : {}}
                                            onClick={() => toggleStaff(member.id)}
                                        >
                                            <span
                                                className={styles.chipAvatar}
                                                style={{ background: member.color }}
                                            >
                                                {member.initials}
                                            </span>
                                            {member.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                {t('cancel')}
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {t('save_service')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
