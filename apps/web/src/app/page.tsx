'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.landing}>
      <div className={styles.gradient} />
      <div className={styles.container}>
        <div className={styles.logoMark}>T</div>
        <h1 className={styles.title}>
          Tempus<span className={styles.accent}>Book</span>
        </h1>
        <p className={styles.subtitle}>
          Tu negocio, tus citas, todo en un solo lugar.
        </p>
        <div className={styles.actions}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => router.push('/dashboard')}
          >
            Ir al dashboard →
          </button>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => router.push('/dashboard')}
          >
            Crear mi negocio
          </button>
        </div>
        <p className={styles.tagline}>
          Barberías · Consultorios · Spas · Dentistas · Gimnasios · y más
        </p>
      </div>
    </div>
  );
}
