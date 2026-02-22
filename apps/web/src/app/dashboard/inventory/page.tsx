/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ---- Constants & MVP Config ----

// ---- Types ----
interface Product {
    id: string;
    businessId: string;
    categoryId?: string;
    name: string;
    description: string;
    category?: ProductCategory; // Mapped dynamically if possible, else defaults for MVP
    sku: string;
    barcode: string;
    costPrice: number;
    price: number; // NestJS uses 'price' instead of 'sellPrice'
    stock: number;
    minStock: number;
    isActive: boolean;
    imageUrl?: string;
}

type ProductCategory = 'hair_care' | 'styling' | 'beard_care' | 'tools' | 'skincare';

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
    price: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    imageUrl: string;
}

const EMPTY_FORM: ProductForm = {
    name: '', description: '', category: 'hair_care', sku: '', barcode: '',
    costPrice: 0, price: 0, stock: 0, minStock: 5, isActive: true, imageUrl: '',
};

export default function InventoryPage() {
    const { t } = useLocale();
    const { activeBusinessId } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

    // ---- Lifecycle ----
    useEffect(() => {
        loadInventory();
    }, [activeBusinessId]);

    const loadInventory = async () => {
        if (!activeBusinessId) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/inventory?businessId=${activeBusinessId}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (e) {
            console.error('Failed to load inventory', e);
        }
    };

    const toggleStockFilter = (filter: 'low' | 'out') => {
        setStockFilter(prev => prev === filter ? 'all' : filter);
    };

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
        const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
        const outOfStock = products.filter(p => p.stock === 0).length;
        return { total, totalValue, lowStock, outOfStock };
    }, [products]);

    const toggleProductActive = async (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const newActive = !product.isActive;

        // Optimistic UI Update
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: newActive } : p));

        try {
            await fetchWithAuth(`${API_URL}/api/v1/inventory/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: newActive })
            });
            showToast(newActive ? t('product_activated') : t('product_deactivated'));
        } catch (error) {
            console.error('Failed to update product status');
            // Revert on error
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: !newActive } : p));
        }
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
            category: product.category || 'hair_care',
            sku: product.sku,
            barcode: product.barcode || '',
            costPrice: product.costPrice,
            price: product.price,
            stock: product.stock,
            minStock: product.minStock,
            isActive: product.isActive,
            imageUrl: product.imageUrl || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingProduct) {
                // Update
                const res = await fetchWithAuth(`${API_URL}/api/v1/inventory/${editingProduct.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...form,
                    })
                });
                if (res.ok) {
                    showToast(t('product_updated') || 'Product updated');
                }
            } else {
                // Create
                const res = await fetchWithAuth(`${API_URL}/api/v1/inventory`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...form,
                        businessId: activeBusinessId,
                        initialStock: form.stock, // For creating the initial stock
                    })
                });
                if (res.ok) {
                    showToast(t('product_added') || 'Product added');
                }
            }
            await loadInventory(); // Refetch Data
            setShowModal(false);
            setEditingProduct(null);
            setForm(EMPTY_FORM);
        } catch (error) {
            console.error('Failed to save product', error);
        }
    };

    const updateField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const adjustStock = async (productId: string, delta: number) => {
        // Optimistic UI Update
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const newStock = Math.max(0, product.stock + delta);
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));

        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/inventory/${productId}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantityDelta: delta,
                    reason: 'Manual User Adjustment'
                })
            });
            if (!res.ok) throw new Error('Failed to adjust stock');
        } catch (error) {
            console.error('Error adjusting stock', error);
            // Revert
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: product.stock } : p));
        }
    };

    const deleteProduct = async (product: Product) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/inventory/${product.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== product.id));
                setExpandedProduct(null);
                showToast(t('product_deactivated'));
            }
        } catch (error) {
            console.error('Error deleting product', error);
        }
        setConfirmDelete(null);
    };

    return (
        <>
            <Header
                title={t('inventory')}
                subtitle={`${stats.total} ${t('product_count')}`}
                actions={
                    <button className="btn btn-primary" onClick={openCreate}>+</button>
                }
            />

            <div className={styles.content}>
                {/* Stats Row — clickable filters */}
                <div className={styles.statsRow}>
                    <div
                        className={`card ${styles.statCard} ${styles.statCardClickable} ${stockFilter === 'all' ? styles.statCardSelected : ''}`}
                        onClick={() => setStockFilter('all')}
                    >
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
                    <div
                        className={`card ${styles.statCard} ${styles.statCardClickable} ${stockFilter === 'low' ? styles.statCardSelected : ''} ${stats.lowStock > 0 ? styles.statCardWarn : ''}`}
                        onClick={() => toggleStockFilter('low')}
                    >
                        <div className={`${styles.statIconBg} ${styles.amber}`}>⚠️</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.lowStock}</div>
                            <div className={styles.statLabel}>{t('low_stock_items')}</div>
                        </div>
                    </div>
                    <div
                        className={`card ${styles.statCard} ${styles.statCardClickable} ${stockFilter === 'out' ? styles.statCardSelected : ''} ${stats.outOfStock > 0 ? styles.statCardDanger : ''}`}
                        onClick={() => toggleStockFilter('out')}
                    >
                        <div className={`${styles.statIconBg} ${styles.red}`}>🚫</div>
                        <div className={styles.statInfo}>
                            <div className={styles.statValue}>{stats.outOfStock}</div>
                            <div className={styles.statLabel}>{t('out_of_stock_items')}</div>
                        </div>
                    </div>
                </div>

                {/* Toolbar: Search only */}
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

                {/* Product List — Collapsible Rows */}
                <div className={styles.productList}>
                    {filtered.map(product => {
                        const stockStatus = getStockStatus(product);
                        const isExpanded = expandedProduct === product.id;
                        return (
                            <div
                                key={product.id}
                                className={`card ${styles.productRow} ${isExpanded ? styles.productRowExpanded : ''} ${!product.isActive ? styles.productInactive : ''}`}
                            >
                                {/* Compact Row — always visible */}
                                <div
                                    className={styles.rowCompact}
                                    onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                                >
                                    <div
                                        className={styles.rowAccent}
                                        style={{ background: CATEGORY_COLORS[product.category || 'hair_care'] }}
                                    />
                                    {product.imageUrl ? (
                                        <div className={styles.rowImage}>
                                            <img src={product.imageUrl} alt={product.name} />
                                        </div>
                                    ) : (
                                        <div className={`${styles.rowImage} ${styles.rowImagePlaceholder}`}>
                                            <span>{CATEGORIES.find(c => c.key === (product.category || 'hair_care'))?.icon || '📦'}</span>
                                        </div>
                                    )}
                                    <div className={styles.rowInfo}>
                                        <div className={styles.rowName}>{product.name}</div>
                                        <div className={styles.rowMeta}>
                                            <span
                                                className={styles.categoryChip}
                                                style={{
                                                    color: CATEGORY_COLORS[product.category || 'hair_care'],
                                                    background: `${CATEGORY_COLORS[product.category || 'hair_care']}18`,
                                                }}
                                            >
                                                {categoryLabel(product.category || 'hair_care')}
                                            </span>
                                            <span className={styles.skuChip}>{product.sku}</span>
                                        </div>
                                    </div>
                                    <div className={styles.rowPrice}>{formatCurrency(product.price)}</div>
                                    <div className={`${styles.rowStock} ${stockStatus === 'out' ? styles.rowStockDanger :
                                        stockStatus === 'low' ? styles.rowStockWarn : styles.rowStockOk
                                        }`}>
                                        <span className={styles.rowStockValue}>{product.stock}</span>
                                        <span className={styles.rowStockLabel}>{t('units')}</span>
                                    </div>
                                    <div className={`${styles.rowChevron} ${isExpanded ? styles.rowChevronOpen : ''}`}>
                                        ▾
                                    </div>
                                </div>

                                {/* Expanded Details — collapsible */}
                                <div className={`${styles.rowDetails} ${isExpanded ? styles.rowDetailsOpen : ''}`}>
                                    <div className={styles.rowDetailsInner}>
                                        {/* Description */}
                                        <p className={styles.cardDesc}>{product.description}</p>

                                        {/* Info chips */}
                                        <div className={styles.detailChips}>
                                            {product.barcode && (
                                                <div className={styles.barcodeRow}>
                                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 3h3v18H3zM9 3h1v18H9zM13 3h2v18h-2zM18 3h3v18h-3z" />
                                                    </svg>
                                                    <span>{product.barcode}</span>
                                                </div>
                                            )}
                                            <div className={styles.costTag}>
                                                {t('cost_price')}: {formatCurrency(product.costPrice)}
                                            </div>
                                            <div className={styles.marginTag}>
                                                +{Math.round(((product.price - product.costPrice) / product.costPrice) * 100)}%
                                            </div>
                                        </div>

                                        {/* Stock control */}
                                        <div className={styles.stockRow}>
                                            <div className={styles.stockLabel}>{t('stock')}:</div>
                                            <div className={styles.stockControl}>
                                                <button
                                                    className={styles.stockBtn}
                                                    onClick={(e) => { e.stopPropagation(); adjustStock(product.id, -1); }}
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
                                                    onClick={(e) => { e.stopPropagation(); adjustStock(product.id, 1); }}
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

                                        {/* Actions */}
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
                                                    ✏️ {t('edit_product')}
                                                </button>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => setConfirmDelete(product)}
                                                >
                                                    🗑️ {t('delete')}
                                                </button>
                                            </div>
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
            <ConfirmDialog
                open={!!confirmDelete}
                title="Eliminar producto"
                message={confirmDelete ? `¿Eliminar "${confirmDelete.name}" del inventario?` : ''}
                confirmLabel="Eliminar"
                variant="danger"
                onConfirm={() => { if (confirmDelete) { setProducts(prev => prev.filter(p => p.id !== confirmDelete.id)); setExpandedProduct(null); showToast(t('product_deactivated')); } setConfirmDelete(null); }}
                onCancel={() => setConfirmDelete(null)}
            />
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
                                        {form.imageUrl ? (
                                            <div className={styles.imagePreview}>
                                                <img src={form.imageUrl} alt="" />
                                                <button
                                                    type="button"
                                                    className={styles.imageRemoveBtn}
                                                    onClick={() => updateField('imageUrl', '')}
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
                                                            updateField('imageUrl', url);
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
                                        onChange={e => updateField('category', e.target.value as ProductCategory)}
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
                                        value={form.price}
                                        onChange={e => updateField('price', parseInt(e.target.value) || 0)}
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
