'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    category: string;
    duration: number; // minutes
    price: number;
    isActive: boolean;
    isGroup: boolean;
    maxCapacity: number;
    isPopular: boolean;
    staff: StaffMember[];
    bookings: number;
}

interface Category {
    key: string;
    icon: string;
    isCustom?: boolean;
}

// Removed hardcoded STAFF

const DEFAULT_CATEGORIES: Category[] = [
    { key: 'hair', icon: '✂️' },
    { key: 'beard', icon: '🪒' },
    { key: 'color', icon: '🎨' },
    { key: 'treatment', icon: '💆' },
    { key: 'extras', icon: '🧴' },
];

const CATEGORY_COLORS: Record<string, string> = {
    hair: 'hsl(262, 60%, 55%)',
    beard: 'hsl(210, 60%, 50%)',
    color: 'hsl(340, 60%, 55%)',
    treatment: 'hsl(160, 50%, 45%)',
    extras: 'hsl(40, 55%, 50%)',
};

// Palette for custom categories
const CUSTOM_CATEGORY_COLORS = [
    'hsl(280, 50%, 55%)',
    'hsl(190, 60%, 45%)',
    'hsl(20, 70%, 55%)',
    'hsl(80, 50%, 45%)',
    'hsl(310, 50%, 50%)',
    'hsl(50, 65%, 50%)',
];

const EMOJI_OPTIONS = ['📦', '💅', '🧖', '🪮', '💇', '🧴', '💊', '🎯', '⭐', '🔧', '🎨', '✨'];

// ---- Helpers ----
function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-MX')}`;
}

