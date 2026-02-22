'use client';

import Header from '@/components/layout/Header';

export default function DentalChartPage() {
    return (
        <>
            <Header
                title="Odontograma Digital"
                subtitle="Gestión dental avanzada"
            />

            <div style={{ padding: 'var(--space-8)', maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
                <div className="card" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', opacity: 0.8 }}>🦷</div>
                    <h3>Odontograma Interactivo</h3>
                    <p style={{ maxWidth: '500px', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', lineHeight: 1.6 }}>
                        La interfaz gráfica del odontograma 3D se está cargando en la nueva versión. Permite marcar caries, extracciones, implantes y evoluciones por pieza dental.
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: 'var(--space-6)', minHeight: '44px' }}>
                        Seleccionar Paciente
                    </button>
                </div>
            </div>
        </>
    );
}
