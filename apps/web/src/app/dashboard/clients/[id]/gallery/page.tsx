'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/providers/AuthProvider';
import CanvasDrawer, { Annotation } from '@/components/clinical/CanvasDrawer';
import { toast } from 'react-hot-toast';

const BUSINESS_ID = '07831828-57ab-43b8-a1fb-67fd0b4a4cb8';

export default function ClinicalGalleryPage() {
    const params = useParams();
    const clientId = params.id as string;
    const router = useRouter();

    const [albums, setAlbums] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Image Upload Modal
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedAlbumId, setSelectedAlbumId] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');

    // Canvas Draving Overlay
    const [activeEditImage, setActiveEditImage] = useState<any | null>(null);

    useEffect(() => {
        loadAlbums();
    }, [clientId]);

    const loadAlbums = async () => {
        setIsLoading(true);
        try {
            // Check if default album exists, if not create one implicitly based on REST logic
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/gallery/albums?clientId=${clientId}&businessId=${BUSINESS_ID}`);
            let data = res.ok ? await res.json() : [];

            if (data.length === 0) {
                const mkRes = await fetchWithAuth(`http://localhost:3001/api/v1/gallery/albums`, {
                    method: 'POST',
                    body: JSON.stringify({ businessId: BUSINESS_ID, clientId, name: 'Historial General', description: 'Fotos automáticas del paciente' })
                });
                if (mkRes.ok) {
                    const mkData = await mkRes.json();
                    data = [{ ...mkData, images: [] }];
                }
            }
            setAlbums(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadImage = async () => {
        if (!newImageUrl || !selectedAlbumId) return;
        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/gallery/images`, {
                method: 'POST',
                body: JSON.stringify({ albumId: selectedAlbumId, url: newImageUrl, notes: '' })
            });

            if (res.ok) {
                toast.success('Fotografía agregada a la galería');
                setIsUploadOpen(false);
                setNewImageUrl('');
                loadAlbums();
            }
        } catch (e) {
            toast.error('Error al subir imagen');
        }
    };

    const handleSaveAnnotations = async (annotations: Annotation[]) => {
        if (!activeEditImage) return;

        // Flatten annotations to API DTO standard
        const flatAnns = annotations.map(stroke => ({
            x: stroke.points.length > 0 ? stroke.points[0].x : 0,
            y: stroke.points.length > 0 ? stroke.points[0].y : 0,
            note: JSON.stringify(stroke.points), // Temporarily store raw vector stroke in note for 2D restoration
            color: stroke.color
        }));

        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/gallery/images/annotations`, {
                method: 'PUT',
                body: JSON.stringify({ imageId: activeEditImage.id, annotations: flatAnns })
            });

            if (res.ok) {
                toast.success('Anotaciones médicas guardadas');
                setActiveEditImage(null);
                loadAlbums();
            }
        } catch (e) {
            toast.error('Error sincronizando Canvas');
        }
    };

    const parseExistingAnnotations = (rawAnns: any[]): Annotation[] => {
        if (!rawAnns || rawAnns.length === 0) return [];
        return rawAnns.map(a => {
            try {
                // Parse points array from stringified note field
                const points = JSON.parse(a.note);
                if (Array.isArray(points)) {
                    return { points, color: a.color || '#EF4444' };
                }
            } catch (e) {
                // If not JSON, default to generic points
            }
            return { points: [{ x: a.x, y: a.y }], color: a.color || '#EF4444' };
        });
    };


    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header: Desktop/Mobile agnostic padding and bold titles */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Galería Visual Pinterest</h1>
                    <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Anotaciones y Progreso Clínico.</p>
                </div>

                {/* 44px Hit Target Standard */}
                <button
                    onClick={() => {
                        if (albums.length > 0) setSelectedAlbumId(albums[0].id);
                        setIsUploadOpen(true);
                    }}
                    style={{
                        minHeight: '44px', padding: '0 1.5rem', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
                    }}
                >
                    + Foto de Progreso
                </button>
            </header>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Cargando galería...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {albums.map((album) => (
                        <div key={album.id}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                📁 {album.name} <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>({album.images.length} fotos)</span>
                            </h2>

                            {/* PINTEREST MASONRY GRID emulation */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '1.5rem',
                                alignItems: 'start' // Critical for masonry distinct heights
                            }}>
                                {album.images.length === 0 ? (
                                    <p style={{ color: '#94a3b8', gridColumn: '1 / -1' }}>El álbum está vacío. Sube imágenes para registrar progresos históricos.</p>
                                ) : (
                                    album.images.map((img: any) => (
                                        <div key={img.id} style={{
                                            background: '#fff',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                            border: '1px solid #f1f5f9',
                                            transition: 'transform 0.2s',
                                            cursor: 'pointer' // Direct interaction vs hover dependency
                                        }} onClick={() => setActiveEditImage(img)}>
                                            <div style={{ position: 'relative', width: '100%', paddingBottom: '110%' /* approx. aspect ratio */ }}>
                                                {/* In a real app we'd use Next/Image, employing standard <img/> for simple layout demo */}
                                                <img
                                                    src={img.url}
                                                    alt="Clinical Evidence"
                                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                                {img.annotations && img.annotations.length > 0 && (
                                                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                                                        {img.annotations.length} Trazos
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '1rem' }}>
                                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Subido: {new Date(img.uploadedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CANVAS ANNOTATION MODAL OVERLAY */}
            {activeEditImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', padding: '1rem',
                    overflowY: 'auto'
                }}>
                    <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a', fontWeight: 800 }}>Trazos y Anotaciones Diagnósticas</h3>
                        <CanvasDrawer
                            imageUrl={activeEditImage.url}
                            existingAnnotations={parseExistingAnnotations(activeEditImage.annotations)}
                            onSave={handleSaveAnnotations}
                            onCancel={() => setActiveEditImage(null)}
                        />
                    </div>
                </div>
            )}

            {/* UPLOAD MODAL */}
            {isUploadOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 50, backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
                }}>
                    <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#0f172a' }}>Agregar Fotografía</h3>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>URL de la Imagen (Simulador CDN):</label>
                            <input
                                type="text"
                                value={newImageUrl}
                                onChange={e => setNewImageUrl(e.target.value)}
                                placeholder="https://ejemplo.com/foto.jpg"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setIsUploadOpen(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleUploadImage} disabled={!newImageUrl} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, cursor: newImageUrl ? 'pointer' : 'not-allowed', opacity: newImageUrl ? 1 : 0.5 }}>Subir</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
