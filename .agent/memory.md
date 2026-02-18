# TempusBook — Memoria del Proyecto

## Reglas Generales del Asistente
- **Siempre responder en español** al usuario
- **Ante cualquier cambio**, verificar toda la app para identificar dónde más aplica (propagación de cambios)
- **Nunca dejar features a medias**: si se modifica un módulo, actualizar backend, web, mobile y tests
- **Consultar este archivo** al inicio de cada sesión para recordar contexto

## Decisiones del Proyecto
- **Nombre**: TempusBook
- **Dominio**: tempusbook.com (ya comprado ✅)
- **Idiomas**: Español e Inglés (i18n desde el inicio)
- **Moneda base**: MXN, pero soporte multi-moneda por país
- **Pasarela de pagos**: MercadoPago (sandbox para desarrollo)
- **Modelo de negocio**: Suscripción mensual por negocio (planes Gratis/Starter/Pro/Business)
- **Autenticación**: Email, Google, Apple, Teléfono (OTP) — todos disponibles
- **Calendario**: Configurable por negocio (individual por empleado o compartido)
- **Hosting**: Google Cloud Run + Cloud SQL + Firebase

## Preferencias del Usuario
- Prefiere un producto **completo y atractivo** sobre un MVP mínimo
- No tiene fecha límite de lanzamiento
- Quiere abarcar la mayor cantidad de rubros posibles desde el inicio
- Le gusta la idea de **cross-platform** (React Native / Expo)
- Quiere que cada rubro tenga muchos módulos útiles que suplan otras herramientas
- Suscripciones deben ser **atractivas y accesibles** (no caras)

## Convenciones de Código
- TypeScript estricto en todo el proyecto
- Monorepo con Turborepo
- Commits en inglés, documentación interna en inglés, UI en ES/EN
- Nombres de archivos: kebab-case
- Componentes React: PascalCase
- Variables/funciones: camelCase
- Base de datos: snake_case

## Stack Tecnológico
- **Backend**: NestJS (TypeScript)
- **Web**: Next.js 14 (App Router)
- **Mobile**: React Native + Expo
- **DB**: PostgreSQL + Prisma ORM
- **Cache/Queues**: Redis + BullMQ
- **Auth**: Firebase Auth
- **Storage**: Firebase Storage
- **Pagos**: MercadoPago
- **WhatsApp**: Twilio (inicial) → Meta API oficial
- **Push**: Firebase Cloud Messaging
- **Maps**: Google Maps API
- **CI/CD**: GitHub Actions

## Notas Importantes
- Los precios de suscripción deben ser configurables por país/moneda
- Cada rubro debe tener módulos ricos que reemplacen herramientas independientes
- La app debe sentirse premium y moderna (no un MVP básico)
- Verificar responsive en cada cambio de UI
- Los módulos por rubro se activan/desactivan según la categoría del negocio

## Historial de Decisiones
| Fecha | Decisión |
|-------|----------|
| 2026-02-18 | Proyecto iniciado, stack definido |
| 2026-02-18 | Nombre aprobado: TempusBook |
| 2026-02-18 | Precios de suscripción ajustados a ser más accesibles |
| 2026-02-18 | Módulos por rubro expandidos para ser más completos |
| 2026-02-18 | **Sin comisión propia** en pagos online — solo se cobran los fees de MercadoPago |
| 2026-02-18 | Plan Gratis incluye **anuncios** (banners discretos) como monetización adicional |
| 2026-02-18 | Anuncios **solo en plan Gratis** — Starter y superiores sin anuncios (incentivo para subir) |
| 2026-02-18 | **Multi-idioma para todos** los planes — es UX básica, no feature premium |
| 2026-02-18 | Infra base estimada ~$115/mes — con 20 negocios en Starter ya se cubre |
| 2026-02-18 | **Dominio comprado**: tempusbook.com |
| 2026-02-18 | Galería antes/después + **Archivo digital** para rubros no-visuales (documentos, recetas, reportes) |
| 2026-02-18 | **Feature gating**: construir todo, mostrar features bloqueadas con 🔒 + badge del plan requerido, upgrade al hacer clic |
| 2026-02-18 | **Formularios de intake** pre-cita específicos por rubro (personalizables por negocio) |
| 2026-02-18 | **Negocios favoritos**: cliente puede guardar favoritos para acceso rápido + notificaciones de promos |
| 2026-02-18 | **Dark/Light mode** desde el inicio |
| 2026-02-18 | **Wizard de onboarding** paso a paso para negocios |
| 2026-02-18 | **Re-booking rápido**: repetir última cita con un tap |
| 2026-02-18 | **Sistema dinámico de citas**: cancelación/reagendación inteligente con cascada de ofertas a otros clientes |
| 2026-02-18 | **Accesibilidad**: solo lo mínimo requerido por ley |
| 2026-02-18 | **Multi-moneda**: negocios pueden ofrecer en USD/MXN/etc |
| 2026-02-18 | **Toggle de animaciones** en configuración para dispositivos lentos |
| 2026-02-18 | **Offline básico**: agenda del día sin internet |
| 2026-02-18 | **App responsive e intuitiva** como prioridad de UX |
| 2026-02-18 | **Crear repo GitHub** para el proyecto |
| 2026-02-18 | **GitHub**: usuario `codeaeternum`, repo `https://github.com/codeaeternum/tempusbook.git` |
