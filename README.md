# MyChurch — ERP para Gestão de Igrejas

Sistema ERP multifilial (Matriz + Filiais + Congregações) para gestão de igrejas.

## Módulos
- Membros, Famílias, Kids
- Diretoria e Secretaria
- Filiais e Congregações
- Eventos com inscrições e pagamentos PIX/gateway
- Ministérios
- Construtor de Escalas
- Tesouraria completa

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20 + Fastify + Prisma + PostgreSQL |
| Frontend | React 19 + Vite + Tailwind CSS + shadcn/ui |
| Cache | Redis |
| Jobs | BullMQ |
| Monorepo | Turborepo |

---

## Desenvolvimento local

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose

### Setup

```bash
# 1. Clone e instale dependências
git clone https://github.com/SEU_USER/my-church.git
cd my-church
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores

# 3. Suba banco e Redis
docker compose up postgres redis -d

# 4. Execute migrations e seed
npm run db:migrate
npm run db:seed

# 5. Inicie em modo dev (API + Web simultâneos)
npm run dev
```

Acesse:
- **Web:** http://localhost:5173
- **API:** http://localhost:3333
- **Docs (Swagger):** http://localhost:3333/docs

---

## Deploy no Easypanel (via GitHub)

O Easypanel detecta o `Dockerfile` automaticamente a partir do repositório.

### Serviços a criar no Easypanel

#### 1. PostgreSQL
- Tipo: **App → Postgres**
- Anote a `DATABASE_URL` gerada

#### 2. Redis
- Tipo: **App → Redis**
- Anote a `REDIS_URL` gerada

#### 3. API (`apps/api`)
- Tipo: **App → GitHub**
- Repositório: `seu-usuario/my-church`
- Dockerfile Path: `apps/api/Dockerfile`
- Build Context: `.` (raiz do repositório)
- Porta: `3333`
- Variáveis de ambiente (aba **Environment**):
  ```
  NODE_ENV=production
  DATABASE_URL=<da etapa 1>
  REDIS_URL=<da etapa 2>
  JWT_SECRET=<gere com: openssl rand -base64 32>
  JWT_EXPIRES_IN=15m
  REFRESH_TOKEN_EXPIRES_IN=7d
  CORS_ORIGIN=https://app.seudominio.com.br
  PORT=3333
  HOST=0.0.0.0
  ```
- Domínio: `api.seudominio.com.br`

#### 4. Web (`apps/web`)
- Tipo: **App → GitHub**
- Repositório: `seu-usuario/my-church`
- Dockerfile Path: `apps/web/Dockerfile`
- Build Context: `.`
- Porta: `80`
- Domínio: `app.seudominio.com.br`

### Migrations em produção

Após o deploy da API, execute pelo terminal do Easypanel (aba **Console** do serviço api):
```bash
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## Estrutura do Monorepo

```
my-church/
├── apps/
│   ├── api/          # Backend Fastify (Dockerfile próprio)
│   └── web/          # Frontend React (Dockerfile próprio)
├── packages/
│   ├── database/     # Prisma schema + client
│   └── shared/       # Types e labels pt-BR compartilhados
├── nginx/            # Configuração Nginx (usada pelo web Dockerfile)
├── docker-compose.yml
└── .env.example
```

---

## Papéis e Permissões

| Papel | Acesso |
|---|---|
| Super Administrador | Total em todas as filiais |
| Diretoria | Acesso máximo por filial |
| Administrador da Filial | Administrativo completo |
| Secretaria | Cadastros + finanças básicas |
| Tesoureiro | Financeiro completo |
| Líder de Ministério | Ministério e escalas |
| Membro | Próprios dados |
