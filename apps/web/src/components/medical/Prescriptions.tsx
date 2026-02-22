'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/providers/AuthProvider';
import toast from 'react-hot-toast';
import { FileText, Plus, Printer, X, PlusCircle, PenLine } from 'lucide-react';

interface PrescriptionItem {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes?: string;
}

interface PrescriptionData {
    id: string;
    businessId: string;
    diagnosis?: string;
    notes?: string;
    doctorName?: string;
    createdAt: string;
    items: PrescriptionItem[];
    // Extended context for printing
    client?: { firstName: string, lastName: string, email: string };
    business?: { name: string, logoUrl?: string, phone?: string, address?: string };
}

interface PrescriptionsProps {
    clientId: string;
    businessId: string;
}

export default function Prescriptions({ clientId, businessId }: PrescriptionsProps) {
    const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newDiagnosis, setNewDiagnosis] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [newDoctorName, setNewDoctorName] = useState('');
    const [newItems, setNewItems] = useState<PrescriptionItem[]>([
        { medicationName: '', dosage: '', frequency: '', duration: '', notes: '' }
    ]);

    // Print State
    const [activePrintRecord, setActivePrintRecord] = useState<PrescriptionData | null>(null);

    useEffect(() => {
        loadPrescriptions();
    }, [clientId, businessId]);

    const loadPrescriptions = async () => {
        if (!clientId || !businessId) return;
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/clients/${clientId}/prescriptions`);
            if (res.ok) {
                const data = await res.json();
                setPrescriptions(data);
            }
        } catch (error) {
            toast.error('Error al cargar recetas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = () => {
        setNewItems(prev => [...prev, { medicationName: '', dosage: '', frequency: '', duration: '', notes: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        setNewItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof PrescriptionItem, value: string) => {
        setNewItems(prev => {
            const arr = [...prev];
            arr[index] = { ...arr[index], [field]: value };
            return arr;
        });
    };

    const handleSave = async () => {
        // Validation
        const validItems = newItems.filter(i => i.medicationName.trim() !== '');
        if (validItems.length === 0) {
            toast.error('Debes agregar al menos un medicamento válido.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                diagnosis: newDiagnosis,
                notes: newNotes,
                doctorName: newDoctorName,
                items: validItems
            };

            const res = await fetchWithAuth(`http://localhost:3001/api/v1/clients/${clientId}/prescriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Receta emitida exitosamente');
                setIsFormOpen(false);
                // Reset form
                setNewDiagnosis('');
                setNewNotes('');
                setNewDoctorName('');
                setNewItems([{ medicationName: '', dosage: '', frequency: '', duration: '', notes: '' }]);
                loadPrescriptions();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('No se pudo guardar la receta');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = async (id: string) => {
        try {
            // Fetch detailed record to assure business/client info context is attached
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/clients/${clientId}/prescriptions/${id}`);
            if (res.ok) {
                const record = await res.json();
                setActivePrintRecord(record);
                // Allow React to mount the printable area, then fire print
                setTimeout(() => {
                    window.print();
                    // Optional: clear active after print dialog closes, but browsers block thread during print anyway
                    setTimeout(() => setActivePrintRecord(null), 1000);
                }, 100);
            }
        } catch (error) {
            toast.error('No se pudo generar el documento PDF');
        }
    };

    // ------------- PRINT LAYOUT (Only visible on browser Print) -------------
    if (activePrintRecord) {
        return (
            <div className="fixed inset-0 bg-white z-[9999] print:block text-black p-8 font-sans">
                {/* Print Context Isolation */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body * { visibility: hidden; }
                        .print-container, .print-container * { visibility: visible; }
                        .print-container { position: absolute; left: 0; top: 0; width: 100%; }
                        @page { margin: 20mm; }
                    }
                `}} />

                <div className="print-container max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="border-b-2 border-black/20 pb-6 mb-6 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                {activePrintRecord.business?.name || 'Clínica Médica'}
                            </h1>
                            <p className="text-sm text-black/60 mt-1">{activePrintRecord.business?.address || 'Dirección de la sucursal no registrada'}</p>
                            <p className="text-sm text-black/60">Telf: {activePrintRecord.business?.phone || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold border border-black/10 px-4 py-1 rounded inline-block bg-black/5">RECETA MÉDICA</h2>
                            <p className="font-mono text-sm mt-3 border-b border-black/10 inline-block pb-1">
                                FECHA: {new Date(activePrintRecord.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="flex gap-10 mb-8 p-4 bg-zinc-50 rounded-lg border border-black/10">
                        <div>
                            <p className="text-xs text-black/50 font-bold uppercase tracking-wider mb-1">Paciente</p>
                            <p className="font-bold text-lg">{activePrintRecord.client?.firstName} {activePrintRecord.client?.lastName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-black/50 font-bold uppercase tracking-wider mb-1">Diagnóstico (CIE-10)</p>
                            <p className="font-medium">{activePrintRecord.diagnosis || 'No especificado'}</p>
                        </div>
                    </div>

                    {/* RX Symbol */}
                    <div className="text-4xl font-serif font-bold italic text-black/30 mb-6">Rx</div>

                    {/* Medications */}
                    <div className="space-y-6 mb-12 min-h-[300px]">
                        {activePrintRecord.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-start pb-4 border-b border-black/5">
                                <span className="font-bold text-xl text-black/40">{idx + 1}.</span>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight uppercase tracking-tight">{item.medicationName} — <span className="text-black/60 lowercase">{item.dosage}</span></h3>
                                    <p className="text-black/80 mt-1">
                                        Tomar <span className="font-bold">{item.frequency}</span> durante <span className="font-bold">{item.duration}</span>.
                                    </p>
                                    {item.notes && <p className="text-sm italic text-black/50 mt-1">Nota: {item.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer / Signature */}
                    <div className="mt-20 pt-10 border-t border-black/20 flex justify-between items-end">
                        <div className="max-w-md">
                            <p className="text-sm italic text-black/60">{activePrintRecord.notes}</p>
                            <p className="text-xs text-black/40 mt-4">Documento emitido electrónicamente a través de AeternaSuite B2B. Válido por 30 días.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-48 h-px bg-black mb-2 mx-auto"></div>
                            <p className="font-bold">Firma del Facultativo</p>
                            <p className="text-sm font-medium text-black/60">Dr(a). {activePrintRecord.doctorName || '_______________'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    // ------------------------------------------------------------------------

    return (
        <div className="flex flex-col gap-6 print:hidden">
            {/* Context Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/5 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-black border-l-4 border-blue-600 pl-3">Recetario Digital</h3>
                    <p className="text-sm text-black/50 pl-4 mt-1">Crea y archiva prescripciones médicas en PDF.</p>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-md"
                    >
                        <Plus className="w-5 h-5" /> Nueva Receta
                    </button>
                )}
            </div>

            {/* NEW PRESCRIPTION FORM */}
            {isFormOpen && (
                <div className="bg-zinc-50 border border-black/10 rounded-2xl p-4 sm:p-6 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-lg flex items-center gap-2"><PenLine className="w-5 h-5 text-blue-600" /> Emitir Nueva Receta</h4>
                        <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/50 hover:text-red-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div>
                            <label className="text-xs font-bold text-black/50 uppercase tracking-widest mb-1 block">Diagnóstico Principal</label>
                            <input
                                className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Ej. Faringitis Aguda (J02.9)"
                                value={newDiagnosis}
                                onChange={e => setNewDiagnosis(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-black/50 uppercase tracking-widest mb-1 block">Nombre del Médico Atendente</label>
                            <input
                                className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Dr. Juan Pérez"
                                value={newDoctorName}
                                onChange={e => setNewDoctorName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-xs font-bold text-black/50 uppercase tracking-widest mb-3 block">Medicamentos (Rx)</label>
                        <div className="flex flex-col gap-3">
                            {newItems.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-black/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center relative group">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
                                        <input
                                            className="w-full bg-zinc-50 border border-black/5 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                                            placeholder="Medicamento (Ej. Paracetamol)"
                                            value={item.medicationName}
                                            onChange={e => handleItemChange(idx, 'medicationName', e.target.value)}
                                        />
                                        <input
                                            className="w-full bg-zinc-50 border border-black/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                                            placeholder="Dosis (Ej. 500mg)"
                                            value={item.dosage}
                                            onChange={e => handleItemChange(idx, 'dosage', e.target.value)}
                                        />
                                        <input
                                            className="w-full bg-zinc-50 border border-black/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                                            placeholder="Frecuencia (Ej. c/8 horas)"
                                            value={item.frequency}
                                            onChange={e => handleItemChange(idx, 'frequency', e.target.value)}
                                        />
                                        <input
                                            className="w-full bg-zinc-50 border border-black/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                                            placeholder="Duración (Ej. 5 días)"
                                            value={item.duration}
                                            onChange={e => handleItemChange(idx, 'duration', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        title="Eliminar medicamento"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="sm:w-auto w-full mt-2 sm:mt-0 p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex justify-center items-center"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAddItem}
                            className="mt-4 flex items-center justify-center gap-2 w-full border-2 border-dashed border-black/10 text-black/50 py-3 rounded-xl hover:bg-black/5 hover:text-black hover:border-black/20 transition-all font-semibold text-sm"
                        >
                            <PlusCircle className="w-4 h-4" /> Añadir otro medicamento
                        </button>
                    </div>

                    <div className="mb-8">
                        <label className="text-xs font-bold text-black/50 uppercase tracking-widest mb-1 block">Indicaciones Generales (Opcional)</label>
                        <textarea
                            className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                            placeholder="Descanso absoluto, evitar irritantes..."
                            value={newNotes}
                            onChange={e => setNewNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="px-6 py-3 rounded-xl font-bold text-black/60 hover:bg-black/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando...' : 'Firmar y Emitir Receta'}
                        </button>
                    </div>
                </div>
            )}

            {/* LIST OF PAST PRESCRIPTIONS */}
            {isLoading ? (
                <div className="text-sm text-black/40 animate-pulse text-center py-10">Cargando recetario seguro...</div>
            ) : prescriptions.length === 0 ? (
                <div className="bg-zinc-50 border border-dashed border-black/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-2">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-lg text-black">Historial Vacío</h4>
                    <p className="text-black/50 text-sm max-w-sm">Este paciente no tiene recetas médicas emitidas en esta clínica. Expídele su primera receta para comenzar el rastro clínico.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {prescriptions.map(p => (
                        <div key={p.id} className="group bg-white border border-black/5 rounded-xl p-5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded">
                                            {new Date(p.createdAt).toLocaleDateString()}
                                        </span>
                                        <h4 className="font-bold text-base line-clamp-1">{p.diagnosis || 'Consulta General'}</h4>
                                    </div>
                                    <p className="text-sm text-black/50 mb-3">Atendido por: {p.doctorName || 'Dr(a). Clínica'}</p>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {p.items.map((item, i) => (
                                            <span key={i} className="inline-flex items-center border border-black/5 bg-zinc-50 text-xs font-medium px-2 py-1 rounded-md text-black/70">
                                                {item.medicationName} ({item.dosage})
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePrint(p.id)}
                                    title="Imprimir PDF Documento"
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors shrink-0"
                                >
                                    <Printer className="w-4 h-4" /> PDF
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
