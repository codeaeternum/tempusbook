'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/providers/AuthProvider';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import styles from '../../mechanic/work-orders/page.module.css';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
}

export type DeviceType = 'PHONE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'CONSOLE' | 'OTHER';

export interface Device {
    id: string;
    clientId: string;
    brand: string;
    model: string;
    serialNumber?: string;
    imei?: string;
    passwordPin?: string;
}

const ROOT_BUSINESS_ID = 'e2e-auto-123';

// ---- Standard Tech-shop Statuses ----
const STATUSES = ['RECEIVING', 'DIAGNOSING', 'WAITING_PARTS', 'REPAIRING', 'READY', 'DELIVERED', 'CANCELLED'] as const;
type WorkOrderStatus = typeof STATUSES[number];

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
    RECEIVING: 'Recepción',
    DIAGNOSING: 'Diagnóstico',
    WAITING_PARTS: 'Pidiendo Refacción',
    REPAIRING: 'En Mesa Reparación',
    READY: 'Listo / Armado',
    DELIVERED: 'Entregado a Cliente',
    CANCELLED: 'Cancelado'
};

// ---- Types ----
interface WorkOrder {
    id: string;
    status: WorkOrderStatus;
    description: string;
    clientId: string;
    deviceId: string;
    client?: User;
    device?: Device;
}

interface OrderForm {
    clientId: string;
    deviceId: string;
    description: string;
}

const EMPTY_FORM: OrderForm = {
    clientId: '',
    deviceId: '',
    description: '',
};

export default function TechWorkOrdersPage() {

    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [clients, setClients] = useState<User[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
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
            fetchWithAuth(`http://localhost:3001/api/v1/work-orders/business/${ROOT_BUSINESS_ID}`).then(r => r.json()),
            fetchWithAuth(`http://localhost:3001/api/v1/businesses/${ROOT_BUSINESS_ID}/clients`).then(r => r.json()),
            fetchWithAuth(`http://localhost:3001/api/v1/devices/business/${ROOT_BUSINESS_ID}`).then(r => r.json())
        ])
            .then(([resOrders, resClients, resDevices]) => {
                setOrders(resOrders || []);
                setClients(resClients || []);
                setDevices(resDevices || []);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
                showToast('Error cargando servidor.');
            });
    }, []);

    // Filter Devices based on selected Client
    const availableDevices = devices.filter(d => form.clientId === '' || d.clientId === form.clientId);

    const openCreateModal = () => {
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const updateField = (field: keyof OrderForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.clientId || !form.deviceId) {
            showToast('Debe seleccionar cliente y dispositivo');
            return;
        }

        const payload = {
            businessId: ROOT_BUSINESS_ID,
            ...form,
        };

        try {
            const res = await fetchWithAuth('http://localhost:3001/api/v1/work-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const created = await res.json();
                created.client = clients.find(c => c.id === created.clientId);
                created.device = devices.find(v => v.id === created.deviceId);
                setOrders(prev => [...prev, created]);
                showToast('Orden Registrada (Recepción)');
                setShowModal(false);
            }
        } catch (error) {
            showToast('Error al crear orden técnica');
        }
    };

    // ---- Drag and Drop Core ----
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
        setDraggedOrderId(orderId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', orderId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: WorkOrderStatus) => {
        e.preventDefault();
        if (dragOverStatus !== status) setDragOverStatus(status);
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

        try {
            await fetchWithAuth(`http://localhost:3001/api/v1/work-orders/${draggedOrderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            showToast('Estado Modificado');
        } catch (error) {
            setOrders(prev => prev.map(o => o.id === draggedOrderId ? { ...o, status: previousStatus } : o));
            showToast('Error de conexión. Se revirtió cambio.');
        }

        setDraggedOrderId(null);
    };

    const ordersByStatus = (status: WorkOrderStatus) => orders.filter(o => o.status === status && o.deviceId != null);

    return (
        <>
            <Header
                title="Laboratorio de Reparación Electrónica"
                subtitle="Gestiona el estatus de los Celulares y Laptops arrastrando las tarjetas"
                actions={
                    <button className="btn btn-primary" onClick={openCreateModal}>+ Iniciar Diagnóstico</button>
                }
            />

            <div className={styles.content}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                        Cargando Mesas de Reparación...
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
                                                        {order.device ? `${order.device.brand} ${order.device.model}` : 'Equipo no Ligado'}
                                                    </div>
                                                    <div className={styles.clientName}>
                                                        {order.client ? `${order.client.firstName} ${order.client.lastName}` : 'Propietario Anónimo'}
                                                    </div>
                                                </div>
                                                <div className={styles.ticketId}>#{order.id.slice(0, 5)}</div>
                                            </div>
                                            <div className={styles.cardDesc}>
                                                {order.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Esperando Reporte Mímesis Técnico</span>}
                                            </div>
                                            <div className={styles.cardFooter}>
                                                <div className={styles.odometer}>
                                                    🔓 {order.device?.passwordPin ? order.device.passwordPin : 'Sin PIN / Patrón'}
                                                </div>
                                                <div className={styles.odometer}>
                                                    📱 {order.device?.imei || order.device?.serialNumber || 'Sin Serie'}
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
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Emitir Nueva Bitácora">
                <div className={styles.modalBody}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Cliente en Mostrador</label>
                            <select
                                className={styles.formInput}
                                value={form.clientId}
                                onChange={e => updateField('clientId', e.target.value)}
                            >
                                <option value="" disabled>Seleccione Persona...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Dispositivo (Celular, Laptop)</label>
                            <select
                                className={styles.formInput}
                                value={form.deviceId}
                                onChange={e => updateField('deviceId', e.target.value)}
                                disabled={!form.clientId}
                            >
                                <option value="" disabled>¿Qué equipo dejó?</option>
                                {availableDevices.map(v => (
                                    <option key={v.id} value={v.id}>{v.brand} {v.model}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Síntomas Reportados (Pantalla rota, Bootloop, Agua...)</label>
                        <textarea
                            className={styles.formTextarea}
                            value={form.description}
                            onChange={e => updateField('description', e.target.value)}
                            placeholder="El dispositivo se reinicia solo en la Manzana..."
                        />
                    </div>
                </div>
                <div className={styles.modalFooter}>
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Atras</button>
                    <button className="btn btn-primary" onClick={handleSave}>Procesar Ingreso</button>
                </div>
            </Modal>

            <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
                {toast.message}
            </div>
        </>
    );
}
