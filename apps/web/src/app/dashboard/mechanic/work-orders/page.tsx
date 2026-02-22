'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import { ROOT_BUSINESS_ID as BUSINESS_ID } from '@aeternasuite/shared-constants';
import styles from './page.module.css';

// ---- Standard Auto-shop Statuses ----
const STATUSES = ['RECEIVING', 'DIAGNOSING', 'WAITING_PARTS', 'REPAIRING', 'READY', 'DELIVERED', 'CANCELLED'] as const;
type WorkOrderStatus = typeof STATUSES[number];

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
    RECEIVING: 'Recepción',
    DIAGNOSING: 'Diagnóstico',
    WAITING_PARTS: 'Refacciones',
    REPAIRING: 'En Rampa',
    READY: 'Terminado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado'
};

// ---- Types ----
interface Client {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
}

interface WorkOrder {
    id: string;
    status: WorkOrderStatus;
    description: string;
    odometer: number;
    clientId: string;
    vehicleId: string;
    client?: Client;
    vehicle?: Vehicle;
}

interface OrderForm {
    clientId: string;
    vehicleId: string;
    description: string;
    odometer: number | '';
}

const EMPTY_FORM: OrderForm = {
    clientId: '',
    vehicleId: '',
    description: '',
    odometer: ''
};

