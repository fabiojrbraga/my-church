import { useEffect, useState } from 'react'
import axios from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BadgeCheck,
  Brush,
  Eye,
  Globe,
  Image,
  Palette,
  RefreshCcw,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  applyBranding,
  defaultBranding,
  getReadableTextColor,
  type BrandingSettings,
} from '@/lib/branding'
import { useAuthStore } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const assetUrlPattern = /^(https?:\/\/|\/)/i
const hexColorPattern = /^#[0-9a-fA-F]{6}$/

const optionalUrl = z
  .string()
  .optional()
  .refine((value) => !value || /^https?:\/\//i.test(value), 'Informe uma URL valida')

const optionalAssetUrl = z
  .string()
  .optional()
  .refine((value) => !value || assetUrlPattern.test(value), 'Use uma URL absoluta ou caminho iniciado por /')

const brandingFormSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome da instituicao').max(120),
  shortName: z.string().trim().min(2, 'Informe o nome curto').max(40),
  slogan: z.string().max(160, 'Use no maximo 160 caracteres').optional(),
  description: z.string().trim().min(10, 'Informe uma descricao publica').max(800),
  legalName: z.string().max(160).optional(),
  document: z.string().max(40).optional(),
  logoUrl: optionalAssetUrl,
  logoDarkUrl: optionalAssetUrl,
  iconUrl: optionalAssetUrl,
  faviconUrl: optionalAssetUrl,
  heroImageUrl: optionalAssetUrl,
  logoBackgroundColor: z.string().regex(hexColorPattern, 'Use #RRGGBB'),
  logoDarkBackgroundColor: z.string().regex(hexColorPattern, 'Use #RRGGBB'),
  iconBackgroundColor: z.string().regex(hexColorPattern, 'Use #RRGGBB'),
  primaryColor: z.string().regex(hexColorPattern, 'Use #RRGGBB'),
  accentColor: z.string().regex(hexColorPattern, 'Use #RRGGBB'),
  sidebarColor: z.string().regex(hexColorPattern, 'Use #RRGGBB'),
  backgroundColor: z.string().regex(hexColorPattern, 'Use #RRGGBB'),
  publicEmail: z
    .string()
    .optional()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'E-mail invalido'),
  publicPhone: z.string().max(40).optional(),
  publicWhatsapp: z.string().max(40).optional(),
  addressLine: z.string().max(180).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(2, 'Use a UF com 2 caracteres').optional(),
  instagramUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  websiteUrl: optionalUrl,
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(800).optional(),
})

type BrandingFormValues = z.infer<typeof brandingFormSchema>

const defaultValues = mapBrandingToForm(defaultBranding)

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Nao foi possivel concluir a operacao.'
  }

  return 'Nao foi possivel concluir a operacao.'
}

function optionalValue(value?: string) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function mapBrandingToForm(branding: BrandingSettings): BrandingFormValues {
  return {
    displayName: branding.displayName,
    shortName: branding.shortName,
    slogan: branding.slogan ?? '',
    description: branding.description,
    legalName: branding.legalName ?? '',
    document: branding.document ?? '',
    logoUrl: branding.logoUrl ?? '',
    logoDarkUrl: branding.logoDarkUrl ?? '',
    iconUrl: branding.iconUrl ?? '',
    faviconUrl: branding.faviconUrl ?? '',
    heroImageUrl: branding.heroImageUrl ?? '',
    logoBackgroundColor: branding.logoBackgroundColor,
    logoDarkBackgroundColor: branding.logoDarkBackgroundColor,
    iconBackgroundColor: branding.iconBackgroundColor,
    primaryColor: branding.theme.primaryColor,
    accentColor: branding.theme.accentColor,
    sidebarColor: branding.theme.sidebarColor,
    backgroundColor: branding.theme.backgroundColor,
    publicEmail: branding.contact.publicEmail ?? '',
    publicPhone: branding.contact.publicPhone ?? '',
    publicWhatsapp: branding.contact.publicWhatsapp ?? '',
    addressLine: branding.contact.addressLine ?? '',
    city: branding.contact.city ?? '',
    state: branding.contact.state ?? '',
    instagramUrl: branding.contact.instagramUrl ?? '',
    youtubeUrl: branding.contact.youtubeUrl ?? '',
    websiteUrl: branding.contact.websiteUrl ?? '',
    seoTitle: branding.seo.seoTitle ?? '',
    seoDescription: branding.seo.seoDescription ?? '',
  }
}

