# ABAP — AI Business Audit Platform

> **Full Product & Engineering Documentation**
> AI-powered business intelligence platform that crawls a company's web presence,
> scores it across multiple digital-health channels, and generates prioritized,
> agency-ready recommendations and sales proposals.

This document explains **what the app is, every feature it has, how it was built,
how the pieces fit together, and how to run/deploy it.** It is the single source
of truth for the current codebase on `main`.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture](#4-architecture)
5. [The Blueprint 12-Stage Pipeline](#5-the-blueprint-12-stage-pipeline)
6. [Backend Modules (API)](#6-backend-modules-api)
   - 6.1 [Crawler](#61-crawler)
   - 6.2 [SEO Analysis](#62-seo-analysis)
   - 6.3 [Performance Analysis](#63-performance-analysis)
   - 6.4 [Branding Analysis](#64-branding-analysis)
   - 6.5 [AI Service](#65-ai-service)
   - 6.6 [Company Discovery](#66-company-discovery)
   - 6.7 [Brand Vision (Vision AI)](#67-brand-vision-vision-ai)
   - 6.8 [Social Analysis](#68-social-analysis)
   - 6.9 [Google Business](#69-google-business)
   - 6.10 [Competitor Intelligence](#610-competitor-intelligence)
   - 6.11 [Auth (JWT + RBAC)](#611-auth-jwt--rbac)
   - 6.12 [Companies](#612-companies)
   - 6.13 [Leads (CRM)](#613-leads-crm)
   - 6.14 [Audits (Orchestrator)](#614-audits-orchestrator)
   - 6.15 [Report Generator](#615-report-generator)
   - 6.16 [Sales Proposal](#616-sales-proposal)
7. [Scoring Model](#7-scoring-model)
8. [Frontend (Web)](#8-frontend-web)
9. [Authentication & Authorization (UI)](#9-authentication--authorization-ui)
10. [Design System (AI Growth Intelligence Theme)](#10-design-system-ai-growth-intelligence-theme)
11. [API Reference](#11-api-reference)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)
14. [Current Status & Known Gaps](#14-current-status--known-gaps)
15. [Roadmap](#15-roadmap)

---

## 1. Overview

**ABAP (AI Business Audit Platform)** turns a company's website URL into a
complete digital-health diagnosis. A user enters a company name + domain, and the
platform:

1. Crawls the site (Playwright/Chromium).
2. Runs structural SEO, performance (Core Web Vitals), and branding analyses.
3. Enriches with company discovery (DNS/IP/industry) and, when data exists,
   social, Google Business, and competitor intelligence.
4. Scores the business across weighted channels into a single **Digital Health Score**.
5. Uses LLMs (Gemini / Groq) to write prioritized, agency-mapped recommendations.
6. Generates a printable PDF/HTML report **and** a sales proposal with a pricing matrix.

The product is aimed at **digital agencies** that want to turn a cold audit into a
warm lead and a sellable proposal.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **API** | NestJS 10 (TypeScript), BullMQ (job queue), Mongoose |
| **Database** | MongoDB (native or containerized `mongo:8`) |
| **Cache / Queue** | Redis 7 (`abap-redis`) |
| **AI** | Google Gemini (`@google/generative-ai`) + Groq (LLaMA) via a unified provider abstraction with automatic failover |
| **Web** | Next.js 14 (App Router), React, Tailwind CSS, Recharts |
| **Crawler** | Playwright with bundled Chromium |
| **PDF** | Chromium headless HTML→PDF (`htmlToPdf`) |
| **Auth** | JWT (access 15m + refresh 7d), Passport, bcrypt, RBAC roles |
| **Deploy** | Docker (per-app Dockerfiles) on a VPS; containers `vps-api`, `vps-web`, `vps-mongo`, `abap-redis` |

---

## 3. Repository Structure

```
business-analizer-ai/
├── apps/
│   ├── api/                      # NestJS backend
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── main.ts           # bootstrap, global prefix /api/v1, validation
│   │       └── modules/
│   │           ├── crawler/      # Playwright crawl + screenshot + PDF
│   │           ├── seo/          # structural SEO scoring
│   │           ├── performance/  # Core Web Vitals
│   │           ├── branding/     # logo/favicon/color/font signals
│   │           ├── ai/           # provider abstraction (Gemini/Groq) + vision
│   │           ├── auth/         # JWT, RBAC, users
│   │           ├── companies/    # company CRUD
│   │           ├── leads/        # CRM leads
│   │           ├── social/       # social presence analysis
│   │           ├── google-business/ # GBP ratings + sentiment
│   │           ├── competitor/   # competitor gap analysis
│   │           └── audits/       # orchestrator (processor, report, proposal)
│   └── web/                      # Next.js frontend
│       ├── Dockerfile            # ARG NEXT_PUBLIC_API_URL
│       └── src/
│           ├── app/              # routes (login, register, dashboard, ...)
│           ├── components/       # ui/, layout/, auth/
│           └── lib/              # api client, auth, constants, *-api clients
├── packages/
│   ├── audit-core/   # scoring math (buildScoreSet, calculateOverallScore)
│   ├── constants/    # SCORE_WEIGHTS, categories, AI tier map, crawl defaults
│   ├── prompts/      # LLM prompt templates
│   ├── schemas/      # shared Zod schemas (recommendation, scoreSet)
│   ├── types/        # shared TS types
│   └── ui/           # (reserved shared UI primitives)
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 4. Architecture

```
                ┌─────────────┐
   Browser ───► │  Next.js   │  (vps-web :3001)
                │  Web (ABAP)│
                └─────┬───────┘
                      │  REST (Bearer JWT)
                      ▼
                ┌─────────────┐   ┌──────────┐   ┌────────┐
                │  NestJS API │◄──►│ MongoDB │   │ Redis  │
                │  (vps-api)  │   │(vps-mongo│   │(queue/ │
                └─────┬───────┘   └──────────┘   │ cache) │
                      │                          └────────┘
        ┌─────────────┼──────────────────────────────┐
        ▼             ▼              ▼                 ▼
   Crawler        AI Service      BullMQ           Report/PDF
 (Playwright)   (Gemini/Groq)    (audit-queue)    (Chromium)
```

- **Stateless API + MongoDB** for persistence.
- **BullMQ** decouples the heavy audit pipeline from HTTP requests. An audit is
  created instantly (status `pending`) and processed asynchronously by
  `AuditProcessor`; the web polls `/audits/:id` for progress.
- **AI failover**: every LLM call tries the primary provider then the fallback
  (premium tier: Gemini→Groq; cheap tier: Groq→Gemini). If both fail, the
  pipeline degrades gracefully (see §14).

---

## 5. The Blueprint 12-Stage Pipeline

The audit follows the product blueprint's **Automated Discovery & Scoring
Pipeline**. `apps/api/src/modules/audits/pipeline.constants.ts` defines the 12
stages; `audit.processor.ts` executes them in order:

| # | Stage | What happens |
|---|-------|--------------|
| 1 | **Company Input** | Company already created via UI; processor fetches it |
| 2 | **Company Discovery** | Reverse DNS, IP lookup, MX providers, AI industry classification, local-business detection (`CompanyDiscoveryService`) |
| 3 | **Data Collection** | Crawl the website with Playwright (`CrawlerService.crawl`) |
| 4 | **Website Analysis** | SEO + Performance analysis on crawled pages |
| 5 | **Brand Analysis** | Text-brand signals **+ Vision AI** screenshot critique (`takeScreenshot` → `AiService.generateWithImage`) |
| 6 | **Social Analysis** | Runs *in-pipeline* if the company has `socialAccounts` |
| 7 | **Competitor Research** | Runs *in-pipeline* if the company has a `competitorUrl` |
| 8 | **AI Processing** | LLM generates prioritized recommendations (`RECOMMENDATIONS_PROMPT`) |
| 9–10 | **Business Scoring + Recommendations** | `buildScoreSet` → overall Digital Health Score |
| 11 | **Report Generation** | On-demand PDF/HTML endpoint (not blocking) |
| 12 | **Sales Proposal** | ROI proposal + pricing matrix from recommendations (`ProposalService`) |

Stages 2, 5 (vision), 6, 7, and 12 were **added to match the blueprint** — earlier
the flow was a loose crawl→SEO→AI→done with social/competitor as separate silos.

---

## 6. Backend Modules (API)

### 6.1 Crawler
- `CrawlerService.crawl(url, maxPages)` — Playwright headless Chromium, crawls
  internal links up to `CRAWL_DEFAULTS.MAX_PAGES` (10).
- Returns per-page: title, description, status code, load time, word count,
  H1/H2 counts, image count, links, metadata.
- `takeScreenshot(url)` → base64 PNG (used by Brand Vision).
- `htmlToPdf(html)` → PDF buffer via Chromium (used by the report).
- Bundled Chromium avoids downloading a browser at runtime.

### 6.2 SEO Analysis
- `SeoService.analyze(crawlResult)` — scores 11 sub-signals (meta tags, headings,
  structured data, canonical, sitemap, robots, Open Graph, image SEO, internal/
  external links, performance-SEO) and emits a list of `issues`.

### 6.3 Performance Analysis
- `PerformanceService.analyze(crawlResult)` — measures **Core Web Vitals**
  (LCP, CLS, FCP, TTFB, TBT, SI) via the Playwright Performance API.
- Returns `performanceScore`, accessibility/SEO proxies, and `issues`.

### 6.4 Branding Analysis
- `BrandingService.analyze(crawlResult)` — detects logo presence, favicon, color
  palette, custom fonts, image usage → `brandScore` (0–100).

### 6.5 AI Service
- `AiService` wraps two providers behind `IAIProvider`:
  - `GeminiProvider` (Google Generative AI) — supports `generate` **and**
    `generateWithImage` (vision).
  - `GroqProvider` (LLaMA 3.3 70B).
- `generateWithTier(tier, ...)` tries providers in order with automatic failover.
- `generateJson(tier, ...)` requests structured JSON (used for recommendations).
- Tier map (`packages/constants`): `cheap` → Gemini Flash / LLaMA; `premium` →
  Gemini Pro / LLaMA.

### 6.6 Company Discovery
- `CompanyDiscoveryService.discover(domain, website, industry)`:
  - DNS `lookup` (IP), `reverse` (PTR hostname), `resolveMx` (mail providers).
  - AI classifies `industry`, `localBusiness`, `confidence`.
- Results persisted on the audit (`companyDiscovery`) and written back to the
  Company (`industry`, `isLocalBusiness`).

### 6.7 Brand Vision (Vision AI)
- During stage 5, the processor captures a homepage screenshot and asks Gemini
  (vision) to critique layout, grid alignment, color harmony, and trust signals.
- Stored as `brandVision.critique`. Skipped gracefully if vision is unavailable.

### 6.8 Social Analysis
- `SocialService.analyze(socialAccounts[])` — for each platform (IG/FB/LinkedIn)
  checks presence, follower text, post count, bio presence; computes
  `presenceScore` + `consistencyScore` + an AI summary.
- Runs in-pipeline (stage 6) when the company has linked accounts. Also exposed
  as a standalone endpoint `/social/analyze`.

### 6.9 Google Business
- `GoogleBusinessService` — ratings/reviews aggregation + sentiment analysis
  (AI). Standalone endpoint `/google-business/analyze`. (Blueprint "GBP Trust /
  Sentiment" channel; wired for future in-pipeline use.)

### 6.10 Competitor Intelligence
- `CompetitorService.analyze(competitorUrl)` — crawls + scores the competitor,
  computes an overall score, and builds a `gap` analysis (strengths / weaknesses
  / opportunities) vs. the user's own audit.
- Runs in-pipeline (stage 7) when `competitorUrl` is set. Standalone endpoint
  `/competitor/analyze`.

### 6.11 Auth (JWT + RBAC)
- `AuthModule`: `User` schema (bcrypt-hashed passwords), `AuthService`
  (register/login/refresh), `JwtStrategy` (Passport), `JwtAuthGuard`,
  `RolesGuard`, `@Roles()` decorator.
- Tokens: **access 15 min**, **refresh 7 days**. Roles: `user | admin | consultant`.
- All `Companies` and `Audits` routes are guarded.

### 6.12 Companies
- `CompaniesService` — create/find/update. A Company holds `name`, `website`,
  `domain`, `industry`, `socialAccounts[]`, `competitorUrl`, `isLocalBusiness`.
- `organizationId` supports future multi-tenancy (default `default-org`).

### 6.13 Leads (CRM)
- `LeadsService` — pipeline stages (`new → contacted → qualified → proposal →
  won/lost`), notes, follow-ups. **Auto-created from every completed audit**
  (source `audit`) so an audit becomes a tracked sales opportunity.

### 6.14 Audits (Orchestrator)
- `AuditsController` (guarded): `POST /audits` (enqueue), `GET /audits`,
  `GET /audits/:id`, `GET /audits/company/:id`, `GET /audits/:id/report`.
- `AuditProcessor` (BullMQ worker) runs the 12-stage pipeline (§5).
- `Audit` schema stores: crawlData, seo/performance/branding analyses,
  companyDiscovery, brandVision, socialSnapshot, competitorSnapshot, scores,
  recommendations, executiveSummary, proposal, reportUrl.

### 6.15 Report Generator
- `ReportService.generateHtml(audit)` + `generatePdf(audit)` — builds a rich
  HTML report (light theme for client suitability, primary `#2563EB`) and
  renders it to PDF via Chromium.
- Endpoint: `GET /audits/:id/report?format=pdf|html`.

### 6.16 Sales Proposal
- `ProposalService.build(...)` — maps each recommendation's
  `recommendedService` to a price card, sums a subtotal + monthly retainer, and
  asks the LLM for a headline + estimated ROI.
- Stored on the audit as `proposal`; rendered as a pricing table in the UI with
  a "Export Proposal PDF" button.

---

## 7. Scoring Model

Score math lives in `packages/audit-core/src/scoring.ts`:

```ts
overall = round( Σ(categoryScore × weight) / Σ(weight) )
```

**Current `SCORE_WEIGHTS`** (10 categories):

| Category | Weight | Populated by |
|----------|--------|--------------|
| branding | 0.15 | BrandingService |
| website | 0.15 | PerformanceService (proxy) |
| seo | 0.15 | SeoService |
| performance | 0.10 | PerformanceService |
| accessibility | 0.10 | *(not yet measured → 0)* |
| security | 0.10 | *(not yet measured → 0)* |
| social_media | 0.05 | SocialService (when accounts set) |
| customer_trust | 0.10 | *(not yet measured → 0)* |
| conversion | 0.05 | *(not yet measured → 0)* |
| customer_experience | 0.05 | *(not yet measured → 0)* |

> ⚠️ **Known gap (see §14):** the blueprint specifies a **7-channel weighted**
> model (Branding 20%, Website 20%, SEO 15%, Speed 15%, Social 10%, GBP 10%,
> Conversion 10%). The current model is a 10-category superset where 6
> categories score 0. Aligning to the blueprint is a planned fix.

**Score colors** (UI + PDF): 90–100 green, 70–89 blue, 40–69 amber, 0–39 red.

---

## 8. Frontend (Web)

Next.js 14 App Router. Routes:

| Route | Purpose |
|-------|---------|
| `/login`, `/register` | Auth pages (dark-themed forms) |
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Overview (guarded) |
| `/audits/new` | Start a new audit (enter company + domain) |
| `/audits/[id]` | Audit detail: 12-stage progress, all analyses, recommendations, **Sales Proposal** |
| `/companies` | Company list + create |
| `/leads` | CRM leads (pipeline, notes, advance) |
| `/competitor` | Competitor intelligence |
| `/social` | Social presence |
| `/google-business` | Google Business reviews/sentiment |

**Shared libs** (`apps/web/src/lib`):
- `api.ts` — fetch client; attaches `Authorization: Bearer` from `localStorage`,
  auto-redirects to `/login` on 401.
- `auth.ts` — token/user storage helpers (`getToken`, `setSession`, `clearSession`).
- `audits-api.ts`, `leads-api.ts`, `companies-api.ts`, `competitor-api.ts`,
  `social-api.ts`, `google-business-api.ts` — typed API clients.
- `constants.ts` — `STAGE_LABELS`, `STATUS_LABELS`, `SCORE_CATEGORY_LABELS`, etc.

---

## 9. Authentication & Authorization (UI)

The API had full JWT auth from the start, but the **web previously had no auth
UI**. Added:
- `lib/auth.ts` — localStorage session (access/refresh tokens + user).
- `lib/api.ts` — `Authorization` header on every request; 401 → clear session →
  redirect to `/login`.
- `app/login/page.tsx`, `app/register/page.tsx` — dark AI-themed forms.
- `components/auth/auth-guard.tsx` — client guard; unauthenticated users hitting
  `/dashboard` are redirected to `/login`.
- `dashboard/layout.tsx` wrapped in `AuthGuard`.
- Sidebar shows the user's name + a **logout** button.

**Verified:** unauthenticated API → 401; login issues token; authenticated
request → 200; `/` → 307 → `/dashboard` (guarded).

> Note: top-level pages (`/companies`, `/leads`, …) are not individually guarded
> at the route level — but any fetch they make 401s and redirects to login, so
> unauthenticated users cannot see data.

---

## 10. Design System (AI Growth Intelligence Theme)

A premium dark theme applied across the entire web app (`tailwind.config.ts` +
`globals.css`):

| Token | Value |
|-------|-------|
| Background | `#080B16` |
| Surface | `#111827` |
| Elevated / Hover | `#1A2236` |
| Border | `#263247` |
| Primary (AI Blue) | `#4F8CFF` |
| Secondary (Purple) | `#8B5CF6` |
| AI Premium (Pink) | `#EC4899` |
| Success / Warning / Danger | `#22C55E` / `#F59E0B` / `#EF4444` |
| Text | `#FFFFFF` / `#94A3B8` |

- **Gradients:** `ai-hero` (135° blue→purple), `ai-growth` (green→blue),
  `ai-premium` (purple→pink).
- **Shadows:** `glow-primary`, `glow-secondary`, `glow-success`, `card`.
- **Font:** Inter (headings 700–800, body 400–500).
- **UI primitives** restyled: `Button` (incl. `ai`/`success` variants),
  `Card`, `Badge`, `Input`, `StatusBadge`, `ScoreCircle`, `RecommendationCard`.
- **Sidebar:** dark with gradient logo + active glow.
- **PDF report** intentionally uses a **light theme** (`#FFFFFF` bg, `#2563EB`
  primary) for client deliverables.

---

## 11. API Reference

Base URL: `http://<host>:3000/api/v1` (global prefix `api`, version `v1`).

### Auth
| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/auth/register` | — | `{ name, email, password, role? }` |
| POST | `/auth/login` | — | `{ email, password }` |
| POST | `/auth/refresh` | refresh | `{ refreshToken }` |

→ returns `{ accessToken, refreshToken, user }`

### Companies (guarded)
| Method | Path | Body |
|--------|------|------|
| POST | `/companies` | `{ name, website, industry?, socialAccounts?, competitorUrl? }` |
| GET | `/companies` | — |

### Audits (guarded)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/audits` | `{ companyId, crawlDepth?, runSeoAudit?, runBrandingAudit?, runAiProcessing? }` |
| GET | `/audits` | list |
| GET | `/audits/:id` | full audit (all stages' data) |
| GET | `/audits/company/:id` | by company |
| GET | `/audits/:id/report?format=pdf\|html` | report download |

### Leads (guarded)
| Method | Path |
|--------|------|
| GET | `/leads` |
| POST | `/leads` |
| PATCH | `/leads/:id` (status advance, notes) |

### Social / Google Business / Competitor (guarded)
| Method | Path | Body |
|--------|------|------|
| POST | `/social/analyze` | `{ accounts: [{platform,url}] }` |
| POST | `/google-business/analyze` | `{ businessName, location? }` |
| POST | `/competitor/analyze` | `{ competitorUrl }` |

---

## 12. Environment Variables

Set on the **API** container (see `docker-compose.yml` / VPS run command):

| Var | Purpose |
|-----|---------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_HOST` / `REDIS_PORT` | Redis (queue/cache) |
| `WEB_URL` | Frontend URL (for CORS/links) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets |
| `GEMINI_API_KEY` | Google Gemini key |
| `GROQ_API_KEY` | Groq key |
| `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | optional asset storage |

Web only needs `NEXT_PUBLIC_API_URL` **at build time**
(`--build-arg NEXT_PUBLIC_API_URL=http://<host>:3000/api/v1`) — Next.js inlines
`NEXT_PUBLIC_*` at build, so it cannot be overridden by a runtime env var.

---

## 13. Deployment

**Local (docker compose):**
```bash
cp .env.example .env   # fill keys
pnpm install
pnpm build
docker compose up -d   # api :3000, web :3001, mongo, redis
```

**VPS (current live setup):**
- Images built locally: `abap-api`, `abap-web` (tagged
  `business-analizer-ai-api:latest`, `business-analizer-ai-web:latest`).
- A native `mongod` on the host was rejected by the container (auth), so a fresh
  `mongo:8` container (`vps-mongo`, IP `172.18.0.5`, no auth) is used; API points
  to `mongodb://172.18.0.5:27017/abap`.
- `abap-redis` (IP `172.18.0.2`).
- Running containers: `vps-api` (:3000), `vps-web` (:3001), `vps-mongo`, `abap-redis`.
- Public: API `http://localhost:3000/api/v1`, Web `http://localhost:3001`.

**Rebuild + restart (after a change):**
```bash
docker build -f apps/api/Dockerfile -t abap-api .
docker build -f apps/web/Dockerfile -t abap-web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 .
docker rm -f vps-api vps-web
# re-run with the env block from §12
```

---

## 14. Current Status & Known Gaps

**Shipped & live:** Phases 1–7 (audit engine, auth+RBAC, leads/CRM, competitor,
social, Google Business, reports), the **blueprint 12-stage pipeline** (discovery,
brand-vision, in-pipeline social/competitor, sales proposal), the **auth UI**
(login/register/guard/logout), and the **AI Growth Intelligence dark theme**.

**Known gaps / caveats:**

1. **AI keys invalid on the VPS.** Both Gemini and Groq keys currently return
   `API_KEY_INVALID` / `Invalid API Key`. The pipeline therefore runs on
   **deterministic fallbacks**:
   - Recommendations are derived from detected SEO/perf/brand issues.
   - Executive summary + brand-vision are skipped when AI is unavailable.
   - The proposal still builds from the fallback recommendations.
   Supplying valid keys instantly upgrades all AI output to full LLM quality.
2. **Scoring ≠ blueprint 7-channel model** (§7). 6 of 10 categories score 0;
   alignment to the blueprint weights is pending.
3. **Conversion/CTA analysis missing** (10% blueprint weight) — no CTA/form/funnel
   measurement yet.
4. **GBP/social only populate when data is set** on the company (socialAccounts /
   competitorUrl); they're wired but not auto-discovered.
5. **Top-level pages not individually route-guarded** (only `/dashboard` is);
   unauthenticated access is blocked at the API layer via 401 redirect.
6. **Phase 8 (multi-tenant SaaS)** — per-org billing, monitoring
   (Sentry/Prometheus) — deferred by user choice (stop at MVP).

---

## 15. Roadmap

Suggested next steps (highest impact first):

- **A. Align scoring to blueprint 7-channel weights** + add **Conversion/CTA
  analysis** (closes gaps #2, #3).
- **B. Supply valid AI keys** to unlock full LLM recommendations, exec summary,
  and vision critique (closes gap #1).
- **C. First-class Proposals entity** — editable sales proposal with pricing
  matrix, send/export (currently generated inline on the audit).
- **D. White-label public share link** — client-facing report URL (no login).
- **E. Phase 8** — multi-tenant orgs, billing, Sentry/Prometheus monitoring.

---

*Generated for the `main` branch. Keep this document in sync with code changes.*
