# AI Business Audit Platform (ABAP)

> AI-powered business intelligence platform that crawls a company's web presence,
> scores it across multiple digital-health channels, and generates prioritized,
> agency-ready recommendations and sales proposals.

📚 **Full documentation:** see [`DOCUMENTATION.md`](./DOCUMENTATION.md) — architecture,
every feature, the 12-stage blueprint pipeline, API reference, deploy steps, and
known gaps.

## Monorepo Structure

```
business-analizer-ai/
├── apps/
│   ├── web/    # Next.js 14 (App Router) frontend
│   └── api/    # NestJS 10 backend
├── packages/
│   ├── types/          # Shared TS types
│   ├── schemas/        # Shared Zod schemas
│   ├── constants/      # Score weights, AI tiers, crawl defaults
│   ├── prompts/        # LLM prompt templates
│   ├── audit-core/     # Scoring math
│   └── ui/             # (reserved shared UI)
├── docker-compose.yml
├── turbo.json
└── DOCUMENTATION.md
```

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env        # add GEMINI_API_KEY / GROQ_API_KEY
pnpm install
pnpm docker:up --build      # MongoDB, Redis, API :3000, Web :3001
```

### Local dev

```bash
pnpm install
pnpm --filter @abap/api exec playwright install chromium
pnpm dev
```

### Scripts

```bash
pnpm dev          # API + Web in dev
pnpm build        # build all (turbo)
pnpm lint         # ESLint
pnpm type-check   # tsc
pnpm docker:up    # start containers
pnpm docker:down  # stop containers
```

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Recharts
- **Backend:** NestJS 10, MongoDB/Mongoose, Redis, BullMQ
- **AI:** Google Gemini + Groq (unified provider with automatic failover)
- **Crawling / PDF:** Playwright (bundled Chromium)
- **Auth:** JWT (access 15m + refresh 7d) + RBAC
- **Monorepo:** Turborepo + pnpm workspaces

## What It Does

1. Enter a company name + domain → the platform crawls the site.
2. Runs SEO, performance (Core Web Vitals), and branding analyses.
3. Enriches with company discovery, and (when data exists) social, Google
   Business, and competitor intelligence.
4. Scores across weighted channels → a single **Digital Health Score**.
5. LLM writes prioritized, agency-mapped recommendations.
6. Generates a PDF/HTML report **and** a sales proposal with a pricing matrix.

See [`DOCUMENTATION.md`](./DOCUMENTATION.md) for the full breakdown.
