import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  prisma,
  KidsAgeGroup,
  MaritalStatus,
  MemberStatus,
  PersonRelationshipType,
  PersonCategory,
  UserRole,
} from '@my-church/database'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js'

const managementRoles = [
  UserRole.SUPER_ADMIN,
  UserRole.BOARD_MEMBER,
  UserRole.BRANCH_ADMIN,
  UserRole.SECRETARY,
] as const
const memberCategoryValues = [PersonCategory.MEMBER, PersonCategory.KIDS_MEMBER] as const
const relationCountKeys = [
  'kids',
  'familyLinks',
  'boardRoles',
  'ministryLinks',
  'scheduleSlots',
  'eventRegistrations',
  'tithes',
  'namedOfferings',
  'availability',
  'outgoingRelationships',
  'incomingRelationships',
] as const
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const relationshipDirectionValues = [
  'PARENT_OF',
  'CHILD_OF',
  'SPOUSE_OF',
  'SIBLING_OF',
  'GRANDPARENT_OF',
  'GRANDCHILD_OF',
  'GUARDIAN_OF',
  'DEPENDENT_OF',
  'OTHER',
] as const

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

const parseDateValue = (value: string) => new Date(`${value}T12:00:00.000Z`)
const optionalStringSchema = z.preprocess(emptyToUndefined, z.string().min(1).optional())
const optionalEmailSchema = z.preprocess(emptyToUndefined, z.string().email('E-mail invalido').optional())
const optionalStateSchema = z
  .preprocess(emptyToUndefined, z.string().max(2, 'Use a UF com 2 caracteres').optional())
  .transform((value) => value?.toUpperCase())
const optionalDateSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(datePattern, 'Informe uma data valida')
    .transform((value) => parseDateValue(value))
    .optional(),
)
const requiredDateSchema = z
  .string()
  .regex(datePattern, 'Informe uma data valida')
  .transform((value) => parseDateValue(value))

const listQuerySchema = z.object({
  search: optionalStringSchema,
  status: z.union([z.literal('all'), z.nativeEnum(MemberStatus)]).default('all'),
  category: z.union([z.literal('all'), z.enum(memberCategoryValues)]).default('all'),
  branchId: optionalStringSchema,
})

const memberBodySchema = z
  .object({
    branchId: z.string().trim().min(1, 'Selecione a filial'),
    fullName: z.string().trim().min(2, 'Informe o nome do membro'),
    preferredName: optionalStringSchema,
    cpf: optionalStringSchema,
    rg: optionalStringSchema,
    birthDate: optionalDateSchema,
    gender: z.preprocess(emptyToUndefined, z.enum(['M', 'F']).optional()),
    maritalStatus: z.preprocess(emptyToUndefined, z.nativeEnum(MaritalStatus).optional()),
    nationality: optionalStringSchema,
    email: optionalEmailSchema,
    phone: optionalStringSchema,
    whatsapp: optionalStringSchema,
    address: optionalStringSchema,
    addressNumber: optionalStringSchema,
    addressComplement: optionalStringSchema,
    neighborhood: optionalStringSchema,
    city: optionalStringSchema,
    state: optionalStateSchema,
    zipCode: optionalStringSchema,
    category: z.enum(memberCategoryValues),
    kidsAgeGroup: z.preprocess(emptyToUndefined, z.nativeEnum(KidsAgeGroup).optional()),
    notes: optionalStringSchema,
    membershipDate: requiredDateSchema,
    baptismDate: optionalDateSchema,
    baptismPlace: optionalStringSchema,
    previousChurch: optionalStringSchema,
    transferDate: optionalDateSchema,
    status: z.nativeEnum(MemberStatus).default(MemberStatus.ACTIVE),
  })
  .superRefine((payload, ctx) => {
    if (payload.category === PersonCategory.KIDS_MEMBER && !payload.kidsAgeGroup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['kidsAgeGroup'],
        message: 'Informe a faixa etaria do membro kids',
      })
    }
  })

const memberStatusSchema = z.object({
  status: z.nativeEnum(MemberStatus),
})

const relationshipBodySchema = z.object({
  relatedMemberId: z.string().trim().min(1, 'Selecione o membro relacionado'),
  type: z.enum(relationshipDirectionValues),
  notes: optionalStringSchema,
})

const branchOptionSelect = {
  id: true,
  name: true,
  type: true,
  isActive: true,
} as const