function getCategoryColor(key: string): string {
    return CATEGORY_COLORS[key] || CUSTOM_CATEGORY_COLORS[
        Math.abs(key.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % CUSTOM_CATEGORY_COLORS.length
    ];
}

// ---- Component ----
interface ServiceForm {
    name: string;
    description: string;
    category: string;
    duration: number;
    price: number;
    isActive: boolean;
    isGroup: boolean;
    maxCapacity: number;
    staffIds: string[];
}

const EMPTY_FORM: ServiceForm = {
    name: '',
    description: '',
    category: 'hair',
    duration: 30,
    price: 0,
    isActive: true,
    isGroup: false,
    maxCapacity: 2,
    staffIds: [],
};

export default function ServicesPage() {
    const { t } = useLocale();
    const { activeBusinessId } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

    // Category management
    const [showCategoryPopover, setShowCategoryPopover] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('📦');
    const catPopoverRef = useRef<HTMLDivElement>(null);

    // Toast
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
    };

    useEffect(() => {
        if (!activeBusinessId) { setIsLoading(false); return; }
        setIsLoading(true);

        Promise.all([
            fetchWithAuth(`${API_URL}/api/v1/services/business/${activeBusinessId}`),
            fetchWithAuth(`${API_URL}/api/v1/business-members/business/${activeBusinessId}`)
        ]).then(async ([resSvc, resStaff]) => {
            const dataSvc = resSvc.ok ? await resSvc.json() : [];
            const dataStaff = resStaff.ok ? await resStaff.json() : [];

            const mappedStaff: StaffMember[] = dataStaff.map((m: any) => ({
                id: m.id,
                name: m.user?.firstName ? `${m.user.firstName} ${m.user.lastName || ''}`.trim() : 'Usuario',
                initials: m.user?.firstName ? m.user.firstName.substring(0, 2).toUpperCase() : 'US',
                color: m.color || `hsl(${Math.random() * 360}, 60%, 50%)`
            }));

            setStaffList(mappedStaff);

            const mapped: Service[] = dataSvc.map((s: any) => ({
                id: s.id,
                name: s.name,
                description: s.description || '',
                category: s.category || 'hair',
                duration: s.durationMinutes || 30,
                price: Number(s.price),
                isActive: s.isActive,
                isGroup: s.isGroup || false,
                maxCapacity: s.maxCapacity || 2,
                isPopular: false,
                // Assign staff randomly or from relation if relation exists
                staff: mappedStaff.length > 0 ? (s.staff || []).map((st: any) => mappedStaff.find(m => m.id === st.id)).filter(Boolean) : [],
                bookings: 0
            }));

            setServices(mapped);
            setIsLoading(false);
        }).catch((err) => {
            console.error('Failed to load catalog data', err);
            setIsLoading(false);
        });
    }, [activeBusinessId]);

    // Close category popover on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (catPopoverRef.current && !catPopoverRef.current.contains(e.target as Node)) {
                setShowCategoryPopover(false);
            }
        }
        if (showCategoryPopover) {
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }
    }, [showCategoryPopover]);

    const categoryLabel = (key: string): string => {
        if (key === 'all') return t('all_categories');
        const map: Record<string, string> = {
            hair: t('cat_hair'),
            beard: t('cat_beard'),
            color: t('cat_color'),
            treatment: t('cat_treatment'),
            extras: t('cat_extras'),
        };
        return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
    };

    const filtered = useMemo(() => {
        let list = services;
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
    }, [search, activeCategory, services]);

    const stats = useMemo(() => {
        const total = services.length;
        const active = services.filter(s => s.isActive).length;
        const prices = services.filter(s => s.isActive).map(s => s.price);
        const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        const topService = [...services].sort((a, b) => b.bookings - a.bookings)[0];
        return { total, active, avgPrice, topService };
    }, [services]);

    // ----- Toggle directly on card -----
    const toggleServiceActive = (serviceId: string) => {
        setServices(prev => prev.map(s => {
            if (s.id === serviceId) {
                const newActive = !s.isActive;
                showToast(newActive ? t('service_activated') : t('service_deactivated'));
                return { ...s, isActive: newActive };
            }
            return s;
        }));
    };

    // ----- Category management -----
    const addCategory = () => {
        const key = newCatName.trim().toLowerCase().replace(/\s+/g, '_');
        if (!key || categories.some(c => c.key === key)) return;
        setCategories(prev => [...prev, { key, icon: newCatIcon, isCustom: true }]);
        CATEGORY_COLORS[key] = getCategoryColor(key);
        setNewCatName('');
        setNewCatIcon('📦');
    };

    const deleteCategory = (key: string) => {
        setCategories(prev => prev.filter(c => c.key !== key));
        if (activeCategory === key) setActiveCategory('all');
    };

    // ----- Service CRUD -----
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
            isGroup: service.isGroup || false,
            maxCapacity: service.maxCapacity || 2,
            staffIds: service.staff.map(s => s.id),
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                businessId: activeBusinessId,
                name: form.name,
                description: form.description,
                durationMinutes: form.duration,
                price: form.price,
                isActive: form.isActive,
                isGroup: form.isGroup,
                maxCapacity: form.isGroup ? form.maxCapacity : null,
                currency: 'MXN'
            };

            if (editingService) {
                const res = await fetchWithAuth(`${API_URL}/api/v1/services/${editingService.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const updated = await res.json();
                    setServices(prev => prev.map(s =>
                        s.id === editingService.id ? {
                            ...s,
                            name: updated.name,
                            description: updated.description,
                            duration: updated.durationMinutes,
                            price: Number(updated.price),
                            isActive: updated.isActive,
                            isGroup: updated.isGroup || false,
                            maxCapacity: updated.maxCapacity || 2,
                            staff: staffList.filter(st => form.staffIds.includes(st.id))
                        } : s
                    ));
                    showToast('Servicio actualizado con éxito');
                }
            } else {
                const res = await fetchWithAuth(`${API_URL}/api/v1/services`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const created = await res.json();
                    setServices(prev => [...prev, {
                        id: created.id,
                        name: created.name,
                        description: created.description || '',
                        category: created.category || 'hair',
                        duration: created.durationMinutes,
                        price: Number(created.price),
                        isActive: created.isActive,
                        isGroup: created.isGroup || false,
                        maxCapacity: created.maxCapacity || 2,
                        isPopular: false,
                        staff: staffList.filter(st => form.staffIds.includes(st.id)),
                        bookings: 0
                    }]);
                    showToast('Servicio creado en base de datos');
                }
            }
        } catch (e) {
            console.error('Save failed', e);
            showToast('Error al procesar el servicio');
        } finally {
            setShowModal(false);
            setEditingService(null);
            setForm(EMPTY_FORM);
        }
    };

    const updateField = <K extends keyof ServiceForm>(field: K, value: ServiceForm[K]) => {
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
                    <button className="btn btn-primary" onClick={openCreate}>+</button>
                }
            />

            <div className={styles.content}>
                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Cargando catálogo de Servicios...
                    </div>
                ) : (
                    <>
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

                        {/* Search */}
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

                        {/* Category Tabs + Manage Button */}
                        <div className={styles.categoryRow}>
                            <div className={styles.categoryTabs}>
                                <button
                                    className={`${styles.categoryTab} ${activeCategory === 'all' ? styles.categoryTabActive : ''}`}
                                    onClick={() => setActiveCategory('all')}
                                >
                                    <span className={styles.categoryIcon}>✨</span>
                                    {t('all_categories')}
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.key}
                                        className={`${styles.categoryTab} ${activeCategory === cat.key ? styles.categoryTabActive : ''}`}
                                        onClick={() => setActiveCategory(cat.key)}
                                    >
                                        <span className={styles.categoryIcon}>{cat.icon}</span>
                                        {categoryLabel(cat.key)}
                                        <span className={styles.categoryCount}>
                                            {services.filter(s => s.category === cat.key).length}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Category manage button */}
                            <div className={styles.categoryManageWrapper} ref={catPopoverRef}>
                                <button
                                    className={styles.categoryManageBtn}
                                    onClick={() => setShowCategoryPopover(prev => !prev)}
                                    title={t('manage_categories')}
                                >
                                    ⚙️
                                </button>

                                {showCategoryPopover && (
                                    <div className={styles.categoryPopover}>
                                        <div className={styles.popoverHeader}>
                                            <h4>{t('manage_categories')}</h4>
                                        </div>
                                        <div className={styles.popoverBody}>
                                            {/* Existing categories list */}
                                            <div className={styles.catList}>
                                                {categories.map(cat => (
                                                    <div key={cat.key} className={styles.catListItem}>
                                                        <span className={styles.catListIcon}>{cat.icon}</span>
                                                        <span className={styles.catListName}>{categoryLabel(cat.key)}</span>
                                                        <span className={styles.catListCount}>
                                                            {services.filter(s => s.category === cat.key).length}
                                                        </span>
                                                        {cat.isCustom && (
                                                            <button
                                                                className={styles.catDeleteBtn}
                                                                onClick={() => deleteCategory(cat.key)}
                                                                title={t('delete_category')}
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add new category form */}
                                            <div className={styles.catAddForm}>
                                                <div className={styles.catAddRow}>
                                                    <div className={styles.emojiPicker}>
                                                        <button className={styles.emojiSelected}>{newCatIcon}</button>
                                                        <div className={styles.emojiGrid}>
                                                            {EMOJI_OPTIONS.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    className={styles.emojiOption}
                                                                    onClick={() => setNewCatIcon(emoji)}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <input
                                                        className={styles.catNameInput}
                                                        placeholder={t('category_name')}
                                                        value={newCatName}
                                                        onChange={e => setNewCatName(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                                                    />
                                                    <button
                                                        className={styles.catAddBtn}
                                                        onClick={addCategory}
                                                        disabled={!newCatName.trim()}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                        style={{ background: getCategoryColor(service.category) }}
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
                                                    color: getCategoryColor(service.category),
                                                    background: `${getCategoryColor(service.category)}18`,
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
                                                        onChange={() => toggleServiceActive(service.id)}
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
                    </>
                )}
            </div>

            {/* Toast notification */}
            <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
                {toast.message}
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
                                        {categories.map(cat => (
                                            <option key={cat.key} value={cat.key}>{categoryLabel(cat.key)}</option>
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
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>¿Es Clase Grupal?</label>
                                    <div className={styles.toggleRow}>
                                        <label className={styles.toggleSwitch}>
                                            <input
                                                type="checkbox"
                                                checked={form.isGroup}
                                                onChange={e => updateField('isGroup', e.target.checked)}
                                            />
                                            <span className={styles.toggleSlider} />
                                        </label>
                                        <span className={styles.toggleLabel}>
                                            {form.isGroup ? 'Sí, Requiere Cupos' : 'No, Cita Privada 1-a-1'}
                                        </span>
                                    </div>
                                </div>
                                {form.isGroup && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Cupo Máximo</label>
                                        <input
                                            className={styles.formInput}
                                            type="number"
                                            min={2}
                                            step={1}
                                            value={form.maxCapacity}
                                            onChange={e => updateField('maxCapacity', parseInt(e.target.value) || 2)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('assigned_staff')}</label>
                                <div className={styles.staffChips}>
                                    {staffList.map(member => (
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