export default function WorkOrdersPage() {
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<OrderForm>(EMPTY_FORM);

    // Drag and Drop UI
    const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<WorkOrderStatus | null>(null);

    // Toast
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
    };

    useEffect(() => {
        Promise.all([
            fetchWithAuth(`http://localhost:3001/api/v1/work-orders/business/${BUSINESS_ID}`),
            fetchWithAuth(`http://localhost:3001/api/v1/businesses/${BUSINESS_ID}/clients`),
            fetchWithAuth(`http://localhost:3001/api/v1/vehicles/business/${BUSINESS_ID}`)
        ])
            .then(async ([resOrders, resClients, resVehicles]) => {
                if (resOrders.ok) setOrders(await resOrders.json());
                if (resClients.ok) setClients(await resClients.json());
                if (resVehicles.ok) setVehicles(await resVehicles.json());
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    // Filter Vehicles based on selected Client
    const availableVehicles = vehicles; // Simplified for MVP. We can filter by `v.clientId === form.clientId` if relation is fetched.

    const openCreateModal = () => {
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const updateField = (field: keyof OrderForm, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.clientId || !form.vehicleId) {
            showToast('Faltan datos obligatorios');
            return;
        }

        const payload = {
            businessId: BUSINESS_ID,
            ...form,
            odometer: form.odometer === '' ? undefined : Number(form.odometer)
        };

        const res = await fetchWithAuth(`http://localhost:3001/api/v1/work-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const created = await res.json();
            created.client = clients.find(c => c.id === created.clientId);
            created.vehicle = vehicles.find(v => v.id === created.vehicleId);
            setOrders(prev => [...prev, created]);
            showToast('Orden Registrada (Recepción)');
            setShowModal(false);
        } else {
            showToast('Error al crear orden');
        }
    };

    // ---- Drag and Drop Core ----
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
        setDraggedOrderId(orderId);
        e.dataTransfer.effectAllowed = 'move';
        // Hide native drag ghost minimally (optional)
        e.dataTransfer.setData('text/plain', orderId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: WorkOrderStatus) => {
        e.preventDefault(); // allow drop
        if (dragOverStatus !== status) {
            setDragOverStatus(status);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverStatus(null);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: WorkOrderStatus) => {
        e.preventDefault();
        setDragOverStatus(null);

        if (!draggedOrderId) return;

        const order = orders.find(o => o.id === draggedOrderId);
        if (!order || order.status === newStatus) return;

        // Optimistic UI update
        const previousStatus = order.status;
        setOrders(prev => prev.map(o => o.id === draggedOrderId ? { ...o, status: newStatus } : o));

        // Network Request
        const res = await fetchWithAuth(`http://localhost:3001/api/v1/work-orders/${draggedOrderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            showToast('Estado Modificado');
        } else {
            // Revert optimistically
            setOrders(prev => prev.map(o => o.id === draggedOrderId ? { ...o, status: previousStatus } : o));
            showToast('Falla de Red. Operación revertida.');
        }

        setDraggedOrderId(null);
    };

    const ordersByStatus = (status: WorkOrderStatus) => orders.filter(o => o.status === status);

    return (
        <>
            <Header
                title="Tablero Kanban de Taller"
                subtitle="Arrastra las tarjetas para cambiar el estatus de las órdenes mecánicas"
                actions={
                    <button className="btn btn-primary" onClick={openCreateModal}>+ Iniciar Orden</button>
                }
            />

            <div className={styles.content}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                        Cargando Tablero...
                    </div>
                ) : (
                    <div className={styles.board}>
                        {STATUSES.filter(s => s !== 'CANCELLED' && s !== 'DELIVERED').map(status => (
                            <div
                                key={status}
                                className={styles.column}
                                onDragOver={(e) => handleDragOver(e, status)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, status)}
                            >
                                <div className={styles.columnHeader}>
                                    <span className={styles.columnTitle}>{STATUS_LABELS[status]}</span>
                                    <span className={styles.columnCount}>{ordersByStatus(status).length}</span>
                                </div>
                                <div className={`${styles.columnBody} ${dragOverStatus === status ? styles.dragOver : ''}`}>
                                    {ordersByStatus(status).map(order => (
                                        <div
                                            key={order.id}
                                            className={styles.card}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, order.id)}
                                        >
                                            <div className={styles.cardHeader}>
                                                <div>
                                                    <div className={styles.carModel}>
                                                        {order.vehicle ? `${order.vehicle.make} ${order.vehicle.model}` : 'Vehículo Desconocido'}
                                                    </div>
                                                    <div className={styles.clientName}>
                                                        {order.client ? `${order.client.firstName} ${order.client.lastName}` : 'Propietario no ligado'}
                                                    </div>
                                                </div>
                                                <div className={styles.ticketId}>#{order.id.slice(0, 5)}</div>
                                            </div>
                                            <div className={styles.cardDesc}>
                                                {order.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Sin notas técnicas</span>}
                                            </div>
                                            <div className={styles.cardFooter}>
                                                <div className={styles.odometer}>
                                                    🏎️ {order.odometer ? `${order.odometer.toLocaleString()} km` : 'Sin Odómetro'}
                                                </div>
                                                <div className={styles.odometer}>
                                                    📝 {order.vehicle?.licensePlate || '--'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Creation Modal */}
            {showModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowModal(false)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Nueva Orden Mecánica</h2>
                            <button className={styles.panelCloseBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Cliente</label>
                                    <select
                                        className={styles.formInput}
                                        value={form.clientId}
                                        onChange={e => updateField('clientId', e.target.value)}
                                    >
                                        <option value="" disabled>Seleccionar...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Vehículo Asignado</label>
                                    <select
                                        className={styles.formInput}
                                        value={form.vehicleId}
                                        onChange={e => updateField('vehicleId', e.target.value)}
                                        disabled={!form.clientId}
                                    >
                                        <option value="" disabled>Seleccionar Flota...</option>
                                        {availableVehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.make} {v.model}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Kilometraje Inicial</label>
                                <input
                                    className={styles.formInput}
                                    type="number"
                                    value={form.odometer}
                                    onChange={e => updateField('odometer', e.target.value)}
                                    placeholder="Ej. 120500"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Defecto o Falla Reportada (Diagnóstico Inicial)</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={form.description}
                                    onChange={e => updateField('description', e.target.value)}
                                    placeholder="Vibra al frenar; Testigo Check Engine encendido..."
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave}>Aperturar Ticket</button>
                        </div>
                    </div>
                </>
            )}

            <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
                {toast.message}
            </div>
        </>
    );
}
