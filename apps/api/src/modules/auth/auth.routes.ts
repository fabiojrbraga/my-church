import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma, UserRole } from '@my-church/database'
import { env } from '../../config/env.js'
import { AppError, NotFoundError } from '../../shared/errors.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const refreshSchema = z.object({
  refreshToken: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post('/login', async (req, reply) => {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { email },
      include: { person: { select: { fullName: true, photoUrl: true } } },
    })

    if (!user || !user.isActive) {
      throw new AppError('Credenciais inválidas', 401)
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      throw new AppError('Credenciais inválidas', 401)
    }

    const payload = { sub: user.id, role: user.role, branchId: user.branchId }

    const accessToken = app.jwt.sign(payload, { expiresIn: env.JWT_EXPIRES_IN })
    const refreshToken = app.jwt.sign(payload, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    return reply.send({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        name: user.person?.fullName,
        photoUrl: user.person?.photoUrl,
      },
    })
  })

  // POST /auth/refresh
  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body)

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token inválido ou expirado', 401)
    }

    const payload = app.jwt.verify<{ sub: string; role: UserRole; branchId: string }>(refreshToken)
    const newAccessToken = app.jwt.sign(
      { sub: payload.sub, role: payload.role, branchId: payload.branchId },
      { expiresIn: env.JWT_EXPIRES_IN },
    )

    return reply.send({ accessToken: newAccessToken })
  })

  // POST /auth/logout
  app.post('/logout', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body)
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    return reply.status(204).send()
  })

  // GET /auth/me
  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: {
        person: { select: { fullName: true, photoUrl: true, phone: true } },
        branch: { select: { name: true, type: true } },
      },
    })
    if (!user) throw new NotFoundError('Usuário')
    const { passwordHash: _, ...safeUser } = user
    return reply.send(safeUser)
  })
}
