'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocale } from '@/providers/LocaleProvider';
import { fetchWithAuth } from '@/providers/AuthProvider';
import { ROOT_BUSINESS_ID } from '@aeternasuite/shared-constants';
import styles from './page.module.css';

// ---- Types ----
interface RevenueData { month: string; revenue: number; }
interface ServiceRanking { name: string; bookings: number; revenue: number; }
interface StaffRanking { name: string; bookings: number; revenue: number; rating: number; }

// ==== End Types ====

// ---- Helpers ----
function formatCurrency(n: number): string { return `$${n.toLocaleString('es-MX')}`; }

// ---- Component ----
type Period = 'week' | 'month' | '3months' | '6months';

export default function ReportsPage() {
    const { t } = useLocale();
    const [period, setPeriod] = useState<Period>('6months');

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{
        kpis: { totalRevenue: number, totalBookings: number, avgTicket: number, growth: number, occupancy: number },
        monthlyRevenue: RevenueData[],
        topServices: ServiceRanking[],
        staffPerformance: StaffRanking[]
    } | null>(null);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        fetchWithAuth(`http://localhost:3001/api/v1/reports/dashboard/${ROOT_BUSINESS_ID}`)
            .then(res => res.ok ? res.json() : null)
            .then(payload => {
                if (isMounted && payload) setData(payload);
            })
            .catch(e => console.error("Error fetching analytics", e))
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });
        return () => { isMounted = false; };
    }, []);

    if (isLoading || !data) {
        return <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>Cargando algoritmos analíticos...</div>;
    }

    const { kpis, monthlyRevenue, topServices, staffPerformance } = data;

    const maxRevenue = monthlyRevenue.length > 0 ? Math.max(...monthlyRevenue.map(m => m.revenue)) : 1;
    const maxServiceBookings = topServices.length > 0 ? Math.max(...topServices.map(s => s.bookings)) : 1;

    return (
        <>
            <Header title={t('reports')} subtitle="Analítica, métricas clave y rendimiento del negocio" />

            <div className={styles.content}>
                {/* Period Selector + KPIs */}
                <div className={styles.topBar}>
                    <div className={styles.periodGroup}>
                        {([['week', '7 días'], ['month', '30 días'], ['3months', '3 meses'], ['6months', '6 meses']] as [Period, string][]).map(([key, label]) => (
                            <button key={key} className={`${styles.periodBtn} ${period === key ? styles.periodActive : ''}`} onClick={() => setPeriod(key)}>{label}</button>
                        ))}
                    </div>
                    <button className={styles.exportBtn}>📄 Exportar PDF</button>
                </div>

                <div className={styles.kpiRow}>
                    <div className={styles.kpi}>
                        <span className={styles.kpiLabel}>Ingresos Totales</span>
                        <span className={styles.kpiValue}>{formatCurrency(kpis.totalRevenue)}</span>
                        <span className={`${styles.kpiChange} ${kpis.growth >= 0 ? styles.kpiUp : styles.kpiDown}`}>
                            {kpis.growth >= 0 ? '↑' : '↓'} {Math.abs(kpis.growth)}% vs mes anterior
                        </span>
                    </div>
                    <div className={styles.kpi}>
                        <span className={styles.kpiLabel}>Total Reservas</span>
                        <span className={styles.kpiValue}>{kpis.totalBookings.toLocaleString()}</span>
                        <span className={styles.kpiSub}>en el período</span>
                    </div>
                    <div className={styles.kpi}>
                        <span className={styles.kpiLabel}>Ticket Promedio</span>
                        <span className={styles.kpiValue}>{formatCurrency(kpis.avgTicket)}</span>
                        <span className={styles.kpiSub}>por transacción</span>
                    </div>
                    <div className={styles.kpi}>
                        <span className={styles.kpiLabel}>Tasa Ocupación</span>
                        <span className={styles.kpiValue}>{kpis.occupancy}%</span>
                        <div className={styles.occupancyBar}><div className={styles.occupancyFill} style={{ width: `${kpis.occupancy}%` }} /></div>
                    </div>
                </div>

                <div className={styles.mainGrid}>
                    {/* Revenue Chart */}
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}><h3>📈 Ingresos Mensuales</h3></div>
                        <div className={styles.chart}>
                            {monthlyRevenue.map(m => (
                                <div key={m.month} className={styles.chartCol}>
                                    <span className={styles.chartValue}>{formatCurrency(m.revenue)}</span>
                                    <div className={styles.chartBar} style={{ height: `${(m.revenue / maxRevenue) * 100}%` }} />
                                    <span className={styles.chartLabel}>{m.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Staff Performance */}
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}><h3>🏆 Rendimiento por Staff</h3></div>
                        <div className={styles.staffList}>
                            {staffPerformance.map((s, i) => (
                                <div key={s.name} className={styles.staffItem}>
                                    <span className={styles.staffRank}>#{i + 1}</span>
                                    <div className={styles.staffInfo}>
                                        <span className={styles.staffName}>{s.name}</span>
                                        <span className={styles.staffMeta}>{s.bookings} reservas · ⭐ {s.rating}</span>
                                    </div>
                                    <span className={styles.staffRevenue}>{formatCurrency(s.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Services Ranking */}
                <div className={styles.panel}>
                    <div className={styles.panelHeader}><h3>💼 Ranking de Servicios</h3></div>
                    <div className={styles.serviceGrid}>
                        {topServices.length === 0 ? <p style={{ color: '#999', fontSize: 13, gridColumn: '1/-1', textAlign: 'center' }}>No hay servicios rankeados en este período.</p> : null}
                        {topServices.map((srv, i) => (
                            <div key={srv.name} className={styles.serviceItem}>
                                <div className={styles.serviceRank}>{i + 1}</div>
                                <div className={styles.serviceInfo}>
                                    <span className={styles.serviceName}>{srv.name}</span>
                                    <div className={styles.serviceBarWrap}>
                                        <div className={styles.serviceBar} style={{ width: `${(srv.bookings / maxServiceBookings) * 100}%` }} />
                                    </div>
                                </div>
                                <div className={styles.serviceStats}>
                                    <span>{srv.bookings} reservas</span>
                                    <span className={styles.serviceRevenue}>{formatCurrency(srv.revenue)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