function buildPayload(values: BrandingFormValues) {
  return {
    displayName: values.displayName.trim(),
    shortName: values.shortName.trim(),
    slogan: optionalValue(values.slogan),
    description: values.description.trim(),
    legalName: optionalValue(values.legalName),
    document: optionalValue(values.document),
    logoUrl: optionalValue(values.logoUrl),
    logoDarkUrl: optionalValue(values.logoDarkUrl),
    iconUrl: optionalValue(values.iconUrl),
    faviconUrl: optionalValue(values.faviconUrl),
    heroImageUrl: optionalValue(values.heroImageUrl),
    logoBackgroundColor: values.logoBackgroundColor.trim().toLowerCase(),
    logoDarkBackgroundColor: values.logoDarkBackgroundColor.trim().toLowerCase(),
    iconBackgroundColor: values.iconBackgroundColor.trim().toLowerCase(),
    theme: {
      primaryColor: values.primaryColor.trim().toLowerCase(),
      accentColor: values.accentColor.trim().toLowerCase(),
      sidebarColor: values.sidebarColor.trim().toLowerCase(),
      backgroundColor: values.backgroundColor.trim().toLowerCase(),
    },
    contact: {
      publicEmail: optionalValue(values.publicEmail),
      publicPhone: optionalValue(values.publicPhone),
      publicWhatsapp: optionalValue(values.publicWhatsapp),
      addressLine: optionalValue(values.addressLine),
      city: optionalValue(values.city),
      state: optionalValue(values.state)?.toUpperCase() ?? null,
      instagramUrl: optionalValue(values.instagramUrl),
      youtubeUrl: optionalValue(values.youtubeUrl),
      websiteUrl: optionalValue(values.websiteUrl),
    },
    seo: {
      seoTitle: optionalValue(values.seoTitle),
      seoDescription: optionalValue(values.seoDescription),
    },
  }
}

interface ColorFieldProps {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}

