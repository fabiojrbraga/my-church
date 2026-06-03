import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, UserRole } from '@my-church/database'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js'

const managementRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.BOARD_MEMBER,
  UserRole.BRANCH_ADMIN,
  UserRole.SECRETARY,
  UserRole.TREASURER,
] as const
const allBranchRoles = [UserRole.SUPER_ADMIN, UserRole.BOARD_MEMBER] as const
const datePattern = /^\d{4}-\d{2}-\d{2}$/

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

const parseEndOfDay = (value: string) => new Date(`${value}T23:59:59.999Z`)
const optionalStringSchema = z.preprocess(emptyToUndefined, z.string().min(1).optional())
const optionalUrlSchema = z.preprocess(emptyToUndefined, z.string().url('URL invalida').optional())
const optionalDateSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(datePattern, 'Informe uma data valida')
    .transform((value) => parseEndOfDay(value))
    .optional(),
)
const identifierSchema = z
  .string()
  .trim()
  .min(3, 'Use ao menos 3 caracteres')
  .max(40, 'Use no maximo 40 caracteres')
  .transform((value) => value.toLowerCase())
  .refine((value) => /^[a-z0-9]+$/.test(value), {
    message: 'Use apenas letras minusculas e numeros, sem espacos ou caracteres especiais',
  })

const listQuerySchema = z.object({
  search: optionalStringSchema,
  status: z.enum(['all', 'active', 'inactive', 'expired', 'public']).default('all'),
  branchId: optionalStringSchema,
})

const pixAddressBodySchema = z.object({
  branchId: optionalStringSchema,
  identifier: identifierSchema,
  purpose: z
    .string()
    .trim()
    .min(2, 'Informe a finalidade')
    .max(120, 'Use no maximo 120 caracteres'),
  copyPasteCode: z.string().trim().min(10, 'Informe o codigo copia e cola'),
  expiresAt: optionalDateSchema,
  logoUrl: optionalUrlSchema,
  isActive: z.boolean().optional(),
})

const pixAddressStatusSchema = z.object({
  isActive: z.boolean(),
})

const pixAddressSelect = {
  id: true,
  branchId: true,
  identifier: true,
  purpose: true,
  copyPasteCode: true,
  expiresAt: true,
  logoUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  branch: {
    select: {
      id: true,
      name: true,
      isActive: true,
      logoUrl: true,
    },
  },
} as const

type PixAddressRecord = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.pixAddress.findUnique<{
        where: { id: string }
        select: typeof pixAddressSelect
      }>
    >
  >
>

function canManageAllBranches(role: UserRole) {
  return allBranchRoles.includes(role as (typeof allBranchRoles)[number])
}

function serializePixAddress(item: PixAddressRecord) {
  const now = Date.now()
  const isExpired = item.expiresAt ? item.expiresAt.getTime() < now : false
  const effectiveLogoUrl = item.logoUrl ?? item.branch.logoUrl

  return {
    id: item.id,
    branchId: item.branchId,
    identifier: item.identifier,
    purpose: item.purpose,
    copyPasteCode: item.copyPasteCode,
    expiresAt: item.expiresAt,
    logoUrl: item.logoUrl,
    effectiveLogoUrl,
    isActive: item.isActive,
    isExpired,
    isPubliclyVisible: item.isActive && item.branch.isActive && !isExpired,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    branch: {
      id: item.branch.id,
      name: item.branch.name,
      isActive: item.branch.isActive,
    },
  }
}

async function getPixAddressOrThrow(id: string) {
  const pixAddress = await prisma.pixAddress.findUnique({
    where: { id },
    select: pixAddressSelect,
  })

  if (!pixAddress) {
    throw new NotFoundError('Endereco Pix')
  }

  return pixAddress
}

async function ensureUniqueIdentifier(identifier: string, pixAddressId?: string) {
  const existing = await prisma.pixAddress.findFirst({
    where: {
      identifier,
      ...(pixAddressId ? { NOT: { id: pixAddressId } } : {}),
    },
    select: { id: true },
  })

  if (existing) {
    throw new ConflictError('Ja existe um endereco Pix com este identificador')
  }
}

async function ensureBranchIsAvailable(branchId: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true, isActive: true },
  })

  if (!branch) {
    throw new NotFoundError('Filial')
  }

  if (!branch.isActive) {
    throw new ConflictError('Selecione uma filial ativa')
  }
}

function ensureCanAccessBranch(role: UserRole, userBranchId: string, targetBranchId: string) {
  if (canManageAllBranches(role) || userBranchId === targetBranchId) return

  throw new ForbiddenError('Voce nao tem acesso a esta filial')
}

