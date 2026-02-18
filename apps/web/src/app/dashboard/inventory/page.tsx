'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './page.module.css';

// ---- Types ----
interface Product {
    id: string;
    name: string;
    description: string;
    category: ProductCategory;
    sku: string;
    barcode: string;
    costPrice: number;
    sellPrice: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    image?: string;
}

type ProductCategory = 'hair_care' | 'styling' | 'beard_care' | 'tools' | 'skincare';

// ---- Mock Data ----
const INITIAL_PRODUCTS: Product[] = [
    {
        id: 'p1', name: 'Cera para Cabello', description: 'Cera de fijación media con acabado mate. Ideal para estilos texturizados.',
        category: 'styling', sku: 'STY-001', barcode: '7501234567890', costPrice: 95, sellPrice: 180, stock: 24, minStock: 5, isActive: true,
        image: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=200&h=200&fit=crop',
    },
    {
        id: 'p2', name: 'Shampoo Profesional', description: 'Shampoo sin sulfatos para uso profesional. Hidrata y fortalece.',
        category: 'hair_care', sku: 'HC-001', barcode: '7501234567891', costPrice: 140, sellPrice: 280, stock: 18, minStock: 8, isActive: true,
        image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200&h=200&fit=crop',
    },
    {
        id: 'p3', name: 'Aceite para Barba', description: 'Mezcla de aceites esenciales: argán, jojoba y vitamina E.',
        category: 'beard_care', sku: 'BC-001', barcode: '7501234567892', costPrice: 120, sellPrice: 250, stock: 15, minStock: 5, isActive: true,
        image: 'https://images.unsplash.com/photo-1621607512022-6aecc834bae0?w=200&h=200&fit=crop',
    },
    {
        id: 'p4', name: 'Tónico Capilar', description: 'Tratamiento anticaída con biotina y saw palmetto.',
        category: 'hair_care', sku: 'HC-002', barcode: '7501234567893', costPrice: 180, sellPrice: 320, stock: 3, minStock: 5, isActive: true,
    },
    {
        id: 'p5', name: 'Cepillo de Barba', description: 'Cerdas naturales de jabalí. Mango de madera de haya.',
        category: 'tools', sku: 'TL-001', barcode: '7501234567894', costPrice: 75, sellPrice: 150, stock: 32, minStock: 10, isActive: true,
    },
    {
        id: 'p6', name: 'Pomada Water-Based', description: 'Fijación fuerte con brillo. Se lava fácilmente con agua.',
        category: 'styling', sku: 'STY-002', barcode: '7501234567895', costPrice: 85, sellPrice: 160, stock: 0, minStock: 5, isActive: true,
        image: 'https://images.unsplash.com/photo-1597854710380-aa3f9bfdb09d?w=200&h=200&fit=crop',
    },
    {
        id: 'p7', name: 'Bálsamo para Barba', description: 'Suaviza y da forma. Con manteca de karité y aceite de coco.',
        category: 'beard_care', sku: 'BC-002', barcode: '7501234567896', costPrice: 100, sellPrice: 200, stock: 12, minStock: 5, isActive: true,
    },
    {
        id: 'p8', name: 'Aftershave Gel', description: 'Gel calmante post-rasurado con aloe vera y mentol.',
        category: 'skincare', sku: 'SK-001', barcode: '7501234567897', costPrice: 90, sellPrice: 175, stock: 8, minStock: 5, isActive: true,
    },
    {
        id: 'p9', name: 'Tijeras Profesionales', description: 'Acero japonés 440C. Ergonómicas, 6 pulgadas.',
        category: 'tools', sku: 'TL-002', barcode: '7501234567898', costPrice: 850, sellPrice: 1500, stock: 4, minStock: 2, isActive: true,
    },
    {
        id: 'p10', name: 'Gel Fijador Extra', description: 'Gel de fijación extra fuerte. Sin residuos ni descamación.',
        category: 'styling', sku: 'STY-003', barcode: '7501234567899', costPrice: 65, sellPrice: 120, stock: 1, minStock: 8, isActive: false,
    },
];

const CATEGORIES: { key: ProductCategory | 'all'; icon: string }[] = [
    { key: 'all', icon: '✨' },
    { key: 'hair_care', icon: '🧴' },
    { key: 'styling', icon: '💇' },
    { key: 'beard_care', icon: '🧔' },
    { key: 'tools', icon: '🔧' },
    { key: 'skincare', icon: '🧖' },
];

