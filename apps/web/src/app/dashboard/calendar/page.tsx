'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './page.module.css';

// ─── Helpers ──────────────────────────────────────────────

type ViewMode = 'day' | 'week' | 'month';

interface CalendarEvent {
    id: string;
    title: string;
    client: string;
    service: string;
    staff: string;
    start: Date;
    end: Date;
    status: 'confirmed' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
    color: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 AM – 8:00 PM

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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    return d;
}

function getMonthDays(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? -5 : 2 - firstDay.getDay(); // Monday start
    const days: Date[] = [];

    for (let i = startDay - 1; i <= lastDay.getDate() + (6 - lastDay.getDay()); i++) {
        days.push(new Date(year, month, i));
    }
    // Ensure full weeks
    while (days.length % 7 !== 0) {
        days.push(new Date(year, month, days[days.length - 1].getDate() + 1));
    }
    return days;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ─── Mock data ────────────────────────────────────────────

function generateMockEvents(referenceDate: Date): CalendarEvent[] {
    const today = new Date(referenceDate);
    const events: CalendarEvent[] = [
        {
            id: '1', title: 'Corte + Barba', client: 'María García', service: 'Corte + Barba',
            staff: 'Carlos', start: new Date(today.setHours(9, 0)), end: new Date(today.setHours(9, 45)),
            status: 'confirmed', color: STAFF_COLORS[0],
        },
        {
            id: '2', title: 'Corte Clásico', client: 'Juan Pérez', service: 'Corte Clásico',
            staff: 'Carlos', start: new Date(today.setHours(10, 0)), end: new Date(today.setHours(10, 30)),
            status: 'pending', color: STAFF_COLORS[0],
        },
        {
            id: '3', title: 'Tratamiento Capilar', client: 'Ana López', service: 'Tratamiento',
            staff: 'Sofía', start: new Date(today.setHours(11, 30)), end: new Date(today.setHours(12, 30)),
            status: 'confirmed', color: STAFF_COLORS[1],
        },
        {
            id: '4', title: 'Barba Completa', client: 'Carlos Ruiz', service: 'Barba',
            staff: 'Carlos', start: new Date(today.setHours(13, 0)), end: new Date(today.setHours(13, 30)),
            status: 'in_progress', color: STAFF_COLORS[0],
        },
        {
            id: '5', title: 'Corte Fade', client: 'Roberto Díaz', service: 'Corte Fade',
            staff: 'Miguel', start: new Date(today.setHours(14, 30)), end: new Date(today.setHours(15, 15)),
            status: 'pending', color: STAFF_COLORS[2],
        },
        {
            id: '6', title: 'Corte + Cejas', client: 'Laura Méndez', service: 'Corte + Cejas',
            staff: 'Sofía', start: new Date(today.setHours(15, 0)), end: new Date(today.setHours(15, 45)),
            status: 'confirmed', color: STAFF_COLORS[1],
        },
        {
            id: '7', title: 'Coloración', client: 'Pedro Sánchez', service: 'Coloración',
            staff: 'Carlos', start: new Date(today.setHours(16, 0)), end: new Date(today.setHours(17, 30)),
            status: 'confirmed', color: STAFF_COLORS[0],
        },
    ];

    // Add a few events for tomorrow
    const tomorrow = addDays(referenceDate, 1);
    events.push(
        {
            id: '8', title: 'Corte Express', client: 'Diego Torres', service: 'Corte Express',
            staff: 'Miguel', start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
            end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 20),
            status: 'confirmed', color: STAFF_COLORS[2],
        },
        {
            id: '9', title: 'Barba + Masaje', client: 'Andrés Vega', service: 'Barba Premium',
            staff: 'Sofía', start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0),
            end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 12, 0),
            status: 'pending', color: STAFF_COLORS[1],
        },
    );

    return events;
}

// ─── Component ────────────────────────────────────────────

export default function CalendarPage() {
    const { t } = useLocale();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const events = useMemo(() => generateMockEvents(new Date()), []);

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
        return currentDate.toLocaleDateString('es-MX', opts);
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
        events.filter(e => isSameDay(e.start, day)).sort((a, b) => a.start.getTime() - b.start.getTime());

    // ─── Render: Day View ───
    const renderDayView = () => {
        const dayEvents = eventsForDay(currentDate);
        return (
            <div className={styles.dayView}>
                <div className={styles.timeGrid}>
                    {HOURS.map(hour => (
                        <div key={hour} className={styles.timeRow}>
                            <div className={styles.timeLabel}>
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            <div className={styles.timeSlot}>
                                {dayEvents
                                    .filter(e => e.start.getHours() === hour)
                                    .map(event => {
                                        const duration = (event.end.getTime() - event.start.getTime()) / 3600000;
                                        return (
                                            <button
                                                key={event.id}
                                                className={styles.eventBlock}
                                                style={{
                                                    '--event-color': event.color,
                                                    '--event-height': `${Math.max(duration * 60, 36)}px`,
                                                    '--event-top': `${(event.start.getMinutes() / 60) * 60}px`,
                                                } as React.CSSProperties}
                                                onClick={() => setSelectedEvent(event)}
                                            >
                                                <span className={styles.eventTime}>
                                                    {formatTime(event.start)} - {formatTime(event.end)}
                                                </span>
                                                <span className={styles.eventTitle}>{event.client}</span>
                                                <span className={styles.eventService}>{event.service}</span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
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
                                const cellEvents = eventsForDay(day).filter(e => e.start.getHours() === hour);
                                return (
                                    <div key={di} className={styles.weekCell}>
                                        {cellEvents.map(event => (
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
                                {dayEvts.slice(0, 3).map(evt => (
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
                    <button className="btn btn-primary btn-sm">
                        + {t('schedule_appointment')}
                    </button>
                }
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
                                {t(mode as any)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calendar Body */}
                <div className={styles.calendarBody}>
                    {viewMode === 'day' && renderDayView()}
                    {viewMode === 'week' && renderWeekView()}
                    {viewMode === 'month' && renderMonthView()}
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
                                    <span className={styles.detailLabel}>🤝 Staff</span>
                                    <span>{selectedEvent.staff}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>📋 Status</span>
                                    <span
                                        className={styles.statusDot}
                                        style={{ '--status-color': STATUS_COLORS[selectedEvent.status] } as React.CSSProperties}
                                    >
                                        {selectedEvent.status}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.detailActions}>
                                <button className="btn btn-sm" style={{ flex: 1 }}>Reagendar</button>
                                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>Editar</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