export async function pixAddressRoutes(app: FastifyInstance) {
  const managementGuard = app.authorize(...managementRoles)

  app.get('/public', async () => {
    const now = new Date()
    const items = await prisma.pixAddress.findMany({
      where: {
        isActive: true,
        branch: { isActive: true },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      select: pixAddressSelect,
      orderBy: [{ purpose: 'asc' }, { identifier: 'asc' }],
    })

    return { items: items.map(serializePixAddress) }
  })

  app.get('/public/:identifier', async (request) => {
    const params = z.object({ identifier: identifierSchema }).parse(request.params)
    const now = new Date()
    const item = await prisma.pixAddress.findFirst({
      where: {
        identifier: params.identifier,
        isActive: true,
        branch: { isActive: true },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      select: pixAddressSelect,
    })

    if (!item) {
      throw new NotFoundError('Endereco Pix')
    }

    return { item: serializePixAddress(item) }
  })

  app.get('/', { preHandler: [managementGuard] }, async (request) => {
    const query = listQuerySchema.parse(request.query)
    const now = new Date()
    const branchId = canManageAllBranches(request.user.role)
      ? query.branchId
      : request.user.branchId

    const items = await prisma.pixAddress.findMany({
      where: {
        AND: [
          branchId ? { branchId } : {},
          query.search
            ? {
                OR: [
                  { identifier: { contains: query.search, mode: 'insensitive' } },
                  { purpose: { contains: query.search, mode: 'insensitive' } },
                  { branch: { name: { contains: query.search, mode: 'insensitive' } } },
                ],
              }
            : {},
          query.status === 'active'
            ? { isActive: true }
            : query.status === 'inactive'
              ? { isActive: false }
              : query.status === 'expired'
                ? { expiresAt: { lt: now } }
                : query.status === 'public'
                  ? {
                      isActive: true,
                      branch: { isActive: true },
                      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
                    }
                  : {},
        ],
      },
      select: pixAddressSelect,
      orderBy: [{ updatedAt: 'desc' }],
    })

    return { items: items.map(serializePixAddress) }
  })

  app.get('/:id', { preHandler: [managementGuard] }, async (request) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params)
    const item = await getPixAddressOrThrow(params.id)

    ensureCanAccessBranch(request.user.role, request.user.branchId, item.branchId)

    return { item: serializePixAddress(item) }
  })

  app.post('/', { preHandler: [managementGuard] }, async (request, reply) => {
    const payload = pixAddressBodySchema.parse(request.body)
    const branchId =
      canManageAllBranches(request.user.role) && payload.branchId
        ? payload.branchId
        : request.user.branchId

    ensureCanAccessBranch(request.user.role, request.user.branchId, branchId)
    await ensureBranchIsAvailable(branchId)
    await ensureUniqueIdentifier(payload.identifier)

    const item = await prisma.pixAddress.create({
      data: {
        branchId,
        identifier: payload.identifier,
        purpose: payload.purpose,
        copyPasteCode: payload.copyPasteCode,
        expiresAt: payload.expiresAt,
        logoUrl: payload.logoUrl,
        isActive: payload.isActive ?? true,
      },
      select: pixAddressSelect,
    })

    return reply.status(201).send({ item: serializePixAddress(item) })
  })

  app.put('/:id', { preHandler: [managementGuard] }, async (request) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params)
    const payload = pixAddressBodySchema.parse(request.body)
    const existing = await getPixAddressOrThrow(params.id)
    const branchId =
      canManageAllBranches(request.user.role) && payload.branchId
        ? payload.branchId
        : existing.branchId

    ensureCanAccessBranch(request.user.role, request.user.branchId, existing.branchId)
    ensureCanAccessBranch(request.user.role, request.user.branchId, branchId)
    await ensureBranchIsAvailable(branchId)
    await ensureUniqueIdentifier(payload.identifier, params.id)

    const item = await prisma.pixAddress.update({
      where: { id: params.id },
      data: {
        branchId,
        identifier: payload.identifier,
        purpose: payload.purpose,
        copyPasteCode: payload.copyPasteCode,
        expiresAt: payload.expiresAt,
        logoUrl: payload.logoUrl,
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
      select: pixAddressSelect,
    })

    return { item: serializePixAddress(item) }
  })

  app.patch('/:id/status', { preHandler: [managementGuard] }, async (request) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params)
    const payload = pixAddressStatusSchema.parse(request.body)
    const existing = await getPixAddressOrThrow(params.id)

    ensureCanAccessBranch(request.user.role, request.user.branchId, existing.branchId)

    const item = await prisma.pixAddress.update({
      where: { id: params.id },
      data: { isActive: payload.isActive },
      select: pixAddressSelect,
    })

    return { item: serializePixAddress(item) }
  })

  app.delete('/:id', { preHandler: [managementGuard] }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params)
    const existing = await getPixAddressOrThrow(params.id)

    ensureCanAccessBranch(request.user.role, request.user.branchId, existing.branchId)

    await prisma.pixAddress.delete({ where: { id: params.id } })

    return reply.status(204).send()
  })
}
