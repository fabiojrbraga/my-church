# ──────────────────────────────────────────────
# Stage 1 — dependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --ignore-scripts

# ──────────────────────────────────────────────
# Stage 2 — build
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Compila os packages internos
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/shared

# Compila o backend
RUN npm run build --workspace=apps/api

# ──────────────────────────────────────────────
# Stage 3 — runner
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Apenas dependências de produção
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY packages/database/prisma ./prisma
COPY apps/api/entrypoint.sh ./entrypoint.sh

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chmod +x entrypoint.sh && \
    chown -R appuser:nodejs /app

USER appuser

EXPOSE 3333

CMD ["./entrypoint.sh"]
