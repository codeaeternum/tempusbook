'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const FEATURED_INDUSTRIES = [
  { icon: '💈', label: 'Barberías' },
  { icon: '🏥', label: 'Clínicas' },
  { icon: '🦷', label: 'Dentistas' },
  { icon: '💆‍♀️', label: 'Spas' },
  { icon: '🏋️', label: 'Gimnasios' },
  { icon: '⚖️', label: 'Abogados' },
  { icon: '🐾', label: 'Veterinarias' },
  { icon: '🖋️', label: 'Tatuajes' },
  { icon: '📊', label: 'Contadores' },
  { icon: '💅', label: 'Uñas' },
  { icon: '🧠', label: 'Psicólogos' },
  { icon: '🚙', label: 'Autolavado' },
];

const FEATURES = [
  { icon: '📅', title: 'Agenda Inteligente', desc: 'Sincronización bidireccional, preventas y recordatorios automáticos por WhatsApp y Correo.' },
  { icon: '💰', title: 'Flujo de Efectivo', desc: 'Punto de Venta completo apoyado por la Facturación CFDI 4.0 automatizada SAT.' },
  { icon: '📱', title: 'Vertical Tech Fix', desc: 'Modo Taller para Celulares con IMEI Tracks, Drag&Drop y Enlaces Web Privados para el cliente.' },
  { icon: '🚗', title: 'Vertical Mechanic', desc: 'Modo Mecánico enfocado a flotillas, mantenimientos programados por Odómetro e Inspección de Daños.' },
  { icon: '📊', title: 'Reportes y Finanzas', desc: 'Dashboard de utilidades, ticket promedio, ocupación de personal y módulos de comisiones.' },
  { icon: '👥', title: 'CRM Omnicanal', desc: 'Expediente digital, encuestas de satisfacción, fidelización de clientes acumulable y envíos masivos.' },
];

const PLANS = [
  {
    name: 'Básico (Para Solopreneurs)',
    price: '$799 MXN',
    period: '/ mes',
    color: '#00CEC9',
    features: ['1 Usuario administrador', 'Agenda Inteligente (Hasta 200 Citas)', 'Punto de Venta Básico', 'Expedientes ilimitados', 'Sin Módulos Verticales'],
  },
  {
    name: 'Aeterna Pro (Recomendado)',
    price: '$1,899 MXN',
    period: '/ mes',
    color: '#6C5CE7',
    popular: true,
    features: ['3 Usuarios (+ Recepción)', 'WhatsApp automatizado', '1 Módulo Vertical a elegir (Autos, Spa o Celulares)', 'Facturación Electrónica SAT', 'Comisiones Empleados'],
  },
  {
    name: 'Enterprise (Para Franquicias)',
    price: '$4,200 MXN',
    period: '/ mes',
    color: '#FDCB6E',
    features: ['Agrupación Multi-Tenant', 'Control de Inventario Cruzado Centralizado', 'Usuarios Ilimitados', 'API Pública abierta'],
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.landing}>
      {/* Animated background layers */}
      <div className={styles.bgOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>
      <div className={styles.gridOverlay} />

      {/* Hero */}
      <main className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Powered by Code Aeternum
        </div>

        <div className={styles.logoMark}>Æ</div>

        <h1 className={styles.title}>
          Aeterna<span className={styles.accent}>Suite</span>
        </h1>

        <p className={styles.subtitle}>
          El ecosistema central para operar cualquier negocio de productos y servicios.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={() => router.push('/login')}
          >
            Iniciar Sesión →
          </button>
          <button
            className={styles.btnSecondary}
            onClick={() => router.push('/register')}
          >
            Crear mi Negocio
          </button>
        </div>

        <div className={styles.spacer}></div>

        {/* Industry Pills */}
        <div className={styles.industries}>
          {FEATURED_INDUSTRIES.map((ind) => (
            <span key={ind.label} className={styles.pill}>
              <span className={styles.pillIcon}>{ind.icon}</span>
              {ind.label}
            </span>
          ))}
          <span className={styles.pillMore}>+16 más</span>
        </div>
      </main>

      {/* Features Section */}
      <div className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Todo lo que tu operación requiere ⚙️</h2>
        <div className={styles.featuresGrid}>
          {FEATURES.map((feat) => (
            <div key={feat.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feat.icon}</div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className={styles.pricingSection}>
        <h2 className={styles.sectionTitle}>Transparencia en Inversión 💎</h2>
        <div className={styles.pricingGrid}>
          {PLANS.map((plan) => (
            <div key={plan.name} className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`} style={{ borderTopColor: plan.color }}>
              {plan.popular && <div className={styles.popularBadge} style={{ background: plan.color }}>Recomendado</div>}
              <h3 style={{ color: plan.color }}>{plan.name}</h3>
              <div className={styles.priceContainer}>
                <span className={styles.price}>{plan.price}</span>
                <span className={styles.period}>{plan.period}</span>
              </div>
              <ul className={styles.planFeatures}>
                {plan.features.map(f => (
                  <li key={f}>✔️ {f}</li>
                ))}
              </ul>
              <button className={styles.btnBuy} onClick={() => router.push('/register')} style={{ background: plan.color }}>Empezar Prueba de 14 Días</button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>© 2026 Code Aeternum</span>
        <span className={styles.footerDot}>·</span>
        <span>aeternasuite.com</span>
      </footer>
    </div>
  );
}
