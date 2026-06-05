# ──────────────────────────────────────────────
# Stage 1 — dependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --ignore-scripts

# ──────────────────────────────────────────────
# Stage 2 — build
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_PUBLIC_SITE_URL=http://localhost:5174
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL

# Compila o package interno
RUN npm run build --workspace=packages/shared

RUN npm run build --workspace=apps/web

# ──────────────────────────────────────────────
# Stage 3 — nginx
# ──────────────────────────────────────────────
FROM nginx:alpine AS runner

ENV API_UPSTREAM=http://general_my-church-api:3333

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx/spa.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
