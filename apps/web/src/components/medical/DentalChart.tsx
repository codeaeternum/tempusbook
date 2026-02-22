'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/providers/AuthProvider';
import toast from 'react-hot-toast';

export type ToothCondition = 'HEALTHY' | 'CARIES' | 'RESTORED';
export type WholeToothStatus = 'ACTIVE' | 'EXTRACTED' | 'CROWN';

export interface ToothFace {
    top: ToothCondition;
    bottom: ToothCondition;
    left: ToothCondition;
    right: ToothCondition;
    center: ToothCondition;
}

export interface ToothData {
    id: number;
    status: WholeToothStatus;
    faces: ToothFace;
}

const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const INITIAL_TEETH = [...UPPER_ARCH, ...LOWER_ARCH].map(id => ({
    id,
    status: 'ACTIVE' as WholeToothStatus,
    faces: { top: 'HEALTHY', bottom: 'HEALTHY', left: 'HEALTHY', right: 'HEALTHY', center: 'HEALTHY' } as ToothFace
}));

interface DentalChartProps {
    clientId: string;
    businessId: string;
}

export default function DentalChart({ clientId, businessId }: DentalChartProps) {
    const [teeth, setTeeth] = useState<ToothData[]>(INITIAL_TEETH);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadChart = async () => {
            try {
                const res = await fetchWithAuth(`http://localhost:3001/api/v1/clients/${clientId}/dental-chart`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.teethData && data.teethData.length > 0) {
                        setTeeth(data.teethData);
                    }
                    if (data.notes) {
                        setNotes(data.notes);
                    }
                }
            } catch (err) {
                toast.error('Error al cargar el odontograma');
            } finally {
                setIsLoading(false);
            }
        };

        if (clientId && businessId) {
            loadChart();
        }
    }, [clientId, businessId]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/clients/${clientId}/dental-chart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teethData: teeth, notes })
            });

            if (res.ok) {
                toast.success('Odontograma guardado firmemente');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('No se pudo guardar el odontograma');
        } finally {
            setIsSaving(false);
        }
    };

    // Cycle face: HEALTHY -> CARIES -> RESTORED -> HEALTHY
    const handleFaceClick = (id: number, face: keyof ToothFace) => {
        setTeeth(prev => prev.map(t => {
            if (t.id !== id) return t;
            if (t.status === 'EXTRACTED' || t.status === 'CROWN') return t; // No surface edits if extracted/crown

            const current = t.faces[face];
            let next: ToothCondition = 'HEALTHY';
            if (current === 'HEALTHY') next = 'CARIES';
            else if (current === 'CARIES') next = 'RESTORED';

            return { ...t, faces: { ...t.faces, [face]: next } };
        }));
    };

    // Cycle whole tooth: ACTIVE -> EXTRACTED -> CROWN -> ACTIVE
    const handleToothClick = (id: number) => {
        setTeeth(prev => prev.map(t => {
            if (t.id !== id) return t;
            let next: WholeToothStatus = 'ACTIVE';
            if (t.status === 'ACTIVE') next = 'EXTRACTED';
            else if (t.status === 'EXTRACTED') next = 'CROWN';
            return { ...t, status: next };
        }));
    };

    const renderTooth = (id: number) => {
        const tooth = teeth.find(t => t.id === id) || INITIAL_TEETH.find(t => t.id === id)!;
        const isExtracted = tooth.status === 'EXTRACTED';
        const isCrown = tooth.status === 'CROWN';

        const getColor = (cond: ToothCondition) => {
            if (cond === 'CARIES') return '#ef4444'; // Red
            if (cond === 'RESTORED') return '#3b82f6'; // Blue
            return '#f9fafb'; // Light Gray
        };

        return (
            <div key={id} className="flex flex-col items-center gap-2 group">
                <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded cursor-pointer transition-colors shadow-sm
                        ${isExtracted ? 'bg-red-100 text-red-600 line-through' : isCrown ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}
                    `}
                    title="Clic para Extracción / Corona"
                    onClick={() => handleToothClick(id)}
                >
                    {id}
                </span>

                <svg viewBox="0 0 100 100" width="100%" height="100%" className="w-[45px] h-[45px] sm:w-[50px] sm:h-[50px] drop-shadow-sm cursor-pointer hover:scale-105 transition-transform" style={{ filter: isExtracted ? 'opacity(0.5)' : 'none', minWidth: '45px', minHeight: '45px' }}>
                    {isExtracted && (
                        <g stroke="#ef4444" strokeWidth="8" strokeLinecap="round">
                            <line x1="15" y1="15" x2="85" y2="85" />
                            <line x1="85" y1="15" x2="15" y2="85" />
                        </g>
                    )}

                    {!isExtracted && (
                        <g stroke="#1f2937" strokeWidth="2.5" className="hover:stroke-[3px]">
                            {/* TOP (Vestibular/Palatino) */}
                            <polygon points="0,0 100,0 75,25 25,25" fill={isCrown ? '#fbbf24' : getColor(tooth.faces.top)} onClick={() => handleFaceClick(id, 'top')} className="hover:opacity-80 transition-opacity" />
                            {/* RIGHT (Distal/Mesial) */}
                            <polygon points="100,0 100,100 75,75 75,25" fill={isCrown ? '#fbbf24' : getColor(tooth.faces.right)} onClick={() => handleFaceClick(id, 'right')} className="hover:opacity-80 transition-opacity" />
                            {/* BOTTOM (Lingual/Vestibular) */}
                            <polygon points="100,100 0,100 25,75 75,75" fill={isCrown ? '#fbbf24' : getColor(tooth.faces.bottom)} onClick={() => handleFaceClick(id, 'bottom')} className="hover:opacity-80 transition-opacity" />
                            {/* LEFT (Mesial/Distal) */}
                            <polygon points="0,100 0,0 25,25 25,75" fill={isCrown ? '#fbbf24' : getColor(tooth.faces.left)} onClick={() => handleFaceClick(id, 'left')} className="hover:opacity-80 transition-opacity" />
                            {/* CENTER (Oclusal) */}
                            <polygon points="25,25 75,25 75,75 25,75" fill={isCrown ? '#fbbf24' : getColor(tooth.faces.center)} onClick={() => handleFaceClick(id, 'center')} className="hover:opacity-80 transition-opacity" />
                        </g>
                    )}
                </svg>
            </div>
        );
    };

    if (isLoading) {
        return <div className="text-sm text-black/50 animate-pulse">Renderizando vectores médicos...</div>;
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-black border-l-4 border-blue-600 pl-3">Mapeo Anatómico Adulto</h3>
                <p className="text-sm text-black/50 pl-4">Haz click en el número del diente para marcar Extracciones o Coronas. Haz click en una de las 5 caras de la cruz para circular entre Diente Sano (Blanco) → Caries (Rojo) → Restauración (Azul).</p>
            </div>

            <div className="flex flex-col gap-10 bg-zinc-50/50 p-6 rounded-2xl border border-black/5 overflow-x-auto">
                {/* Upper Arch */}
                <div className="flex justify-center gap-1 sm:gap-2">
                    <div className="flex gap-1 sm:gap-2 pr-4 sm:pr-6 border-r-2 border-dashed border-black/10">
                        {UPPER_ARCH.slice(0, 8).map(renderTooth)}
                    </div>
                    <div className="flex gap-1 sm:gap-2 pl-4 sm:pl-6">
                        {UPPER_ARCH.slice(8).map(renderTooth)}
                    </div>
                </div>

                {/* Lower Arch */}
                <div className="flex justify-center gap-1 sm:gap-2">
                    <div className="flex gap-1 sm:gap-2 pr-4 sm:pr-6 border-r-2 border-dashed border-black/10">
                        {LOWER_ARCH.slice(0, 8).map(renderTooth)}
                    </div>
                    <div className="flex gap-1 sm:gap-2 pl-4 sm:pl-6">
                        {LOWER_ARCH.slice(8).map(renderTooth)}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-black">Observaciones Clínicas (Procedimientos y Diagnósticos)</label>
                <textarea
                    className="w-full h-32 p-4 rounded-xl border border-black/10 bg-white shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                    placeholder="El paciente reporta sensibilidad térmica en las piezas 26 y 46. Se planifica profilaxis profunda para la siguiente sesión..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-black/5">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 hover:scale-[1.02] transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Escribiendo en Servidor...
                        </>
                    ) : (
                        'Guardar Odontograma'
                    )}
                </button>
            </div>
        </div>
    );
}
