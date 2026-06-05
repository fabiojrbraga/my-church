FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* turbo.json ./
COPY apps/public-site/package.json ./apps/public-site/

RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build --workspace=apps/public-site

FROM nginx:alpine AS runner

ENV API_UPSTREAM=http://api:3333

COPY --from=builder /app/apps/public-site/dist /usr/share/nginx/html
COPY nginx/spa.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
