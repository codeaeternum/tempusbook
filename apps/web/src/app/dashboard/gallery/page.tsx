'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './page.module.css';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ---- Types ----
interface GalleryItem {
    id: string;
    title: string;
    type: string;
    fileUrl: string;
    mimeType: string;
    isPublic: boolean;
    createdAt: string;
    likes?: number; // kept for UI only
    staff?: string; // kept for UI only
    featured?: boolean; // kept for UI only
    color?: string; // kept for UI fallback
    size?: 'normal' | 'tall' | 'wide';
}

type GalleryForm = { title: string; category: string; staff: string; featured: boolean, file: File | null };
type SortBy = 'recent' | 'popular' | 'staff';

const CATEGORIES = ['Todos', 'BEFORE_AFTER', 'PORTFOLIO', 'DOCUMENT'];
const ALBUMS = ['Todas'];
const STAFF = ['Admin', 'General'];

const EMPTY_FORM: GalleryForm = { title: '', category: 'PORTFOLIO', staff: 'General', featured: false, file: null };

// ---- Component ----
export default function GalleryPage() {
    const { t } = useLocale();
    const { activeBusinessId } = useAuth();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('Todos');
    const [filterAlbum, setFilterAlbum] = useState('Todas');
    const [sortBy, setSortBy] = useState<SortBy>('recent');
    const [onlyFeatured, setOnlyFeatured] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<GalleryForm>(EMPTY_FORM);
    const [toast, setToast] = useState<string | null>(null);
    const [baSlider, setBaSlider] = useState(50);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    const loadGallery = async () => {
        setIsLoading(true);
        if (!activeBusinessId) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/gallery/business/${activeBusinessId}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Error fetching gallery:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadGallery();
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const filtered = useMemo(() => {
        const result = items.filter(item => {
            const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase()) || true;
            const matchCat = filterCat === 'Todos' || item.type === filterCat;
            const matchFeatured = !onlyFeatured || item.featured;
            // Albums logic bypassed for real items unless typed in DB
            return matchSearch && matchCat && matchFeatured;
        });
        if (sortBy === 'recent') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return result;
    }, [items, search, filterCat, sortBy, onlyFeatured, filterAlbum]);

    const stats = useMemo(() => ({
        total: items.length,
        featured: items.filter(i => i.featured).length,
        totalLikes: items.reduce((s, i) => s + (i.likes || 0), 0),
        topCategory: (() => { const counts: Record<string, number> = {}; items.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; }); return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || '-'; })(),
    }), [items]);

    const likeItem = (id: string) => { setItems(prev => prev.map(i => i.id === id ? { ...i, likes: (i.likes || 0) + 1 } : i)); };
    const deleteItem = async (id: string) => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/gallery/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== id));
                setSelectedItem(null);
                showToast('Archivo eliminado de la Bóveda');
            } else {
                showToast('Fallo al eliminar archivo');
            }
        } catch (e) {
            console.warn(e);
        }
    };
    const toggleFeatured = (id: string) => { setItems(prev => prev.map(i => i.id === id ? { ...i, featured: !i.featured } : i)); };

    const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
    const openEdit = (item: GalleryItem) => { setEditingId(item.id); setForm({ title: item.title, category: item.type, staff: item.staff || 'General', featured: !!item.featured, file: null }); setSelectedItem(null); setModalOpen(true); };

    const handleSave = async () => {
        if (!form.title) return;
        if (editingId) {
            // Edit not fully implemented in API yet, mock UI update
            setItems(prev => prev.map(i => i.id === editingId ? { ...i, title: form.title, type: form.category, featured: form.featured } : i));
            showToast('Metadatos actualizados');
        } else {
            if (!form.file) {
                showToast('Debes seleccionar un archivo binario primero');
                return;
            }

            const formData = new FormData();
            formData.append('businessId', activeBusinessId || '');
            formData.append('type', form.category);
            formData.append('title', form.title);
            formData.append('isPublic', 'true');
            formData.append('file', form.file);

            try {
                // Notice we omit 'Content-Type' header to let the browser set it to multipart/form-data boundary
                const authCookie = document.cookie.split('; ').find(row => row.startsWith('aeterna-auth='))?.split('=')[1];
                const res = await fetch(`${API_URL}/api/v1/gallery/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authCookie || localStorage.getItem('aeterna-token')}`
                    },
                    body: formData as any
                });

                if (res.ok) {
                    showToast('Transacción Multipart Exitosa');
                    loadGallery(); // Reload items from DB to catch the new fileUrl
                } else {
                    const errorResponse = await res.json();
                    showToast(`NestJS Rechazó: ${errorResponse?.message || 'Error Desconocido'}`);
                }
            } catch (e) {
                showToast('Falla en la Red al subir la Bóveda');
            }
        }
        setModalOpen(false);
    };

    // Lightbox navigation
    const navigateLightbox = useCallback((dir: 1 | -1) => {
        if (!selectedItem) return;
        const idx = filtered.findIndex(i => i.id === selectedItem.id);
        const next = filtered[(idx + dir + filtered.length) % filtered.length];
        if (next) { setSelectedItem(next); setBaSlider(50); }
    }, [selectedItem, filtered]);

    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) { navigateLightbox(diff > 0 ? 1 : -1); }
    };

    return (
        <>
            <Header title={t('gallery')} subtitle="Portfolio de trabajos, portafolio visual del negocio" />
            <div className={styles.content}>
                <div className={styles.statsRow}>
                    <div className={styles.stat}><span className={styles.statIcon}>📸</span><div><span className={styles.statValue}>{stats.total}</span><span className={styles.statLabel}>Total imágenes</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>⭐</span><div><span className={styles.statValue}>{stats.featured}</span><span className={styles.statLabel}>Destacadas</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>❤️</span><div><span className={styles.statValue}>{stats.totalLikes}</span><span className={styles.statLabel}>Total likes</span></div></div>
                    <div className={styles.stat}><span className={styles.statIcon}>🏆</span><div><span className={styles.statValue}>{stats.topCategory}</span><span className={styles.statLabel}>Top categoría</span></div></div>
                </div>

                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <div className={styles.searchGroup}><span className={styles.sIcon}>🔍</span><input className={styles.searchInput} type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    <div className={styles.catFilters}>
                        {CATEGORIES.map(c => (<button key={c} className={`${styles.catBtn} ${filterCat === c ? styles.catActive : ''}`} onClick={() => setFilterCat(c)}>{c}</button>))}
                    </div>
                    <label className={styles.featuredCheck}><input type="checkbox" checked={onlyFeatured} onChange={e => setOnlyFeatured(e.target.checked)} /> ⭐ Solo destacadas</label>
                    <button className={styles.uploadBtn} onClick={openCreate}>+</button>
                </div>

                {/* Sort + Album */}
                <div className={styles.sortRow}>
                    <div className={styles.sortGroup}>
                        <span className={styles.sortLabel}>Ordenar:</span>
                        {([['recent', '🕐 Recientes'], ['popular', '❤️ Populares'], ['staff', '👤 Por staff']] as [SortBy, string][]).map(([key, label]) => (
                            <button key={key} className={`${styles.sortBtn} ${sortBy === key ? styles.sortActive : ''}`} onClick={() => setSortBy(key)}>{label}</button>
                        ))}
                    </div>
                    <div className={styles.albumGroup}>
                        <span className={styles.sortLabel}>Álbum:</span>
                        <select className={styles.albumSelect} value={filterAlbum} onChange={e => setFilterAlbum(e.target.value)}>
                            {ALBUMS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                </div>

                {/* Masonry Grid */}
                <div className={styles.masonry}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando Bóveda P12...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No hay archivos almacenados.</div>
                    ) : filtered.map(item => (
                        <div key={item.id} className={`${styles.masonryItem} ${styles[`size_${item.size || 'normal'}`]}`} onClick={() => { setSelectedItem(item); setBaSlider(50); }}>
                            <div className={styles.imgCard} style={{ background: item.color || '#3b82f6', backgroundImage: `url(${API_URL}${item.fileUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {item.featured && <span className={styles.featBadge}>⭐</span>}
                                {item.type === 'BEFORE_AFTER' && <span className={styles.baBadge}>B/A</span>}
                                <div className={styles.imgOverlay}>
                                    <span className={styles.imgTitle}>{item.title}</span>
                                </div>
                            </div>
                            <div className={styles.cardMeta}>
                                <span className={styles.metaStaff}>{item.staff || 'N/A'}</span>
                                <span className={styles.metaCat}>{item.type}</span>
                                <button className={styles.likeBtn} onClick={e => { e.stopPropagation(); likeItem(item.id); }}>❤️ {item.likes || 0}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {selectedItem && (
                <>
                    <div className={styles.lbOverlay} onClick={() => setSelectedItem(null)} />
                    <div className={styles.lightbox}>
                        <button className={styles.lbNav} style={{ left: 16 }} onClick={() => navigateLightbox(-1)}>←</button>
                        <button className={styles.lbNav} style={{ right: 16 }} onClick={() => navigateLightbox(1)}>→</button>
                        <button className={styles.lbClose} onClick={() => setSelectedItem(null)}>✕</button>

                        <div className={styles.lbContent} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                            {selectedItem.type === 'BEFORE_AFTER' ? (
                                <div className={styles.baContainer}>
                                    <div className={styles.baImage} style={{ background: selectedItem.color || '#ccc', backgroundImage: `url(${API_URL}${selectedItem.fileUrl})`, backgroundSize: 'cover', opacity: 0.6 }}>
                                        <span className={styles.baLabel}>ANTES</span>
                                    </div>
                                    <div className={styles.baImage} style={{ background: selectedItem.color || '#ccc', backgroundImage: `url(${API_URL}${selectedItem.fileUrl})`, backgroundSize: 'cover', width: `${baSlider}%` }}>
                                        <span className={styles.baLabel}>DESPUÉS</span>
                                    </div>
                                    <input type="range" className={styles.baSlider} min={0} max={100} value={baSlider} onChange={e => setBaSlider(+e.target.value)} />
                                </div>
                            ) : (
                                <div className={styles.lbImage} style={{ background: selectedItem.color || '#ccc', backgroundImage: `url(${API_URL}${selectedItem.fileUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
                            )}

                            <div className={styles.lbInfo}>
                                <h3 className={styles.lbTitle}>{selectedItem.title}</h3>
                                <div className={styles.lbMeta}>
                                    <span>👤 {selectedItem.staff || 'N/A'}</span>
                                    <span>📁 {selectedItem.type}</span>
                                    <span>📅 {new Date(selectedItem.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    <span>❤️ {selectedItem.likes || 0} likes</span>
                                </div>
                                <div className={styles.lbActions}>
                                    <button className={styles.lbActBtn} onClick={() => openEdit(selectedItem)}>✏️ Editar</button>
                                    <button className={styles.lbActBtn} onClick={() => { toggleFeatured(selectedItem.id); setSelectedItem({ ...selectedItem, featured: !selectedItem.featured }); }}>{selectedItem.featured ? '⭐ Quitar Destacada' : '☆ Destacar'}</button>
                                    <button className={styles.lbActDel} onClick={() => deleteItem(selectedItem.id)}>🗑 Eliminar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Upload/Edit Modal */}
            {modalOpen && (
                <>
                    <div className={styles.lbOverlay} onClick={() => setModalOpen(false)} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}><h3>{editingId ? 'Editar Imagen' : 'Subir Imagen'}</h3><button className={styles.modalClose} onClick={() => setModalOpen(false)}>✕</button></div>
                        <div className={styles.modalBody}>
                            {!editingId && (
                                <div className={styles.uploadArea}>
                                    <span className={styles.uploadIcon}>📸</span>
                                    <span className={styles.uploadText}>Selecciona el Archivo Físico</span>
                                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setForm({ ...form, file: e.target.files ? e.target.files[0] : null })} style={{ marginTop: '1rem' }} />
                                    <span className={styles.uploadHint}>Se guardará en Bóveda vía Multipart/Form-Data</span>
                                    {form.file && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#10b981' }}>✓ {form.file.name} seleccionado</div>}
                                </div>
                            )}
                            <div className={styles.formRow}><label>Título *</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nombre del trabajo" /></div>
                            <div className={styles.formGrid}>
                                <div className={styles.formRow}><label>Categoría</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.filter(c => c !== 'Todos').map(c => <option key={c}>{c}</option>)}</select></div>
                                <div className={styles.formRow}><label>Staff</label><select value={form.staff} onChange={e => setForm({ ...form, staff: e.target.value })}><option value="">Seleccionar...</option>{STAFF.map(s => <option key={s}>{s}</option>)}</select></div>
                            </div>
                            <label className={styles.checkLabel}><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> ⭐ Marcar como destacada</label>
                        </div>
                        <div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancelar</button><button className={styles.saveBtn} onClick={handleSave}>{editingId ? 'Guardar' : 'Subir'}</button></div>
                    </div>
                </>
            )}

            {toast && <div className={styles.toast}>{toast}</div>}
        </>
    );
}
