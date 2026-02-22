'use client';

import React, { useRef, useState, useEffect } from 'react';

/**
 * Módulo de Dibujo Agnostic (Canvas Drawer)
 * Diseñado bajo protocolos de Perfección: Multi-plataforma e Interacción Híbrida.
 * Las coordenadas se guardan como escalares relativas (X,Y entre 0 y 1) para garantizar 
 * consistencia perfecta independientemente si la imagen se visualiza en un Móvil o Monitor 4K.
 */

export interface Point {
    x: number;
    y: number;
}

export interface Annotation {
    points: Point[]; // Continuous stroke
    color: string;
}

interface CanvasDrawerProps {
    imageUrl: string;
    existingAnnotations?: Annotation[];
    onSave: (annotations: Annotation[]) => void;
    onCancel: () => void;
}

export default function CanvasDrawer({ imageUrl, existingAnnotations = [], onSave, onCancel }: CanvasDrawerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const bgImageRef = useRef<HTMLImageElement | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#EF4444');
    const [annotations, setAnnotations] = useState<Annotation[]>(existingAnnotations);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Initialize Canvas and Image Scaling
    useEffect(() => {
        const bgImg = new Image();
        bgImg.src = imageUrl;
        bgImg.onload = () => {
            bgImageRef.current = bgImg;
            fitCanvasToImage();
        };

        const handleResize = () => requestAnimationFrame(fitCanvasToImage);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [imageUrl]);

    const fitCanvasToImage = () => {
        if (!containerRef.current || !bgImageRef.current) return;
        const containerWidth = containerRef.current.clientWidth;
        const imgRatio = bgImageRef.current.width / bgImageRef.current.height;

        let targetWidth = containerWidth;
        let targetHeight = containerWidth / imgRatio;

        // Max Height clamp
        if (targetHeight > window.innerHeight * 0.7) {
            targetHeight = window.innerHeight * 0.7;
            targetWidth = targetHeight * imgRatio;
        }

        setCanvasSize({ width: targetWidth, height: targetHeight });
    };

    // Render loop whenever annotations or size changes
    useEffect(() => {
        const tCtx = canvasRef.current?.getContext('2d');
        if (!tCtx || !bgImageRef.current || canvasSize.width === 0) return;

        // Limpiar lienzo
        tCtx.clearRect(0, 0, canvasSize.width, canvasSize.height);

        // Dibujar Fondo
        tCtx.drawImage(bgImageRef.current, 0, 0, canvasSize.width, canvasSize.height);

        // Configuración Universal de Pincel
        tCtx.lineCap = 'round';
        tCtx.lineJoin = 'round';
        tCtx.lineWidth = 4;

        // Dibujar Histórico
        const drawStrokeLine = (pts: Point[], col: string) => {
            if (pts.length < 2) return;
            tCtx.beginPath();
            tCtx.strokeStyle = col;
            tCtx.moveTo(pts[0].x * canvasSize.width, pts[0].y * canvasSize.height);
            for (let i = 1; i < pts.length; i++) {
                tCtx.lineTo(pts[i].x * canvasSize.width, pts[i].y * canvasSize.height);
            }
            tCtx.stroke();
        };

        annotations.forEach(ann => drawStrokeLine(ann.points, ann.color));
        if (currentStroke.length > 0) drawStrokeLine(currentStroke, color);

    }, [annotations, currentStroke, canvasSize, color]);

    // Input Agnostic Event Handlers (Mouse & Touch mapping to relative 0-1)
    const getEvtPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) / canvasSize.width,
            y: (clientY - rect.top) / canvasSize.height
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent scrolling while drawing on mobile
        //if ('touches' in e && e.cancelable) e.preventDefault(); 
        setIsDrawing(true);
        setCurrentStroke([getEvtPos(e)]);
    };

    const doDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        setCurrentStroke(prev => [...prev, getEvtPos(e)]);
    };

    const endDraw = () => {
        if (!isDrawing) return;
        if (currentStroke.length > 1) {
            setAnnotations(prev => [...prev, { points: currentStroke, color }]);
        }
        setCurrentStroke([]);
        setIsDrawing(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            {/* Native Ergonomics: Toolbar Toolbar Hit Targets > 44px */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>

                {/* Color Selector */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF', '#0f172a'].map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                backgroundColor: c,
                                border: color === c ? '3px solid #6366f1' : '1px solid #e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: color === c ? 'scale(1.1)' : 'scale(1)'
                            }}
                            aria-label={`Seleccionar color ${c}`}
                        />
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setAnnotations(prev => prev.slice(0, -1))}
                        disabled={annotations.length === 0}
                        style={{
                            minHeight: '44px', padding: '0 1.5rem', borderRadius: '8px',
                            background: '#f1f5f9', color: '#475569', fontWeight: 600,
                            border: 'none', cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
                            opacity: annotations.length > 0 ? 1 : 0.5
                        }}
                    >
                        ↩️ Deshacer
                    </button>

                    <button
                        onClick={() => setAnnotations([])}
                        disabled={annotations.length === 0}
                        style={{
                            minHeight: '44px', padding: '0 1.5rem', borderRadius: '8px',
                            background: '#fee2e2', color: '#b91c1c', fontWeight: 600,
                            border: 'none', cursor: annotations.length > 0 ? 'pointer' : 'not-allowed',
                            opacity: annotations.length > 0 ? 1 : 0.5
                        }}
                    >
                        🗑️ Limpiar
                    </button>
                </div>
            </div>

            {/* Canvas Container */}
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '1rem',
                    overflow: 'hidden',
                    touchAction: 'none' // Critical: stops mobile browser scroll when drawing
                }}
            >
                {canvasSize.width > 0 && (
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        onMouseDown={startDraw}
                        onMouseMove={doDraw}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                        onTouchStart={startDraw}
                        onTouchMove={doDraw}
                        onTouchEnd={endDraw}
                        onTouchCancel={endDraw}
                        style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            cursor: 'crosshair',
                            background: '#fff'
                        }}
                    />
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                    onClick={onCancel}
                    style={{
                        minHeight: '44px', minWidth: '120px', borderRadius: '8px',
                        background: 'transparent', border: '1px solid #94a3b8',
                        color: '#64748b', fontWeight: 600, cursor: 'pointer'
                    }}
                >
                    Cancelar
                </button>
                <button
                    onClick={() => onSave(annotations)}
                    style={{
                        minHeight: '44px', minWidth: '150px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: '#ffffff', border: 'none', fontWeight: 600,
                        cursor: 'pointer', boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
}
