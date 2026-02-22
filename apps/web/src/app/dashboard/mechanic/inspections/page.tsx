'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { fetchWithAuth } from '@/providers/AuthProvider';
import { ROOT_BUSINESS_ID as BUSINESS_ID } from '@aeternasuite/shared-constants';
import styles from './page.module.css';

interface WorkOrder {
    id: string;
    clientId: string;
    vehicleId: string;
    description: string;
    status: string;
    client?: { firstName: string, lastName: string, phone: string };
    vehicle?: { make: string, model: string, licensePlate: string };
}

type CheckStatus = 'OK' | 'WARN' | 'FAIL' | null;

interface CheckItem {
    id: string;
    label: string;
    status: CheckStatus;
    notes: string;
}

interface CheckSection {
    id: string;
    title: string;
    icon: string;
    items: CheckItem[];
}

const INITIAL_SECTIONS: CheckSection[] = [
    {
        id: 'exterior',
        title: 'Exterior e Iluminación',
        icon: '🔦',
        items: [
            { id: 'ext-lights', label: 'Faros, Calaveras y Direccionales', status: null, notes: '' },
            { id: 'ext-wiper', label: 'Plumillas Limpiaparabrisas', status: null, notes: '' },
            { id: 'ext-body', label: 'Rayones o Golpes Previos', status: null, notes: '' },
        ]
    },
    {
        id: 'brakes',
        title: 'Frenos y Llantas',
        icon: '🛞',
        items: [
            { id: 'brk-pads', label: 'Balatas (Grosor Restante)', status: null, notes: '' },
            { id: 'brk-rotors', label: 'Discos (Ceja / Cristalamiento)', status: null, notes: '' },
            { id: 'brk-tires', label: 'Llantas (Presión y Desgaste)', status: null, notes: '' },
        ]
    },
    {
        id: 'underhood',
        title: 'Motor y Fluidos',
        icon: '⚙️',
        items: [
            { id: 'flu-oil', label: 'Nivel y Estado de Aceite', status: null, notes: '' },
            { id: 'flu-coolant', label: 'Anticongelante (Fugas)', status: null, notes: '' },
            { id: 'flu-batt', label: 'Batería (Terminales / Carga)', status: null, notes: '' },
            { id: 'flu-belts', label: 'Bandas Rechinando o Cuarteadas', status: null, notes: '' },
        ]
    }
];

