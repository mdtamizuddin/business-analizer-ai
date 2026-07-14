# AI Business Audit Platform (ABAP)

AI-powered business intelligence platform that analyzes a company's digital presence and generates actionable recommendations.

## Monorepo Structure

```
abap/
├── apps/
│   ├── web/              # Next.js 15 frontend
│   └── api/              # NestJS backend
├── packages/
│   ├── types/            # Shared TypeScript types & enums
│   ├── schemas/          # Shared Zod validation schemas
│   ├── constants/        # Shared constants (score categories, priorities)
│   ├── prompts/          # AI prompt templates
│   ├── ui/               # Shared React components (shadcn/ui)
│   ├── config/           # Shared ESLint, TS, Tailwind configs
│   └── audit-core/       # Shared audit utilities (scoring, normalization)
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Getting Started

### Option 1: Docker (recommended)

```bash
# Copy environment file and add your API keys
cp .env.example .env

# Build and start all services (MongoDB, Redis, API, Web)
pnpm docker:up --build

# View logs
pnpm docker:logs

# Stop everything
pnpm docker:down
```

This starts:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`
- API on `localhost:3000`
- Web on `localhost:3001`

### Option 2: Local development

Prerequisites: MongoDB, Redis, and Playwright browsers installed.

```bash
# Install dependencies
pnpm install

# Install Playwright browser
pnpm --filter @abap/api exec playwright install chromium

# Run all apps in dev mode
pnpm dev
```

### Available scripts

```bash
pnpm dev          # Start API + Web in dev mode
pnpm build        # Build all packages
pnpm lint         # Run ESLint
pnpm test         # Run tests
pnpm type-check   # TypeScript type checking
pnpm docker:up    # Start all Docker services
pnpm docker:down  # Stop all Docker services
pnpm docker:logs  # Follow Docker logs
pnpm docker:reset # Full reset — remove volumes and rebuild
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS, TypeScript, MongoDB/Mongoose, Redis, BullMQ
- **AI:** Gemini, Groq (provider abstraction layer)
- **Crawling:** Playwright, Cheerio, Lighthouse
- **Monorepo:** Turborepo + pnpm workspaces
