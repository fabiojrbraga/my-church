import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, BranchType, UserRole } from '@my-church/database'
import { AppError, ConflictError, NotFoundError } from '../../shared/errors.js'

const managementRoles = [UserRole.SUPER_ADMIN, UserRole.BOARD_MEMBER] as const
const relationCountKeys = [
  'children',
  'persons',
  'users',
  'events',
  'ministries',
  'schedules',
  'serviceTypes',
  'accounts',
  'categories',
  'transactions',
  'contracts',
  'boardMembers',
] as const

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

const optionalStringSchema = z.preprocess(emptyToUndefined, z.string().min(1).optional())
const optionalEmailSchema = z.preprocess(emptyToUndefined, z.string().email('E-mail invalido').optional())
const optionalUrlSchema = z.preprocess(emptyToUndefined, z.string().url('URL invalida').optional())
const optionalStateSchema = z
  .preprocess(emptyToUndefined, z.string().max(2, 'Use a UF com 2 caracteres').optional())
  .transform((value) => value?.toUpperCase())

const listQuerySchema = z.object({
  search: optionalStringSchema,
  type: z.nativeEnum(BranchType).optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
})

const branchBodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da filial'),
  type: z.nativeEnum(BranchType),
  parentId: optionalStringSchema,
  cnpj: optionalStringSchema,
  phone: optionalStringSchema,
  email: optionalEmailSchema,
  address: optionalStringSchema,
  city: optionalStringSchema,
  state: optionalStateSchema,
  zipCode: optionalStringSchema,
  logoUrl: optionalUrlSchema,
  pixKey: optionalStringSchema,
  pixKeyType: optionalStringSchema,
  isActive: z.boolean().optional(),
})

const branchStatusSchema = z.object({
  isActive: z.boolean(),
})

const branchSelect = {
  id: true,
  name: true,
  type: true,
  parentId: true,
  cnpj: true,
  phone: true,
  email: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  logoUrl: true,
  pixKey: true,
  pixKeyType: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  parent: {
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
    },
  },
  _count: {
    select: {
      children: true,
      persons: true,
      users: true,
      events: true,
      ministries: true,
      schedules: true,
      serviceTypes: true,
      accounts: true,
      categories: true,
      transactions: true,
      contracts: true,
      boardMembers: true,
    },
  },
} as const

const branchOptionSelect = {
  id: true,
  name: true,
  type: true,
  isActive: true,
  parentId: true,
} as const

async function ensureHeadquartersUniqueness(type: BranchType, branchId?: string) {
  if (type !== BranchType.HEADQUARTERS) return

  const existingHeadquarters = await prisma.branch.findFirst({
    where: {
      type: BranchType.HEADQUARTERS,
      ...(branchId ? { NOT: { id: branchId } } : {}),
    },
    select: { id: true },
  })

  if (existingHeadquarters) {
    throw new ConflictError('Ja existe uma matriz cadastrada')
  }
}

async function ensureUniqueCnpj(cnpj?: string, branchId?: string) {
  if (!cnpj) return

  const existingBranch = await prisma.branch.findFirst({
    where: {
      cnpj,
      ...(branchId ? { NOT: { id: branchId } } : {}),
    },
    select: { id: true },
  })

  if (existingBranch) {
    throw new ConflictError('Ja existe uma filial com este CNPJ')
  }
}

async function ensureValidParent(parentId: string | undefined, branchId: string | undefined, type: BranchType) {
  if (type === BranchType.HEADQUARTERS && parentId) {
    throw new AppError('A matriz nao pode possuir filial pai', 400, 'INVALID_PARENT')
  }

  if (!parentId) return null

  if (branchId && parentId === branchId) {
    throw new AppError('Uma filial nao pode ser pai dela mesma', 400, 'INVALID_PARENT')
  }

  const parent = await prisma.branch.findUnique({
    where: { id: parentId },
    select: { id: true, name: true, type: true, parentId: true, isActive: true },
  })

  if (!parent) {
    throw new NotFoundError('Filial pai')
  }

  if (!parent.isActive) {
    throw new AppError('Selecione uma filial pai ativa', 400, 'INVALID_PARENT')
  }

  if (branchId) {
    const visited = new Set<string>()
    let currentId: string | null = parent.id

    while (currentId) {
      if (currentId === branchId) {
        throw new AppError('Nao e permitido criar um ciclo na hierarquia', 400, 'INVALID_PARENT')
      }

      if (visited.has(currentId)) break
      visited.add(currentId)

      const current: { parentId: string | null } | null = await prisma.branch.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })

      currentId = current?.parentId ?? null
    }
  }

  return parent
}

async function getBranchOrThrow(branchId: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: branchSelect,
  })

  if (!branch) {
    throw new NotFoundError('Filial')
  }

  return branch
}

