# TempusBook

> Multi-category SaaS appointment booking platform for service businesses.

**Web** (Next.js) • **iOS/Android** (React Native/Expo) • **Backend** (NestJS) • **PostgreSQL**

## 🏗️ Tech Stack

- **Monorepo**: Turborepo + npm workspaces
- **Backend**: NestJS (TypeScript)
- **Web**: Next.js 14 (App Router)
- **Mobile**: React Native + Expo
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Firebase Auth
- **Payments**: MercadoPago
- **Hosting**: Google Cloud Run

## 📂 Project Structure

```
tempusapp/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js dashboard
│   └── mobile/       # React Native / Expo app
├── packages/
│   ├── shared-types/     # TypeScript interfaces
│   ├── shared-constants/ # Enums, categories, roles
│   └── shared-utils/     # Utility functions
├── docker-compose.yml
├── turbo.json
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- npm >= 10

### Setup

```bash
# Install dependencies
npm install

# Start database and services
docker compose up -d

# Run all apps in development
npm run dev
```

## 📄 License

Private — All rights reserved.
