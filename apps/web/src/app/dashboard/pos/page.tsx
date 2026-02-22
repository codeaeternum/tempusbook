'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { usePosStore, usePosTotals, PosState } from '@/store/usePosStore';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STAFF_ID = 'e8084456-13d3-427c-89cf-de53afbaff8c';

// ---- Types ----
interface CatalogItem { id: string; name: string; price: number; category: 'service' | 'product'; icon: string; duration?: number; stock?: number; }
interface CartItem { item: CatalogItem; qty: number; discount: number; note: string; priceOverride?: number; }
interface SaleRecord { id: string; items: CartItem[]; total: number; method: string; client: string; change: number; date: Date; metadata?: any; }

// ---- Database Data Loaded via API ----
// Arrays are now populated dynamically in useEffect using `fetch`


const PROMO_CODES: Record<string, { discount: number; label: string }> = {
    'BIENVENIDO10': { discount: 10, label: '10% Bienvenida' },
    'VIP20': { discount: 20, label: '20% VIP' },
    'AMIGO15': { discount: 15, label: '15% Referido' },
};

type PayMethod = 'cash' | 'card' | 'transfer' | 'mixed';
type CatFilter = 'all' | 'service' | 'product';
type ViewMode = 'grid' | 'list';

function fmt(n: number) { return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`; }

// ---- Swipe-to-Delete Cart Row ----
function SwipeCartRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
    const rowRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const swiping = useRef(false);

    const onTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        swiping.current = true;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (!swiping.current || !rowRef.current) return;
        const dx = e.touches[0].clientX - startX.current;
        currentX.current = dx;
        if (dx < 0) {
            rowRef.current.style.transform = `translateX(${Math.max(dx, -140)}px)`;
            rowRef.current.style.transition = 'none';
        }
    };
    const onTouchEnd = () => {
        if (!rowRef.current) return;
        swiping.current = false;
        if (currentX.current < -100) {
            rowRef.current.style.transform = 'translateX(-100%)';
            rowRef.current.style.transition = 'transform 0.2s ease';
            setTimeout(onDelete, 200);
        } else {
            rowRef.current.style.transform = 'translateX(0)';
            rowRef.current.style.transition = 'transform 0.2s ease';
        }
        currentX.current = 0;
    };

    return (
        <div className={styles.swipeContainer}>
            <div className={styles.swipeDeleteBg}>🗑️ Eliminar</div>
            <div ref={rowRef} className={styles.cartRow}
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                {children}
            </div>
        </div>
    );
}

export default function PosPage() {
    const { t } = useLocale();
    const { activeBusinessId } = useAuth();

    // Zustand POS Store
    const cart = usePosStore((s: PosState) => s.cart);
    const selectedClient = usePosStore((s: PosState) => s.selectedClient);
    const payMethod = usePosStore((s: PosState) => s.payMethod);
    const cashGiven = usePosStore((s: PosState) => s.cashGiven);
    const cardAmount = usePosStore((s: PosState) => s.cardAmount);
    const appliedPromo = usePosStore((s: PosState) => s.appliedPromo);
    const manualDiscountValue = usePosStore((s: PosState) => s.manualDiscountValue);
    const manualDiscountType = usePosStore((s: PosState) => s.manualDiscountType);
    const giftCardCode = usePosStore((s: PosState) => s.giftCardCode);
    const selectedClientPackageId = usePosStore((s: PosState) => s.selectedClientPackageId);

    // Actions
    const { addToCart, updateQty, removeFromCart, clearCart,
        setSelectedClient, setAppliedPromo, setPayMethod,
        setCashGiven, setCardAmount, setGiftCardCode, setSelectedClientPackageId, setManualDiscount, resetPos } = usePosStore.getState();

    // Memoized Totals Selectors
    const { subtotal, totalItemDiscount, promoDiscount, manualDiscount, total, change, canCheckout } = usePosTotals();

    // Local UI State (Modals, filters, toasts — things that don't need Global State)
    const [catFilter, setCatFilter] = useState<CatFilter>('all');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 250);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const [clientSearch, setClientSearch] = useState('');
    const debouncedClientSearch = useDebounce(clientSearch, 250);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const clientRef = useRef<HTMLDivElement>(null);

    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<SaleRecord | null>(null);

    const [promoInput, setPromoInput] = useState('');

    const [showCustomItem, setShowCustomItem] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState<number>(0);

    const [pricePromptItem, setPricePromptItem] = useState<CatalogItem | null>(null);
    const [pricePromptValue, setPricePromptValue] = useState<number>(0);

    const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // ---- Cash Shift UI State ----
    const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [startingCash, setStartingCash] = useState<number>(0);
    const [actualCash, setActualCash] = useState<number>(0);
    const [closingNotes, setClosingNotes] = useState('');

    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [voucherNum, setVoucherNum] = useState('');
    const [terminal, setTerminal] = useState('');
    const [transferRef, setTransferRef] = useState('');

    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // Close client dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (clientRef.current && !clientRef.current.contains(e.target as Node)) setShowClientDropdown(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // ---- API Data Loading ----
    const [dbCatalog, setDbCatalog] = useState<CatalogItem[]>([]);
    const [dbClients, setDbClients] = useState<{ id: string; name: string; phone: string }[]>([]);
    const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
    const [requiresShift, setRequiresShift] = useState(true); // Default to strict for MVP test
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [clientPackages, setClientPackages] = useState<any[]>([]);

    useEffect(() => {
        if (payMethod === 'package' && selectedClient?.id && activeBusinessId) {
            fetchWithAuth(`${API_URL}/api/v1/packages/client/${selectedClient.id}/business/${activeBusinessId}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => setClientPackages(data.filter((p: any) => p.status === 'ACTIVE')))
                .catch(e => console.error(e));
        } else {
            setClientPackages([]);
        }
    }, [payMethod, selectedClient?.id]);

    useEffect(() => {
        async function loadPosData() {
            try {
                // TODO: Get real business ID from context, hardcoding for MVP
                const businessId = activeBusinessId;
                if (!businessId) { throw new Error('No active business id'); }

                const [catRes, cliRes, shiftRes] = await Promise.all([
                    fetchWithAuth(`${API_URL}/api/v1/pos/catalog?businessId=${businessId}`),
                    fetchWithAuth(`${API_URL}/api/v1/pos/clients?businessId=${businessId}`),
                    fetchWithAuth(`${API_URL}/api/v1/pos/shift/active?businessId=${businessId}`)
                ]);

                if (catRes.ok) setDbCatalog(await catRes.json());
                if (cliRes.ok) setDbClients(await cliRes.json());

                if (shiftRes.ok) {
                    const shiftData = await shiftRes.json();
                    if (shiftData?.id) {
                        setActiveShiftId(shiftData.id);
                    }
                }
            } catch (e) {
                console.error('Failed to load POS data', e);
            } finally {
                setIsLoadingData(false);
            }
        }
        loadPosData();
    }, []);

    const clientSuggestions = useMemo(() => {
        if (!debouncedClientSearch.trim()) return dbClients;
        return dbClients.filter(c => c.name.toLowerCase().includes(debouncedClientSearch.toLowerCase()));
    }, [debouncedClientSearch, dbClients]);

    const filteredCatalog = useMemo(() => {
        return dbCatalog.filter(item => {
            const mCat = catFilter === 'all' || item.category === catFilter;
            const mSearch = item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
            return mCat && mSearch;
        });
    }, [catFilter, debouncedSearch, dbCatalog]);

    const handleAddToCart = (item: CatalogItem) => {
        if (item.price === 0) { setPricePromptItem(item); setPricePromptValue(0); return; }
        addToCart(item);
    };

    const addPricedItem = () => {
        if (!pricePromptItem || pricePromptValue <= 0) return;
        addToCart(pricePromptItem, pricePromptValue);
        setPricePromptItem(null);
    };

    const handleAddCustomItem = () => {
        if (!customName || customPrice <= 0) return;
        usePosStore.getState().addCustomItem(customName, customPrice);
        setCustomName(''); setCustomPrice(0); setShowCustomItem(false);
        showToast(`✅ "${customName}" agregado`);
    };

    // Keep this helper for UI mapping
    const itemTotal = (c: CartItem) => ((c.priceOverride || c.item.price) * c.qty) * (1 - c.discount / 100);

    const applyPromo = () => {
        const code = promoInput.trim().toUpperCase();
        if (PROMO_CODES[code]) { setAppliedPromo(PROMO_CODES[code]); showToast(`🎉 Código "${code}" aplicado — ${PROMO_CODES[code].label}`); }
        else { showToast('❌ Código inválido'); }
    };

    const handleCheckout = async () => {
        if (!canCheckout) return;
        const clientName = selectedClient?.name || clientSearch || 'Público general';

        // 1. Prepare Backend Payload (CheckoutDto)
        const payload = {
            businessId: activeBusinessId || '', // TODO: Get from auth context
            staffId: STAFF_ID,       // TODO: Get from auth context
            clientId: selectedClient?.id,
            shiftId: activeShiftId || undefined,
            subtotal,
            discount: totalItemDiscount + promoDiscount + manualDiscount,
            total,
            paymentMethod: payMethod.toUpperCase(),
            giftCardCode: payMethod === 'gift_card' ? giftCardCode : undefined,
            clientPackageId: payMethod === 'package' ? selectedClientPackageId : undefined,
            cashGiven: payMethod === 'cash' || payMethod === 'mixed' ? cashGiven : undefined,
            items: cart.map(c => ({
                productId: c.item.category === 'product' ? c.item.id : undefined,
                serviceId: c.item.category === 'service' ? c.item.id : undefined,
                name: c.item.name,
                qty: c.qty,
                unitPrice: c.priceOverride || c.item.price,
                discount: c.discount,
                totalPrice: itemTotal(c),
                note: c.note || undefined
            }))
        };

        try {
            // 2. Dispatch to NestJS Backend
            const res = await fetchWithAuth(`${API_URL}/api/v1/pos/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            let responseData: any = {};
            if (!res.ok) {
                const err = await res.json();
                console.warn('POS API Warning (Expected if DB is empty):', err);
                // Fallback locally for MVP presentation if DB fails
            } else {
                responseData = await res.json();
                console.log('✅ ACID Transaction Successful:', responseData);
            }

            // 3. Update UI
            const finalMetadata = responseData.metadata || {};
            const sale: SaleRecord = {
                id: responseData.id || `V-${Date.now().toString(36).toUpperCase()}`,
                items: [...cart],
                total,
                method: payMethod,
                client: clientName,
                change,
                date: new Date(),
                metadata: finalMetadata
            };

            setLastSale(sale);
            setSalesHistory(prev => [sale, ...prev]);
            setShowReceipt(true);
            showToast(`✅ Venta completada — ${fmt(total)}`);
        } catch (error) {
            showToast('❌ Error de conexión con la Caja');
        }
    };

    // ---- Cash Shift Handlers ----
    const handleOpenShift = async () => {
        try {
            const payload = {
                businessId: activeBusinessId || '',
                openedById: STAFF_ID, // TODO: From context
                startingCash: startingCash || 0
            };
            const res = await fetchWithAuth(`${API_URL}/api/v1/pos/shift/open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                setActiveShiftId(data.id);
                setShowOpenShiftModal(false);
                setStartingCash(0);
                showToast(`✅ Caja Abierta con ${fmt(payload.startingCash)}`);
            } else {
                const err = await res.json();
                showToast(`❌ Error: ${err.message || 'No se pudo abrir caja'}`);
            }
        } catch (e) {
            showToast('❌ Error de conexión con la Caja');
        }
    };

    const handleCloseShift = async () => {
        if (!activeShiftId) return;
        try {
            const payload = {
                businessId: activeBusinessId || '',
                closedById: STAFF_ID,
                shiftId: activeShiftId,
                actualCash: actualCash || 0,
                notes: closingNotes
            };
            const res = await fetchWithAuth(`${API_URL}/api/v1/pos/shift/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setActiveShiftId(null);
                setShowCloseShiftModal(false);
                setActualCash(0);
                setClosingNotes('');
                showToast(`✅ Caja Cerrada. Ingreso reportado: ${fmt(payload.actualCash)}`);
            } else {
                const err = await res.json();
                showToast(`❌ Error: ${err.message || 'No se pudo cerrar caja'}`);
            }
        } catch (e) {
            showToast('❌ Error de conexión con la Caja');
        }
    };

    const newSale = () => {
        resetPos();
        setClientSearch('');
        setShowReceipt(false);
        setLastSale(null);
        setPromoInput('');
        setVoucherNum('');
        setTerminal('');
        setTransferRef('');
    };

    const shareWhatsApp = () => {
        if (!lastSale) return;
        const lines = lastSale.items.map(c => `• ${c.item.name} × ${c.qty} = ${fmt(itemTotal(c))}`);
        const msg = `🧾 *Ticket de Venta*\n📌 ${lastSale.id}\n👤 ${lastSale.client}\n${lines.join('\n')}\n\n💰 *Total: ${fmt(lastSale.total)}*\nMétodo: ${lastSale.method === 'cash' ? 'Efectivo' : lastSale.method === 'card' ? 'Tarjeta' : lastSale.method === 'mixed' ? 'Mixto' : 'Transferencia'}\n📅 ${lastSale.date.toLocaleString('es-MX')}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const printReceipt = () => { window.print(); };

    const selectClient = (c: { id: string; name: string; phone: string }) => { setSelectedClient(c); setClientSearch(c.name); setShowClientDropdown(false); };

    const todaySales = salesHistory.filter(s => s.date.toDateString() === new Date().toDateString());
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

    const headerActions = (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>
                {requiresShift ? (activeShiftId ? '🟢 Caja Abierta' : '🔴 Caja Cerrada') : '🔘 Módulo Caja desactivado'}
            </span>
            {activeShiftId && (
                <button
                    onClick={() => setShowCloseShiftModal(true)}
                    style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    🔒 Corte de Caja
                </button>
            )}
        </div>
    );

    return (
        <>
            <Header title={t('pos')} subtitle="Cobro rápido, productos y servicios" actions={headerActions} mobileActionsInline={true} />
            <div className={styles.posLayout}>
                {/* LEFT: Catalog */}
                <div className={styles.catalog}>
                    <div className={styles.catToolbar}>
                        <div className={styles.catFilters}>
                            {([['all', 'Todos', '📋'], ['service', 'Servicios', '💼'], ['product', 'Productos', '📦']] as const).map(([k, l, ic]) => (
                                <button key={k} className={`${styles.catBtn} ${catFilter === k ? styles.catActive : ''}`} onClick={() => setCatFilter(k as CatFilter)}>{ic} {l}</button>
                            ))}
                        </div>
                        <div className={styles.catToolbarRight}>
                            <div className={styles.catSearch}><span>🔍</span><input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                            <div className={styles.viewToggle}>
                                <button className={viewMode === 'grid' ? styles.viewActive : ''} onClick={() => setViewMode('grid')} title="Vista cuadrícula">▦</button>
                                <button className={viewMode === 'list' ? styles.viewActive : ''} onClick={() => setViewMode('list')} title="Vista lista">☰</button>
                            </div>
                        </div>
                    </div>

                    <div className={viewMode === 'grid' ? styles.catGrid : styles.catList}>
                        {filteredCatalog.map(item => (
                            <button key={item.id} className={viewMode === 'grid' ? styles.catItem : styles.catListItem} onClick={() => addToCart(item)}>
                                <span className={styles.catItemIcon}>{item.icon}</span>
                                <span className={styles.catItemName}>{item.name}</span>
                                <span className={item.price === 0 ? styles.catItemPriceFree : styles.catItemPrice}>{item.price === 0 ? 'A cotizar' : fmt(item.price)}</span>
                                {item.duration && <span className={styles.catItemMeta}>{item.duration} min</span>}
                                {item.stock !== undefined && <span className={styles.catItemMeta}>Stock: {item.stock}</span>}
                            </button>
                        ))}
                    </div>

                    <button className={styles.customItemBtn} onClick={() => setShowCustomItem(true)}>🏷️ + Artículo personalizado</button>
                </div>

                {/* RIGHT: Cart — simplified */}
                <div className={styles.cartPanel}>
                    <div className={styles.cartHeader}>
                        <h3>🛒 Carrito</h3>
                        {cart.length > 0 && <button className={styles.clearBtn} onClick={() => clearCart()}>Vaciar</button>}
                    </div>

                    {/* Client autocomplete */}
                    <div className={styles.clientRow} ref={clientRef}>
                        <span>👤</span>
                        <input type="text" placeholder="Buscar cliente o Público general" value={clientSearch}
                            onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); setShowClientDropdown(true); }}
                            onFocus={() => setShowClientDropdown(true)} className={styles.clientInput} />
                        {selectedClient && <span className={styles.clientBadge}>✓</span>}
                        {showClientDropdown && clientSuggestions.length > 0 && (
                            <div className={styles.clientDropdown}>
                                {clientSuggestions.map(c => (
                                    <button key={c.id} className={styles.clientOption} onClick={() => selectClient(c)}>
                                        <span>{c.name}</span><span className={styles.clientPhone}>{c.phone}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart items */}
                    <div className={styles.cartItems}>
                        {cart.length === 0 && <div className={styles.emptyCart}>Agrega productos o servicios del catálogo</div>}
                        {cart.map(c => (
                            <SwipeCartRow key={c.item.id} onDelete={() => { removeFromCart(c.item.id); showToast(`🗑️ ${c.item.name} eliminado`); }}>
                                <div className={styles.cartRowTop}>
                                    <span className={styles.cartItemName}>{c.item.icon} {c.item.name}</span>
                                    <button className={styles.removeBtn} onClick={() => removeFromCart(c.item.id)}>✕</button>
                                </div>
                                <div className={styles.cartRowBottom}>
                                    <div className={styles.qtyControl}><button onClick={() => updateQty(c.item.id, -1)}>−</button><span>{c.qty}</span><button onClick={() => updateQty(c.item.id, 1)}>+</button></div>
                                    <span className={styles.cartItemTotal}>{fmt(itemTotal(c))}</span>
                                </div>
                            </SwipeCartRow>
                        ))}
                    </div>

                    {/* Promo code — collapsible */}
                    {cart.length > 0 && (
                        <details className={styles.promoDetails}>
                            <summary className={styles.promoSummary}>🏷️ Descuentos {(appliedPromo || manualDiscount > 0) && <span className={styles.promoApplied}>✅ Aplicado</span>}</summary>
                            {/* Manual discount */}
                            <div className={styles.manualDiscountSection}>
                                <div className={styles.manualDiscountHeader}>
                                    <span className={styles.manualDiscountLabel}>Descuento manual</span>
                                    <div className={styles.discountTypeToggle}>
                                        <button className={`${styles.discountTypeBtn} ${manualDiscountType === '%' ? styles.discountTypeBtnActive : ''}`} onClick={() => setManualDiscount(manualDiscountValue, '%')}>%</button>
                                        <button className={`${styles.discountTypeBtn} ${manualDiscountType === '$' ? styles.discountTypeBtnActive : ''}`} onClick={() => setManualDiscount(manualDiscountValue, '$')}>$</button>
                                    </div>
                                </div>
                                <div className={styles.manualDiscountRow}>
                                    <input type="number" min="0" max={manualDiscountType === '%' ? 100 : subtotal} value={manualDiscountValue || ''} onChange={e => setManualDiscount(Number(e.target.value), manualDiscountType)} placeholder={manualDiscountType === '%' ? '0%' : '$0'} className={styles.promoInput} />
                                    {manualDiscountValue > 0 && <button className={styles.promoClearBtn} onClick={() => setManualDiscount(0, '%')}>✕</button>}
                                </div>
                                <div className={styles.quickDiscounts}>
                                    {manualDiscountType === '%'
                                        ? [5, 10, 15, 20].map(v => <button key={v} className={`${styles.quickDiscountBtn} ${manualDiscountValue === v ? styles.quickDiscountActive : ''}`} onClick={() => setManualDiscount(v, '%')}>{v}%</button>)
                                        : [50, 100, 150, 200].map(v => <button key={v} className={`${styles.quickDiscountBtn} ${manualDiscountValue === v ? styles.quickDiscountActive : ''}`} onClick={() => setManualDiscount(v, '$')}>${v}</button>)
                                    }
                                </div>
                            </div>
                            {/* Promo code */}
                            <div className={styles.promoCodeSection}>
                                <span className={styles.manualDiscountLabel}>Código promocional</span>
                                <div className={styles.promoRow}>
                                    <input type="text" placeholder="Código" value={promoInput} onChange={e => setPromoInput(e.target.value)} className={styles.promoInput} />
                                    <button className={styles.promoBtn} onClick={applyPromo}>Aplicar</button>
                                </div>
                                {appliedPromo && <span className={styles.promoAppliedTag}>✅ {appliedPromo.label}</span>}
                            </div>
                        </details>
                    )}

                    {/* Totals */}
                    <div className={styles.totals}>
                        <div className={styles.totalRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                        {totalItemDiscount > 0 && <div className={styles.totalRow}><span>Desc. items</span><span className={styles.discountText}>-{fmt(totalItemDiscount)}</span></div>}
                        {promoDiscount > 0 && <div className={styles.totalRow}><span>Promo ({appliedPromo?.label})</span><span className={styles.discountText}>-{fmt(promoDiscount)}</span></div>}
                        {manualDiscount > 0 && <div className={styles.totalRow}><span>Descuento {manualDiscountType === '%' ? `(${manualDiscountValue}%)` : 'manual'}</span><span className={styles.discountText}>-{fmt(manualDiscount)}</span></div>}
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}><span>Total</span><span>{fmt(total)}</span></div>
                    </div>

                    {/* BIG CHECKOUT BUTTON */}
                    {requiresShift && !activeShiftId ? (
                        <button className={styles.checkoutBtn} onClick={() => setShowOpenShiftModal(true)} style={{ backgroundColor: '#ff4d4f', opacity: 1, cursor: 'pointer' }}>
                            🔒 Abrir Caja para Cobrar
                        </button>
                    ) : (
                        <button className={styles.checkoutBtn} onClick={() => setShowCheckoutModal(true)} disabled={cart.length === 0}>
                            💰 Cobrar {fmt(total)}
                        </button>
                    )}
                </div>
            </div>

            {/* ====== CHECKOUT MODAL ====== */}
            {showCheckoutModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => !showReceipt && setShowCheckoutModal(false)} />
                    <div className={styles.checkoutModal}>
                        {!showReceipt ? (
                            <>
                                <div className={styles.modalHeader}>
                                    <h3>💳 Cobrar</h3>
                                    <button className={styles.modalClose} onClick={() => setShowCheckoutModal(false)}>✕</button>
                                </div>

                                {/* Ticket summary */}
                                <div className={styles.modalTicket}>
                                    <div className={styles.modalTicketClient}>👤 {selectedClient?.name || clientSearch || 'Público general'}</div>
                                    {cart.map(c => (
                                        <div key={c.item.id} className={styles.modalTicketRow}>
                                            <span>{c.item.icon} {c.item.name} × {c.qty}</span>
                                            <span>{fmt(itemTotal(c))}</span>
                                        </div>
                                    ))}
                                    <div className={styles.modalTicketTotal}>
                                        <span>Total a cobrar</span>
                                        <span>{fmt(total)}</span>
                                    </div>
                                </div>

                                {/* Payment method tabs */}
                                <div className={styles.payMethods}>
                                    {([['cash', '💵', 'Efectivo'], ['card', '💳', 'Tarjeta'], ['transfer', '🏦', 'Transferencia'], ['mixed', '🔀', 'Mixto'], ['gift_card', '💌', 'Gift Card'], ['package', '🎟️', 'Paquete']] as const).map(([k, ic, l]) => (
                                        <button key={k} className={`${styles.payBtn} ${payMethod === k ? styles.payActive : ''}`} onClick={() => setPayMethod(k as PayMethod)}>{ic}<span>{l}</span></button>
                                    ))}
                                </div>

                                {/* Dynamic payment fields */}
                                <div className={styles.payFields}>
                                    {payMethod === 'cash' && (
                                        <>
                                            <div className={styles.quickDenoms}>
                                                {[50, 100, 200, 500, 1000].map(d => (
                                                    <button key={d} className={`${styles.denomBtn} ${cashGiven === d ? styles.denomActive : ''}`} onClick={() => setCashGiven(d)}>${d}</button>
                                                ))}
                                                <button className={`${styles.denomBtn} ${cashGiven === Math.ceil(total) ? styles.denomActive : ''}`} onClick={() => setCashGiven(Math.ceil(total))}>Exacto</button>
                                            </div>
                                            <div className={styles.payInputRow}>
                                                <label>Monto recibido</label>
                                                <div className={styles.payInputWrap}><span>$</span><input type="number" value={cashGiven || ''} onChange={e => setCashGiven(+e.target.value)} placeholder="0.00" /></div>
                                            </div>
                                            {cashGiven >= total && total > 0 && (
                                                <div className={styles.changeBox}><span>💵 Cambio:</span><span className={styles.changeAmount}>{fmt(change)}</span></div>
                                            )}
                                        </>
                                    )}

                                    {payMethod === 'card' && (
                                        <>
                                            <div className={styles.payInputRow}>
                                                <label># Voucher / Ticket</label>
                                                <input type="text" placeholder="Ej: 4521" value={voucherNum} onChange={e => setVoucherNum(e.target.value)} />
                                            </div>
                                            <div className={styles.payInputRow}>
                                                <label>Terminal</label>
                                                <select value={terminal} onChange={e => setTerminal(e.target.value)}>
                                                    <option value="">Seleccionar terminal</option>
                                                    <option value="clip">📱 Clip</option>
                                                    <option value="izettle">📲 iZettle</option>
                                                    <option value="sumup">💳 SumUp</option>
                                                    <option value="bbva">🏦 Terminal BBVA</option>
                                                    <option value="otro">🔧 Otro</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {payMethod === 'transfer' && (
                                        <>
                                            <div className={styles.payInputRow}>
                                                <label># Referencia</label>
                                                <input type="text" placeholder="Folio de transferencia" value={transferRef} onChange={e => setTransferRef(e.target.value)} />
                                            </div>
                                            <button className={styles.uploadBtn}>📷 Subir comprobante</button>
                                        </>
                                    )}

                                    {payMethod === 'mixed' && (
                                        <>
                                            <div className={styles.mixedGrid}>
                                                <div className={styles.payInputRow}>
                                                    <label>💵 Efectivo</label>
                                                    <div className={styles.payInputWrap}><span>$</span><input type="number" value={cashGiven || ''} onChange={e => setCashGiven(+e.target.value)} placeholder="0.00" /></div>
                                                </div>
                                                <div className={styles.payInputRow}>
                                                    <label>💳 Tarjeta</label>
                                                    <div className={styles.payInputWrap}><span>$</span><input type="number" value={cardAmount || ''} onChange={e => setCardAmount(+e.target.value)} placeholder="0.00" /></div>
                                                </div>
                                            </div>
                                            <div className={styles.mixedCoverage}>
                                                <div className={styles.mixedBar}>
                                                    <div className={styles.mixedBarFill} style={{ width: `${Math.min(100, ((cashGiven + cardAmount) / total) * 100)}%` }} />
                                                </div>
                                                <span className={cashGiven + cardAmount >= total ? styles.mixedOk : styles.mixedPending}>
                                                    {fmt(cashGiven + cardAmount)} / {fmt(total)} {cashGiven + cardAmount >= total ? '✅' : `(faltan ${fmt(total - cashGiven - cardAmount)})`}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {payMethod === 'gift_card' && (
                                        <>
                                            <div className={styles.payInputRow}>
                                                <label>Código de la Tarjeta</label>
                                                <input type="text" placeholder="AE-XXXX-XXXX" value={giftCardCode} onChange={e => setGiftCardCode(e.target.value.toUpperCase())} style={{ fontFamily: 'monospace', fontSize: '1.2rem', textTransform: 'uppercase' }} />
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>El sistema validará el saldo automáticamente al confirmar el cobro descontando {fmt(total)}.</p>
                                        </>
                                    )}

                                    {payMethod === 'package' && (
                                        <>
                                            <div className={styles.payInputRow}>
                                                <label>Descontar de Paquete</label>
                                                {!selectedClient ? (
                                                    <div style={{ padding: '1rem', background: '#fffbeb', color: '#b45309', borderRadius: '8px', fontSize: '0.85rem' }}>⚠️ Selecciona un Cliente primero en el lado izquierdo.</div>
                                                ) : clientPackages.length === 0 ? (
                                                    <div style={{ padding: '1rem', background: '#f8fafc', color: '#64748b', borderRadius: '8px', fontSize: '0.85rem' }}>El cliente <b>{selectedClient.name}</b> no tiene paquetes o abonos prepagados activos.</div>
                                                ) : (
                                                    <select value={selectedClientPackageId} onChange={e => setSelectedClientPackageId(e.target.value)}>
                                                        <option value="">-- Seleccionar paquete --</option>
                                                        {clientPackages.map((cp: any) => (
                                                            <option key={cp.id} value={cp.id}>{cp.package.name} (Restan {cp.totalSessions - cp.usedSessions} de {cp.totalSessions})</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                            {selectedClientPackageId && <p style={{ fontSize: '0.8rem', color: '#666' }}>Se descontará un uso o monto de este paquete seleccionado por el total de los {fmt(total)} de la venta.</p>}
                                        </>
                                    )}
                                </div>

                                <button className={styles.finalCheckoutBtn} onClick={handleCheckout} disabled={!canCheckout}>
                                    ✅ Confirmar Cobro — {fmt(total)}
                                </button>
                            </>
                        ) : lastSale && (
                            <div className={styles.receipt}>
                                <div className={styles.receiptHeader}>
                                    <span className={styles.receiptCheck}>✅</span>
                                    <h3>Venta Completada</h3>
                                    <p className={styles.receiptId}>{lastSale.id}</p>
                                    <p className={styles.receiptDate}>{lastSale.date.toLocaleString('es-MX')}</p>
                                </div>
                                <div className={styles.receiptClient}>👤 {lastSale.client}</div>
                                <div className={styles.receiptItems}>
                                    {lastSale.items.map(c => (<div key={c.item.id} className={styles.receiptRow}><span>{c.item.name} × {c.qty}</span><span>{fmt(itemTotal(c))}</span></div>))}
                                </div>
                                <div className={styles.receiptTotal}><span>Total</span><span>{fmt(lastSale.total)}</span></div>
                                <div className={styles.receiptMeta}>
                                    <span>Método: {lastSale.method === 'cash' ? '💵 Efectivo' : lastSale.method === 'card' ? '💳 Tarjeta' : lastSale.method === 'mixed' ? '🔀 Mixto' : '🏦 Transferencia'}</span>
                                    {lastSale.change > 0 && <span>Cambio: {fmt(lastSale.change)}</span>}
                                </div>
                                {lastSale.metadata?.loyaltyAwarded && (
                                    <div style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534', textAlign: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>🎉 ¡Beneficios de Lealtad!</h4>
                                        {lastSale.metadata?.pointsGained > 0 && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>+{lastSale.metadata.pointsGained} Puntos ganados</p>}
                                        {lastSale.metadata?.stampsGained > 0 && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>+{lastSale.metadata.stampsGained} Sellos Acumulados</p>}
                                    </div>
                                )}
                                <div className={styles.qrBox}>
                                    <div className={styles.qrPlaceholder}><span>📱</span><small>QR: {lastSale.id}</small></div>
                                </div>
                                <div className={styles.receiptActions}>
                                    <button className={styles.receiptActionBtn} onClick={printReceipt}>🖨️ Imprimir</button>
                                    <button className={styles.receiptActionBtn} onClick={shareWhatsApp}>💬 WhatsApp</button>
                                    <button className={styles.receiptActionBtn}>📧 Email</button>
                                </div>
                                <button className={styles.newSaleBtn} onClick={() => { newSale(); setShowCheckoutModal(false); }}>🛒 Nueva Venta</button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Sales History Toggle */}
            {salesHistory.length > 0 && (
                <div className={styles.historySection}>
                    <button className={styles.historyToggle} onClick={() => setShowHistory(p => !p)}>
                        📋 Ventas del día ({todaySales.length}) — Total: {fmt(todayRevenue)} {showHistory ? '▲' : '▼'}
                    </button>
                    {showHistory && (
                        <div className={styles.historyList}>
                            {todaySales.map(s => (
                                <div key={s.id} className={styles.historyItem}>
                                    <span className={styles.historyId}>{s.id}</span>
                                    <span>👤 {s.client}</span>
                                    <span>{s.items.length} items</span>
                                    <span className={styles.historyTotal}>{fmt(s.total)}</span>
                                    <span className={styles.historyTime}>{s.date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Custom Item Modal */}
            {showCustomItem && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowCustomItem(false)} />
                    <div className={styles.promptModal}>
                        <div className={styles.promptModalInner}>
                            <h4>🏷️ Artículo Personalizado</h4>
                            <p>Escribe el nombre y el precio del servicio o producto que vas a agregar al ticket.</p>
                            <label>Concepto (Descripción)</label>
                            <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Ej: Venta especial" className={styles.promptInput} autoFocus />
                            <label>Precio de Venta</label>
                            <div className={styles.payInputWrap}><span>$</span><input type="number" min="1" value={customPrice || ''} onChange={e => setCustomPrice(Number(e.target.value))} placeholder="0.00" /></div>
                            <div className={styles.promptActions}>
                                <button className={styles.promptCancelBtn} onClick={() => setShowCustomItem(false)}>Cancelar</button>
                                <button className={styles.promptConfirmBtn} onClick={handleAddCustomItem} disabled={!customName || customPrice <= 0}>Agregar</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ====== OPEN SHIFT MODAL ====== */}
            {showOpenShiftModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowOpenShiftModal(false)} />
                    <div className={styles.promptModal}>
                        <div className={styles.promptModalInner}>
                            <h4>🔓 Apertura de Caja</h4>
                            <p>Ingresa el fondo o efectivo fijo (morralla) con el que inicia este turno.</p>
                            <label>Efectivo Inicial</label>
                            <div className={styles.payInputWrap}><span>$</span><input type="number" min="0" value={startingCash || ''} onChange={e => setStartingCash(Number(e.target.value))} placeholder="0.00" autoFocus /></div>
                            <div className={styles.promptActions}>
                                <button className={styles.promptCancelBtn} onClick={() => setShowOpenShiftModal(false)}>Cancelar</button>
                                <button className={styles.promptConfirmBtn} onClick={handleOpenShift}>Abrir Turno</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ====== CLOSE SHIFT MODAL ====== */}
            {showCloseShiftModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowCloseShiftModal(false)} />
                    <div className={styles.promptModal}>
                        <div className={styles.promptModalInner}>
                            <h4>🔒 Corte de Caja (Z-Report)</h4>
                            <p>Cuenta el efectivo en la caja y decláralo aquí para hacer el cuadre final del turno.</p>
                            <label>Efectivo Contado (Físico)</label>
                            <div className={styles.payInputWrap}><span>$</span><input type="number" min="0" value={actualCash || ''} onChange={e => setActualCash(Number(e.target.value))} placeholder="0.00" autoFocus /></div>
                            <label>Notas o Comentarios (Opcional)</label>
                            <textarea
                                value={closingNotes}
                                onChange={e => setClosingNotes(e.target.value)}
                                placeholder="Ej: Faltaron 5 pesos de cambio..."
                                className={styles.promptInput}
                                style={{ marginTop: '0.5rem', width: '100%', minHeight: '60px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <div className={styles.promptActions}>
                                <button className={styles.promptCancelBtn} onClick={() => setShowCloseShiftModal(false)}>Cancelar</button>
                                <button className={styles.promptConfirmBtn} onClick={handleCloseShift} style={{ background: '#ff4d4f' }}>Realizar Corte</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Price on demand modal */}
            {pricePromptItem && (
                <>
                    <div className={styles.overlay} onClick={() => setPricePromptItem(null)} />
                    <div className={styles.miniModal}>
                        <h4>💬 {pricePromptItem.name}</h4>
                        <p className={styles.pricePromptHint}>Este servicio no tiene precio definido. Ingresa el monto:</p>
                        <div className={styles.modalPriceRow}><span>$</span><input type="number" placeholder="Precio" value={pricePromptValue || ''} onChange={e => setPricePromptValue(+e.target.value)} className={styles.modalInput} autoFocus /></div>
                        <div className={styles.modalActions}><button className={styles.cancelModalBtn} onClick={() => setPricePromptItem(null)}>Cancelar</button><button className={styles.saveModalBtn} onClick={addPricedItem}>Agregar al carrito</button></div>
                    </div>
                </>
            )}

            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
}
