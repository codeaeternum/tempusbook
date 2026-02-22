'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/providers/AuthProvider';

export default function MedicalRecordsPage() {
    const { activeBusinessId } = useAuth();
    const [search, setSearch] = useState('');

    return (
        <>
            <Header
                title="Expedientes Médicos"
                subtitle="Gestión clínica y EHR de pacientes"
                actions={
                    <button className="btn btn-primary" onClick={() => alert('Nuevo expediente (Próximamente)')}>
                        + Nuevo Ingreso
                    </button>
                }
            />

            <div style={{ padding: 'var(--space-8)', maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
                <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar paciente por nombre o ID..."
                                style={{
                                    width: '100%',
                                    padding: '10px 14px 10px 40px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text)',
                                    minHeight: '44px' // Ergonomics
                                }}
                            />
                        </div>
                        <button className="btn btn-secondary" style={{ minHeight: '44px' }}>Filtros</button>
                    </div>

                    <div style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--color-text-tertiary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)', opacity: 0.5 }}>🏥</div>
                        <h3>Módulo Clínico en Construcción</h3>
                        <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Estamos conectando el EHR (Electronic Health Record) con la base de datos de pacientes. Pronto podrás consultar historias clínicas, evoluciones y diagnósticos desde aquí.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
