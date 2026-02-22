'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ---- Types ----
interface Transaction {
    id: string;
    createdAt: string;
    client: string;
    service: string;
    staff: string;
    type: 'FULL' | 'DEPOSIT' | 'TIP' | 'REFUND';
    method: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED' | 'MERCADOPAGO';
    amount: number;
    status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED';
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    FULL: { label: 'Pago Total', icon: '💳', color: '#10b981' },
    DEPOSIT: { label: 'Anticipo', icon: '🔒', color: '#3b82f6' },
    TIP: { label: 'Propina', icon: '✨', color: '#f59e0b' },
    REFUND: { label: 'Reembolso', icon: '↩️', color: '#ef4444' },
};

const METHOD_CONFIG: Record<string, { label: string; icon: string }> = {
    CASH: { label: 'Efectivo', icon: '💵' },
    CARD: { label: 'Tarjeta', icon: '💳' },
    TRANSFER: { label: 'Transferencia', icon: '🏦' },
    MERCADOPAGO: { label: 'MercadoPago', icon: '🟦' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    COMPLETED: { label: 'Completado', color: '#10b981' },
    PENDING: { label: 'Pendiente', color: '#f59e0b' },
    REFUNDED: { label: 'Reembolsado', color: '#8b5cf6' },
    FAILED: { label: 'Fallido', color: '#ef4444' },
};

// ---- Helpers ----
function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-MX')}`;
}