function ColorField({ label, value, error, onChange }: ColorFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-border bg-surface p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} error={!!error} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function BrandingSettingsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues,
  })

  const brandingQuery = useQuery({
    queryKey: ['branding-admin'],
    enabled: isSuperAdmin,
    queryFn: () =>
      api
        .get<{ item: BrandingSettings }>('/branding/admin')
        .then((response) => response.data.item),
  })

  const saveMutation = useMutation({
    mutationFn: (values: BrandingFormValues) =>
      api
        .put<{ item: BrandingSettings }>('/branding', buildPayload(values))
        .then((response) => response.data.item),
    onSuccess: (item) => {
      const formValues = mapBrandingToForm(item)
      reset(formValues)
      applyBranding(item)
      queryClient.setQueryData(['branding-admin'], item)
      queryClient.setQueryData(['branding-public'], item)
      queryClient.invalidateQueries({ queryKey: ['branding-public'] })
      setFeedback({ type: 'success', message: 'Identidade visual atualizada com sucesso.' })
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  useEffect(() => {
    if (brandingQuery.data) {
      reset(mapBrandingToForm(brandingQuery.data))
    }
  }, [brandingQuery.data, reset])

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="flex items-start gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <Badge variant="destructive" className="w-fit">
              Acesso restrito
            </Badge>
            <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
              Somente super administradores podem alterar a identidade visual.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Esta area controla marca, cores e dados publicos usados pelo site e pela aplicacao administrativa.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const values = watch()
  const logoPreview = values.logoUrl || values.iconUrl
  const logoPreviewForeground = getReadableTextColor(values.logoBackgroundColor)
  const iconPreviewForeground = getReadableTextColor(values.iconBackgroundColor)
  const isSaving = saveMutation.isPending

  return (
    <form
      className="page-grid"
      onSubmit={handleSubmit((formValues) => {
        setFeedback(null)
        saveMutation.mutate(formValues)
      })}
    >
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] xl:px-8 xl:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">White label</Badge>
              <Badge variant="secondary">Somente superadmin</Badge>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Identidade visual da instituicao.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Defina nome, marca, cores e canais publicos usados no site, no login, no painel administrativo e nas
                proximas areas do membro.
              </p>
            </div>

            {feedback && (
              <div
                className={`rounded-[1.25rem] border px-4 py-3 text-sm ${
                  feedback.type === 'success'
                    ? 'border-success/20 bg-success/10 text-success'
                    : 'border-destructive/20 bg-destructive/10 text-destructive'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </div>

          <div
            className="rounded-[1.5rem] border border-border/60 p-5 shadow-sm shadow-slate-950/5"
            style={{ background: values.backgroundColor }}
          >
            <div className="rounded-[1.25rem] border border-white/50 bg-white/85 p-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white"
                  style={{ background: values.logoBackgroundColor, color: logoPreviewForeground }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-10 w-10 object-contain" />
                  ) : (
                    <Sparkles className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-semibold text-slate-950">
                    {values.shortName || 'Nome curto'}
                  </p>
                  <p className="truncate text-sm text-slate-500">{values.slogan || 'Slogan institucional'}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Palette className="h-5 w-5" style={{ color: values.primaryColor }} />
                  <p className="mt-3 text-sm font-semibold text-slate-950">Cor primaria</p>
                  <p className="mt-1 text-xs text-slate-500">{values.primaryColor}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Brush className="h-5 w-5" style={{ color: values.accentColor }} />
                  <p className="mt-3 text-sm font-semibold text-slate-950">Cor de destaque</p>
                  <p className="mt-1 text-xs text-slate-500">{values.accentColor}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: values.iconBackgroundColor, color: iconPreviewForeground }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950">Fundo do icone</p>
                  <p className="mt-1 text-xs text-slate-500">{values.iconBackgroundColor}</p>
                </div>
              </div>

              <Button type="button" className="mt-5 w-full" style={{ background: values.primaryColor }}>
                Previa de botao
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                Instituicao
              </Badge>
              <CardTitle>Dados principais</CardTitle>
              <CardDescription>Essas informacoes aparecem no site publico e nos pontos institucionais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName" required>
                    Nome publico
                  </Label>
                  <Input id="displayName" {...register('displayName')} error={!!errors.displayName} />
                  {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortName" required>
                    Nome curto
                  </Label>
                  <Input id="shortName" {...register('shortName')} error={!!errors.shortName} />
                  {errors.shortName && <p className="text-xs text-destructive">{errors.shortName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slogan">Slogan</Label>
                <Input id="slogan" {...register('slogan')} placeholder="Ex.: Uma igreja para a cidade" />
                {errors.slogan && <p className="text-xs text-destructive">{errors.slogan.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" required>
                  Descricao publica
                </Label>
                <Textarea id="description" {...register('description')} error={!!errors.description} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Nome legal</Label>
                  <Input id="legalName" {...register('legalName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CNPJ ou documento</Label>
                  <Input id="document" {...register('document')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                Marca
              </Badge>
              <CardTitle>Logos e imagens</CardTitle>
              <CardDescription>Use URLs absolutas ou caminhos publicados que comecem com /.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo principal</Label>
                  <Input id="logoUrl" {...register('logoUrl')} error={!!errors.logoUrl} placeholder="https://..." />
                  {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoDarkUrl">Logo para fundo escuro</Label>
                  <Input id="logoDarkUrl" {...register('logoDarkUrl')} error={!!errors.logoDarkUrl} />
                  {errors.logoDarkUrl && <p className="text-xs text-destructive">{errors.logoDarkUrl.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="iconUrl">Icone</Label>
                  <Input id="iconUrl" {...register('iconUrl')} error={!!errors.iconUrl} />
                  {errors.iconUrl && <p className="text-xs text-destructive">{errors.iconUrl.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon</Label>
                  <Input id="faviconUrl" {...register('faviconUrl')} error={!!errors.faviconUrl} />
                  {errors.faviconUrl && <p className="text-xs text-destructive">{errors.faviconUrl.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroImageUrl">Imagem hero publica</Label>
                  <Input id="heroImageUrl" {...register('heroImageUrl')} error={!!errors.heroImageUrl} />
                  {errors.heroImageUrl && <p className="text-xs text-destructive">{errors.heroImageUrl.message}</p>}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-border/60 bg-surface/70 p-4">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">Fundos de aplicacao da marca</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Ajuste o fundo usado atras de logos e icones para evitar conflito com a arte enviada.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <ColorField
                    label="Logo em area clara"
                    value={values.logoBackgroundColor}
                    error={errors.logoBackgroundColor?.message}
                    onChange={(value) =>
                      setValue('logoBackgroundColor', value, { shouldDirty: true, shouldValidate: true })
                    }
                  />
                  <ColorField
                    label="Logo em area escura"
                    value={values.logoDarkBackgroundColor}
                    error={errors.logoDarkBackgroundColor?.message}
                    onChange={(value) =>
                      setValue('logoDarkBackgroundColor', value, { shouldDirty: true, shouldValidate: true })
                    }
                  />
                  <ColorField
                    label="Icone compacto"
                    value={values.iconBackgroundColor}
                    error={errors.iconBackgroundColor?.message}
                    onChange={(value) =>
                      setValue('iconBackgroundColor', value, { shouldDirty: true, shouldValidate: true })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <Badge variant="info" className="w-fit">
                Tema
              </Badge>
              <CardTitle>Cores do sistema</CardTitle>
              <CardDescription>As cores sao aplicadas como tokens CSS no admin e no site publico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorField
                label="Primaria"
                value={values.primaryColor}
                error={errors.primaryColor?.message}
                onChange={(value) => setValue('primaryColor', value, { shouldDirty: true, shouldValidate: true })}
              />
              <ColorField
                label="Destaque"
                value={values.accentColor}
                error={errors.accentColor?.message}
                onChange={(value) => setValue('accentColor', value, { shouldDirty: true, shouldValidate: true })}
              />
              <ColorField
                label="Sidebar"
                value={values.sidebarColor}
                error={errors.sidebarColor?.message}
                onChange={(value) => setValue('sidebarColor', value, { shouldDirty: true, shouldValidate: true })}
              />
              <ColorField
                label="Fundo"
                value={values.backgroundColor}
                error={errors.backgroundColor?.message}
                onChange={(value) => setValue('backgroundColor', value, { shouldDirty: true, shouldValidate: true })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                Canais publicos
              </Badge>
              <CardTitle>Contato e SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="publicEmail">E-mail publico</Label>
                  <Input id="publicEmail" {...register('publicEmail')} error={!!errors.publicEmail} />
                  {errors.publicEmail && <p className="text-xs text-destructive">{errors.publicEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicPhone">Telefone</Label>
                  <Input id="publicPhone" {...register('publicPhone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicWhatsapp">WhatsApp</Label>
                  <Input id="publicWhatsapp" {...register('publicWhatsapp')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine">Endereco</Label>
                  <Input id="addressLine" {...register('addressLine')} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_5rem]">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">UF</Label>
                  <Input id="state" {...register('state')} maxLength={2} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Site externo</Label>
                <Input id="websiteUrl" {...register('websiteUrl')} error={!!errors.websiteUrl} />
                {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram</Label>
                  <Input id="instagramUrl" {...register('instagramUrl')} error={!!errors.instagramUrl} />
                  {errors.instagramUrl && <p className="text-xs text-destructive">{errors.instagramUrl.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">YouTube</Label>
                  <Input id="youtubeUrl" {...register('youtubeUrl')} error={!!errors.youtubeUrl} />
                  {errors.youtubeUrl && <p className="text-xs text-destructive">{errors.youtubeUrl.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoTitle">Titulo SEO</Label>
                <Input id="seoTitle" {...register('seoTitle')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription">Descricao SEO</Label>
                <Textarea id="seoDescription" {...register('seoDescription')} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {brandingQuery.isLoading ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <BadgeCheck className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Alteracoes em runtime</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Ao salvar, os tokens visuais sao aplicados imediatamente e publicados para o site publico.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={!isDirty || isSaving}
              onClick={() => {
                reset(brandingQuery.data ? mapBrandingToForm(brandingQuery.data) : defaultValues)
                setFeedback(null)
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              Resetar
            </Button>
            <Button type="submit" loading={isSaving} disabled={brandingQuery.isLoading}>
              <Save className="h-4 w-4" />
              Salvar identidade
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-4">
            <Globe className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Site publico</p>
            <p className="text-sm leading-6 text-muted-foreground">Nome, descricao, hero e canais publicos usam estes dados.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <Eye className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Login e admin</p>
            <p className="text-sm leading-6 text-muted-foreground">Logo, nome curto e cores sao aplicados na area administrativa.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <Image className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">Ativos visuais</p>
            <p className="text-sm leading-6 text-muted-foreground">Use arquivos publicados por URL ou caminhos estaticos do frontend.</p>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
