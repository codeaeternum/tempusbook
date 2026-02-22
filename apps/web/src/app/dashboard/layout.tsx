'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/providers/AuthProvider';
import { PaywallModal } from '@/components/ui/PaywallModal';
import styles from './layout.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { dbUser, isLoading } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const isSuperAdmin = pathname.startsWith('/dashboard/superadmin');
    const isOnboarding = pathname === '/dashboard/onboarding';

    // Hook to auto-collapse sidebar on Tablet devices
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024 && window.innerWidth > 768) {
                setCollapsed(true);
            } else if (window.innerWidth > 1024) {
                setCollapsed(false);
            }
        };

        // Initial execution
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isLoading && dbUser) {
            // If user has no businesses and is not a PLATFORM_ADMIN, force onboarding.
            if (dbUser.businessMembers?.length === 0 && dbUser.role !== 'PLATFORM_ADMIN') {
                if (!isOnboarding) {
                    router.replace('/dashboard/onboarding');
                }
            } else if (isOnboarding && (dbUser.businessMembers?.length > 0 || dbUser.role === 'PLATFORM_ADMIN')) {
                // If they are on onboarding but already have a business/are admin, redirect to dashboard.
                router.replace('/dashboard');
            }
        }
    }, [dbUser, isLoading, router, isOnboarding]);

    // SuperAdmin has its own layout with its own sidebar
    if (isSuperAdmin) {
        return <>{children}</>;
    }

    // Onboarding has no sidebar
    if (isOnboarding) {
        if (isLoading) return null;
        return <main style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>{children}</main>;
    }

    return (
        <div className={styles.dashboardLayout}>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : ''}`}>
                {children}
            </main>
            <PaywallModal />
        </div>
    );
}
