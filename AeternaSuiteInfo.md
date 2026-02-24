# AeternaSuiteInfo — Biblia Técnica Completa

> **"Code Aeternum — Código Eterno. Software que trasciende."**

**Última actualización:** Febrero 23, 2026  
**Versión del documento:** 1.0.0  
**Autor:** AeternaSuite Development Team — Code Aeternum  
**Versión del software:** 0.1.0 (Early Development)

---

## Tabla de Contenidos Maestra

1. [Identidad y Filosofía](#1-identidad-y-filosofía)
2. [Visión, Misión y Propósito](#2-visión-misión-y-propósito)
3. [El Problema que Resuelve](#3-el-problema-que-resuelve)
4. [La Solución: Arquitectura de Micro-Módulos](#4-la-solución-arquitectura-de-micro-módulos)
5. [Modelo de Negocio](#5-modelo-de-negocio)
6. [Arquitectura del Sistema](#6-arquitectura-del-sistema)
7. [Stack Tecnológico Completo](#7-stack-tecnológico-completo)
8. [Estructura del Monorepo](#8-estructura-del-monorepo)
9. [Backend — NestJS API en Profundidad](#9-backend--nestjs-api-en-profundidad)
10. [Base de Datos — Prisma Schema](#10-base-de-datos--prisma-schema)
11. [Frontend — Next.js Web App](#11-frontend--nextjs-web-app)
12. [Sistema de Diseño](#12-sistema-de-diseño)
13. [Internacionalización (i18n)](#13-internacionalización-i18n)
14. [Paquetes Compartidos](#14-paquetes-compartidos)
15. [Infraestructura y DevOps](#15-infraestructura-y-devops)
16. [Los 30 Rubros Soportados](#16-los-30-rubros-soportados)
17. [Matriz de Micro-Módulos Especializados](#17-matriz-de-micro-módulos-especializados)
18. [Motor Universal de Formularios (Intake Forms)](#18-motor-universal-de-formularios-intake-forms)
19. [Ecosistema B2B + B2C](#19-ecosistema-b2b--b2c)
20. [SuperAdmin Command Center](#20-superadmin-command-center)
21. [Integraciones Externas](#21-integraciones-externas)
22. [Seguridad y Autenticación](#22-seguridad-y-autenticación)
23. [Estado de Integración Frontend ↔ Backend](#23-estado-de-integración-frontend--backend)
24. [Roadmap de Evolución](#24-roadmap-de-evolución)
25. [Guía de Ejecución Local](#25-guía-de-ejecución-local)
26. [Mandato de Calidad](#26-mandato-de-calidad)

---

## 1. Identidad y Filosofía

### ¿Qué es AeternaSuite?

**AeternaSuite** es una plataforma **SaaS All-In-One (CRM + ERP)** diseñada para la gestión integral de negocios de servicios. No es una app de citas genérica — es un **ecosistema operativo completo** que se adapta a 30 industrias distintas mediante una arquitectura de Micro-Módulos especializados.

### ¿Qué es Code Aeternum?

**Code Aeternum** es la empresa detrás de AeternaSuite. El nombre significa literalmente *"Código Eterno"* en latín — una declaración de intenciones: construir software que no sea desechable, que trascienda, que evolucione.

- **Dominio corporativo:** `codeaeternum.com`
- **Dominio del producto:** `aeternasuite.com`
- **Correos:** `admin@codeaeternum.com`, `admin@aeternasuite.com`
- **Repositorio:** `github.com/codeaeternum/aeternasuite`

### Evolución del Nombre

| Etapa | Nombre | Razón |
|-------|--------|-------|
| Concepto original | **TempusBook** | "Tempus" = Tiempo. App de citas/agenda. |
| Evolución actual | **AeternaSuite** | Suite completa. "Aeterna" = Eterna. Refleja la ambición de ser permanente. |

> **Nota técnica:** Actualmente los paquetes npm internos conservan el prefijo legacy `@tempusbook/` (ej: `@tempusbook/shared-types`). El plan es migrarlos a `@aeternasuite/` pero el import interno `@aeternasuite/shared-types` ya es funcional en `shared-constants`.

### Filosofía de Desarrollo

AeternaSuite se construye bajo estos principios no negociables:

| Principio | Significado |
|-----------|-------------|
| **RESPONSIVE** | Funciona impecable en desktop, tablet y móvil |
| **SINERGIA** | Cada módulo potencia a los demás |
| **COMPATIBILIDAD** | Integra con Firebase, MercadoPago, Twilio, Google Maps |
| **ADAPTABILIDAD** | Se moldea a 30 industrias distintas |
| **INTUITIVA** | Un barbero sin training tech puede usarla |
| **SEGURA** | Firebase Auth, JWT, Guards por rol |
| **ESCALABLE** | Multi-tenant, multi-sucursal, multi-moneda |
| **PERSONALIZABLE** | Módulos togglables, temas, idiomas, formularios |
| **PERFECTA** | Estándar de calidad: perfección o nada |

---

## 2. Visión, Misión y Propósito

### Visión
Ser **el sistema operativo digital** de todo negocio de servicios en Latinoamérica y el mundo hispanohablante — desde una barbería de esquina hasta una cadena de clínicas dentales.

### Misión
Democratizar la tecnología empresarial para que cualquier profesional de servicios pueda operar su negocio como una corporación, sin necesidad de múltiples apps fragmentadas ni conocimientos técnicos.

### Propósito
Reemplazar la fragmentación digital. Un negocio típico de servicios usa:
- **Calendly/Booksy** para citas
- **Excel/Sheets** para inventario
- **WhatsApp** para comunicación
- **Una libreta** para notas de clientes
- **Otro sistema** para pagos
- **Nada** para fidelización

**AeternaSuite reemplaza todo esto con UNA sola plataforma.**

---

## 3. El Problema que Resuelve

### Dolor del Mercado

Los negocios de servicios (barberías, salones, spas, consultorios, dentistas, gimnasios, talleres mecánicos, veterinarias, etc.) enfrentan:

1. **Fragmentación de herramientas** — 5-8 apps para operar un solo negocio
2. **Cero historial de clientes** — No hay CRM, solo contactos de WhatsApp
3. **Gestión de citas manual** — Agendas de papel o calendarios genéricos
4. **Sin control de inventario** — Stock controlado "de memoria"
5. **Pagos desorganizados** — Mezcla de efectivo, transferencias, sin reconciliación
6. **Sin fidelización** — No hay programa de puntos, stamps, ni retención
7. **Módulos genéricos** — Las apps existentes no entienden que un dentista necesita un odontograma y un quiropráctico necesita un mapa corporal
8. **Sin presencia digital** — No tienen página web ni sistema de reservas online

### Diferenciador Clave: Módulos Especializados por Industria

Mientras que competidores como Booksy, Fresha, o Calendly ofrecen la misma UI genérica para todos, AeternaSuite **enciende módulos distintos** según el rubro:

- Un **dentista** obtiene → Odontograma, Recetas, Expediente Clínico
- Un **tatuador** obtiene → Cotizador Interactivo, Galería Before/After, Mapa Corporal
- Un **mecánico** obtiene → Órdenes de Trabajo, Registro de Vehículos, Cotizaciones con Magic Link
- Un **barbero** obtiene → Cola Walk-In, Galería de Cortes, POS rápido

---

## 4. La Solución: Arquitectura de Micro-Módulos

AeternaSuite NO crea "apps distintas" para cada industria. En su lugar, agrupa **Micro-Módulos Especializados** que se encienden/apagan por rubro. Esto permite:

- **Extrema reusabilidad del código** (Cross-pollination)
- **Un solo codebase** para 30 industrias
- **Escalabilidad vertical** — agregar un módulo nuevo beneficia a todos los rubros compatibles
- **Personalización granular** — cada negocio puede activar/desactivar módulos manualmente

```
┌─────────────────────────────────────────────────────────────┐
│                    AeternaSuite Core                        │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Bookings │ │ Clients  │ │ Services │ │ Payments │      │
│  │  Engine  │ │   CRM    │ │  Catalog │ │ + POS    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Calendar │ │Inventory │ │  Team    │ │ Gallery  │      │
│  │ 3 Views  │ │ + Stock  │ │  Staff   │ │ B/A+Port │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Micro-Módulos Especializados            │   │
│  │                                                      │   │
│  │  🦷 Dental Charts    💉 Prescriptions   🗺️ Body Map  │   │
│  │  🔧 Work Orders     🚗 Vehicles        📱 Devices   │   │
│  │  💎 Loyalty          🎁 Gift Cards      📦 Packages  │   │
│  │  📋 Intake Forms     💰 Quotations     📊 Reports   │   │
│  │  🧾 POS + Shifts    ⭐ Reviews         🔔 Notifs    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Modelo de Negocio

### Planes de Suscripción

Definidos en `packages/shared-constants/src/index.ts` → `PLAN_LIMITS` + `SUBSCRIPTION_PRICES`.

| Feature | Free | Starter ($9.99/mo) | Pro ($14.99/mo) | Business ($39.99/mo) |
|---------|------|---------------------|-----------------|----------------------|
| **Precio anual** | $0 | $95.90 (20% off) | $143.90 | $383.90 |
| **Trial gratuito** | — | 14 días | 14 días | 14 días |
| Bookings / mes | 100 | 500 | ∞ Ilimitado | ∞ Ilimitado |
| Empleados | 1 | 3 | 5 | 15 |
| Sucursales | 1 | 1 | 2 | 5 |
| Items galería | 10 | 50 | 200 | 1,000 |
| WhatsApp / mes | 0 | 0 | 50 | 500 |
| Muestra anuncios | ✅ Sí | ❌ No | ❌ No | ❌ No |
| Pagos online | ❌ | ✅ | ✅ | ✅ |
| Fidelización | ❌ | ✅ | ✅ | ✅ |
| Reportes avanzados | ❌ | ❌ | ✅ | ✅ |
| Chat in-app | ❌ | ❌ | ✅ | ✅ |
| QR Check-in | ✅ | ✅ | ✅ | ✅ |
| Propinas digitales | ❌ | ❌ | ✅ | ✅ |
| Lista de espera | ❌ | ✅ | ✅ | ✅ |
| Citas recurrentes | ❌ | ✅ | ✅ | ✅ |
| Google/Apple Calendar | ❌ | ✅ | ✅ | ✅ |
| Branding custom | ❌ | ❌ | ✅ | ✅ |
| Exportar datos | ❌ | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |

### Monedas Soportadas (7)

Definidas en `SUPPORTED_CURRENCIES`:

`MXN` · `USD` · `ARS` · `COP` · `CLP` · `BRL` · `EUR`

### Fuentes de Ingreso

1. **Suscripciones SaaS** — Recurrente mensual/anual (MercadoPago)
2. **Platform Ads** — Banners inyectables en planes Free/Starter (modelo `PlatformAd` en DB)
3. **Comisiones por pago online** — % sobre transacciones MercadoPago procesadas
4. **Módulos premium futuros** — Add-ons por vertical especializada

---

## 6. Arquitectura del Sistema

### Diagrama de Alto Nivel

```
                              ┌──────────────────────────────┐
                              │      Portal Público B2C      │
                              │   /portal, /reserva/[slug]   │
                              │   /book/[slug], /q/[token]   │
                              │   Next.js SSR (SEO)          │
                              └──────────┬───────────────────┘
                                         │
┌────────────────────────┐    ┌──────────▼───────────────────┐
│   SuperAdmin Panel     │    │    Dashboard Admin B2B       │
│   /dashboard/superadmin│    │    /dashboard/*              │
│   PLATFORM_ADMIN only  │    │    SPA + React 19            │
└──────────┬─────────────┘    └──────────┬───────────────────┘
           │                             │
           └──────────┬──────────────────┘
                      │ HTTP/REST (fetchWithAuth)
           ┌──────────▼──────────────────┐
           │     NestJS API Server       │
           │     Prefix: /api/v1         │
           │     Port: 3001              │
           │     32 modules, ~130+ EP    │
           │     Firebase Auth Guard     │
           │     Swagger: /docs          │
           └──────────┬──────────────────┘
                      │
           ┌──────────▼──────────────────┐
           │     PostgreSQL 16-alpine    │
           │     Prisma ORM              │
           │     37 models, 20 enums     │
           │     1431 lines schema       │
           └──────────┬──────────────────┘
                      │
           ┌──────────▼──────────────────┐
           │     Redis 7-alpine          │
           │     Bull Queue (Jobs)       │
           │     Cache layer             │
           └─────────────────────────────┘
```

### Tipo de Arquitectura

| Aspecto | Decisión |
|---------|----------|
| **Monorepo** | ✅ Turborepo + npm Workspaces |
| **Frontend** | Next.js 16 (App Router, SSR + CSR) |
| **Backend** | NestJS 10 (REST API, modular) |
| **ORM** | Prisma 6 (type-safe, migrations) |
| **Base de datos** | PostgreSQL 16 (relacional, ACID) |
| **Cache/Queue** | Redis 7 (Bull Queue para jobs) |
| **Auth** | Firebase Auth (JWT tokens) |
| **Pagos** | MercadoPago (preferencias, webhooks) |
| **Mensajería** | Twilio (WhatsApp, SMS) |
| **Multi-tenant** | Sí — cada Business es un tenant |
| **Multi-idioma** | Español + Inglés |
| **Multi-tema** | Light + Dark mode |
| **Multi-sucursal** | Sí — modelo Branch |
| **Multi-moneda** | 7 monedas soportadas |

---

## 7. Stack Tecnológico Completo

### Frontend (`apps/web`)

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Next.js** | 16.1.6 | Framework React con App Router, SSR para SEO en portal público, CSR para dashboard |
| **React** | 19.2.3 | Librería UI con hooks, Server Components |
| **TypeScript** | ^5.7 | Tipado estático en todo el frontend |
| **CSS Modules** | nativo | Estilos locales por componente (`.module.css`) sin conflictos |
| **CSS Custom Properties** | nativo | Design tokens globales en `globals.css` |
| **Firebase JS SDK** | ^11 | Autenticación en el cliente (email, Google, magic link) |

### Backend (`apps/api`)

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **NestJS** | ^10.4 | Framework de API modular con decoradores, DI, Guards |
| **Prisma** | ^6.3 | ORM type-safe + migraciones SQL automáticas |
| **PostgreSQL** | 16-alpine | Base de datos principal (relacional, ACID, JSON columns) |
| **Redis** | 7-alpine | Cache + Bull Queue para jobs asíncronos |
| **Bull** | ^4.16 | Job queue (emails, notificaciones, recordatorios) |
| **Firebase Admin SDK** | ^13 | Verificación de JWT tokens en el servidor |
| **Swagger/OpenAPI** | ^8.1 | Documentación auto-generada de API en `/docs` |
| **class-validator** | ^0.14 | Validación declarativa de DTOs |
| **class-transformer** | ^0.5 | Transformación de objetos request |
| **@nestjs/config** | — | Variables de entorno con `.env` |
| **@nestjs/schedule** | — | Cron jobs y tareas programadas |
| **@nestjs/serve-static** | — | Servir archivos estáticos (uploads/gallery) |
| **MercadoPago SDK** | — | Procesamiento de pagos y suscripciones |
| **Twilio** | — | Envío de WhatsApp/SMS |

### DevOps

| Herramienta | Propósito |
|------------|-----------|
| **Docker Compose** | Orquestación local (PostgreSQL + Redis) |
| **Turborepo** | Build pipeline paralelo con cache |
| **npm Workspaces** | Gestión de dependencias en monorepo |
| **Git** | Control de versiones |
| **ESLint** | Linting de código |
| **Prettier** | Formateo consistente |
| **TypeScript** | ^5.7 — Configuración base compartida |



---

## 8. Estructura del Monorepo

El proyecto es un **monorepo** gestionado con Turborepo + npm Workspaces. Contiene 2 aplicaciones (`apps/api`, `apps/web`) y 3 paquetes compartidos (`packages/shared-*`).

```
aeternasuite/  (directorio actual: tempusapp/)
├── apps/
│   ├── api/                              # Backend NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # 37 modelos, 20 enums, 1431 líneas
│   │   │   ├── seed.ts                  # Seed de categorías y datos iniciales
│   │   │   └── migrations/              # Migraciones incrementales SQL
│   │   ├── src/
│   │   │   ├── main.ts                  # Bootstrap: CORS, ValidationPipe, Swagger
│   │   │   ├── app.module.ts            # Root module: 32 módulos importados
│   │   │   ├── prisma/                  # PrismaService (singleton) + PrismaModule
│   │   │   └── modules/                 # 32 módulos NestJS (ver sección 9)
│   │   ├── uploads/                     # Archivos estáticos (gallery, avatars)
│   │   └── package.json
│   │
│   └── web/                              # Frontend Next.js
│       ├── src/
│       │   ├── app/                     # 50+ páginas (App Router)
│       │   │   ├── page.tsx             # Landing page pública
│       │   │   ├── layout.tsx           # Root layout (providers, metadata)
│       │   │   ├── globals.css          # Design tokens (447 líneas)
│       │   │   ├── login/ register/     # Auth pages
│       │   │   ├── portal/             # Portal B2C público (directorio, login, perfil)
│       │   │   ├── reserva/            # Booking público + review
│       │   │   ├── book/ q/ kiosco/    # Legacy booking, cotización, kiosco
│       │   │   └── dashboard/          # 23+ secciones admin B2B
│       │   ├── components/             # Sidebar, Header, UI, Clinical, Medical
│       │   ├── providers/              # Auth, Theme, Locale, Settings
│       │   ├── hooks/                  # useBusinessVertical, useCalendarLayout, useDebounce
│       │   ├── lib/                    # firebase, i18n (599 líneas), api clients
│       │   ├── store/                  # State management
│       │   └── styles/components.css   # 432 líneas, 12 componentes reutilizables
│       └── package.json
│
├── packages/
│   ├── shared-types/      # 12 enums + 15 interfaces (286 líneas)
│   ├── shared-constants/  # 30 categorías, planes, currencies (213 líneas)
│   └── shared-utils/      # 12 funciones utilitarias (168 líneas)
│
├── docker-compose.yml     # PostgreSQL 16 + Redis 7
├── turbo.json             # Pipeline de builds
├── package.json           # Root monorepo config
└── tsconfig.json          # TypeScript base config
```

---

## 9. Backend — NestJS API en Profundidad

**Puerto:** 3001 | **Prefix:** `/api/v1` | **Swagger:** `/docs`

### Configuración Global (`main.ts`)

- CORS habilitado para `FRONTEND_URL` (default `http://localhost:3000`)
- `ValidationPipe` global: `whitelist`, `forbidNonWhitelisted`, `transform`
- Swagger con Bearer Auth, título "AeternaSuite API"
- Archivos estáticos servidos desde `/uploads/`
- `@nestjs/schedule` habilitado para cron jobs

### Los 32 Módulos NestJS (~130+ endpoints)

#### Core (8 módulos, ~29 endpoints)

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| `users` | 6 | CRUD + preferences + favorites toggle |
| `businesses` | 4 | CRUD + onboarding atómico (Business+Owner+Trial) |
| `business-members` | 5 | Staff CRUD + roles (OWNER/ADMIN/MANAGER/EMPLOYEE) |
| `categories` | 2 | 30 rubros con enabledModules |
| `services` | 5 | Catálogo CRUD con staff assignment |
| `bookings` | 5 | Motor de reservas (conflictos, buffer, reschedule) |
| `dashboard` | 2 | KPIs reales + upcoming bookings |
| `health` | 1 | Health check |

#### Comercial (7 módulos, ~38 endpoints)

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| `inventory` | 5 | Productos + stock por sucursal (Plan PRO) |
| `payments` | 4 | Pagos + reembolsos + MercadoPago |
| `pos` | 7 | Punto de Venta: shifts, checkout, catálogo (Plan STARTER) |
| `gallery` | 6 | Albums, Images, Annotations |
| `gift-cards` | 4 | Hash codes canjeables |
| `loyalty` | 9 | Stamps/Points/Tiers + rewards (Plan PRO) |
| `packages` | 6 | Paquetes de sesiones + wallet |

#### Engagement (5 módulos, ~17 endpoints)

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| `reviews` | 3 | Reseñas + reply del negocio |
| `notifications` | 3 | Multi-canal (in-app, email, push, WhatsApp, SMS) |
| `forms` | 7 | Dynamic Form Builder |
| `reports` | 1 | Métricas agregadas |
| `quotations` | 6 | Cotizaciones + Magic Link público |

#### Verticales Especializadas (7 módulos, ~22 endpoints)

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| `vehicles` | 6 | Registro de vehículos (VIN, make, model, plates) |
| `devices` | 6 | Registro de dispositivos (phone, tablet, IMEI) |
| `work-orders` | 5 | Kanban con 7 estados |
| `medical-records` | 2 | EHR: allergies, medications, emergency contact |
| `dental-charts` | 2 | Odontograma digital (32 dientes JSON) |
| `prescriptions` | 3 | Recetas con items (medicamento/dosis/frecuencia) |
| `body-charts` | 2 | Mapa anatómico (markers con coordenadas) |

#### Plataforma (5 módulos, ~25 endpoints)

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| `subscriptions` | 3 | Planes + checkout MercadoPago |
| `billing` | 2 | Subscribe + webhook |
| `public` | 2 | Perfil público + booking sin auth |
| `superadmin` | 17 | Command Center (flags, ads, audit, feedback) |

---

## 10. Base de Datos — Prisma Schema

**Archivo:** `apps/api/prisma/schema.prisma` | **1,431 líneas** | **37 modelos** | **20 enums**

### Modelos por Dominio

**Core (8):** User, Business, Category, Branch, BusinessMember, StaffService, BusinessClient, BusinessHours

**Servicios (3):** Service, Product, ProductStock

**Reservas (2):** Booking, WaitlistEntry

**Pagos (3):** Payment, Subscription, CashShift

**POS (2):** Sale, SaleItem

**Fidelización (4):** LoyaltyProgram, LoyaltyCard, LoyaltyReward, GiftCard

**Paquetes (3):** Package, ClientPackage, PackageSession

**Galería (4):** GalleryItem, GalleryAlbum, GalleryImage, ImageAnnotation

**Clínico (5):** MedicalRecord, DentalChart, Prescription, PrescriptionItem, BodyChart

**Automotriz (4):** Vehicle, Device, WorkOrder, Quotation

**Plataforma (5):** FeatureFlag, PlatformAd, AuditLog, PlatformFeedback, Review

**Otros (4):** Favorite, Notification, IntakeFormOverride, FormTemplate, FormResponse

### Enums (20)

`UserRole` · `BusinessStatus` · `BusinessRole` · `CalendarMode` · `ClientStatus` · `BookingStatus` · `WaitlistStatus` · `DayOfWeek` · `PaymentType` · `PaymentStatus` · `PaymentMethod` · `SubscriptionPlan` · `SubscriptionStatus` · `ShiftStatus` · `SaleStatus` · `PackageStatus` · `LoyaltyType` · `GalleryType` · `GiftCardStatus` · `NotificationType` · `NotificationChannel` · `DeviceType` · `WorkOrderStatus` · `QuotationStatus` · `AdPlacement` · `FeedbackType` · `FeedbackPriority` · `FeedbackStatus`

---

## 11. Frontend — Next.js Web App

### Las 50+ Páginas Implementadas

#### Landing & Auth
- `/` — Landing page con logo gradient, tagline, botones CTA
- `/login` — Login con Firebase (email, Google)
- `/register` — Registro de usuario

#### Portal Público B2C (8 páginas, 100% integradas 🟢)
- `/portal` — Directorio Inteligente de Negocios
- `/portal/login` — Magic Link login
- `/portal/finish-login` — Identity merge
- `/portal/n/[slug]` — Perfil público del negocio + reservas
- `/reserva/[slug]` — Funnel modal de reserva
- `/reserva/review/[bookingId]` — Sistema de reseñas 5 estrellas
- `/book/[slug]` — Wizard estático de 5 pasos (legacy)
- `/q/[token]` — Cotización con magic link

#### Dashboard Admin B2B (23+ secciones)

| Página | Ruta | Tamaño | Estado |
|--------|------|--------|--------|
| Dashboard Home | `/dashboard` | 25KB | 🟢 Integrado |
| Calendario | `/dashboard/calendar` | — | 🟢 3 vistas (día/semana/mes), collision detection |
| Citas | `/dashboard/appointments` | — | 🟢 Status change real |
| Clientes CRM | `/dashboard/clients` | 46KB | 🟢 CRUD completo, notas, perfil lateral |
| Servicios | `/dashboard/services` | — | 🟢 Category tabs, staff assignment |
| Inventario | `/dashboard/inventory` | — | 🟢 Stat cards filtro, filas colapsables |
| Equipo | `/dashboard/team` | — | 🟢 Staff CRUD con roles |
| Pagos | `/dashboard/payments` | — | 🟢 Reembolsos reales |
| POS | `/dashboard/pos` | — | 🟢 Checkout + cajas |
| Recepción | `/dashboard/reception` | — | 🟢 Kiosco + monitor staff |
| Settings | `/dashboard/settings` | — | 🟢 7 secciones |
| Billing | `/dashboard/settings/billing` | — | 🟢 MercadoPago checkout |
| Onboarding | `/dashboard/onboarding` | — | 🟢 Wizard + DB transaction |
| Galería | `/dashboard/gallery` | — | 🔴 UI existe, no conectada |
| Reseñas | `/dashboard/reviews` | — | 🔴 UI existe, no conectada |
| Fidelización | `/dashboard/loyalty` | — | 🔴 UI existe, no conectada |
| Gift Cards | `/dashboard/gift-cards` | — | 🔴 UI existe, no conectada |
| Paquetes | `/dashboard/packages` | — | 🔴 UI existe, no conectada |
| Formularios | `/dashboard/forms` | — | 🔴 UI existe, no conectada |
| Reportes | `/dashboard/reports` | — | 🔴 UI existe, no conectada |
| Cashflow | `/dashboard/cashflow` | — | 🔴 UI métricas financieras |

#### Verticales Mecánica/Reparación (6 páginas, 🔴 pendientes)
`/dashboard/mechanic/vehicles`, `inspections`, `work-orders`, `quotes`
`/dashboard/repair/devices`, `work-orders`

#### Verticales Clínicas (3 scaffolds ⬜)
`/dashboard/clinical/dental-chart`, `medical-records`, `prescriptions`

#### SuperAdmin (9 páginas, 8 integradas 🟢)
`/dashboard/superadmin` — Overview, businesses, users, subscriptions, flags, ads, audit, feedback, config

### Providers (4 Context Providers)

#### AuthProvider (246 líneas)
- Firebase Auth: email, Google, magic link, mock login
- `fetchWithAuth()` — Interceptor que inyecta JWT en headers
- `activeBusinessId` — Negocio activo del usuario
- `dbUser` — Datos del usuario desde la API (incluyendo businessMembers)

#### ThemeProvider
- Modo claro/oscuro con `data-theme` attribute
- Persistencia en `localStorage` (`aeternasuite-theme`)
- Fallback a `prefers-color-scheme`

#### LocaleProvider
- ES / EN con función `t(key)`
- Persistencia en `localStorage` (`aeternasuite-locale`)
- Aplica `lang` attribute al `<html>`

#### SettingsProvider (422 líneas)
- **ModuleKey type** con 26 módulos posibles
- **BusinessSettings interface** con 60+ campos:
  - Perfil: nombre, dirección, rubro, logo, teléfono, email, descripción
  - Social links, website, Google Maps embed
  - Fiscal: RFC, razón social, régimen, tasa IVA
  - Booking: buffer, max advance days, auto-confirm, cancellation, deposits
  - Schedule: 7 daySchedules, timezone, rest days, lunch break
  - Notifications: email, push, WhatsApp, SMS toggles
- Sincronización con API vía `fetchWithAuth`
- `enabledModules` como `Set<ModuleKey>`
- `toggleModule()`, `moveModule()`, `toggleFavorite()`, `resetSettings()`

### Custom Hooks (3)

| Hook | Descripción |
|------|-------------|
| `useBusinessVertical` | Detecta el tipo de negocio (isClinical, isMechanic, etc.) y adapta la UI |
| `useCalendarLayout` | Calcula dimensiones y posiciones para las vistas de calendario |
| `useDebounce` | Debounce genérico para inputs de búsqueda |

### API Client (`lib/api/`)

| Módulo | Funciones |
|--------|-----------|
| `bookings.ts` | createBooking, getBusinessBookings, updateBookingStatus, rescheduleBooking |
| `pos.ts` | openShift, closeShift, processCheckout, getCatalog |
| `public.ts` | getPublicBusiness, createPublicBooking, getPortalBusinesses |
| `subscriptions.ts` | getCurrentSubscription, createCheckout |

### Sidebar Dinámico

El sidebar tiene 13+ items de navegación filtrados dinámicamente:

1. **Módulos activos** — Solo se muestran los módulos habilitados en Settings
2. **Tipo de negocio** — `useBusinessVertical` detecta si es clínico, mecánico, etc.
3. **Plan del negocio** — Algunos módulos requieren plan Starter, Pro, o Business

---

## 12. Sistema de Diseño

### Tipografía
- **Font principal:** Inter (Google Fonts) con pesos 300-800
- **Font monospace:** JetBrains Mono / Fira Code
- **Fallback:** system-ui, -apple-system, BlinkMacSystemFont

### Design Tokens (`globals.css` — 447 líneas)

#### Colores Brand
| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--color-primary` | `#6C5CE7` (violeta) | `#A29BFE` |
| `--color-secondary` | `#00CEC9` (teal) | `#81ECEC` |
| `--color-accent` | `#FD79A8` (rosa) | `#FD79A8` |

#### Colores de Estado
| Token | Light | Dark |
|-------|-------|------|
| `--color-success` | `#00B894` | `#55EFC4` |
| `--color-warning` | `#FDCB6E` | `#FFEAA7` |
| `--color-error` | `#FF6B6B` | `#FF7675` |
| `--color-info` | `#74B9FF` | `#74B9FF` |

#### Escala de Espaciado (14 tokens)
`4px` → `8px` → `12px` → `16px` → `20px` → `24px` → `28px` → `32px` → `40px` → `48px` → `64px` → `80px`

#### Escala Tipográfica (10 tokens)
`0.75rem` → `0.8125rem` → `0.875rem` → `1rem` → `1.125rem` → `1.25rem` → `1.5rem` → `1.875rem` → `2.25rem` → `3rem`

#### Bordes, Sombras, Transiciones
- 6 radius tokens (4px → 9999px)
- 6 shadow tokens (xs → xl + glow)
- 4 transition tokens (120ms fast → 500ms spring)
- 6 z-index tokens (100 → 600)

### Librería de Componentes (`components.css` — 432 líneas, 12 clases)

| Componente | Variantes | Features |
|-----------|-----------|----------|
| **Buttons** (`.btn`) | primary, secondary, ghost, danger, sm, lg, icon | Ripple effect, scale(0.97) active |
| **Cards** (`.card`) | interactive (hover lift), stat (label+value+change) | Glassmorphism, shadow elevation |
| **Inputs** (`.input`) | error, group, label | Focus glow, placeholder styling |
| **Badges** (`.badge`) | primary, success, warning, error, info, plan | Plan badge with gradient |
| **Avatars** (`.avatar`) | sm (32px), default (40px), lg (56px), xl (80px) | object-fit cover |
| **Tables** (`.table`) | wrapper (overflow-x) | Uppercase headers, hover rows |
| **Toast** (`.toast`) | — | Fixed bottom-right, slideInUp spring |
| **Empty State** | icon, title, desc | Centered, max-width 360px |
| **Skeleton** | — | Pulse gradient animation |
| **Divider** | — | 1px border-light |
| **Headings** | h1, h2, h3, h4 | Responsive reduction at 768px |

### Características del Design System
- ✅ Dark mode completo (17+ tokens con override)
- ✅ Responsive mobile-first (breakpoints: 768px, 1024px)
- ✅ CSS Modules per-page (no conflictos de clases)
- ✅ Touch-first (min 44x44px targets en mobile)
- ✅ Safe area para notched devices (iPhone X+)
- ✅ Previene iOS zoom on focus (font-size 16px minimum)
- ✅ Momentum scrolling en iOS
- ✅ Reduced motion support
- ✅ Focus-visible para accesibilidad
- ✅ Custom scrollbar styling
- ✅ Selection styling con color primario

---

## 13. Internacionalización (i18n)

**Archivo:** `apps/web/src/lib/i18n.ts` | **599 líneas** | **~290 claves**

### Idiomas Soportados
- 🇲🇽 **Español** (`es`) — idioma por defecto
- 🇺🇸 **English** (`en`)

### Categorías de Claves

| Categoría | Ejemplo de Claves |
|-----------|-------------------|
| Navegación | `overview`, `calendar`, `clients`, `services`, `inventory` |
| Dashboard | `total_bookings`, `total_revenue`, `new_clients`, `avg_rating` |
| Status | `status_pending`, `status_confirmed`, `status_in_progress` |
| Calendario | `day_view`, `week_view`, `month_view`, `today` |
| Clientes | `add_client`, `edit_client`, `client_since`, `total_visits` |
| Servicios | `add_service`, `duration`, `popular`, `staff_assigned` |
| Inventario | `total_products`, `inventory_value`, `stock_low`, `out_of_stock` |
| POS | `open_shift`, `close_shift`, `checkout`, `cash_given` |
| Settings | `business_profile`, `active_modules`, `subscription_plan` |
| Acciones | `save`, `cancel`, `delete`, `search`, `confirm`, `edit` |

### Implementación
```typescript
const { t, locale, setLocale } = useLocale();
// Uso: t('total_bookings') → "Total de Citas" (ES) / "Total Bookings" (EN)
```

---

## 14. Paquetes Compartidos

### `@aeternasuite/shared-types` (286 líneas)

**12 Enums:** UserRole, BusinessRole, BusinessStatus, CalendarMode, BookingStatus, PaymentType, PaymentStatus, SubscriptionPlan, SubscriptionStatus, DayOfWeek, NotificationType, NotificationChannel

**15 Interfaces:** IUser, IBusiness, IBusinessSettings, ICategory, IService, IBooking, IPayment, ISubscription, IReview, IBusinessHours, IIntakeFormSchema, IIntakeFormField, ApiResponse\<T\>, PaginatedResponse\<T\>, ApiError

### `@aeternasuite/shared-constants` (213 líneas)

| Export | Contenido |
|--------|-----------|
| `CATEGORIES` | Array de 30 rubros con slug, icon, nameEs, nameEn |
| `CategorySlug` | Union type de los 30 slugs |
| `PLAN_LIMITS` | 18 feature flags × 4 planes |
| `DEFAULT_BUSINESS_SETTINGS` | 12 settings con valores default |
| `SUPPORTED_CURRENCIES` | 7 monedas (MXN, USD, ARS, COP, CLP, BRL, EUR) |
| `SUPPORTED_LANGUAGES` | `['es', 'en']` |
| `TRIAL_DURATION_DAYS` | 14 |
| `SUBSCRIPTION_PRICES` | Precios mensuales + anuales en centavos USD |
| `ROOT_BUSINESS_ID` | UUID del negocio MVP de desarrollo |

### `@aeternasuite/shared-utils` (168 líneas, 12 funciones)

| Función | Descripción |
|---------|-------------|
| `slugify(text)` | Genera slug URL-safe (normaliza acentos) |
| `formatPrice(amount, currency, locale)` | Formatea precio con `Intl.NumberFormat` |
| `formatDate(date, locale, options)` | Fecha legible con `toLocaleDateString` |
| `formatTime(date, locale)` | Hora en formato HH:mm (12h) |
| `formatDuration(minutes, lang)` | Duración legible: "1h 30min" |
| `calculateDistance(lat1, lon1, lat2, lon2)` | Haversine formula (km) |
| `formatDistance(km, lang)` | "500 m" o "2.5 km" |
| `getInitials(firstName, lastName)` | Iniciales para avatares |
| `isValidEmail(email)` | Regex de email |
| `isValidPhone(phone)` | Validación LATAM (10-15 dígitos) |
| `truncate(text, maxLength)` | Truncar con "..." |
| `seedColor(seed)` | Color HSL determinístico para avatares |

---

## 15. Infraestructura y DevOps

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: aeternasuite-db
    ports: "5432:5432"
    credentials: aeternasuite / aeternasuite_dev_2026
    volumes: postgres_data:/var/lib/postgresql/data
    healthcheck: pg_isready -U aeternasuite

  redis:
    image: redis:7-alpine
    container_name: aeternasuite-redis
    ports: "6379:6379"
    volumes: redis_data:/data
    healthcheck: redis-cli ping
```

### Turborepo Pipeline (`turbo.json`)

| Task | Behavior |
|------|----------|
| `build` | Dependencias primero (`^build`), outputs: `.next/**`, `dist/**` |
| `dev` | Sin cache, persistente |
| `lint` | Después de build |
| `test` | Después de build |
| `typecheck` | Después de build |
| `clean` | Sin cache |

### Scripts Root (`package.json`)

```bash
npm run dev        # Turbo: API (3001) + Web (3000) en paralelo
npm run build      # Build all packages
npm run lint       # Lint all
npm run test       # Test all
npm run typecheck  # TypeScript check all
npm run format     # Prettier format all
```

---

## 16. Los 30 Rubros Soportados

Definidos en `packages/shared-constants/src/index.ts` → `CATEGORIES`.

### 💆‍♀️ Belleza y Cuidado Personal (8)

| # | Slug | Emoji | Nombre |
|---|------|-------|--------|
| 1 | `barbershop` | 💈 | Barberías |
| 2 | `beauty-salon` | 💇‍♀️ | Salones de Belleza |
| 3 | `nails` | 💅 | Uñas y Manicura |
| 4 | `lashes-brows` | 👁️ | Cejas y Pestañas |
| 5 | `makeup` | 💄 | Maquillistas |
| 6 | `waxing` | ✨ | Depilación y Láser |
| 7 | `spa` | 💆‍♀️ | Spas y Masajes |
| 8 | `cosmetology` | 🧖‍♀️ | Cosmetología |

### 🏥 Salud y Bienestar (8)

| # | Slug | Emoji | Nombre |
|---|------|-------|--------|
| 9 | `medical` | 🏥 | Clínicas y Médicos |
| 10 | `dental` | 🦷 | Dentistas |
| 11 | `optometry` | 👓 | Ópticas |
| 12 | `podiatry` | 🦶 | Podólogos |
| 13 | `psychology` | 🧠 | Psicólogos y Terapeutas |
| 14 | `nutrition` | 🥗 | Nutriólogos |
| 15 | `physiotherapy` | 🦴 | Fisioterapia |
| 16 | `chiropractic` | 💆‍♂️ | Quiroprácticos |

### 🏋️ Deportes (2) · 🐾 Mascotas (2) · 💼 Profesionales (2)

| # | Slug | Emoji | Nombre |
|---|------|-------|--------|
| 17 | `gym` | 🏋️ | Gimnasios y Crossfit |
| 18 | `yoga-pilates` | 🧘‍♀️ | Yoga y Pilates |
| 19 | `veterinary` | 🐾 | Veterinarias |
| 20 | `pet-grooming` | ✂️ | Estéticas Caninas |
| 21 | `legal` | ⚖️ | Abogados y Legal |
| 22 | `accounting` | 📊 | Contadores y Asesoría |

### 🎨 Creatividad · 🚗 Automotriz · 🎪 Eventos · 📅 General (8)

| # | Slug | Emoji | Nombre |
|---|------|-------|--------|
| 23 | `tattoo` | 🖋️ | Tatuajes y Piercings |
| 24 | `tutoring` | 📚 | Tutorías y Academias |
| 25 | `mechanic` | 🔧 | Taller Mecánico |
| 26 | `carwash` | 🚙 | Autolavado y Car Detail |
| 27 | `electronics-repair` | 📱 | Reparación de Celulares/PC |
| 28 | `party-rentals` | 🎪 | Renta de Mobiliario |
| 29 | `apparel-rental` | 👗 | Renta de Vestidos/Trajes |
| 30 | `general` | 📅 | General / Otros |


---

## 17. Matriz de Micro-Módulos Especializados

El motor AeternaSuite no crea "apps distintas" para cada rubro. Agrupa **Micro-Módulos Especializados** que se encienden/apagan por nicho:

| Módulo | Rubros que lo usan | Caso de Uso |
|--------|-------------------|-------------|
| `prescriptions` | Médicos, Dentistas, Podólogos, Veterinarias | Recetas médicas digitales |
| `lab-orders` | Médicos, Veterinarias | Órdenes de laboratorio |
| `medical-history` | 9 rubros clínicos | Expediente universal del paciente |
| `xray-orders` | Dentistas, Médicos, Fisio, Quiro, Vet | Solicitud de radiografías |
| `dental-charts` | Dentistas | Odontograma interactivo |
| `treatment-plans` | Dentistas, Quiro, Cosmetología, Fisio | Planes de tratamiento |
| `diet-plans` | Nutriólogos | Formulador de macros y rutinas |
| `rehab-plans` | Fisioterapia | Ejercicios de movilidad articular |
| `body-chart` | Quiro, Fisio, Cosmetología, Tattoo, Spa | Mapa anatómico tap-to-mark |
| `patch-test` | Cejas/Pestañas, Maquillaje, Cosmetología | Registro de prueba de alergia |
| `equipment-booking` | Depilación, Mobiliario, Vestidos | Motor de recursos limitados |
| `session-tracking` | Depilación, Cosmetología, Fisio, Psicología | Rastreador "Sesión 3 de 10" |
| `design-reference` | Uñas, Maquillaje, Salón, Tattoo | Canvas de inspiración Pinterest-like |
| `gallery` | Barberías, Belleza, Mascotas, Tattoo | Before/after + portafolio |
| `quote-requests` | Tattoo, Carwash, Abogados | Flujo "Solicitar Presupuesto" |
| `walk-in-queue` | Barberías, Clínicas, Carwash | Cola FIFO para walk-ins |
| `packages` | Spas, Belleza, Carwash | SKUs agrupados de sesiones |
| `gift-cards` | Spas, Belleza, Uñas, Tattoo | Hashes canjeables por saldo |
| `group-classes` | Gimnasios, Yoga, Tutorías | Cupos N en vez de 1-a-1 |
| `training-plans` | Gimnasios, Tutorías | Planes de entrenamiento PDF |
| `progress-tracking` | Gimnasios, Nutriólogos, Fisio | Gráficos de avance temporal |
| `pet-profiles` | Veterinarias, Estéticas Caninas | Entidad "Mascota" bajo Owner |
| `vaccine-history` | Veterinarias, Estéticas Caninas | Cartilla de vacunación |
| `prescription-history` | Ópticas | Historial de dioptrías |
| `lens-orders` | Ópticas | Órdenes a laboratorio óptico |
| `session-notes` | Psicólogos, Podólogos, Nutrición | Rich-text SOAP notes privadas |
| `crisis-detection` | Psicólogos | NLP para keywords de riesgo |
| `split-payments` | Renta Mobiliario | Dividir pago entre N tarjetas |
| `private-case-notes` | Abogados | Bóveda ultra-encriptada |
| `retainer-fees` | Abogados, Tattoo, Mobiliario | Pagos de bloqueo no-reembolsables |
| `document-requests` | Contadores, Legal, Médicos | Ingesta de PDFs obligatorios |
| `vehicle-tracking` | Autolavado | Kanban Recepción→Lavado→Entrega |

---

## 18. Motor Universal de Formularios (Intake Forms)

Módulo obligatorio para todos los rubros. Los admins crean formularios dinámicamente con componentes tipados:

| Tipo de Campo | Descripción | Ejemplo Real |
|---------------|-------------|--------------|
| `text` | Input corto | Nombre, Placas de Auto |
| `textarea` | Box multilínea | Detalles del caso legal |
| `select` | Dropdown | Talla de traje, Tipo de Combustible |
| `multiselect` | Checkboxes | Medicinas actuales, Enfoque de tutoría |
| `date` | Selector de fecha | Fecha de nacimiento |
| `number` | Numérico estricto | Presupuesto máximo, Kilometraje |
| `boolean` | Toggle | ¿Consentimiento firmado?, ¿Fuma? |
| `scale` | Slider 1-10 | Nivel de dolor, Estrés laboral |
| `upload` | Selector de archivos | INE escaneada, Diseño de tatuaje |
| `body-selector` | **SVG anatómico** | Zonas de dolor quiropráctico |
| `tooth-selector` | **Grid odontológico** | Dientes con caries |
| `color-picker` | **Hexadecimal** | Color de esmalte, Color de pintura |

Definidos en `shared-types` → `IIntakeFormField.type`.

---

## 19. Ecosistema B2B + B2C

### B2B — Panel Administrativo (Dashboard)
El corazón del producto. Los dueños de negocios gestionan todo desde `/dashboard/*`:
- Citas, clientes, servicios, inventario, equipo, pagos
- POS, galería, reseñas, fidelización, formularios
- Configuración, facturación, suscripción
- Verticales especializadas según su rubro

### B2C — Portal Público + Link-in-Bio
Para clientes finales que no tienen la app:

**URL pública:** `aeternasuite.com/reserva/[slug-del-negocio]`
- Link ideal para Instagram, WhatsApp, Facebook
- El cliente ve servicios, escoge staff, horario, paga depósito
- **Hook post-reserva:** "¿Quieres acumular puntos? Descarga la App"

**Portal de directorio:** `aeternasuite.com/portal`
- Directorio inteligente de negocios
- Búsqueda por rubro, ubicación, calificación
- Login con magic link (sin password)

### B2C — App del Cliente (Futuro)
Una vez que el cliente descarga la app:
- **QR Check-in** — Muestra su "Tempus ID" para check-in automático
- **Billetera digital** — Tarjetas tokenizadas, pagos 1-click
- **Historial** — Todas las visitas, recibos, prescripciones
- **Push notifications** — Reemplaza SMS/WhatsApp costosos
- **Directorio in-app** — Descubrimiento orgánico de negocios

---

## 20. SuperAdmin Command Center

Panel exclusivo para `PLATFORM_ADMIN` (Code Aeternum) con 17 endpoints y 9 páginas:

| Sección | Funcionalidad |
|---------|---------------|
| **Overview** | Stats globales: total businesses, users, revenue, MRR |
| **Businesses** | Listar, suspender, activar negocios |
| **Users** | Gestión de usuarios de la plataforma |
| **Subscriptions** | Ver todas, cambiar planes manualmente |
| **Feature Flags** | Crear, togglear módulos Beta por plan/categoría |
| **Platform Ads** | Crear, segmentar, togglear anuncios en planes Free/Starter |
| **Audit Log** | Bitácora inmutable de todas las acciones admin |
| **Feedback** | Gestión de tickets (bugs, feature requests, quejas) |
| **Config** | Configuración global de la plataforma |

### Feature Flags — Control Remoto de Módulos
El modelo `FeatureFlag` permite:
- Activar/desactivar módulos Beta remotamente
- Targeting por plan (`targetPlans: ["PRO", "BUSINESS"]`)
- Targeting por rubro (`targetCategories: ["dental", "medical"]`)
- Targeting por environment (`production`, `staging`, `development`)

### Platform Ads — Monetización de Planes Gratuitos
El modelo `PlatformAd` permite:
- Banners no-intrusivos en planes Free/Starter
- 4 posiciones: Dashboard banner, Sidebar widget, Booking confirmation, Calendar interstitial
- Métricas: impressions, clicks
- Scheduling: startsAt, endsAt

---

## 21. Integraciones Externas

| Integración | Estado | Variables de Entorno |
|-------------|--------|---------------------|
| **Firebase Auth** | ✅ Implementado | `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` |
| **MercadoPago** | ✅ Implementado | `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY` |
| **Twilio** | ✅ Service existe | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` |
| **Google Maps** | ⬜ Configurado | `GOOGLE_MAPS_API_KEY` |
| **Redis/Bull** | ⬜ Disponible | `REDIS_URL` |
| **Swagger** | ✅ Operativo | Auto-configurado en `/docs` |

---

## 22. Seguridad y Autenticación

### Flujo de Autenticación

```
Cliente (Browser)
    │
    ├── Firebase Auth (email/Google/magic link)
    │       ↓
    │   JWT Token (idToken)
    │       ↓
    ├── fetchWithAuth() ← inyecta Authorization: Bearer {token}
    │       ↓
    API NestJS
    │       ↓
    ├── FirebaseAuthGuard (global)
    │   ├── Verifica JWT con Firebase Admin SDK
    │   ├── Extrae uid, email del token
    │   └── Busca/crea User en PostgreSQL
    │       ↓
    └── @CurrentUser() decorator → inyecta user en request
```

### Guards y Decoradores

| Entidad | Descripción |
|---------|-------------|
| `FirebaseAuthGuard` | Guard global, verifica JWT en cada request |
| `@Public()` | Decorador para marcar endpoints sin auth |
| `@CurrentUser()` | Inyecta el usuario autenticado |
| Fallback dev | Si `NODE_ENV=development` y Firebase no configurado → mock user |

### Roles del Sistema

| Rol | Acceso |
|-----|--------|
| `PLATFORM_ADMIN` | SuperAdmin — todo el sistema |
| `BUSINESS_USER` | Dashboard del negocio (filtrado por rol dentro del negocio) |
| `CLIENT` | Portal público, app del cliente |

### Roles dentro de un Negocio

| Rol | Permisos |
|-----|----------|
| `OWNER` | Todo. Dueño absoluto. |
| `ADMIN` | Gestión completa excepto eliminar negocio |
| `MANAGER` | Gestión operativa (staff, calendario, inventario) |
| `EMPLOYEE` | Solo ver su calendario y atender citas asignadas |

---

## 23. Estado de Integración Frontend ↔ Backend

### Resumen Ejecutivo (Febrero 2026)

| Categoría | Total | 🟢 Integrado | 🟡 Parcial | 🔴 Desconectado | ⚫ Sin UI | ⬜ Scaffold |
|-----------|-------|-------------|-----------|----------------|----------|------------|
| Dashboard Core | 23 | **13** | 1 | 7 | 0 | 2 |
| Verticales Mec/Rep | 6 | 0 | 0 | 5 | 0 | 1 |
| Verticales Clínicas | 4 | 0 | 0 | 0 | 1 | 3 |
| SuperAdmin | 9 | **8** | 0 | 0 | 0 | 1 |
| Portal Público | 8 | **8** | 0 | 0 | 0 | 0 |
| **TOTAL** | **50** | **29 (58%)** | **1 (2%)** | **12 (24%)** | **1 (2%)** | **7 (14%)** |

### Fracturas Conocidas (Root Cause Analysis)

1. **`ROOT_BUSINESS_ID` Hardcodeado** — Algunas páginas usan un ID constante en vez del `activeBusinessId`
2. **Datos Mock Locales** — Páginas con UIs terminadas pero arrays mock en `useState`
3. **Módulos Clínicos Sin Frontend** — Backend completo, UI en scaffold
4. **Motor de Menú Incompleto** — Sidebar no incluye items clínicos condicionalmente

---

## 24. Roadmap de Evolución

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1. Inventario UI | ✅ Completada | Stat cards filtro, filas colapsables, CRUD |
| 2. Settings + Sidebar | ✅ Completada | 7 secciones, módulos toggleables, persistencia |
| 3. POS | ✅ Completada | Shifts, checkout, catálogo integrado |
| 3.5 Fiscal + Cotizaciones | ✅ Completada | Magic links, notas de venta |
| 4. Multi-Rubro | 🔄 En progreso | Motor de módulos por categoría |
| 5. Directorio B2C | 🔄 En progreso | Portal público de negocios |
| 6. Integración Total | 📋 Pendiente | Conectar las 12 páginas 🔴 desconectadas |
| 7. App Móvil B2C | 📋 Pendiente | React Native / Expo |
| 8. Producción | 📋 Pendiente | Google Cloud Run + CI/CD |

---

## 25. Guía de Ejecución Local

### Requisitos
- Node.js >= 20.0
- npm >= 10.0
- Docker + Docker Compose

### Instalación

```bash
git clone https://github.com/codeaeternum/aeternasuite.git
cd aeternasuite
npm install

# Levantar base de datos
docker compose up -d

# Configurar backend
cp apps/api/.env.example apps/api/.env
cd apps/api && npx prisma generate && npx prisma migrate dev && npm run prisma:seed
cd ../..
```

### Desarrollo

```bash
npm run dev  # Inicia API (3001) + Web (3000) en paralelo via Turborepo
```

### URLs

| Servicio | URL |
|----------|-----|
| Frontend | `http://localhost:3000` |
| API | `http://localhost:3001/api/v1` |
| Swagger | `http://localhost:3001/docs` |
| Prisma Studio | `cd apps/api && npx prisma studio` |

### Build de Producción

```bash
npm run build      # Build all packages
npm run lint       # Lint all
npm run typecheck  # TypeScript check all
```

---

## 26. Mandato de Calidad

Todo desarrollo en AeternaSuite debe cumplir estos estándares no negociables:

### Mandato Multiplataforma
- **Input Agnostic:** La UI maneja con la misma fluidez eventos de mouse/teclado y eventos táctiles (tap, swipe, pinch)
- **Ergonomía Contextual:** En desktop maximiza espacio para datos densos y shortcuts. En mobile garantiza hit targets >= 44x44px
- **Navegación Fluida:** Sidebar en desktop → Bottom tabs en mobile. Menú contextual → Long-press

### Estándares de Código
- TypeScript estricto en todo el proyecto
- CSS Modules para estilos locales (zero conflictos)
- CSS Custom Properties para design tokens globales
- Validación con class-validator en todos los DTOs
- DTOs anotados con Swagger decoradores
- Prisma como única interfaz a la base de datos

### Accesibilidad
- `focus-visible` en todos los interactivos
- `prefers-reduced-motion` respetado
- Safe areas para devices con notch
- Font-size mínimo 16px en inputs (previene iOS zoom)
- ARIA roles donde corresponda
- Contraste de colores WCAG 2.1 AA

---

> **AeternaSuite** — El ecosistema central para operar cualquier negocio de servicios.
> **Code Aeternum** — Código Eterno. Software que trasciende.
>
> *Última actualización: Febrero 23, 2026*
> *Versión: 0.1.0 (Early Development)*