function serializeBranch(
  branch: Awaited<ReturnType<typeof getBranchOrThrow>>,
  currentUserBranchId: string,
) {
  const totalLinks = relationCountKeys.reduce((accumulator, key) => accumulator + branch._count[key], 0)

  return {
    id: branch.id,
    name: branch.name,
    type: branch.type,
    parentId: branch.parentId,
    cnpj: branch.cnpj,
    phone: branch.phone,
    email: branch.email,
    address: branch.address,
    city: branch.city,
    state: branch.state,
    zipCode: branch.zipCode,
    logoUrl: branch.logoUrl,
    pixKey: branch.pixKey,
    pixKeyType: branch.pixKeyType,
    isActive: branch.isActive,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
    parent: branch.parent,
    counts: {
      ...branch._count,
      total: totalLinks,
    },
    isCurrentUserBranch: branch.id === currentUserBranchId,
    canDelete: totalLinks === 0 && branch.id !== currentUserBranchId,
  }
}

export async function branchRoutes(app: FastifyInstance) {
  const managementGuard = app.authorize(...managementRoles)

  app.get(
    '/',
    { preHandler: [managementGuard] },
    async (request) => {
      const query = listQuerySchema.parse(request.query)

      const branches = await prisma.branch.findMany({
        where: {
          AND: [
            query.search
              ? {
                  OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { cnpj: { contains: query.search } },
                    { city: { contains: query.search, mode: 'insensitive' } },
                    { email: { contains: query.search, mode: 'insensitive' } },
                  ],
                }
              : {},
            query.type ? { type: query.type } : {},
            query.status === 'active'
              ? { isActive: true }
              : query.status === 'inactive'
                ? { isActive: false }
                : {},
          ],
        },
        select: branchSelect,
        orderBy: [{ name: 'asc' }],
      })

      return {
        items: branches.map((branch) => serializeBranch(branch, request.user.branchId)),
      }
    },
  )

  app.get(
    '/options',
    { preHandler: [managementGuard] },
    async () => {
      const branches = await prisma.branch.findMany({
        select: branchOptionSelect,
        orderBy: [{ name: 'asc' }],
      })

      return { items: branches }
    },
  )

  app.get(
    '/:id',
    { preHandler: [managementGuard] },
    async (request) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const branch = await getBranchOrThrow(params.id)

      return { item: serializeBranch(branch, request.user.branchId) }
    },
  )

  app.post(
    '/',
    { preHandler: [managementGuard] },
    async (request, reply) => {
      const payload = branchBodySchema.parse(request.body)

      await ensureHeadquartersUniqueness(payload.type)
      await ensureUniqueCnpj(payload.cnpj as string | undefined)
      await ensureValidParent(payload.parentId as string | undefined, undefined, payload.type)

      const branch = await prisma.branch.create({
        data: {
          name: payload.name,
          type: payload.type,
          parentId: payload.parentId,
          cnpj: payload.cnpj,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          zipCode: payload.zipCode,
          logoUrl: payload.logoUrl,
          pixKey: payload.pixKey,
          pixKeyType: payload.pixKeyType,
          isActive: payload.isActive ?? true,
        },
        select: branchSelect,
      })

      return reply.status(201).send({
        item: serializeBranch(branch, request.user.branchId),
      })
    },
  )

  app.put(
    '/:id',
    { preHandler: [managementGuard] },
    async (request) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const payload = branchBodySchema.parse(request.body)

      await getBranchOrThrow(params.id)
      await ensureHeadquartersUniqueness(payload.type, params.id)
      await ensureUniqueCnpj(payload.cnpj as string | undefined, params.id)
      await ensureValidParent(payload.parentId as string | undefined, params.id, payload.type)

      const branch = await prisma.branch.update({
        where: { id: params.id },
        data: {
          name: payload.name,
          type: payload.type,
          parentId: payload.parentId,
          cnpj: payload.cnpj,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          city: payload.city,
          state: payload.state,
          zipCode: payload.zipCode,
          logoUrl: payload.logoUrl,
          pixKey: payload.pixKey,
          pixKeyType: payload.pixKeyType,
          ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
        },
        select: branchSelect,
      })

      return { item: serializeBranch(branch, request.user.branchId) }
    },
  )

  app.patch(
    '/:id/status',
    { preHandler: [managementGuard] },
    async (request) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const payload = branchStatusSchema.parse(request.body)
      const existingBranch = await getBranchOrThrow(params.id)

      if (existingBranch.id === request.user.branchId && !payload.isActive) {
        throw new ConflictError('Voce nao pode desativar a filial vinculada a sua sessao')
      }

      const branch = await prisma.branch.update({
        where: { id: params.id },
        data: { isActive: payload.isActive },
        select: branchSelect,
      })

      return { item: serializeBranch(branch, request.user.branchId) }
    },
  )

  app.delete(
    '/:id',
    { preHandler: [managementGuard] },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const branch = await getBranchOrThrow(params.id)
      const serializedBranch = serializeBranch(branch, request.user.branchId)

      if (serializedBranch.isCurrentUserBranch) {
        throw new ConflictError('Voce nao pode excluir a filial vinculada a sua sessao')
      }

      if (!serializedBranch.canDelete) {
        throw new ConflictError('A filial possui vinculos e nao pode ser excluida')
      }

      await prisma.branch.delete({ where: { id: params.id } })

      return reply.status(204).send()
    },
  )
}