const memberSelect = {
  id: true,
  personId: true,
  membershipDate: true,
  baptismDate: true,
  baptismPlace: true,
  previousChurch: true,
  transferDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  person: {
    select: {
      id: true,
      branchId: true,
      fullName: true,
      preferredName: true,
      cpf: true,
      rg: true,
      birthDate: true,
      gender: true,
      maritalStatus: true,
      nationality: true,
      email: true,
      phone: true,
      whatsapp: true,
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      category: true,
      photoUrl: true,
      kidsAgeGroup: true,
      parentId: true,
      isActive: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      branch: {
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
        },
      },
      parent: {
        select: {
          id: true,
          fullName: true,
        },
      },
      user: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          kids: true,
          familyLinks: true,
          boardRoles: true,
          ministryLinks: true,
          scheduleSlots: true,
          eventRegistrations: true,
          tithes: true,
          namedOfferings: true,
          availability: true,
          outgoingRelationships: true,
          incomingRelationships: true,
        },
      },
    },
  },
} as const

const relationshipSelect = {
  id: true,
  sourcePersonId: true,
  targetPersonId: true,
  type: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  sourcePerson: {
    select: {
      id: true,
      fullName: true,
      preferredName: true,
      gender: true,
      branchId: true,
      member: {
        select: {
          id: true,
          status: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  targetPerson: {
    select: {
      id: true,
      fullName: true,
      preferredName: true,
      gender: true,
      branchId: true,
      member: {
        select: {
          id: true,
          status: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const

type RelationshipInputType = (typeof relationshipDirectionValues)[number]

function sortPair(sourcePersonId: string, targetPersonId: string) {
  return sourcePersonId.localeCompare(targetPersonId) <= 0
    ? [sourcePersonId, targetPersonId] as const
    : [targetPersonId, sourcePersonId] as const
}

function normalizeRelationshipInput(currentPersonId: string, relatedPersonId: string, type: RelationshipInputType) {
  switch (type) {
    case 'PARENT_OF':
      return { sourcePersonId: currentPersonId, targetPersonId: relatedPersonId, type: PersonRelationshipType.PARENT_OF }
    case 'CHILD_OF':
      return { sourcePersonId: relatedPersonId, targetPersonId: currentPersonId, type: PersonRelationshipType.PARENT_OF }
    case 'SPOUSE_OF': {
      const [sourcePersonId, targetPersonId] = sortPair(currentPersonId, relatedPersonId)
      return { sourcePersonId, targetPersonId, type: PersonRelationshipType.SPOUSE_OF }
    }
    case 'SIBLING_OF': {
      const [sourcePersonId, targetPersonId] = sortPair(currentPersonId, relatedPersonId)
      return { sourcePersonId, targetPersonId, type: PersonRelationshipType.SIBLING_OF }
    }
    case 'GRANDPARENT_OF':
      return {
        sourcePersonId: currentPersonId,
        targetPersonId: relatedPersonId,
        type: PersonRelationshipType.GRANDPARENT_OF,
      }
    case 'GRANDCHILD_OF':
      return {
        sourcePersonId: relatedPersonId,
        targetPersonId: currentPersonId,
        type: PersonRelationshipType.GRANDPARENT_OF,
      }
    case 'GUARDIAN_OF':
      return {
        sourcePersonId: currentPersonId,
        targetPersonId: relatedPersonId,
        type: PersonRelationshipType.GUARDIAN_OF,
      }
    case 'DEPENDENT_OF':
      return {
        sourcePersonId: relatedPersonId,
        targetPersonId: currentPersonId,
        type: PersonRelationshipType.GUARDIAN_OF,
      }
    case 'OTHER': {
      const [sourcePersonId, targetPersonId] = sortPair(currentPersonId, relatedPersonId)
      return { sourcePersonId, targetPersonId, type: PersonRelationshipType.OTHER }
    }
  }
}

function getPersonRoleLabel(base: 'PARENT' | 'CHILD' | 'GRANDPARENT' | 'GRANDCHILD' | 'SIBLING', gender?: string | null) {
  switch (base) {
    case 'PARENT':
      return gender === 'F' ? 'Mae de' : gender === 'M' ? 'Pai de' : 'Pai/Mae de'
    case 'CHILD':
      return gender === 'F' ? 'Filha de' : gender === 'M' ? 'Filho de' : 'Filho(a) de'
    case 'GRANDPARENT':
      return gender === 'F' ? 'Avo de' : gender === 'M' ? 'Avo de' : 'Avo de'
    case 'GRANDCHILD':
      return gender === 'F' ? 'Neta de' : gender === 'M' ? 'Neto de' : 'Neto(a) de'
    case 'SIBLING':
      return gender === 'F' ? 'Irma de' : gender === 'M' ? 'Irmao de' : 'Irmao(a) de'
  }
}

function getRelationshipLabelFromPerspective(
  relationship: {
    type: PersonRelationshipType
    sourcePersonId: string
    targetPersonId: string
    sourcePerson: { gender: string | null }
    targetPerson: { gender: string | null }
  },
  currentPersonId: string,
) {
  const currentIsSource = relationship.sourcePersonId === currentPersonId
  const currentGender = currentIsSource ? relationship.sourcePerson.gender : relationship.targetPerson.gender

  switch (relationship.type) {
    case PersonRelationshipType.PARENT_OF:
      return currentIsSource
        ? getPersonRoleLabel('PARENT', currentGender)
        : getPersonRoleLabel('CHILD', currentGender)
    case PersonRelationshipType.SPOUSE_OF:
      return 'Conjuge de'
    case PersonRelationshipType.SIBLING_OF:
      return getPersonRoleLabel('SIBLING', currentGender)
    case PersonRelationshipType.GRANDPARENT_OF:
      return currentIsSource
        ? getPersonRoleLabel('GRANDPARENT', currentGender)
        : getPersonRoleLabel('GRANDCHILD', currentGender)
    case PersonRelationshipType.GUARDIAN_OF:
      return currentIsSource ? 'Responsavel por' : 'Dependente de'
    case PersonRelationshipType.OTHER:
      return 'Vinculo familiar com'
  }
}

function serializeRelationship(
  relationship: {
    id: string
    sourcePersonId: string
    targetPersonId: string
    type: PersonRelationshipType
    notes: string | null
    createdAt: Date
    updatedAt: Date
    sourcePerson: {
      id: string
      fullName: string
      preferredName: string | null
      gender: string | null
      branchId: string
      member: { id: string; status: MemberStatus } | null
      branch: { id: string; name: string }
    }
    targetPerson: {
      id: string
      fullName: string
      preferredName: string | null
      gender: string | null
      branchId: string
      member: { id: string; status: MemberStatus } | null
      branch: { id: string; name: string }
    }
  },
  currentPersonId: string,
) {
  const currentIsSource = relationship.sourcePersonId === currentPersonId
  const relative = currentIsSource ? relationship.targetPerson : relationship.sourcePerson

  return {
    id: relationship.id,
    type: relationship.type,
    label: getRelationshipLabelFromPerspective(relationship, currentPersonId),
    notes: relationship.notes,
    createdAt: relationship.createdAt,
    updatedAt: relationship.updatedAt,
    member: relative.member
      ? {
          id: relative.member.id,
          personId: relative.id,
          fullName: relative.fullName,
          preferredName: relative.preferredName,
          branchId: relative.branchId,
          branchName: relative.branch.name,
          gender: relative.gender,
          status: relative.member.status,
        }
      : null,
  }
}

function canManageAllBranches(role: UserRole) {
  return role === UserRole.SUPER_ADMIN || role === UserRole.BOARD_MEMBER
}

async function ensureUniqueCpf(cpf?: string, personId?: string) {
  if (!cpf) return

  const existingPerson = await prisma.person.findFirst({
    where: {
      cpf,
      ...(personId ? { NOT: { id: personId } } : {}),
    },
    select: { id: true },
  })

  if (existingPerson) {
    throw new ConflictError('Ja existe uma pessoa cadastrada com este CPF')
  }
}

async function ensureBranchExists(branchId: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: branchOptionSelect,
  })

  if (!branch) {
    throw new NotFoundError('Filial')
  }

  return branch
}

async function resolveBranchId(role: UserRole, currentBranchId: string, requestedBranchId: string) {
  if (!canManageAllBranches(role) && requestedBranchId !== currentBranchId) {
    throw new ForbiddenError('Voce nao pode cadastrar membros em outra filial')
  }

  const branchId = canManageAllBranches(role) ? requestedBranchId : currentBranchId
  await ensureBranchExists(branchId)
  return branchId
}

function ensureMemberAccess(branchId: string, role: UserRole, currentBranchId: string) {
  if (!canManageAllBranches(role) && branchId !== currentBranchId) {
    throw new ForbiddenError('Voce nao pode acessar membros de outra filial')
  }
}

async function getMemberOrThrow(memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: memberSelect,
  })

  if (!member) {
    throw new NotFoundError('Membro')
  }

  return member
}

function getAccessibleMemberWhere(role: UserRole, currentBranchId: string) {
  return canManageAllBranches(role) ? {} : { person: { is: { branchId: currentBranchId } } }
}

async function getRelationshipTargetMemberOrThrow(memberId: string, role: UserRole, currentBranchId: string) {
  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      ...getAccessibleMemberWhere(role, currentBranchId),
    },
    select: memberSelect,
  })

  if (!member) {
    throw new NotFoundError('Membro relacionado')
  }

  return member
}

function serializeMember(member: Awaited<ReturnType<typeof getMemberOrThrow>>) {
  const totalLinks =
    relationCountKeys.reduce((accumulator, key) => accumulator + member.person._count[key], 0) +
    (member.person.user ? 1 : 0)

  return {
    id: member.id,
    personId: member.personId,
    branchId: member.person.branchId,
    branch: member.person.branch,
    fullName: member.person.fullName,
    preferredName: member.person.preferredName,
    cpf: member.person.cpf,
    rg: member.person.rg,
    birthDate: member.person.birthDate,
    gender: member.person.gender,
    maritalStatus: member.person.maritalStatus,
    nationality: member.person.nationality,
    email: member.person.email,
    phone: member.person.phone,
    whatsapp: member.person.whatsapp,
    address: member.person.address,
    addressNumber: member.person.addressNumber,
    addressComplement: member.person.addressComplement,
    neighborhood: member.person.neighborhood,
    city: member.person.city,
    state: member.person.state,
    zipCode: member.person.zipCode,
    category: member.person.category,
    photoUrl: member.person.photoUrl,
    kidsAgeGroup: member.person.kidsAgeGroup,
    notes: member.person.notes,
    isActive: member.person.isActive,
    membershipDate: member.membershipDate,
    baptismDate: member.baptismDate,
    baptismPlace: member.baptismPlace,
    previousChurch: member.previousChurch,
    transferDate: member.transferDate,
    status: member.status,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    responsible: member.person.parent,
    hasUserAccount: !!member.person.user,
    counts: {
      ...member.person._count,
      userAccount: member.person.user ? 1 : 0,
      total: totalLinks,
    },
    canDelete: totalLinks === 0,
  }
}

export async function memberRoutes(app: FastifyInstance) {
  const managementGuard = app.authorize(...managementRoles)

  app.get(
    '/',
    { preHandler: [managementGuard] },
    async (request) => {
      const query = listQuerySchema.parse(request.query)
      const personFilters: Record<string, unknown> = {}

      personFilters.branchId = canManageAllBranches(request.user.role)
        ? query.branchId ?? undefined
        : request.user.branchId

      if (!personFilters.branchId) {
        delete personFilters.branchId
      }

      if (query.category !== 'all') {
        personFilters.category = query.category
      }

      if (query.search) {
        personFilters.OR = [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { preferredName: { contains: query.search, mode: 'insensitive' } },
          { cpf: { contains: query.search } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
          { whatsapp: { contains: query.search } },
        ]
      }

      const members = await prisma.member.findMany({
        where: {
          AND: [
            query.status === 'all' ? {} : { status: query.status },
            Object.keys(personFilters).length > 0 ? ({ person: { is: personFilters } } as never) : {},
          ],
        },
        select: memberSelect,
        orderBy: [{ person: { fullName: 'asc' } }],
      })

      return {
        items: members.map((member) => serializeMember(member)),
      }
    },
  )

  app.get(
    '/options',
    { preHandler: [managementGuard] },
    async (request) => {
      const branches = await prisma.branch.findMany({
        where: canManageAllBranches(request.user.role) ? {} : { id: request.user.branchId },
        select: branchOptionSelect,
        orderBy: [{ name: 'asc' }],
      })

      return {
        branches,
        canManageAllBranches: canManageAllBranches(request.user.role),
        currentBranchId: request.user.branchId,
      }
    },
  )

  app.get(
    '/:id/relationship-options',
    { preHandler: [managementGuard] },
    async (request) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const member = await getMemberOrThrow(params.id)

      ensureMemberAccess(member.person.branchId, request.user.role, request.user.branchId)

      const relatedMembers = await prisma.member.findMany({
        where: {
          id: { not: params.id },
          ...getAccessibleMemberWhere(request.user.role, request.user.branchId),
        },
        select: {
          id: true,
          personId: true,
          status: true,
          person: {
            select: {
              fullName: true,
              preferredName: true,
              branchId: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ person: { fullName: 'asc' } }],
      })

      return {
        items: relatedMembers.map((relatedMember) => ({
          id: relatedMember.id,
          personId: relatedMember.personId,
          fullName: relatedMember.person.fullName,
          preferredName: relatedMember.person.preferredName,
          branchId: relatedMember.person.branchId,
          branchName: relatedMember.person.branch.name,
          status: relatedMember.status,
        })),
      }
    },
  )

  app.get(
    '/:id/relationships',
    { preHandler: [managementGuard] },
    async (request) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const member = await getMemberOrThrow(params.id)

      ensureMemberAccess(member.person.branchId, request.user.role, request.user.branchId)

      const relationships = await prisma.personRelationship.findMany({
        where: {
          OR: [{ sourcePersonId: member.person.id }, { targetPersonId: member.person.id }],
        },
        select: relationshipSelect,
        orderBy: [{ createdAt: 'asc' }],
      })

      const items = relationships
        .filter((relationship) => {
          const relative = relationship.sourcePersonId === member.person.id ? relationship.targetPerson : relationship.sourcePerson
          return !!relative.member && (canManageAllBranches(request.user.role) || relative.branchId === request.user.branchId)
        })
        .map((relationship) => serializeRelationship(relationship, member.person.id))

      return { items }
    },
  )

  app.get(
    '/:id',
    { preHandler: [managementGuard] },
    async (request) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const member = await getMemberOrThrow(params.id)

      ensureMemberAccess(member.person.branchId, request.user.role, request.user.branchId)

      return { item: serializeMember(member) }
    },
  )

  app.post(
    '/:id/relationships',
    { preHandler: [managementGuard] },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const payload = relationshipBodySchema.parse(request.body)
      const member = await getMemberOrThrow(params.id)

      ensureMemberAccess(member.person.branchId, request.user.role, request.user.branchId)

      const relatedMember = await getRelationshipTargetMemberOrThrow(
        payload.relatedMemberId,
        request.user.role,
        request.user.branchId,
      )

      if (relatedMember.person.id === member.person.id) {
        throw new ConflictError('Selecione outro membro para criar o vinculo familiar')
      }

      const normalized = normalizeRelationshipInput(member.person.id, relatedMember.person.id, payload.type)
      const existingRelationship = await prisma.personRelationship.findFirst({
        where: normalized,
        select: { id: true },
      })

      if (existingRelationship) {
        throw new ConflictError('Este vinculo familiar ja esta cadastrado')
      }

      const relationship = await prisma.personRelationship.create({
        data: {
          ...normalized,
          notes: payload.notes,
        },
        select: relationshipSelect,
      })

      return reply.status(201).send({
        item: serializeRelationship(relationship, member.person.id),
      })
    },
  )

  app.post(
    '/',
    { preHandler: [managementGuard] },
    async (request, reply) => {
      const payload = memberBodySchema.parse(request.body)
      const branchId = await resolveBranchId(request.user.role, request.user.branchId, payload.branchId)

      await ensureUniqueCpf(payload.cpf)

      const member = await prisma.member.create({
        data: {
          membershipDate: payload.membershipDate,
          baptismDate: payload.baptismDate,
          baptismPlace: payload.baptismPlace,
          previousChurch: payload.previousChurch,
          transferDate: payload.transferDate,
          status: payload.status,
          person: {
            create: {
              branchId,
              fullName: payload.fullName,
              preferredName: payload.preferredName,
              cpf: payload.cpf,
              rg: payload.rg,
              birthDate: payload.birthDate,
              gender: payload.gender,
              maritalStatus: payload.maritalStatus,
              nationality: payload.nationality ?? 'Brasileiro',
              email: payload.email,
              phone: payload.phone,
              whatsapp: payload.whatsapp,
              address: payload.address,
              addressNumber: payload.addressNumber,
              addressComplement: payload.addressComplement,
              neighborhood: payload.neighborhood,
              city: payload.city,
              state: payload.state,
              zipCode: payload.zipCode,
              category: payload.category,
              kidsAgeGroup: payload.category === PersonCategory.KIDS_MEMBER ? payload.kidsAgeGroup : undefined,
              notes: payload.notes,
              isActive: payload.status === MemberStatus.ACTIVE,
            },
          },
        },
        select: memberSelect,
      })

      return reply.status(201).send({
        item: serializeMember(member),
      })
    },
  )

  app.put(
    '/:id',
    { preHandler: [managementGuard] },
    async (request) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const payload = memberBodySchema.parse(request.body)
      const existingMember = await getMemberOrThrow(params.id)

      ensureMemberAccess(existingMember.person.branchId, request.user.role, request.user.branchId)

      const branchId = await resolveBranchId(request.user.role, request.user.branchId, payload.branchId)
      await ensureUniqueCpf(payload.cpf, existingMember.person.id)

      const member = await prisma.member.update({
        where: { id: params.id },
        data: {
          membershipDate: payload.membershipDate,
          baptismDate: payload.baptismDate,
          baptismPlace: payload.baptismPlace,
          previousChurch: payload.previousChurch,
          transferDate: payload.transferDate,
          status: payload.status,
          person: {
            update: {
              branchId,
              fullName: payload.fullName,
              preferredName: payload.preferredName,
              cpf: payload.cpf,
              rg: payload.rg,
              birthDate: payload.birthDate,
              gender: payload.gender,
              maritalStatus: payload.maritalStatus,
              nationality: payload.nationality ?? 'Brasileiro',
              email: payload.email,
              phone: payload.phone,
              whatsapp: payload.whatsapp,
              address: payload.address,
              addressNumber: payload.addressNumber,
              addressComplement: payload.addressComplement,
              neighborhood: payload.neighborhood,
              city: payload.city,
              state: payload.state,
              zipCode: payload.zipCode,
              category: payload.category,
              kidsAgeGroup: payload.category === PersonCategory.KIDS_MEMBER ? payload.kidsAgeGroup : null,
              notes: payload.notes,
              isActive: payload.status === MemberStatus.ACTIVE,
            },
          },
        },
        select: memberSelect,
      })

      return { item: serializeMember(member) }
    },
  )

  app.patch(
    '/:id/status',
    { preHandler: [managementGuard] },
    async (request) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const payload = memberStatusSchema.parse(request.body)
      const existingMember = await getMemberOrThrow(params.id)

      ensureMemberAccess(existingMember.person.branchId, request.user.role, request.user.branchId)

      const member = await prisma.member.update({
        where: { id: params.id },
        data: {
          status: payload.status,
          person: {
            update: {
              isActive: payload.status === MemberStatus.ACTIVE,
            },
          },
        },
        select: memberSelect,
      })

      return { item: serializeMember(member) }
    },
  )

  app.delete(
    '/:id/relationships/:relationshipId',
    { preHandler: [managementGuard] },
    async (request, reply) => {
      const params = z
        .object({
          id: z.string().min(1),
          relationshipId: z.string().min(1),
        })
        .parse(request.params)
      const member = await getMemberOrThrow(params.id)

      ensureMemberAccess(member.person.branchId, request.user.role, request.user.branchId)

      const relationship = await prisma.personRelationship.findUnique({
        where: { id: params.relationshipId },
        select: relationshipSelect,
      })

      if (!relationship) {
        throw new NotFoundError('Vinculo familiar')
      }

      const belongsToCurrentMember =
        relationship.sourcePersonId === member.person.id || relationship.targetPersonId === member.person.id

      if (!belongsToCurrentMember) {
        throw new NotFoundError('Vinculo familiar')
      }

      const relative = relationship.sourcePersonId === member.person.id ? relationship.targetPerson : relationship.sourcePerson

      if (!canManageAllBranches(request.user.role) && relative.branchId !== request.user.branchId) {
        throw new ForbiddenError('Voce nao pode remover vinculos com membros de outra filial')
      }

      await prisma.personRelationship.delete({
        where: { id: params.relationshipId },
      })

      return reply.status(204).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [managementGuard] },
    async (request, reply) => {
      const params = z.object({ id: z.string().min(1) }).parse(request.params)
      const member = await getMemberOrThrow(params.id)

      ensureMemberAccess(member.person.branchId, request.user.role, request.user.branchId)

      const serializedMember = serializeMember(member)

      if (!serializedMember.canDelete) {
        throw new ConflictError('O membro possui vinculos e nao pode ser excluido')
      }

      await prisma.$transaction([
        prisma.member.delete({ where: { id: params.id } }),
        prisma.person.delete({ where: { id: member.person.id } }),
      ])

      return reply.status(204).send()
    },
  )
}
