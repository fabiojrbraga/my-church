import Fastify, { FastifyError } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from './config/env.js'
import authPlugin from './plugins/auth.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { branchRoutes } from './modules/branches/branches.routes.js'
import { memberRoutes } from './modules/members/members.routes.js'

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
})

async function bootstrap() {
  // Segurança
  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cors, { origin: env.CORS_ORIGIN.split(','), credentials: true })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  // Documentação
  await app.register(swagger, {
    openapi: {
      info: { title: 'MyChurch API', version: '1.0.0', description: 'ERP para gestão de igrejas' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  // Auth plugin (JWT + decorators)
  await app.register(authPlugin)

  // Rotas
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(branchRoutes, { prefix: '/api/v1/branches' })
  await app.register(memberRoutes, { prefix: '/api/v1/members' })

  // Healthcheck
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Error handler global
  app.setErrorHandler((error: FastifyError, _req, reply) => {
    if (error.name === 'AppError' || (error as any).statusCode) {
      return reply
        .status((error as any).statusCode ?? 400)
        .send({ message: error.message, code: (error as any).code })
    }
    if (error.name === 'ZodError') {
      return reply.status(422).send({ message: 'Dados inválidos', errors: (error as any).errors })
    }
    app.log.error(error)
    return reply.status(500).send({ message: 'Erro interno do servidor' })
  })

  await app.listen({ port: env.PORT, host: env.HOST })
  app.log.info(`🚀 API rodando em http://${env.HOST}:${env.PORT}`)
  app.log.info(`📚 Docs disponíveis em http://${env.HOST}:${env.PORT}/docs`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
