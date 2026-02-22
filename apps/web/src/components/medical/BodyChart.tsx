'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/providers/AuthProvider';
import toast from 'react-hot-toast';
import { Save, X, Activity } from 'lucide-react';

interface BodyMarker {
    id: string;
    x: number;
    y: number;
    side: 'front' | 'back';
    label: string;
    severity: number;
    notes?: string;
}

interface BodyChartProps {
    clientId: string;
    businessId: string;
}

export default function BodyChart({ clientId, businessId }: BodyChartProps) {
    const [markers, setMarkers] = useState<BodyMarker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal state
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
    const [tempMarker, setTempMarker] = useState<Partial<BodyMarker> | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Form inside modal
    const [label, setLabel] = useState('');
    const [severity, setSeverity] = useState(5);
    const [notes, setNotes] = useState('');

    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadChart();
    }, [clientId, businessId]);

    const loadChart = async () => {
        if (!clientId || !businessId) return;
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/clients/${clientId}/body-charts`);
            if (res.ok) {
                const data = await res.json();
                if (data.markers) setMarkers(data.markers);
            }
        } catch (error) {
            toast.error('Error al cargar mapa anatómico');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/clients/${clientId}/body-charts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markers }) // notes can be added later
            });

            if (res.ok) {
                toast.success('Mapa anatómico asegurado');
            } else {
                throw new Error('Save Failed');
            }
        } catch (error) {
            toast.error('Error al sincronizar el mapa');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>, side: 'front' | 'back') => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate relative % 
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setTempMarker({ x, y, side });
        setLabel('');
        setSeverity(5);
        setNotes('');
        setShowModal(true);
    };

    const confirmMarker = () => {
        if (!tempMarker) return;
        if (!label.trim()) {
            toast.error('Especifica la zona o síntoma');
            return;
        }

        const newMarker: BodyMarker = {
            id: crypto.randomUUID(),
            x: tempMarker.x!,
            y: tempMarker.y!,
            side: tempMarker.side!,
            label,
            severity,
            notes
        };

        setMarkers(prev => [...prev, newMarker]);
        setShowModal(false);
        setTempMarker(null);
    };

    const deleteMarker = (id: string) => {
        setMarkers(prev => prev.filter(m => m.id !== id));
    };

    // Humanoid SVG Abstract Representation
    const renderHumanoid = () => (
        <svg viewBox="0 0 200 500" className="w-full h-full drop-shadow-md">
            {/* Head */}
            <circle cx="100" cy="50" r="35" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="4" />
            {/* Neck */}
            <rect x="90" y="85" width="20" height="25" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="4" />
            {/* Torso */}
            <path d="M60 110 Q100 110 140 110 L130 250 Q100 260 70 250 Z" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="4" strokeLinejoin="round" />
            {/* Left Arm */}
            <path d="M55 115 Q30 110 25 180 L35 250 L50 250 L60 180 Z" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="4" strokeLinejoin="round" />
            {/* Right Arm */}
            <path d="M145 115 Q170 110 175 180 L165 250 L150 250 L140 180 Z" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="4" strokeLinejoin="round" />
            {/* Left Leg */}
            <path d="M75 255 L65 400 L80 480 L95 480 L95 400 L95 255 Z" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="4" strokeLinejoin="round" />
            {/* Right Leg */}
            <path d="M125 255 L135 400 L120 480 L105 480 L105 400 L105 255 Z" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="4" strokeLinejoin="round" />
        </svg>
    );

    const getSeverityColor = (sev: number) => {
        if (sev <= 3) return 'bg-yellow-400';
        if (sev <= 7) return 'bg-orange-500';
        return 'bg-red-600';
    };

    if (isLoading) {
        return <div className="text-center py-10 text-black/40 animate-pulse font-bold">Iniciando motor de renderizado SVG...</div>;
    }

    return (
        <div className="flex flex-col xl:flex-row gap-8 relative select-none">

            {/* LEFT: 2D Models */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 justify-center bg-zinc-50 border border-black/5 rounded-2xl p-6 relative">

                {/* Switcher for mobile View (show only one side at a time on very small screens if desired, but flex-row/col handles it) */}

                {/* Front Model */}
                <div className="w-full max-w-[300px] mx-auto flex flex-col items-center">
                    <h4 className="font-bold text-black/50 tracking-widest uppercase text-sm mb-4">Vista Frontal</h4>
                    <div
                        ref={frontRef}
                        className="relative w-full aspect-[2/5] min-h-[400px] cursor-crosshair group touch-none"
                        onClick={(e) => handleBodyClick(e, 'front')}
                    >
                        {renderHumanoid()}

                        {/* Hover Helper */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-blue-500/5 transition-opacity pointer-events-none rounded-[100px]" />

                        {/* Render Front Markers */}
                        {markers.filter(m => m.side === 'front').map(m => (
                            <div
                                key={m.id}
                                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center shadow-lg border-2 border-white transform transition-transform hover:scale-125 cursor-pointer ${getSeverityColor(m.severity)}`}
                                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                title={`${m.label} (Severidad: ${m.severity})`}
                                onClick={(e) => { e.stopPropagation(); deleteMarker(m.id); }}
                            >
                                <span className="text-[10px] font-bold text-white leading-none">{m.severity}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Back Model */}
                <div className="w-full max-w-[300px] mx-auto flex flex-col items-center">
                    <h4 className="font-bold text-black/50 tracking-widest uppercase text-sm mb-4">Vista Posterior</h4>
                    <div
                        ref={backRef}
                        className="relative w-full aspect-[2/5] min-h-[400px] cursor-crosshair group touch-none"
                        onClick={(e) => handleBodyClick(e, 'back')}
                    >
                        {renderHumanoid()}

                        {/* Render Back Markers */}
                        {markers.filter(m => m.side === 'back').map(m => (
                            <div
                                key={m.id}
                                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center shadow-lg border-2 border-white transform transition-transform hover:scale-125 cursor-pointer ${getSeverityColor(m.severity)}`}
                                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                title={`${m.label} (Severidad: ${m.severity})`}
                                onClick={(e) => { e.stopPropagation(); deleteMarker(m.id); }}
                            >
                                <span className="text-[10px] font-bold text-white leading-none">{m.severity}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* RIGHT: Markers List & Save */}
            <div className="w-full xl:w-96 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> Hallazgos Clínicos</h3>
                        <p className="text-sm text-black/50">Toca el cuerpo para registrar puntos.</p>
                    </div>
                </div>

                <div className="flex-1 bg-white border border-black/5 rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] max-h-[500px] overflow-y-auto">
                    {markers.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-black/40 text-center px-4">
                            <p className="text-sm font-semibold mb-1">Sin hallazgos marcados</p>
                            <p className="text-xs">Usa el cursor transversal o haz 'tap' en el diagrama para ubicar lesiones y puntos de dolor.</p>
                        </div>
                    ) : (
                        markers.map(m => (
                            <div key={m.id} className="border border-black/10 rounded-xl p-3 flex justify-between items-start group hover:border-blue-500/50 transition-colors">
                                <div>
                                    <h4 className="font-bold text-sm uppercase tracking-tight flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(m.severity)}`}></div>
                                        {m.label}
                                    </h4>
                                    <p className="text-xs text-black/50 mt-1 capitalize">{m.side === 'front' ? 'Frontal' : 'Posterior'}</p>
                                    {m.notes && <p className="text-xs text-black/70 italic mt-2">{m.notes}</p>}
                                </div>
                                <button onClick={() => deleteMarker(m.id)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-3 text-red-500 hover:bg-red-50 rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="mt-6 w-full py-4 bg-black text-white font-bold rounded-2xl shadow-lg hover:shadow-black/20 hover:bg-zinc-800 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Aplicando cifrado...' : 'Guardar Mapa Anatómico'}
                </button>
            </div>

            {/* MODAL BOTTOM SHEET OVERLAY */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-4">
                            <h3 className="font-bold text-lg">Registrar Hallazgo</h3>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-black/50 uppercase tracking-widest mb-2 block">Zona / Aflicción</label>
                                <input
                                    className="w-full border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-semibold"
                                    placeholder="Ej. Desgarre Lumbar, Tatuaje..."
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black/50 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Nivel de Dolor / Gravedad</span>
                                    <span className="text-black font-extrabold">{severity} / 10</span>
                                </label>
                                <input
                                    type="range"
                                    min="1" max="10"
                                    value={severity}
                                    onChange={e => setSeverity(parseInt(e.target.value))}
                                    className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-[10px] text-black/40 font-bold uppercase mt-2">
                                    <span>Leve</span>
                                    <span>Moderado</span>
                                    <span>Crítico</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-black/50 uppercase tracking-widest mb-2 block">Notas Adicionales (Opcional)</label>
                                <textarea
                                    className="w-full border border-black/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm h-20 resize-none"
                                    placeholder="Detalles sobre el daño celular..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={confirmMarker}
                                className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm"
                            >
                                Anclar Marcador
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
