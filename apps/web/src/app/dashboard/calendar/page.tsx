'use client';
import type { TranslationKey } from '@/lib/i18n';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { fetchWithAuth, useAuth } from '@/providers/AuthProvider';
import styles from './page.module.css';
import NewBookingModal from '@/components/bookings/NewBookingModal';

// ─── Helpers ──────────────────────────────────────────────

type ViewMode = 'day' | 'week' | 'month';

import { useCalendarLayout, CalendarEvent, LayoutEvent } from '@/hooks/useCalendarLayout';

const HOUR_HEIGHT = 80; // px per hour row — 30-min events = 40px, enough for text
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

const STATUS_COLORS: Record<string, string> = {
    confirmed: 'var(--color-success)',
    pending: 'var(--color-warning)',
    in_progress: 'var(--color-info)',
    completed: 'var(--color-primary)',
    cancelled: 'var(--color-error)',
};

const STAFF_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
}

function getMonthDays(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? -5 : 2 - firstDay.getDay();
    const days: Date[] = [];

    for (let i = startDay - 1; i <= lastDay.getDate() + (6 - lastDay.getDay()); i++) {
        days.push(new Date(year, month, i));
    }
    while (days.length % 7 !== 0) {
        days.push(new Date(year, month, days[days.length - 1].getDate() + 1));
    }
    return days;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─── Collision detection for overlapping events ───
// Moved to src/hooks/useCalendarLayout.ts to prevent React render-cycle thrashing.

// ─── Constants ────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Component ────────────────────────────────────────────

export default function CalendarPage() {
    const router = useRouter();
    const { t } = useLocale();
    const { activeBusinessId } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [eventsList, setEventsList] = useState<CalendarEvent[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadWaitlist = async () => {
        if (!activeBusinessId) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/bookings/waitlist/business/${activeBusinessId}`);
            if (res && res.ok) {
                const data = await res.json();
                setWaitlist(data.map((w: any) => ({
                    id: w.id,
                    client: w.client ? `${w.client.firstName} ${w.client.lastName || ''}`.trim() : 'Anónimo',
                    phone: w.client?.phone || '-',
                    service: w.service?.name || 'Servicio',
                    addedAt: new Date(w.createdAt),
                })));
            }
        } catch (err) {
            console.error("Failed to load waitlist", err);
        }
    };

    useEffect(() => {
        async function fetchBookings() {
            if (!activeBusinessId) return;
            try {
                const res = await fetchWithAuth(`${API_URL}/api/v1/bookings/business/${activeBusinessId}`);
                if (res && res.ok) {
                    const data = await res.json();

                    const mappedEvents: CalendarEvent[] = data.map((b: any, index: number) => {
                        const statusMapping: Record<string, CalendarEvent['status']> = {
                            'PENDING': 'pending',
                            'CONFIRMED': 'confirmed',
                            'IN_PROGRESS': 'in_progress',
                            'COMPLETED': 'completed',
                            'CANCELLED': 'cancelled',
                            'NO_SHOW': 'cancelled'
                        };

                        const staffName = b.staff?.user?.firstName ? `${b.staff.user.firstName} ${b.staff.user.lastName || ''}`.trim() : 'Staff';
                        const clientName = b.client?.firstName ? `${b.client.firstName} ${b.client.lastName || ''}`.trim() : 'Cliente Anónimo';
                        const serviceName = b.service?.name || 'Servicio';

                        return {
                            id: b.id,
                            title: serviceName,
                            client: clientName,
                            service: serviceName,
                            staff: staffName,
                            start: new Date(b.startTime),
                            end: new Date(b.endTime),
                            status: statusMapping[b.status] || 'pending',
                            color: STAFF_COLORS[index % STAFF_COLORS.length]
                        };
                    });

                    setEventsList(mappedEvents);
                }
            } catch (err) {
                console.error("Failed to load bookings", err);
            }
        };
        fetchBookings();
        loadWaitlist();
    }, [activeBusinessId]);

    const refreshBookings = async () => {
        if (!activeBusinessId) return;
        try {
            const res = await fetchWithAuth(`${API_URL}/api/v1/bookings/business/${activeBusinessId}`);
            if (res && res.ok) {
                const data = await res.json();
                const mappedEvents: CalendarEvent[] = data.map((b: any, index: number) => {
                    const statusMapping: Record<string, CalendarEvent['status']> = {
                        'PENDING': 'pending',
                        'CONFIRMED': 'confirmed',
                        'IN_PROGRESS': 'in_progress',
                        'COMPLETED': 'completed',
                        'CANCELLED': 'cancelled',
                        'NO_SHOW': 'cancelled'
                    };
                    const staffName = b.staff?.user?.firstName ? `${b.staff.user.firstName} ${b.staff.user.lastName || ''}`.trim() : 'Staff';
                    const clientName = b.client?.firstName ? `${b.client.firstName} ${b.client.lastName || ''}`.trim() : 'Cliente Anónimo';
                    const serviceName = b.service?.name || 'Servicio';
                    return {
                        id: b.id,
                        title: serviceName,
                        client: clientName,
                        service: serviceName,
                        staff: staffName,
                        start: new Date(b.startTime),
                        end: new Date(b.endTime),
                        status: statusMapping[b.status] || 'pending',
                        color: STAFF_COLORS[index % STAFF_COLORS.length]
                    };
                });
                setEventsList(mappedEvents);
            }
        } catch (err) {
            console.error("Failed to refresh bookings", err);
        }
    };

    const today = new Date();

    // Navigation
    const goToday = () => setCurrentDate(new Date());
    const goPrev = () => {
        if (viewMode === 'day') setCurrentDate(addDays(currentDate, -1));
        else if (viewMode === 'week') setCurrentDate(addDays(currentDate, -7));
        else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };
    const goNext = () => {
        if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(addDays(currentDate, 7));
        else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Format title
    const headerTitle = useMemo(() => {
        const opts: Intl.DateTimeFormatOptions = viewMode === 'month'
            ? { month: 'long', year: 'numeric' }
            : viewMode === 'week'
                ? { month: 'long', year: 'numeric' }
                : { weekday: 'long', day: 'numeric', month: 'long' };
        const formatted = currentDate.toLocaleDateString('es-MX', opts);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }, [currentDate, viewMode]);

    // Week days
    const weekDays = useMemo(() => {
        const start = getWeekStart(currentDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    // Month days
    const monthDays = useMemo(() => {
        return getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
    }, [currentDate]);

    // Events for a given day
    const eventsForDay = (day: Date) =>
        eventsList.filter((e: CalendarEvent) => isSameDay(e.start, day)).sort((a: CalendarEvent, b: CalendarEvent) => a.start.getTime() - b.start.getTime());

    // Pre-calculate Day Layout using pure greedy graph hook
    const currentDayEvents = useMemo(() => eventsForDay(currentDate), [eventsList, currentDate]);
    const laidDayEvents = useCalendarLayout(currentDayEvents, START_HOUR, HOUR_HEIGHT);

    // ─── Render: Day View ───
    const renderDayView = () => {
        const gridHeight = HOURS.length * HOUR_HEIGHT;

        return (
            <div className={styles.dayView}>
                <div className={styles.timeGrid} style={{ height: `${gridHeight}px` }}>
                    {/* Hour lines */}
                    {HOURS.map(hour => (
                        <div
                            key={hour}
                            className={styles.timeRow}
                            style={{ height: `${HOUR_HEIGHT}px` }}
                        >
                            <div className={styles.timeLabel}>
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            <div className={styles.timeSlot} />
                        </div>
                    ))}

                    {/* Events layer — absolutely positioned over the full grid */}
                    <div className={styles.eventsLayer}>
                        {laidDayEvents.map((event: LayoutEvent) => (
                            <button
                                key={event.id}
                                className={styles.eventBlock}
                                style={{
                                    '--event-color': event.color,
                                    top: `${event.top}px`,
                                    height: `${event.height}px`,
                                    left: `${event.left}%`,
                                    width: `calc(${event.width}% - 4px)`,
                                } as React.CSSProperties}
                                onClick={() => setSelectedEvent(event)}
                            >
                                <span className={styles.eventTime}>
                                    {formatTime(event.start)} – {formatTime(event.end)}
                                </span>
                                <span className={styles.eventTitle}>{event.client}</span>
                                <span className={styles.eventService}>{event.service}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // ─── Render: Week View ───
    const renderWeekView = () => {
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        return (
            <div className={styles.weekView}>
                <div className={styles.weekHeader}>
                    <div className={styles.weekTimeCol}></div>
                    {weekDays.map((day, i) => (
                        <div
                            key={i}
                            className={`${styles.weekDayHeader} ${isSameDay(day, today) ? styles.isToday : ''}`}
                            onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                        >
                            <span className={styles.weekDayName}>{dayNames[i]}</span>
                            <span className={styles.weekDayNum}>{day.getDate()}</span>
                        </div>
                    ))}
                </div>
                <div className={styles.weekBody}>
                    {HOURS.map(hour => (
                        <div key={hour} className={styles.weekRow}>
                            <div className={styles.timeLabel}>
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            {weekDays.map((day, di) => {
                                const cellEvents = eventsForDay(day).filter((e: CalendarEvent) => e.start.getHours() === hour);
                                return (
                                    <div key={di} className={styles.weekCell}>
                                        {cellEvents.map((event: CalendarEvent) => (
                                            <button
                                                key={event.id}
                                                className={styles.weekEvent}
                                                style={{ '--event-color': event.color } as React.CSSProperties}
                                                onClick={() => setSelectedEvent(event)}
                                            >
                                                <span className={styles.weekEventTime}>{formatTime(event.start)}</span>
                                                <span className={styles.weekEventTitle}>{event.client}</span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ─── Render: Month View ───
    const renderMonthView = () => {
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const currentMonth = currentDate.getMonth();
        return (
            <div className={styles.monthView}>
                <div className={styles.monthHeader}>
                    {dayNames.map(name => (
                        <div key={name} className={styles.monthDayName}>{name}</div>
                    ))}
                </div>
                <div className={styles.monthGrid}>
                    {monthDays.map((day, i) => {
                        const dayEvts = eventsForDay(day);
                        const isOtherMonth = day.getMonth() !== currentMonth;
                        return (
                            <div
                                key={i}
                                className={`${styles.monthCell} ${isOtherMonth ? styles.otherMonth : ''} ${isSameDay(day, today) ? styles.isToday : ''}`}
                                onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                            >
                                <span className={styles.monthCellDay}>{day.getDate()}</span>
                                {dayEvts.slice(0, 3).map((evt: CalendarEvent) => (
                                    <div
                                        key={evt.id}
                                        className={styles.monthEvent}
                                        style={{ '--event-color': evt.color } as React.CSSProperties}
                                    >
                                        {formatTime(evt.start)} {evt.client.split(' ')[0]}
                                    </div>
                                ))}
                                {dayEvts.length > 3 && (
                                    <div className={styles.monthMore}>+{dayEvts.length - 3} más</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
            <Header
                title={t('calendar')}
                subtitle={headerTitle}
                actions={
                    <button className="btn btn-primary btn-sm min-h-[44px] min-w-[44px] px-4" onClick={() => setIsModalOpen(true)}>+ Nueva Cita</button>
                }
            />

            <NewBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    refreshBookings();
                }}
            />

            <div className={styles.content}>
                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <div className={styles.navButtons}>
                        <button className={styles.navBtn} onClick={goPrev}>‹</button>
                        <button className={styles.todayBtn} onClick={goToday}>{t('today')}</button>
                        <button className={styles.navBtn} onClick={goNext}>›</button>
                    </div>

                    <h2 className={styles.dateTitle}>{headerTitle}</h2>

                    <div className={styles.viewToggle}>
                        {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                            <button
                                key={mode}
                                className={`${styles.viewBtn} ${viewMode === mode ? styles.viewActive : ''}`}
                                onClick={() => setViewMode(mode)}
                            >
                                {t(mode as TranslationKey)}
                            </button>
                        ))}
                        <button
                            className={`${styles.viewBtn} ${showWaitlist ? styles.waitlistActive : ''}`}
                            onClick={() => setShowWaitlist(!showWaitlist)}
                        >
                            📋 Espera
                            {waitlist.length > 0 && (
                                <span className={styles.waitlistBadge}>{waitlist.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Calendar Body Area */}
                <div className={styles.calendarLayout}>
                    <div className={`${styles.calendarBody} ${showWaitlist ? styles.withWaitlist : ''}`}>
                        {viewMode === 'day' && renderDayView()}
                        {viewMode === 'week' && renderWeekView()}
                        {viewMode === 'month' && renderMonthView()}
                    </div>

                    {showWaitlist && (
                        <aside className={styles.waitlistPanel}>
                            <h3 className={styles.waitlistTitle}>Lista de Espera — Hoy</h3>
                            <p className={styles.waitlistSubtitle}>Clientes listos para tomar un espacio si alguien cancela.</p>

                            <div className={styles.waitlistItems}>
                                {waitlist.length === 0 ? (
                                    <div className={styles.emptyWaitlist}>No hay clientes en espera hoy.</div>
                                ) : (
                                    waitlist.map(w => (
                                        <div key={w.id} className={styles.waitlistCard}>
                                            <div className={styles.wHeader}>
                                                <div>
                                                    <span className={styles.wClient}>{w.client}</span>
                                                    <span className={styles.wPhone}>{w.phone}</span>
                                                </div>
                                                <span className={styles.wTime}>{formatTime(w.addedAt)}</span>
                                            </div>
                                            <div className={styles.wService}>{w.service}</div>
                                            <div className={styles.wActions}>
                                                <a
                                                    href={`https://wa.me/${w.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${w.client}, ¡se abrió un espacio para ${w.service} hoy!`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`btn btn-outline btn-sm ${styles.waBtn}`}
                                                >
                                                    💬 WhatsApp
                                                </a>
                                                <button className="btn btn-outline btn-sm">📲 Notificar</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </aside>
                    )}
                </div>

                {/* Event Detail Overlay */}
                {selectedEvent && (
                    <>
                        <div className={styles.eventOverlay} onClick={() => setSelectedEvent(null)} />
                        <div className={styles.eventDetail}>
                            <div className={styles.detailHeader}>
                                <div
                                    className={styles.detailColor}
                                    style={{ background: selectedEvent.color }}
                                />
                                <div>
                                    <h3 className={styles.detailTitle}>{selectedEvent.service}</h3>
                                    <p className={styles.detailSub}>
                                        {formatTime(selectedEvent.start)} – {formatTime(selectedEvent.end)}
                                    </p>
                                </div>
                                <button className={styles.detailClose} onClick={() => setSelectedEvent(null)}>✕</button>
                            </div>
                            <div className={styles.detailBody}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>👤 {t('clients')}</span>
                                    <span>{selectedEvent.client}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>✂️ {t('services')}</span>
                                    <span>{selectedEvent.service}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>🤝 {t('team')}</span>
                                    <span>{selectedEvent.staff}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>📋 {t('status')}</span>
                                    <span
                                        className={styles.statusDot}
                                        style={{ '--status-color': STATUS_COLORS[selectedEvent.status] } as React.CSSProperties}
                                    >
                                        {t(selectedEvent.status as TranslationKey)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.detailActions}>
                                <button className="btn btn-sm" style={{ flex: 1 }}>{t('reschedule')}</button>
                                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>{t('edit')}</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
