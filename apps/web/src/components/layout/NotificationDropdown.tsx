'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLocale } from '@/providers/LocaleProvider';
import styles from './NotificationDropdown.module.css';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

interface Notification {
    id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationDropdown() {
    const { token } = useAuth();
    const { locale } = useLocale();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    // Fetch initial data
    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications?limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.items);
                setUnreadCount(data.meta.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling cada 30 segundos (MVP seguro/robusto antes de WebSockets)
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent | TouchEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handler);
            document.addEventListener('touchstart', handler);
        }
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [open]);

    const markAsRead = async (id: string, isCurrentlyRead: boolean) => {
        if (isCurrentlyRead || !token) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await fetch(`${API}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0 || !token) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await fetch(`${API}/notifications/read-all`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    // Helper para íconos según tipo
    const getIcon = (type: string) => {
        if (type.includes('BOOKING')) return '📅';
        if (type.includes('REVIEW')) return '⭐';
        if (type.includes('SYSTEM')) return '⚙️';
        if (type.includes('PAYMENT')) return '💰';
        return '🔔';
    };

    return (
        <div className={styles.wrapper} ref={dropdownRef}>
            <button className={styles.iconBtn} onClick={() => setOpen(!open)} aria-label="Notificaciones">
                <span>🔔</span>
                {unreadCount > 0 && <span className={styles.notifDot}></span>}
            </button>

            {open && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <span className={styles.title}>Notificaciones {unreadCount > 0 && `(${unreadCount})`}</span>
                        {unreadCount > 0 && (
                            <button className={styles.markAllReadBtn} onClick={markAllAsRead}>
                                Marcar todo leído
                            </button>
                        )}
                    </div>

                    <ul className={styles.list}>
                        {notifications.length === 0 ? (
                            <li className={styles.empty}>
                                <span className={styles.emptyIcon}>📭</span>
                                Estás al día. <br /> No tienes notificaciones nuevas.
                            </li>
                        ) : (
                            notifications.map(notif => (
                                <li
                                    key={notif.id}
                                    className={`${styles.item} ${!notif.isRead ? styles.itemUnread : ''}`}
                                    onClick={() => markAsRead(notif.id, notif.isRead)}
                                >
                                    <div className={styles.icon}>{getIcon(notif.type)}</div>
                                    <div className={styles.content}>
                                        <div className={styles.itemTitle}>{notif.title}</div>
                                        <div className={styles.itemBody}>{notif.body}</div>
                                        <div className={styles.time}>
                                            {formatDistanceToNow(new Date(notif.createdAt), {
                                                addSuffix: true,
                                                locale: locale === 'es' ? es : enUS
                                            })}
                                        </div>
                                    </div>
                                    {!notif.isRead && <div className={styles.unreadDot} />}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
