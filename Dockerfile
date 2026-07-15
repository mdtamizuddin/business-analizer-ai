FROM node:20-alpine AS base
ENV NODE_ENV=production
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/package.json
COPY packages/rules/package.json packages/rules/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci --include-workspace-root --workspace=apps/api

FROM deps AS build
COPY . .
RUN npx nx run-many --target=build --projects=@abap/types,@abap/rules,apps/api --parallel=2

FROM base AS runtime
COPY --from=build /app/dist/apps/api ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main"]