function formatDateTime(date: Date): string {
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date: Date): string {
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

// ---- Component ----
type FilterType = 'all' | 'FULL' | 'DEPOSIT' | 'TIP' | 'REFUND';
type FilterStatus = 'all' | 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED';

export default function PaymentsPage() {
    const { t } = useLocale();
    const { activeBusinessId } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
    const [confirmRefund, setConfirmRefund] = useState<Transaction | null>(null);

    const loadData = async () => {
        if (!activeBusinessId) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/payments?businessId=${activeBusinessId}`);
            if (res && res.ok) {
                const data = await res.json();
                // Map NestJS API response to Component Interface properties
                const mapped = data.map((item: any) => ({
                    id: item.id,
                    createdAt: item.createdAt,
                    client: item.booking?.client ? `${item.booking.client.firstName} ${item.booking.client.lastName}` : (item.sale?.client ? `${item.sale.client.firstName} ${item.sale.client.lastName}` : 'Walk-in'),
                    service: item.booking ? 'Reserva' : 'Venta POS',
                    staff: 'N/A', // Expandable relation later
                    type: item.type,
                    method: item.method,
                    amount: parseFloat(item.amount),
                    status: item.status
                }));
                setTransactions(mapped);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => { loadData(); }, [activeBusinessId]);

    const handleResend = (tx: Transaction) => { showToast(`📧 Ticket reenviado a ${tx.client}`); };
    const handleCopyId = (tx: Transaction) => { navigator.clipboard?.writeText(tx.id).then(() => showToast(`📋 ID ${tx.id} copiado`)).catch(() => showToast(`📋 ID: ${tx.id}`)); };

    const handleConfirm = async (tx: Transaction) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/payments/${tx.id}/complete?businessId=${activeBusinessId}`, { method: 'PATCH' });
            if (res && res.ok) {
                showToast(`✅ Pago de ${tx.client} confirmado`);
                setSelectedTx(null);
                loadData();
            } else {
                showToast(`❌ Error al confirmar pago`);
            }
        } catch (e) {
            console.error(e);
            showToast(`❌ Error de conexión al servidor`);
        }
    };

    const handleRefund = (tx: Transaction) => { setConfirmRefund(tx); };
    const executeRefund = async () => {
        if (!confirmRefund) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/payments/${confirmRefund.id}/refund?businessId=${activeBusinessId}`, { method: 'PATCH' });
            if (res && res.ok) {
                showToast(`↩️ Reembolso procesado para ${confirmRefund.client}`);
                setSelectedTx(null);
                setConfirmRefund(null);
                loadData();
            } else {
                showToast(`❌ Error procesando el reembolso`);
            }
        } catch (e) {
            console.error(e);
            showToast(`❌ Error de conexión al servidor`);
        }
    };

    const filtered = useMemo(() => {
        return transactions.filter(tx => {
            const matchSearch = `${tx.client} ${tx.service} ${tx.staff}`.toLowerCase().includes(search.toLowerCase());
            const matchType = filterType === 'all' || tx.type === filterType;
            const matchStatus = filterStatus === 'all' || tx.status === filterStatus;
            return matchSearch && matchType && matchStatus;
        });
    }, [search, filterType, filterStatus, transactions]);

    const stats = useMemo(() => {
        const completed = transactions.filter(t => t.status === 'COMPLETED');
        const today = new Date();
        const todayTxs = completed.filter(t => new Date(t.createdAt).toDateString() === today.toDateString());
        return {
            todayRevenue: todayTxs.reduce((s, t) => s + t.amount, 0),
            todayCount: todayTxs.length,
            weekRevenue: completed.reduce((s, t) => s + t.amount, 0),
            pending: transactions.filter(t => t.status === 'PENDING').length,
            avgTicket: Math.round(completed.reduce((s, t) => s + t.amount, 0) / (completed.length || 1)),
            tips: completed.filter(t => t.type === 'TIP').reduce((s, t) => s + t.amount, 0),
        };
    }, [transactions]);

    // Revenue by method chart data
    const revenueByMethod = useMemo(() => {
        const methods: Record<string, number> = {};
        transactions.filter(t => t.status === 'COMPLETED').forEach(t => {
            methods[t.method] = (methods[t.method] || 0) + t.amount;
        });
        const total = Object.values(methods).reduce((s, v) => s + v, 0);
        return Object.entries(methods).map(([method, amount]) => ({
            method,
            amount,
            percentage: Math.round((amount / total) * 100),
            ...METHOD_CONFIG[method],
        }));
    }, []);

    return (
        <>
            <Header title={t('payments')} subtitle="Transacciones, ingresos y métodos de pago" />

            <div className={styles.content}>
                {/* Revenue Stats */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Ingresos Hoy</span>
                            <span className={styles.statIcon}>📅</span>
                        </div>
                        <span className={styles.statValue}>{formatCurrency(stats.todayRevenue)}</span>
                        <span className={styles.statSub}>{stats.todayCount} transacciones</span>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Ingresos Semana</span>
                            <span className={styles.statIcon}>📊</span>
                        </div>
                        <span className={styles.statValue}>{formatCurrency(stats.weekRevenue)}</span>
                        <span className={styles.statSub}>{transactions.filter(t => t.status === 'COMPLETED').length} completados</span>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Ticket Promedio</span>
                            <span className={styles.statIcon}>🎯</span>
                        </div>
                        <span className={styles.statValue}>{formatCurrency(stats.avgTicket)}</span>
                        <span className={styles.statSub}>por transacción</span>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Propinas</span>
                            <span className={styles.statIcon}>✨</span>
                        </div>
                        <span className={styles.statValue}>{formatCurrency(stats.tips)}</span>
                        <span className={styles.statSub}>esta semana</span>
                    </div>
                    <div className={`${styles.statCard} ${stats.pending > 0 ? styles.statWarning : ''}`}>
                        <div className={styles.statTop}>
                            <span className={styles.statLabel}>Pendientes</span>
                            <span className={styles.statIcon}>⏳</span>
                        </div>
                        <span className={styles.statValue}>{stats.pending}</span>
                        <span className={styles.statSub}>por confirmar</span>
                    </div>
                </div>

                <div className={styles.mainGrid}>
                    {/* Transactions Table */}
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h3>💳 Historial de Transacciones</h3>
                            <div className={styles.panelActions}>
                                <button className={styles.exportBtn}>📄 Exportar</button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className={styles.tableFilters}>
                            <div className={styles.searchGroup}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input
                                    className={styles.searchInput}
                                    type="text"
                                    placeholder="Buscar cliente, servicio..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className={styles.filterGroup}>
                                <select
                                    className={styles.filterSelect}
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                                >
                                    <option value="all">Todo tipo</option>
                                    <option value="FULL">Pago Total</option>
                                    <option value="DEPOSIT">Anticipo</option>
                                    <option value="TIP">Propina</option>
                                    <option value="REFUND">Reembolso</option>
                                </select>
                                <select
                                    className={styles.filterSelect}
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                                >
                                    <option value="all">Todo estado</option>
                                    <option value="COMPLETED">Completado</option>
                                    <option value="PENDING">Pendiente</option>
                                    <option value="REFUNDED">Reembolsado</option>
                                    <option value="FAILED">Fallido</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <span>Fecha</span>
                                <span>Cliente</span>
                                <span>Servicio</span>
                                <span>Tipo</span>
                                <span>Método</span>
                                <span>Monto</span>
                                <span>Estado</span>
                            </div>
                            {filtered.map(tx => {
                                const type = TYPE_CONFIG[tx.type];
                                const method = METHOD_CONFIG[tx.method];
                                const status = STATUS_CONFIG[tx.status];
                                return (
                                    <div key={tx.id} className={styles.tableRow} onClick={() => setSelectedTx(tx)} role="button" tabIndex={0}>
                                        <span className={styles.txDate}>{formatDateTime(new Date(tx.createdAt))}</span>
                                        <span className={styles.txClient}>{tx.client}</span>
                                        <span className={styles.txService}>{tx.service}</span>
                                        <span className={styles.txType}>
                                            <span className={styles.typeBadge} style={{ color: type.color, background: `${type.color}12` }}>
                                                {type.icon} {type.label}
                                            </span>
                                        </span>
                                        <span className={styles.txMethod}>
                                            {method.icon} {method.label}
                                        </span>
                                        <span className={`${styles.txAmount} ${tx.type === 'REFUND' ? styles.refundAmount : ''}`}>
                                            {tx.type === 'REFUND' ? '-' : ''}{formatCurrency(tx.amount)}
                                        </span>
                                        <span>
                                            <span className={styles.statusDot} style={{ background: status.color }} />
                                            <span style={{ color: status.color }}>{status.label}</span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Revenue by Method */}
                    <div className={styles.sidePanel}>
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h3>📊 Por Método</h3>
                            </div>
                            <div className={styles.methodChart}>
                                {revenueByMethod.map(item => (
                                    <div key={item.method} className={styles.methodItem}>
                                        <div className={styles.methodInfo}>
                                            <span className={styles.methodIcon}>{item.icon}</span>
                                            <span className={styles.methodLabel}>{item.label}</span>
                                            <span className={styles.methodPct}>{item.percentage}%</span>
                                        </div>
                                        <div className={styles.methodBar}>
                                            <div
                                                className={styles.methodBarFill}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                        <span className={styles.methodAmount}>{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h3>⚡ Últimos pagos</h3>
                            </div>
                            <div className={styles.recentList}>
                                {transactions.slice(0, 5).map(tx => (
                                    <div key={tx.id} className={styles.recentItem} onClick={() => setSelectedTx(tx)} role="button" tabIndex={0}>
                                        <span className={styles.recentIcon}>{TYPE_CONFIG[tx.type].icon}</span>
                                        <div className={styles.recentInfo}>
                                            <span className={styles.recentClient}>{tx.client}</span>
                                            <span className={styles.recentTime}>{formatDateShort(new Date(tx.createdAt))}</span>
                                        </div>
                                        <span className={`${styles.recentAmount} ${tx.status === 'COMPLETED' ? styles.amountGreen : ''}`}>
                                            {formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Detail Panel */}
            {selectedTx && (<>
                <div className={styles.detailOverlay} onClick={() => setSelectedTx(null)} />
                <div className={styles.detailPanel}>
                    <div className={styles.detailHeader}>
                        <h3>Detalle de Transacción</h3>
                        <button className={styles.detailClose} onClick={() => setSelectedTx(null)}>✕</button>
                    </div>
                    <div className={styles.detailBody}>
                        <div className={styles.detailAmount}>
                            <span className={styles.detailAmountValue}>{selectedTx.type === 'REFUND' ? '-' : ''}{formatCurrency(selectedTx.amount)}</span>
                            <span className={styles.detailStatus} style={{ color: STATUS_CONFIG[selectedTx.status].color, background: `${STATUS_CONFIG[selectedTx.status].color}18` }}>
                                <span className={styles.statusDot} style={{ background: STATUS_CONFIG[selectedTx.status].color }} />
                                {STATUS_CONFIG[selectedTx.status].label}
                            </span>
                        </div>
                        <div className={styles.detailInfoGrid}>
                            <div className={styles.detailInfoItem}>
                                <span className={styles.detailInfoLabel}>Cliente</span>
                                <span className={styles.detailInfoValue}>👤 {selectedTx.client}</span>
                            </div>
                            <div className={styles.detailInfoItem}>
                                <span className={styles.detailInfoLabel}>Servicio</span>
                                <span className={styles.detailInfoValue}>💇 {selectedTx.service}</span>
                            </div>
                            <div className={styles.detailInfoItem}>
                                <span className={styles.detailInfoLabel}>Profesional</span>
                                <span className={styles.detailInfoValue}>🧑‍💼 {selectedTx.staff}</span>
                            </div>
                            <div className={styles.detailInfoItem}>
                                <span className={styles.detailInfoLabel}>Fecha y Hora</span>
                                <span className={styles.detailInfoValue}>📅 {new Date(selectedTx.createdAt).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={styles.detailInfoItem}>
                                <span className={styles.detailInfoLabel}>Tipo de Pago</span>
                                <span className={styles.detailInfoValue}>{TYPE_CONFIG[selectedTx.type].icon} {TYPE_CONFIG[selectedTx.type].label}</span>
                            </div>
                            <div className={styles.detailInfoItem}>
                                <span className={styles.detailInfoLabel}>Método</span>
                                <span className={styles.detailInfoValue}>{METHOD_CONFIG[selectedTx.method].icon} {METHOD_CONFIG[selectedTx.method].label}</span>
                            </div>
                        </div>
                        <div className={styles.detailId}>
                            <span>ID: {selectedTx.id}</span>
                            <button className={styles.copyBtn} onClick={() => handleCopyId(selectedTx)}>📋 Copiar</button>
                        </div>
                    </div>
                    <div className={styles.detailActions}>
                        <button className={styles.detailActionBtn} onClick={() => handleResend(selectedTx)}>
                            📧 Reenviar Ticket
                        </button>
                        {selectedTx.status === 'PENDING' && (
                            <button className={`${styles.detailActionBtn} ${styles.detailActionSuccess}`} onClick={() => handleConfirm(selectedTx)}>
                                ✅ Confirmar Pago
                            </button>
                        )}
                        {selectedTx.status === 'COMPLETED' && (
                            <button className={`${styles.detailActionBtn} ${styles.detailActionDanger}`} onClick={() => handleRefund(selectedTx)}>
                                ↩️ Reembolsar
                            </button>
                        )}
                    </div>
                </div>
            </>)}

            <ConfirmDialog
                open={!!confirmRefund}
                title="Reembolsar pago"
                message={confirmRefund ? `¿Reembolsar ${formatCurrency(confirmRefund.amount)} a ${confirmRefund.client}?` : ''}
                confirmLabel="Sí, reembolsar"
                variant="warning"
                onConfirm={executeRefund}
                onCancel={() => setConfirmRefund(null)}
            />
            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
}
