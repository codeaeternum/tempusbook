'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { fetchWithAuth } from '@/providers/AuthProvider';
import { ROOT_BUSINESS_ID as BUSINESS_ID } from '@aeternasuite/shared-constants';
import styles from './page.module.css';

// ---- Types ----
interface Client {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

interface Vehicle {
    id: string;
    clientId: string;
    client?: Client;
    vin: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
    notes: string;
    createdAt: Date;
}

interface VehicleForm {
    clientId: string;
    vin: string;
    make: string;
    model: string;
    year: number | '';
    licensePlate: string;
    color: string;
    notes: string;
}

const EMPTY_FORM: VehicleForm = {
    clientId: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
    notes: '',
};

export default function VehiclesPage() {
    const { t, locale } = useLocale();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);

    // Toast
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
    };

    const [confirm, setConfirm] = useState<{ message: string; action: () => void } | null>(null);

    useEffect(() => {
        // Fetch Clients & Vehicles
        Promise.all([
            fetchWithAuth(`http://localhost:3001/api/v1/businesses/${BUSINESS_ID}/clients`),
            fetchWithAuth(`http://localhost:3001/api/v1/vehicles/business/${BUSINESS_ID}`)
        ])
            .then(async ([resClients, resVehicles]) => {
                if (resClients.ok) {
                    const data = await resClients.json();
                    setClients(data || []);
                }
                if (resVehicles.ok) {
                    const data = await resVehicles.json();
                    setVehicles(data || []);
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return vehicles;
        const q = search.toLowerCase();
        return vehicles.filter(v =>
            v.make.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.licensePlate?.toLowerCase().includes(q) ||
            v.vin?.toLowerCase().includes(q) ||
            (v.client && `${v.client.firstName} ${v.client.lastName}`.toLowerCase().includes(q))
        );
    }, [search, vehicles]);

    const stats = useMemo(() => {
        const total = vehicles.length;
        const uniqueMakes = new Set(vehicles.map(v => v.make.toUpperCase())).size;
        return { total, uniqueMakes };
    }, [vehicles]);

    const openCreateModal = () => {
        setEditingVehicle(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEditModal = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setForm({
            clientId: vehicle.clientId,
            vin: vehicle.vin || '',
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year || '',
            licensePlate: vehicle.licensePlate || '',
            color: vehicle.color || '',
            notes: vehicle.notes || '',
        });
        setShowModal(true);
    };

    const updateField = (field: keyof VehicleForm, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.clientId || !form.make || !form.model) {
            showToast('Faltan campos obligatorios');
            return;
        }

        const payload = {
            ...form,
            year: form.year === '' ? undefined : Number(form.year),
            businessId: BUSINESS_ID
        };

        if (editingVehicle) {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/vehicles/${editingVehicle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const updated = await res.json();
                updated.client = clients.find(c => c.id === updated.clientId);
                setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
                showToast('Vehículo actualizado');
            }
        } else {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const created = await res.json();
                created.client = clients.find(c => c.id === created.clientId);
                setVehicles(prev => [created, ...prev]);
                showToast('Vehículo registrado');
            }
        }
        setShowModal(false);
    };

    const deleteVehicle = (id: string) => {
        setConfirm({
            message: '¿Eliminar este vehículo de forma permanente?',
            action: async () => {
                const res = await fetchWithAuth(`http://localhost:3001/api/v1/vehicles/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setVehicles(prev => prev.filter(v => v.id !== id));
                    showToast('Vehículo eliminado');
                }
                setConfirm(null);
            }
        });
    };

    return (
        <>
            <Header
                title="Vehículos"
                subtitle={`${stats.total} activos listados`}
                actions={
                    <button className="btn btn-primary" onClick={openCreateModal}>+</button>
                }
            />

            <div className={styles.content}>
                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Cargando Expediente Vehicular...
                    </div>
                ) : (
                    <>
                        <div className={styles.statsRow}>
                            <div className={`card ${styles.statCard}`}>
                                <div className={`${styles.statIconBg} ${styles.blue}`}>🚗</div>
                                <div className={styles.statInfo}>
                                    <div className={styles.statValue}>{stats.total}</div>
                                    <div className={styles.statLabel}>Flota Registrada</div>
                                </div>
                            </div>
                            <div className={`card ${styles.statCard}`}>
                                <div className={`${styles.statIconBg} ${styles.amber}`}>🏭</div>
                                <div className={styles.statInfo}>
                                    <div className={styles.statValue}>{stats.uniqueMakes}</div>
                                    <div className={styles.statLabel}>Marcas Únicas</div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.toolbar}>
                            <div className={styles.searchBox}>
                                <span className={styles.searchIcon}>🔍</span>
                                <input
                                    className={styles.searchInput}
                                    placeholder="Buscar por Marca, Modelo, Placas o Cliente..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={`card ${styles.tableCard} ${styles.desktopOnly}`}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Propietario / Cliente</th>
                                            <th>Vehículo</th>
                                            <th>Año / VIN</th>
                                            <th>Placas</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(vehicle => (
                                            <tr key={vehicle.id}>
                                                <td>
                                                    <div className={styles.clientCell}>
                                                        <div className={styles.avatar}>
                                                            {vehicle.client ? `${vehicle.client.firstName[0]}${vehicle.client.lastName?.[0] || ''}`.toUpperCase() : '??'}
                                                        </div>
                                                        <div>
                                                            <div className={styles.clientName}>
                                                                {vehicle.client ? `${vehicle.client.firstName} ${vehicle.client.lastName}` : 'Cliente Eliminado'}
                                                            </div>
                                                            <div className={styles.clientEmail}>
                                                                {vehicle.client?.phone || vehicle.client?.email || 'Sin Contacto'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 600 }}>{vehicle.make}</span> {vehicle.model}
                                                    {vehicle.color && <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Color: {vehicle.color}</div>}
                                                </td>
                                                <td>
                                                    <span className={styles.visitCount}>{vehicle.year || 'N/A'}</span>
                                                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{vehicle.vin || 'Sin VIN'}</div>
                                                </td>
                                                <td>
                                                    <span className={styles.statusBadge} style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                                        {vehicle.licensePlate || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.tableActions}>
                                                        <button className={styles.actionBtn} onClick={() => openEditModal(vehicle)}>
                                                            ✏️
                                                        </button>
                                                        <button className={`${styles.actionBtnIcon} ${styles.deleteBtn}`} style={{ opacity: 1, border: '1px solid var(--color-border)', color: 'var(--color-text)' }} title="Eliminar" onClick={() => deleteVehicle(vehicle.id)}>
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                                                    No se encontraron vehículos.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className={styles.tableFooter}>
                                <span>Mostrando {filtered.length} resultados</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setShowModal(false)} />
                    <div className={styles.modal} style={{ maxWidth: '600px' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {editingVehicle ? 'Editar Vehículo' : 'Registrar Automóvil'}
                            </h2>
                            <button className={styles.panelCloseBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Propietario (Cliente)*</label>
                                <select
                                    className={styles.formInput}
                                    value={form.clientId}
                                    onChange={e => updateField('clientId', e.target.value)}
                                    style={{ appearance: 'auto' }}
                                >
                                    <option value="" disabled>Selecciona un cliente de la agenda</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phone || c.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Marca*</label>
                                    <input className={styles.formInput} value={form.make} onChange={e => updateField('make', e.target.value)} placeholder="Ej: Honda, Ford, BMW..." />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Modelo*</label>
                                    <input className={styles.formInput} value={form.model} onChange={e => updateField('model', e.target.value)} placeholder="Ej: Ranger, Civic..." />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Año</label>
                                    <input className={styles.formInput} type="number" value={form.year} onChange={e => updateField('year', e.target.value)} placeholder="2020" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Placas</label>
                                    <input className={styles.formInput} value={form.licensePlate} onChange={e => updateField('licensePlate', e.target.value)} placeholder="ABC-1234" />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>VIN (Opcional)</label>
                                    <input className={styles.formInput} value={form.vin} onChange={e => updateField('vin', e.target.value)} placeholder="1HGCM826...." />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Color</label>
                                    <input className={styles.formInput} value={form.color} onChange={e => updateField('color', e.target.value)} placeholder="Blanco Perla" />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Notas u Observaciones</label>
                                <textarea className={styles.formTextarea} value={form.notes} onChange={e => updateField('notes', e.target.value)} rows={3} placeholder="Muescas en la fascia, birlos de seguridad faltantes..." />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave}>Guardar Expediente</button>
                        </div>
                    </div>
                </>
            )}

            {/* Confirm Dialog */}
            {confirm && (
                <>
                    <div className={styles.modalOverlay} onClick={() => setConfirm(null)} />
                    <div className={styles.confirmDialog}>
                        <div className={styles.confirmIcon}>⚠️</div>
                        <p className={styles.confirmMessage}>{confirm.message}</p>
                        <div className={styles.confirmActions}>
                            <button className="btn btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button>
                            <button className={styles.confirmDeleteBtn} onClick={confirm.action}>Eliminar</button>
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
