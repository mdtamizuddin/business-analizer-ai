# ---- Build stage ----
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

# Copy workspace root config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/constants/package.json ./packages/constants/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/prompts/package.json ./packages/prompts/
COPY packages/audit-core/package.json ./packages/audit-core/

# Install with shamefully-hoist for flat node_modules (npm-like layout)
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages

# Build API and all its workspace dependencies in topological order
RUN pnpm exec turbo build --filter=@abap/api...

# ---- Production stage ----
FROM node:24-alpine AS runner

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/constants/package.json ./packages/constants/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/prompts/package.json ./packages/prompts/
COPY packages/audit-core/package.json ./packages/audit-core/

RUN pnpm install --frozen-lockfile --shamefully-hoist --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=builder /app/packages/constants/dist ./packages/constants/dist
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/prompts/dist ./packages/prompts/dist
COPY --from=builder /app/packages/audit-core/dist ./packages/audit-core/dist
COPY --from=builder /app/packages/ui/dist ./packages/ui/dist

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
