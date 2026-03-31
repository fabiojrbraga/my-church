import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { env } from '../config/env.js'
import { UserRole } from '@my-church/database'

export interface JwtPayload {
  sub: string        // user id
  role: UserRole
  branchId: string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorize: (...roles: UserRole[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyJwt, { secret: env.JWT_SECRET })

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ message: 'Não autorizado' })
    }
  })

  app.decorate(
    'authorize',
    (...roles: UserRole[]) =>
      async (req: FastifyRequest, reply: FastifyReply) => {
        await req.jwtVerify()
        if (!roles.includes(req.user.role)) {
          reply.status(403).send({ message: 'Acesso negado' })
        }
      },
  )
})
