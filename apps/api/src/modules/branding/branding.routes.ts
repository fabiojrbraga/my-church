import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, UserRole } from '@my-church/database'

const BRANDING_SETTINGS_ID = 'default'

const defaultBranding = {
  displayName: 'MyChurch',
  shortName: 'MyChurch',
  slogan: 'ERP e site publico para igrejas',
  description:
    'Uma comunidade local para acolher pessoas, compartilhar a fe e conectar visitantes aos canais oficiais da instituicao.',
  primaryColor: '#2563eb',
  accentColor: '#f97316',
  sidebarColor: '#0f172a',
  backgroundColor: '#f8fafc',
}

const emptyToNull = (value: unknown) => {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

const optionalStringSchema = (max = 240) =>
  z.preprocess(emptyToNull, z.string().trim().min(1).max(max).nullable().optional())

const optionalLongTextSchema = z.preprocess(
  emptyToNull,
  z.string().trim().min(1).max(800).nullable().optional(),
)

const optionalAssetUrlSchema = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .refine(
      (value) => /^https?:\/\//i.test(value) || value.startsWith('/'),
      'Informe uma URL absoluta ou um caminho iniciado por /',
    )
    .nullable()
    .optional(),
)

const optionalUrlSchema = z.preprocess(
  emptyToNull,
  z.string().trim().url('Informe uma URL valida').nullable().optional(),
)

const optionalEmailSchema = z.preprocess(
  emptyToNull,
  z.string().trim().email('Informe um e-mail valido').nullable().optional(),
)

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB')
  .transform((value) => value.toLowerCase())

const brandingBodySchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome da instituicao').max(120),
  shortName: z.string().trim().min(2, 'Informe o nome curto').max(40),
  slogan: optionalStringSchema(160),
  description: z.string().trim().min(10, 'Informe uma descricao publica').max(800),
  legalName: optionalStringSchema(160),
  document: optionalStringSchema(40),
  logoUrl: optionalAssetUrlSchema,
  logoDarkUrl: optionalAssetUrlSchema,
  iconUrl: optionalAssetUrlSchema,
  faviconUrl: optionalAssetUrlSchema,
  heroImageUrl: optionalAssetUrlSchema,
  theme: z.object({
    primaryColor: hexColorSchema,
    accentColor: hexColorSchema,
    sidebarColor: hexColorSchema,
    backgroundColor: hexColorSchema,
  }),
  contact: z.object({
    publicEmail: optionalEmailSchema,
    publicPhone: optionalStringSchema(40),
    publicWhatsapp: optionalStringSchema(40),
    addressLine: optionalStringSchema(180),
    city: optionalStringSchema(80),
    state: optionalStringSchema(2).transform((value) => value?.toUpperCase() ?? value),
    instagramUrl: optionalUrlSchema,
    youtubeUrl: optionalUrlSchema,
    websiteUrl: optionalUrlSchema,
  }),
  seo: z.object({
    seoTitle: optionalStringSchema(160),
    seoDescription: optionalLongTextSchema,
  }),
})

async function ensureBrandingSettings() {
  return prisma.brandingSettings.upsert({
    where: { id: BRANDING_SETTINGS_ID },
    update: {},
    create: {
      id: BRANDING_SETTINGS_ID,
      ...defaultBranding,
    },
  })
}

function serializeBranding(
  settings: Awaited<ReturnType<typeof ensureBrandingSettings>>,
  options: { includeAdminMetadata?: boolean } = {},
) {
  const payload = {
    id: settings.id,
    displayName: settings.displayName,
    shortName: settings.shortName,
    slogan: settings.slogan,
    description: settings.description,
    legalName: settings.legalName,
    document: settings.document,
    logoUrl: settings.logoUrl,
    logoDarkUrl: settings.logoDarkUrl,
    iconUrl: settings.iconUrl,
    faviconUrl: settings.faviconUrl,
    heroImageUrl: settings.heroImageUrl,
    theme: {
      primaryColor: settings.primaryColor,
      accentColor: settings.accentColor,
      sidebarColor: settings.sidebarColor,
      backgroundColor: settings.backgroundColor,
    },
    contact: {
      publicEmail: settings.publicEmail,
      publicPhone: settings.publicPhone,
      publicWhatsapp: settings.publicWhatsapp,
      addressLine: settings.addressLine,
      city: settings.city,
      state: settings.state,
      instagramUrl: settings.instagramUrl,
      youtubeUrl: settings.youtubeUrl,
      websiteUrl: settings.websiteUrl,
    },
    seo: {
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
    },
  }

  if (!options.includeAdminMetadata) return payload

  return {
    ...payload,
    updatedById: settings.updatedById,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  }
}

export async function brandingRoutes(app: FastifyInstance) {
  const superAdminGuard = app.authorize(UserRole.SUPER_ADMIN)

  app.get('/public', async () => {
    const settings = await ensureBrandingSettings()
    return { item: serializeBranding(settings) }
  })

  app.get('/admin', { preHandler: [superAdminGuard] }, async () => {
    const settings = await ensureBrandingSettings()
    return { item: serializeBranding(settings, { includeAdminMetadata: true }) }
  })

  app.put('/', { preHandler: [superAdminGuard] }, async (request) => {
    const payload = brandingBodySchema.parse(request.body)

    await ensureBrandingSettings()

    const settings = await prisma.brandingSettings.update({
      where: { id: BRANDING_SETTINGS_ID },
      data: {
        displayName: payload.displayName,
        shortName: payload.shortName,
        slogan: payload.slogan ?? null,
        description: payload.description,
        legalName: payload.legalName ?? null,
        document: payload.document ?? null,
        logoUrl: payload.logoUrl ?? null,
        logoDarkUrl: payload.logoDarkUrl ?? null,
        iconUrl: payload.iconUrl ?? null,
        faviconUrl: payload.faviconUrl ?? null,
        heroImageUrl: payload.heroImageUrl ?? null,
        primaryColor: payload.theme.primaryColor,
        accentColor: payload.theme.accentColor,
        sidebarColor: payload.theme.sidebarColor,
        backgroundColor: payload.theme.backgroundColor,
        publicEmail: payload.contact.publicEmail ?? null,
        publicPhone: payload.contact.publicPhone ?? null,
        publicWhatsapp: payload.contact.publicWhatsapp ?? null,
        addressLine: payload.contact.addressLine ?? null,
        city: payload.contact.city ?? null,
        state: payload.contact.state ?? null,
        instagramUrl: payload.contact.instagramUrl ?? null,
        youtubeUrl: payload.contact.youtubeUrl ?? null,
        websiteUrl: payload.contact.websiteUrl ?? null,
        seoTitle: payload.seo.seoTitle ?? null,
        seoDescription: payload.seo.seoDescription ?? null,
        updatedById: request.user.sub,
      },
    })

    return { item: serializeBranding(settings, { includeAdminMetadata: true }) }
  })
}
