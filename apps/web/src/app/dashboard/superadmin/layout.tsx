'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import SuperAdminSidebar from '@/components/layout/SuperAdminSidebar';
import styles from './layout.module.css';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { dbUser, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!dbUser || dbUser.role !== 'PLATFORM_ADMIN') {
                router.replace('/dashboard');
            }
        }
    }, [dbUser, isLoading, router]);

    if (isLoading || !dbUser || dbUser.role !== 'PLATFORM_ADMIN') {
        return <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>Verificando permisos...</div>;
    }

    return (
        <div className={styles.superAdminLayout}>
            <SuperAdminSidebar />
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
