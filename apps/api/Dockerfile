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
COPY packages/rules/package.json ./packages/rules/

# Install with shamefully-hoist for flat node_modules (npm-like layout)
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages

ENV CI=true

# Force the workspace packages the API depends on to emit CommonJS.
# Their tsconfigs extend tsconfig.base.json (module: ESNext / moduleResolution:
# bundler), which is correct for bundler consumers (e.g. Next.js transpilePackages)
# but produces ESM with extensionless relative imports that break when the
# CommonJS API require()s them at runtime under native Node. Overriding to
# CommonJS here only affects the Docker build, not local dev.
RUN for p in types schemas constants prompts audit-core rules; do \
      node -e " \
        const fs=require('fs'); \
        const f='packages/'+process.argv[1]+'/tsconfig.json'; \
        const j=JSON.parse(fs.readFileSync(f)); \
        j.compilerOptions=j.compilerOptions||{}; \
        j.compilerOptions.module='CommonJS'; \
        j.compilerOptions.moduleResolution='node'; \
        fs.writeFileSync(f, JSON.stringify(j,null,2)); \
      " "$p"; \
    done

# Build API and all its workspace dependencies in topological order
RUN pnpm exec turbo build --filter=@abap/api...

# ---- Production stage ----
# Debian slim (not alpine): Playwright's browser binaries + system deps install
# reliably here (Alpine/musl is unsupported by Playwright's install-deps).
FROM node:24-slim AS runner

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# System libraries required by Chromium / chrome-headless-shell
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      libnss3 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libdrm2 \
      libxkbcommon0 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxrandr2 \
      libgbm1 \
      libpango-1.0-0 \
      libcairo2 \
      libasound2 \
      fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/constants/package.json ./packages/constants/
COPY packages/prompts/package.json ./packages/prompts/
COPY packages/audit-core/package.json ./packages/audit-core/
COPY packages/rules/package.json ./packages/rules/

RUN pnpm install --frozen-lockfile --shamefully-hoist --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=builder /app/packages/constants/dist ./packages/constants/dist
COPY --from=builder /app/packages/prompts/dist ./packages/prompts/dist
COPY --from=builder /app/packages/audit-core/dist ./packages/audit-core/dist
COPY --from=builder /app/packages/rules/dist ./packages/rules/dist

# Repoint workspace package entry points at compiled dist output.
# The source package.json files set "main"/"exports" to ./src/index.ts for dev
# tooling, but in the production image only the compiled dist/ exists, so Node
# must resolve to dist instead of missing .ts sources.
RUN for p in types schemas constants prompts audit-core rules; do \
      node -e " \
        const fs=require('fs'); \
        const f='packages/'+process.argv[1]+'/package.json'; \
        const j=JSON.parse(fs.readFileSync(f)); \
        j.main='./dist/index.js'; \
        j.types='./dist/index.d.ts'; \
        j.exports={'.':{'types':'./dist/index.d.ts','default':'./dist/index.js'}}; \
        fs.writeFileSync(f, JSON.stringify(j,null,2)); \
      " "$p"; \
    done

# Install the Chromium browser binary Playwright needs at runtime.
# PLAYWRIGHT_BROWSERS_PATH=0 keeps it inside node_modules so it ships with the image.
# CI=true prevents pnpm's interactive module-purge prompt during the install.
# We invoke the Playwright CLI binary directly (not `pnpm exec`) because pnpm's
# workspace exec resolution can't find the binary in this prod-only context.
ENV PLAYWRIGHT_BROWSERS_PATH=0
ENV CI=true
RUN node node_modules/playwright/cli.js install chromium

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
