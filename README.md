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

```bash
# Install dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm type-check
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS, TypeScript, MongoDB/Mongoose, Redis, BullMQ
- **AI:** Gemini, Groq (provider abstraction layer)
- **Crawling:** Playwright, Cheerio, Lighthouse
- **Monorepo:** Turborepo + pnpm workspaces
