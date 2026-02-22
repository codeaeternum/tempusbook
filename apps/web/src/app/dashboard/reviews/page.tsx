'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { fetchWithAuth } from '@/providers/AuthProvider';
import { ROOT_BUSINESS_ID } from '@aeternasuite/shared-constants';
import styles from './page.module.css';

// ---- Types ----
interface Review {
    id: string;
    client: string;
    rating: number;
    comment: string;
    service: string;
    staff: string;
    date: Date;
    replied: boolean;
    reply?: string;
    source: 'app' | 'google' | 'whatsapp';
}

// ==== End Types ====

const SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
    app: { label: 'App', icon: '📱' },
    google: { label: 'Google', icon: '🔍' },
    whatsapp: { label: 'WhatsApp', icon: '💬' },
};

// ---- Helpers ----
function formatDate(date: Date): string {
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// ---- Component ----
type FilterRating = 'all' | 1 | 2 | 3 | 4 | 5;

export default function ReviewsPage() {
    const { t } = useLocale();
    const [search, setSearch] = useState('');
    const [filterRating, setFilterRating] = useState<FilterRating>('all');
    const [filterReplied, setFilterReplied] = useState<'all' | 'pending' | 'replied'>('all');

    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadReviews = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/reviews/business/${ROOT_BUSINESS_ID}`);
            if (res.ok) {
                const data = await res.json();
                const mapped: Review[] = data.map((d: any) => ({
                    id: d.id,
                    client: d.client ? `${d.client.firstName} ${d.client.lastName}` : 'Cliente Eliminado',
                    rating: d.rating,
                    comment: d.comment || '',
                    service: d.booking?.service?.name || 'Varios',
                    staff: d.booking?.staff?.user ? `${d.booking.staff.user.firstName} ${d.booking.staff.user.lastName}` : 'General',
                    date: new Date(d.createdAt),
                    replied: !!d.reply,
                    reply: d.reply || undefined,
                    source: 'app' // Placeholder
                }));
                setReviews(mapped);
            }
        } catch (e) {
            console.error('Failed fetching reviews', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadReviews(); }, [loadReviews]);

    const handleReply = async (id: string) => {
        const replyText = prompt('Ingresa tu respuesta para el cliente:');
        if (!replyText || !replyText.trim()) return;

        try {
            const res = await fetchWithAuth(`http://localhost:3001/api/v1/reviews/${id}/reply`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: replyText })
            });

            if (res.ok) {
                loadReviews(); // Refrescamos
            } else {
                alert('No se pudo enviar la respuesta.');
            }
        } catch (error) {
            alert('Error al contactar con la API.');
        }
    };

    const filtered = useMemo(() => {
        return reviews.filter(r => {
            const matchSearch = `${r.client} ${r.comment} ${r.staff}`.toLowerCase().includes(search.toLowerCase());
            const matchRating = filterRating === 'all' || r.rating === filterRating;
            const matchReplied = filterReplied === 'all' || (filterReplied === 'pending' ? !r.replied : r.replied);
            return matchSearch && matchRating && matchReplied;
        });
    }, [search, filterRating, filterReplied, reviews]);

    const stats = useMemo(() => {
        const total = reviews.length;
        if (total === 0) return { total: 0, avg: 0, dist: [5, 4, 3, 2, 1].map(n => ({ rating: n, count: 0, pct: 0 })), pending: 0 };
        const avg = +(reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
        const dist = [5, 4, 3, 2, 1].map(n => ({
            rating: n,
            count: reviews.filter(r => r.rating === n).length,
            pct: Math.round((reviews.filter(r => r.rating === n).length / total) * 100),
        }));
        const pending = reviews.filter(r => !r.replied).length;
        return { total, avg, dist, pending };
    }, [reviews]);

    return (
        <>
            <Header title={t('reviews')} subtitle="Reputación, calificaciones y gestión de respuestas" />

            <div className={styles.content}>
                <div className={styles.topGrid}>
                    {/* Rating Summary */}
                    <div className={styles.ratingCard}>
                        <div className={styles.ratingBig}>
                            <span className={styles.ratingNum}>{stats.avg}</span>
                            <div className={styles.ratingStars}>{renderStars(Math.round(stats.avg))}</div>
                            <span className={styles.ratingCount}>{stats.total} reseñas</span>
                        </div>
                        <div className={styles.ratingDist}>
                            {stats.dist.map(d => (
                                <div key={d.rating} className={styles.distRow}>
                                    <span className={styles.distLabel}>{d.rating}★</span>
                                    <div className={styles.distBar}>
                                        <div className={styles.distFill} style={{ width: `${d.pct}%` }} />
                                    </div>
                                    <span className={styles.distCount}>{d.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className={styles.quickStats}>
                        <div className={styles.qStat}>
                            <span className={styles.qIcon}>⭐</span>
                            <span className={styles.qValue}>{stats.avg}</span>
                            <span className={styles.qLabel}>Promedio</span>
                        </div>
                        <div className={styles.qStat}>
                            <span className={styles.qIcon}>💬</span>
                            <span className={styles.qValue}>{stats.pending}</span>
                            <span className={styles.qLabel}>Sin responder</span>
                        </div>
                        <div className={styles.qStat}>
                            <span className={styles.qIcon}>🏆</span>
                            <span className={styles.qValue}>{reviews.filter(r => r.rating >= 4).length}</span>
                            <span className={styles.qLabel}>Positivas (4-5★)</span>
                        </div>
                        <div className={styles.qStat}>
                            <span className={styles.qIcon}>⚠️</span>
                            <span className={styles.qValue}>{reviews.filter(r => r.rating <= 2).length}</span>
                            <span className={styles.qLabel}>Requieren atención</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.toolbar}>
                    <div className={styles.searchGroup}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input className={styles.searchInput} type="text" placeholder="Buscar por cliente, comentario..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className={styles.filterGroup}>
                        {(['all', 5, 4, 3, 2, 1] as FilterRating[]).map(r => (
                            <button key={String(r)} className={`${styles.filterBtn} ${filterRating === r ? styles.filterActive : ''}`} onClick={() => setFilterRating(r)}>
                                {r === 'all' ? 'Todas' : `${r}★`}
                            </button>
                        ))}
                    </div>
                    <div className={styles.filterGroup}>
                        {(['all', 'pending', 'replied'] as const).map(f => (
                            <button key={f} className={`${styles.filterBtn} ${filterReplied === f ? styles.filterActive : ''}`} onClick={() => setFilterReplied(f)}>
                                {f === 'all' ? 'Todas' : f === 'pending' ? '⏳ Pendientes' : '✅ Respondidas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reviews List */}
                <div className={styles.reviewsList}>
                    {filtered.map(review => (
                        <div key={review.id} className={`${styles.reviewCard} ${review.rating <= 2 ? styles.reviewNegative : ''}`}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewClient}>
                                    <div className={styles.clientAvatar} style={{ background: review.rating >= 4 ? 'hsl(160, 50%, 45%)' : review.rating === 3 ? 'hsl(40, 55%, 50%)' : 'hsl(0, 60%, 55%)' }}>
                                        {review.client[0]}
                                    </div>
                                    <div>
                                        <span className={styles.clientName}>{review.client}</span>
                                        <span className={styles.reviewMeta}>
                                            {SOURCE_CONFIG[review.source].icon} {SOURCE_CONFIG[review.source].label} · {formatDate(review.date)}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.reviewRating}>
                                    <span className={styles.stars}>{renderStars(review.rating)}</span>
                                </div>
                            </div>
                            <p className={styles.reviewComment}>{review.comment}</p>
                            <div className={styles.reviewFooter}>
                                <span className={styles.reviewService}>💼 {review.service} · {review.staff}</span>
                                {!review.replied && (
                                    <button className={styles.replyBtn} onClick={() => handleReply(review.id)}>Responder →</button>
                                )}
                            </div>
                            {review.replied && review.reply && (
                                <div className={styles.replyBox}>
                                    <span className={styles.replyHeader}>↩️ Tu respuesta:</span>
                                    <p className={styles.replyText}>{review.reply}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
