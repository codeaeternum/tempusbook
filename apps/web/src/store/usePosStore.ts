import { create } from 'zustand';

// ---- Types ----
export interface CatalogItem {
    id: string;
    name: string;
    price: number;
    category: 'service' | 'product';
    icon: string;
    duration?: number;
    stock?: number;
}

export interface CartItem {
    item: CatalogItem;
    qty: number;
    discount: number;
    note: string;
    priceOverride?: number;
}

export type PayMethod = 'cash' | 'card' | 'transfer' | 'mixed' | 'gift_card' | 'package';

export interface PosState {
    // --- Cart State ---
    cart: CartItem[];
    addToCart: (item: CatalogItem, priceOverride?: number) => void;
    addCustomItem: (name: string, price: number) => void;
    updateQty: (id: string, delta: number) => void;
    removeFromCart: (id: string) => void;
    setItemDiscount: (id: string, discount: number) => void;
    setItemNote: (id: string, note: string) => void;
    clearCart: () => void;

    // --- Client State ---
    selectedClient: { id: string; name: string; phone: string } | null;
    setSelectedClient: (client: { id: string; name: string; phone: string } | null) => void;

    // --- Discounts & Payment ---
    appliedPromo: { discount: number; label: string } | null;
    setAppliedPromo: (promo: { discount: number; label: string } | null) => void;

    manualDiscountValue: number;
    manualDiscountType: '%' | '$';
    setManualDiscount: (value: number, type: '%' | '$') => void;

    payMethod: PayMethod;
    setPayMethod: (method: PayMethod) => void;

    cashGiven: number;
    setCashGiven: (amount: number) => void;

    cardAmount: number;
    setCardAmount: (amount: number) => void;

    // --- Prepaid Options ---
    giftCardCode: string;
    setGiftCardCode: (code: string) => void;
    selectedClientPackageId: string;
    setSelectedClientPackageId: (id: string) => void;

    // --- Reset ---
    resetPos: () => void;
}

export const usePosStore = create<PosState>((set) => ({
    cart: [],

    addToCart: (item, priceOverride) => set((state) => {
        const existing = state.cart.find(c => c.item.id === item.id);
        if (existing) {
            return {
                cart: state.cart.map(c =>
                    c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c
                )
            };
        }
        return {
            cart: [...state.cart, { item, qty: 1, discount: 0, note: '', priceOverride }]
        };
    }),

    addCustomItem: (name, price) => set((state) => {
        const item: CatalogItem = {
            id: `custom-${Date.now()}`,
            name,
            price,
            category: 'service',
            icon: '🏷️'
        };
        return {
            cart: [...state.cart, { item, qty: 1, discount: 0, note: '' }]
        };
    }),

    updateQty: (id, delta) => set((state) => ({
        cart: state.cart.map(c =>
            c.item.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c
        )
    })),

    removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter(c => c.item.id !== id)
    })),

    setItemDiscount: (id, discount) => set((state) => ({
        cart: state.cart.map(c =>
            c.item.id === id ? { ...c, discount: Math.min(100, Math.max(0, discount)) } : c
        )
    })),

    setItemNote: (id, note) => set((state) => ({
        cart: state.cart.map(c =>
            c.item.id === id ? { ...c, note } : c
        )
    })),

    clearCart: () => set({ cart: [] }),

    selectedClient: null,
    setSelectedClient: (client) => set({ selectedClient: client }),

    appliedPromo: null,
    setAppliedPromo: (promo) => set({ appliedPromo: promo }),

    manualDiscountValue: 0,
    manualDiscountType: '%',
    setManualDiscount: (value, type) => set({ manualDiscountValue: value, manualDiscountType: type }),

    payMethod: 'cash',
    setPayMethod: (method) => set({ payMethod: method }),

    cashGiven: 0,
    setCashGiven: (amount) => set({ cashGiven: amount }),

    cardAmount: 0,
    setCardAmount: (amount) => set({ cardAmount: amount }),

    giftCardCode: '',
    setGiftCardCode: (code) => set({ giftCardCode: code }),

    selectedClientPackageId: '',
    setSelectedClientPackageId: (id) => set({ selectedClientPackageId: id }),

    resetPos: () => set({
        cart: [],
        selectedClient: null,
        appliedPromo: null,
        manualDiscountValue: 0,
        manualDiscountType: '%',
        payMethod: 'cash',
        cashGiven: 0,
        cardAmount: 0,
        giftCardCode: '',
        selectedClientPackageId: '',
    })
}));

// --- Selectors for derived state (memoized for performance) ---
export const usePosTotals = () => {
    const cart = usePosStore((s) => s.cart);
    const appliedPromo = usePosStore((s) => s.appliedPromo);
    const manualDiscountValue = usePosStore((s) => s.manualDiscountValue);
    const manualDiscountType = usePosStore((s) => s.manualDiscountType);
    const payMethod = usePosStore((s) => s.payMethod);
    const cashGiven = usePosStore((s) => s.cashGiven);
    const cardAmount = usePosStore((s) => s.cardAmount);

    const itemPrice = (c: CartItem) => (c.priceOverride || c.item.price) * c.qty;
    const subtotal = cart.reduce((s, c) => s + itemPrice(c), 0);
    const totalItemDiscount = cart.reduce((s, c) => s + itemPrice(c) * c.discount / 100, 0);

    const promoDiscount = appliedPromo ? (subtotal - totalItemDiscount) * appliedPromo.discount / 100 : 0;

    const manualDiscount = manualDiscountValue > 0
        ? (manualDiscountType === '%'
            ? (subtotal - totalItemDiscount) * Math.min(100, manualDiscountValue) / 100
            : Math.min(subtotal - totalItemDiscount, manualDiscountValue))
        : 0;

    const total = Math.max(0, subtotal - totalItemDiscount - promoDiscount - manualDiscount);

    let change = 0;
    if (payMethod === 'cash') {
        change = Math.max(0, cashGiven - total);
    } else if (payMethod === 'mixed') {
        change = Math.max(0, cashGiven + cardAmount - total);
    }

    return {
        subtotal,
        totalItemDiscount,
        promoDiscount,
        manualDiscount,
        total,
        change,
        canCheckout: cart.length > 0 &&
            (payMethod === 'cash' ? cashGiven >= total :
                payMethod === 'mixed' ? (cashGiven + cardAmount) >= total : true)
        // For gift_card and package, the checkout validation checks state via API.
    };
};
