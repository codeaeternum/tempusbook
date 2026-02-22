'use client';

import { useEffect, useCallback } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    // Close on Escape
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
    }, [onCancel]);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onCancel} />
            <div className={styles.dialog} role="alertdialog" aria-modal="true">
                <div className={styles.body}>
                    <span className={styles.icon}>
                        {variant === 'danger' ? '🗑️' : variant === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    {title && <h4 className={styles.title}>{title}</h4>}
                    <p className={styles.message}>{message}</p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`${styles.confirmBtn} ${variant === 'danger' ? styles.confirmDanger : variant === 'warning' ? styles.confirmWarning : ''}`}
                        onClick={onConfirm}
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </>
    );
}