const CATEGORY_COLORS: Record<ProductCategory, string> = {
    hair_care: 'hsl(262, 60%, 55%)',
    styling: 'hsl(210, 60%, 50%)',
    beard_care: 'hsl(160, 50%, 45%)',
    tools: 'hsl(40, 55%, 50%)',
    skincare: 'hsl(340, 60%, 55%)',
};

// ---- Helpers ----
function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-MX')}`;
}

function getStockStatus(product: Product): 'ok' | 'low' | 'out' {
    if (product.stock === 0) return 'out';
    if (product.stock <= product.minStock) return 'low';
    return 'ok';
}

// ---- Form ----
interface ProductForm {
    name: string;
    description: string;
    category: ProductCategory;
    sku: string;
    barcode: string;
    costPrice: number;
    sellPrice: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    image: string;
}

const EMPTY_FORM: ProductForm = {
    name: '', description: '', category: 'hair_care', sku: '', barcode: '',
    costPrice: 0, sellPrice: 0, stock: 0, minStock: 5, isActive: true, image: '',
};

export default function InventoryPage() {
    const { t } = useLocale();
    const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
    };

    const categoryLabel = (key: ProductCategory | 'all'): string => {
        if (key === 'all') return t('all_categories');
        const map: Record<ProductCategory, string> = {
            hair_care: t('cat_hair_care'),
            styling: t('cat_styling'),
            beard_care: t('cat_beard_care'),
            tools: t('cat_tools'),
            skincare: t('cat_skincare'),
        };
        return map[key];
    };

    const filtered = useMemo(() => {
        let list = products;
        if (activeCategory !== 'all') {
            list = list.filter(p => p.category === activeCategory);
        }
        if (stockFilter === 'low') {
            list = list.filter(p => p.stock > 0 && p.stock <= p.minStock);
        } else if (stockFilter === 'out') {
            list = list.filter(p => p.stock === 0);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q)
            );
        }
        return list;
    }, [search, activeCategory, stockFilter, products]);

    const stats = useMemo(() => {
        const total = products.length;
        const totalValue = products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0);
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
        const outOfStock = products.filter(p => p.stock === 0).length;
        return { total, totalValue, lowStock, outOfStock };
    }, [products]);

    const toggleProductActive = (productId: string) => {
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const newActive = !p.isActive;
                showToast(newActive ? t('product_activated') : t('product_deactivated'));
                return { ...p, isActive: newActive };
            }
            return p;
        }));
    };

    const openCreate = () => {
        setEditingProduct(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            description: product.description,
            category: product.category,
            sku: product.sku,
            barcode: product.barcode || '',
            costPrice: product.costPrice,
            sellPrice: product.sellPrice,
            stock: product.stock,
            minStock: product.minStock,
            isActive: product.isActive,
            image: product.image || '',
        });
        setShowModal(true);
    };

    const handleSave = () => {
        if (editingProduct) {
            setProducts(prev => prev.map(p =>
                p.id === editingProduct.id ? { ...p, ...form } : p
            ));
        } else {
            const newProduct: Product = {
                id: Date.now().toString(),
                ...form,
            };
            setProducts(prev => [...prev, newProduct]);
        }
        setShowModal(false);
        setEditingProduct(null);
        setForm(EMPTY_FORM);
    };

    const updateField = (field: keyof ProductForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const adjustStock = (productId: string, delta: number) => {
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                const newStock = Math.max(0, p.stock + delta);
                return { ...p, stock: newStock };
            }
            return p;
        }));
    };

    return (
        <>
            <Header
                title={t('inventory')}
                subtitle={`${stats.total} ${t('product_count')}`}
                actions={
                    <button className="btn btn-primary" onClick={openCreate}>
                        + {t('add_product')}
                    </button>
                }
            />

            <div className={styles.content}>
                {/* Stats Row */}
                <div className={styles.statsRow}>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.purple}`}>📦</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.total}</div>
                            <div className={styles.statLabel}>{t('total_products')}</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard}`}>
                        <div className={`${styles.statIconBg} ${styles.green}`}>💰</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{formatCurrency(stats.totalValue)}</div>
                            <div className={styles.statLabel}>{t('total_value')}</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard} ${stats.lowStock > 0 ? styles.statCardWarn : ''}`}>
                        <div className={`${styles.statIconBg} ${styles.amber}`}>⚠️</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.lowStock}</div>
                            <div className={styles.statLabel}>{t('low_stock_items')}</div>
                        </div>
                    </div>
                    <div className={`card ${styles.statCard} ${stats.outOfStock > 0 ? styles.statCardDanger : ''}`}>
                        <div className={`${styles.statIconBg} ${styles.red}`}>🚫</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.outOfStock}</div>
                            <div className={styles.statLabel}>{t('out_of_stock_items')}</div>
                        </div>
                    </div>
                </div>

                {/* Toolbar: Search + Stock Filter */}
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            className={styles.searchInput}
                            placeholder={t('search_products')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={styles.stockFilters}>
                        <button
                            className={`${styles.stockFilterBtn} ${stockFilter === 'all' ? styles.stockFilterActive : ''}`}
                            onClick={() => setStockFilter('all')}
                        >
                            {t('all')}
                        </button>
                        <button
                            className={`${styles.stockFilterBtn} ${styles.stockFilterWarn} ${stockFilter === 'low' ? styles.stockFilterActive : ''}`}
                            onClick={() => setStockFilter('low')}
                        >
                            ⚠️ {t('low_stock')} ({stats.lowStock})
                        </button>
                        <button
                            className={`${styles.stockFilterBtn} ${styles.stockFilterDanger} ${stockFilter === 'out' ? styles.stockFilterActive : ''}`}
                            onClick={() => setStockFilter('out')}
                        >
                            🚫 {t('out_of_stock')} ({stats.outOfStock})
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
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
                                    {products.filter(p => p.category === cat.key).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Product Cards Grid */}
                <div className={styles.productGrid}>
                    {filtered.map(product => {
                        const stockStatus = getStockStatus(product);
                        return (
                            <div
                                key={product.id}
                                className={`card ${styles.productCard} ${!product.isActive ? styles.productInactive : ''}`}
                            >
                                <div
                                    className={styles.cardAccent}
                                    style={{ background: CATEGORY_COLORS[product.category] }}
                                />

                                <div className={styles.cardBody}>
                                    {/* Header with image */}
                                    <div className={styles.cardHeader}>
                                        {product.image ? (
                                            <div className={styles.productImage}>
                                                <img src={product.image} alt={product.name} />
                                            </div>
                                        ) : (
                                            <div className={`${styles.productImage} ${styles.productImagePlaceholder}`}>
                                                <span>{CATEGORIES.find(c => c.key === product.category)?.icon || '📦'}</span>
                                            </div>
                                        )}
                                        <div className={styles.cardHeaderInfo}>
                                            <div className={styles.cardTitleRow}>
                                                <h3 className={styles.cardTitle}>{product.name}</h3>
                                                {stockStatus === 'out' && (
                                                    <span className={styles.outBadge}>🚫 {t('out_of_stock')}</span>
                                                )}
                                                {stockStatus === 'low' && (
                                                    <span className={styles.lowBadge}>⚠️ {t('low_stock')}</span>
                                                )}
                                            </div>
                                            <div className={styles.cardMeta}>
                                                <span
                                                    className={styles.categoryChip}
                                                    style={{
                                                        color: CATEGORY_COLORS[product.category],
                                                        background: `${CATEGORY_COLORS[product.category]}18`,
                                                    }}
                                                >
                                                    {categoryLabel(product.category)}
                                                </span>
                                                <span className={styles.skuChip}>{product.sku}</span>
                                            </div>
                                            {product.barcode && (
                                                <div className={styles.barcodeRow}>
                                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 3h3v18H3zM9 3h1v18H9zM13 3h2v18h-2zM18 3h3v18h-3z" />
                                                    </svg>
                                                    <span>{product.barcode}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className={styles.cardDesc}>{product.description}</p>

                                    {/* Price row */}
                                    <div className={styles.cardMetrics}>
                                        <div className={styles.priceTag}>{formatCurrency(product.sellPrice)}</div>
                                        <div className={styles.costTag}>
                                            {t('cost_price')}: {formatCurrency(product.costPrice)}
                                        </div>
                                        <div className={styles.marginTag}>
                                            +{Math.round(((product.sellPrice - product.costPrice) / product.costPrice) * 100)}%
                                        </div>
                                    </div>

                                    {/* Stock control */}
                                    <div className={styles.stockRow}>
                                        <div className={styles.stockLabel}>{t('stock')}:</div>
                                        <div className={styles.stockControl}>
                                            <button
                                                className={styles.stockBtn}
                                                onClick={() => adjustStock(product.id, -1)}
                                                disabled={product.stock === 0}
                                            >
                                                −
                                            </button>
                                            <span className={`${styles.stockValue} ${stockStatus === 'out' ? styles.stockDanger :
                                                stockStatus === 'low' ? styles.stockWarn : ''
                                                }`}>
                                                {product.stock}
                                            </span>
                                            <button
                                                className={styles.stockBtn}
                                                onClick={() => adjustStock(product.id, 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className={styles.stockUnit}>
                                            {t('units')} (min: {product.minStock})
                                        </span>
                                    </div>

                                    {/* Stock progress bar */}
                                    <div className={styles.stockBar}>
                                        <div
                                            className={`${styles.stockBarFill} ${stockStatus === 'out' ? styles.stockBarDanger :
                                                stockStatus === 'low' ? styles.stockBarWarn : styles.stockBarOk
                                                }`}
                                            style={{ width: `${Math.min(100, (product.stock / (product.minStock * 3)) * 100)}%` }}
                                        />
                                    </div>

                                    {/* Footer actions */}
                                    <div className={styles.cardFooter}>
                                        <label className={styles.toggleSwitch} title={t('toggle_active')}>
                                            <input
                                                type="checkbox"
                                                checked={product.isActive}
                                                onChange={() => toggleProductActive(product.id)}
                                            />
                                            <span className={styles.toggleSlider} />
                                        </label>
                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.restockBtn}
                                                onClick={() => adjustStock(product.id, 10)}
                                                title={t('restock')}
                                            >
                                                📥 +10
                                            </button>
                                            <button
                                                className={styles.editBtn}
                                                onClick={() => openEdit(product)}
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📦</span>
                        <p>{t('no_services')}</p>
                    </div>
                )}
            </div>

            {/* Toast */}
            <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
                {toast.message}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowModal(false)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingProduct ? t('edit_product') : t('add_product')}
                            </h2>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('product_name')}</label>
                                    <input
                                        className={styles.formInput}
                                        value={form.name}
                                        onChange={e => updateField('name', e.target.value)}
                                        placeholder={t('name_placeholder_product')}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('sku')}</label>
                                    <input
                                        className={styles.formInput}
                                        value={form.sku}
                                        onChange={e => updateField('sku', e.target.value)}
                                        placeholder="SKU-001"
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('barcode')}</label>
                                    <div className={styles.barcodeInputRow}>
                                        <input
                                            className={styles.formInput}
                                            value={form.barcode}
                                            onChange={e => updateField('barcode', e.target.value)}
                                            placeholder="7501234567890"
                                        />
                                        <button
                                            type="button"
                                            className={styles.scanBtn}
                                            title={t('scan_barcode')}
                                            onClick={() => showToast(t('scanner_coming_soon'))}
                                        >
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                                                <line x1="7" y1="12" x2="17" y2="12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('product_image')}</label>
                                    <div className={styles.imageUploadZone}>
                                        {form.image ? (
                                            <div className={styles.imagePreview}>
                                                <img src={form.image} alt="" />
                                                <button
                                                    type="button"
                                                    className={styles.imageRemoveBtn}
                                                    onClick={() => updateField('image', '')}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <label className={styles.imageDropArea}>
                                                <span className={styles.imageDropIcon}>📷</span>
                                                <span className={styles.imageDropText}>{t('click_to_upload')}</span>
                                                <input
                                                    type="file" accept="image/*" style={{ display: 'none' }}
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const url = URL.createObjectURL(file);
                                                            updateField('image', url);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t('product_description')}</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={form.description}
                                    onChange={e => updateField('description', e.target.value)}
                                    rows={2}
                                    placeholder={t('description_placeholder_product')}
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
                                        {(['hair_care', 'styling', 'beard_care', 'tools', 'skincare'] as ProductCategory[]).map(cat => (
                                            <option key={cat} value={cat}>{categoryLabel(cat)}</option>
                                        ))}
                                    </select>
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
                                    <label className={styles.formLabel}>{t('cost_price')} (MXN)</label>
                                    <input
                                        className={styles.formInput}
                                        type="number"
                                        min={0}
                                        value={form.costPrice}
                                        onChange={e => updateField('costPrice', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('sell_price')} (MXN)</label>
                                    <input
                                        className={styles.formInput}
                                        type="number"
                                        min={0}
                                        value={form.sellPrice}
                                        onChange={e => updateField('sellPrice', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('stock')}</label>
                                    <input
                                        className={styles.formInput}
                                        type="number"
                                        min={0}
                                        value={form.stock}
                                        onChange={e => updateField('stock', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t('min_stock')}</label>
                                    <input
                                        className={styles.formInput}
                                        type="number"
                                        min={0}
                                        value={form.minStock}
                                        onChange={e => updateField('minStock', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                {t('cancel')}
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {t('save_product')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
