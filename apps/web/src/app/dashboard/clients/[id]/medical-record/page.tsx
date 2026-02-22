'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, fetchWithAuth } from '@/providers/AuthProvider';
import Header from '@/components/layout/Header';
import DentalChart from '@/components/medical/DentalChart';
import Prescriptions from '@/components/medical/Prescriptions';
import BodyChart from '@/components/medical/BodyChart';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { ROOT_BUSINESS_ID } from '@aeternasuite/shared-constants';
import { useBusinessVertical } from '@/hooks/useBusinessVertical';

export default function MedicalRecordPage() {
    const params = useParams();
    const router = useRouter();
    const { activeBusinessId } = useAuth();
    const safeBusinessId = activeBusinessId || ROOT_BUSINESS_ID;
    const { isClinical } = useBusinessVertical();

    // El parametro id viene de la URL (clients/[id])
    const clientId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [clientName, setClientName] = useState('...');
    const [activeTab, setActiveTab] = useState<'general' | 'dental' | 'prescriptions' | 'bodyChart'>('general');

    // Muro de Fuego Contextual:
    // Evita que negocios no-médicos vean esta interfaz incluso si forzan la URL.
    if (!isClinical) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4">
                    !
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
                <p className="text-gray-500 mb-6 max-w-md">
                    El Expediente Médico (EHR) está reservado para negocios del sector salud o clínico.
                    Tu negocio está configurado en una vertical distinta.
                </p>
                <button
                    onClick={() => router.push('/dashboard/clients')}
                    className="h-11 px-6 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                    Volver a Clientes
                </button>
            </div>
        );
    }

    // Medical Info State
    const [record, setRecord] = useState({
        bloodType: '',
        allergies: '',
        chronicConditions: '',
        currentMedications: '',
        emergencyContact: '',
        notes: ''
    });

    useEffect(() => {
        if (!safeBusinessId || !clientId) return;

        fetchWithAuth(`http://localhost:3001/api/v1/medical-records/business/${safeBusinessId}/client/${clientId}`)
            .then(res => {
                if (res.ok) return res.json();
                if (res.status === 404) return null; // Permite crear si no existia
                throw new Error('Error recuperando expediente');
            })
            .then(data => {
                if (data) {
                    setRecord({
                        bloodType: data.bloodType || '',
                        allergies: data.allergies || '',
                        chronicConditions: data.chronicConditions || '',
                        currentMedications: data.currentMedications || '',
                        emergencyContact: data.emergencyContact || '',
                        notes: data.notes || ''
                    });
                }
                setIsLoading(false);
            })
            .catch(err => {
                toast.error('No se pudo cargar el expediente seguro.');
                setIsLoading(false);
            });
    }, [safeBusinessId, clientId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRecord(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!safeBusinessId || !clientId) return;
        setIsSaving(true);

        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/medical-records/business/${safeBusinessId}/client/${clientId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });

            if (!res.ok) throw new Error('Fallo al actualizar el expediente');
            toast.success('Expediente actualizado exitosamente');

        } catch (error) {
            toast.error('Hubo un error al guardar los datos.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ paddingBottom: '3rem' }}>
            <Header title="Expediente Clínico" subtitle="Datos médicos protegidos bajo confidencialidad" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>Historial Médico y Riesgos</h2>
                        <p className={styles.subtitle}>Cualquier formulario médico (Intake) llenado por el paciente auto-sincronizará estos campos.</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => router.back()}>
                        ← Volver a Clientes
                    </button>
                </div>

                <div className="flex gap-4 border-b border-black/10 mb-8 pb-px overflow-x-auto no-scrollbar scroll-smooth snap-x">
                    <button
                        className={`min-h-[44px] px-2 flex-shrink-0 text-sm font-semibold transition-colors relative snap-start ${activeTab === 'general' ? 'text-blue-600' : 'text-black/50 hover:text-black'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        Expediente General
                        {activeTab === 'general' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-full"></div>}
                    </button>
                    <button
                        className={`min-h-[44px] px-2 flex-shrink-0 text-sm font-semibold transition-colors relative snap-start ${activeTab === 'dental' ? 'text-blue-600' : 'text-black/50 hover:text-black'}`}
                        onClick={() => setActiveTab('dental')}
                    >
                        Odontograma
                        {activeTab === 'dental' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-full"></div>}
                    </button>
                    <button
                        className={`min-h-[44px] px-2 flex-shrink-0 text-sm font-semibold transition-colors relative snap-start ${activeTab === 'prescriptions' ? 'text-blue-600' : 'text-black/50 hover:text-black'}`}
                        onClick={() => setActiveTab('prescriptions')}
                    >
                        Recetas
                        {activeTab === 'prescriptions' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-full"></div>}
                    </button>
                    <button
                        className={`min-h-[44px] px-2 flex-shrink-0 text-sm font-semibold transition-colors relative snap-start ${activeTab === 'bodyChart' ? 'text-blue-600' : 'text-black/50 hover:text-black'}`}
                        onClick={() => setActiveTab('bodyChart')}
                    >
                        Mapa Anatómico
                        {activeTab === 'bodyChart' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-full"></div>}
                    </button>
                    <button
                        className={`min-h-[44px] px-2 flex-shrink-0 text-sm font-semibold transition-colors relative snap-start text-black/50 hover:text-black`}
                        onClick={() => router.push(`/dashboard/clients/${clientId}/gallery`)}
                    >
                        📸 Galería (Anotaciones)
                    </button>
                </div>

                {isLoading ? (
                    <div>Cargando expediente cifrado...</div>
                ) : (
                    <>
                        {activeTab === 'general' && (
                            <div className={styles.card}>
                                <div className={styles.formGrid}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Tipo de Sangre</label>
                                        <input
                                            name="bloodType"
                                            className={styles.input}
                                            placeholder="Ej. O+, A- ..."
                                            value={record.bloodType}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Contacto de Emergencia</label>
                                        <input
                                            name="emergencyContact"
                                            className={styles.input}
                                            placeholder="Nombre y Teléfono"
                                            value={record.emergencyContact}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Alergias Conocidas</label>
                                        <input
                                            name="allergies"
                                            className={styles.input}
                                            placeholder="Penicilina, polvo, nueces..."
                                            value={record.allergies}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Condiciones Crónicas</label>
                                        <input
                                            name="chronicConditions"
                                            className={styles.input}
                                            placeholder="Hipertensión, Diabetes..."
                                            value={record.chronicConditions}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Medicamentos Actuales</label>
                                        <input
                                            name="currentMedications"
                                            className={styles.input}
                                            placeholder="Dosis y fármaco..."
                                            value={record.currentMedications}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Notas Clínicas Confidenciales</label>
                                        <textarea
                                            name="notes"
                                            className={styles.textarea}
                                            placeholder="Apuntes de consulta, observaciones de riesgo, evolución..."
                                            value={record.notes}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? 'Guardando...' : 'Guardar Expediente'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'dental' && (
                            <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-sm">
                                <DentalChart clientId={clientId} businessId={safeBusinessId} />
                            </div>
                        )}

                        {activeTab === 'prescriptions' && (
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm">
                                <Prescriptions clientId={clientId} businessId={safeBusinessId} />
                            </div>
                        )}

                        {activeTab === 'bodyChart' && (
                            <div className="bg-white rounded-2xl border border-black/5 shadow-sm">
                                <BodyChart clientId={clientId} businessId={safeBusinessId} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