export default function MobileInspectionPage() {
    const [sections, setSections] = useState<CheckSection[]>(INITIAL_SECTIONS);
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    const [toast, setToast] = useState({ message: '', visible: false });
    const showToast = (message: string) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
    };

    useEffect(() => {
        // Fetch active Work Orders for assignment
        fetchWithAuth(`http://localhost:3001/api/v1/work-orders/business/${BUSINESS_ID}`)
            .then(res => res.ok ? res.json() : [])
            .then(async (data: WorkOrder[]) => {
                // To fetch clients/vehicles relation
                const [cRes, vRes] = await Promise.all([
                    fetchWithAuth(`http://localhost:3001/api/v1/businesses/${BUSINESS_ID}/clients`),
                    fetchWithAuth(`http://localhost:3001/api/v1/vehicles/business/${BUSINESS_ID}`)
                ]);
                const clients = cRes.ok ? await cRes.json() : [];
                const vehicles = vRes.ok ? await vRes.json() : [];

                const mapped = data.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').map(o => ({
                    ...o,
                    client: clients.find((c: any) => c.id === o.clientId),
                    vehicle: vehicles.find((v: any) => v.id === o.vehicleId)
                }));
                setOrders(mapped);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const setItemStatus = (sectionId: string, itemId: string, status: CheckStatus) => {
        setSections(prev => prev.map(sec => {
            if (sec.id !== sectionId) return sec;
            return {
                ...sec,
                items: sec.items.map(item => item.id === itemId ? { ...item, status } : item)
            };
        }));
    };

    const handleSave = async () => {
        if (!selectedOrderId) {
            showToast('Selecciona la Orden de Trabajo a Inspeccionar');
            return;
        }

        const unCheckedPoints = sections.flatMap(s => s.items).filter(i => i.status === null);
        if (unCheckedPoints.length > 0) {
            showToast(`Faltan ${unCheckedPoints.length} puntos por revisar`);
            return;
        }

        // Logic to save Inspection Data as a huge Text or JSON mapped into the description field of WorkOrder since we don't have Inspection Model
        const inspectionReport = `\n\n--- REPORTE DE INSPECCIÓN MULTI-PUNTO ---\n` + sections.map(s =>
            `\n[${s.title}]\n` + s.items.map(i => `- ${i.label}: ${i.status === 'OK' ? 'Verde' : i.status === 'WARN' ? 'Amarillo' : 'Rojo/Requiere Cambio'}`).join('\n')
        ).join('\n');

        const linkedOrder = orders.find(o => o.id === selectedOrderId);
        const mergedDescription = (linkedOrder?.description || '') + inspectionReport;

        const res = await fetchWithAuth(`http://localhost:3001/api/v1/work-orders/${selectedOrderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: mergedDescription, status: 'DIAGNOSING' })
        });

        if (res.ok) {
            showToast('✅ Check-List Integrado. Vehículo pasó a Diagnóstico.');
            setSections(INITIAL_SECTIONS);
            setSelectedOrderId('');
        } else {
            showToast('❌ Falla remota al guardar inspección.');
        }
    };

    return (
        <>
            <Header
                title="Inspección Digital (MPI)"
                subtitle="Revisión de recepción (Mobile-First)"
            />

            <div className={styles.content}>
                <p className={styles.introText}>
                    Asegúrese de caminar alrededor del vehículo evaluando los fluidos y puntos de seguridad
                    para anexarlos a la bitácora electrónica del cliente.
                </p>

                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        Sincronizando expedientes...
                    </div>
                ) : (
                    <>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>🚗 Orden Asignada</label>
                            <select
                                className={styles.formInput}
                                value={selectedOrderId}
                                onChange={e => setSelectedOrderId(e.target.value)}
                            >
                                <option value="" disabled>Seleccione en Rampa...</option>
                                {orders.map(o => (
                                    <option key={o.id} value={o.id}>
                                        {o.vehicle ? `${o.vehicle.make} ${o.vehicle.model}` : 'Auto'} ({o.id.slice(0, 5)}) - {o.client?.firstName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {sections.map(section => (
                            <div key={section.id} className={styles.formSection}>
                                <div className={styles.sectionHeader}>
                                    <span>{section.icon}</span> {section.title}
                                </div>
                                <div className={styles.checkItems}>
                                    {section.items.map(item => (
                                        <div key={item.id} className={styles.checkRow}>
                                            <div className={styles.checkLabel}>{item.label}</div>
                                            <div className={styles.checkOptions}>
                                                <button
                                                    className={`${styles.optionBtn} ${styles.optionBtnOk} ${item.status === 'OK' ? styles.active : ''}`}
                                                    onClick={() => setItemStatus(section.id, item.id, 'OK')}
                                                >
                                                    Buen Estado
                                                </button>
                                                <button
                                                    className={`${styles.optionBtn} ${styles.optionBtnWarn} ${item.status === 'WARN' ? styles.active : ''}`}
                                                    onClick={() => setItemStatus(section.id, item.id, 'WARN')}
                                                >
                                                    Sugerencia
                                                </button>
                                                <button
                                                    className={`${styles.optionBtn} ${styles.optionBtnFail} ${item.status === 'FAIL' ? styles.active : ''}`}
                                                    onClick={() => setItemStatus(section.id, item.id, 'FAIL')}
                                                >
                                                    Reemplazar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className={styles.stickyFooter}>
                <button className={styles.submitBtn} onClick={handleSave}>
                    Subir Evidencia Diagnóstica
                </button>
            </div>

            <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
                {toast.message}
            </div>
        </>
    );
}
