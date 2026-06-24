import { useDeferredValue, useEffect, useState } from 'react'
import axios from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  KeyRound,
  Plus,
  Power,
  QrCode,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  buildStaticPixCopyPasteCode,
  PixPayloadError,
  STATIC_PIX_FIELD_LIMITS,
  type StaticPixKeyType,
} from '@/lib/pixPayload'
import { useAuthStore } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type PixFilterStatus = 'all' | 'active' | 'inactive' | 'expired' | 'public'
type FeedbackMessage = { type: 'success' | 'error'; message: string }

const PIX_FORM_LIMITS = {
  identifier: 40,
  purpose: 120,
} as const

interface BranchOption {
  id: string
  name: string
  type: string
  isActive: boolean
}

interface PixAddressRecord {
  id: string
  branchId: string
  identifier: string
  purpose: string
  copyPasteCode: string
  expiresAt: string | null
  logoUrl: string | null
  effectiveLogoUrl: string | null
  isActive: boolean
  isExpired: boolean
  isPubliclyVisible: boolean
  createdAt: string
  updatedAt: string
  branch: {
    id: string
    name: string
    isActive: boolean
  }
}

const pixFormSchema = z.object({
  branchId: z.string().optional(),
  identifier: z
    .string()
    .trim()
    .min(3, 'Use ao menos 3 caracteres')
    .max(PIX_FORM_LIMITS.identifier, 'Use no maximo 40 caracteres')
    .regex(/^[a-z0-9]+$/, 'Use apenas letras minusculas e numeros'),
  purpose: z
    .string()
    .trim()
    .min(2, 'Informe a finalidade')
    .max(PIX_FORM_LIMITS.purpose, 'Use no maximo 120 caracteres'),
  copyPasteCode: z.string().trim().min(10, 'Informe o codigo copia e cola'),
  expiresAt: z.string().optional(),
  logoUrl: z
    .string()
    .optional()
    .refine((value) => !value || /^https?:\/\//i.test(value), 'Informe uma URL valida'),
})

type PixFormValues = z.infer<typeof pixFormSchema>

const pixKeyTypeValues = ['cpf', 'cnpj', 'phone', 'email', 'random'] as const

const pixKeyTypeOptions: { value: StaticPixKeyType; label: string }[] = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'random', label: 'Chave aleatoria' },
]

const pixGeneratorSchema = z.object({
  keyType: z.enum(pixKeyTypeValues),
  pixKey: z
    .string()
    .trim()
    .min(1, 'Informe a chave Pix')
    .max(STATIC_PIX_FIELD_LIMITS.pixKey, 'Use no maximo 77 caracteres'),
  merchantName: z
    .string()
    .trim()
    .min(2, 'Informe o nome do recebedor')
    .max(STATIC_PIX_FIELD_LIMITS.merchantName, 'Use no maximo 25 caracteres'),
  merchantCity: z
    .string()
    .trim()
    .min(2, 'Informe a cidade')
    .max(STATIC_PIX_FIELD_LIMITS.merchantCity, 'Use no maximo 15 caracteres'),
  amount: z
    .string()
    .max(STATIC_PIX_FIELD_LIMITS.amountInput, 'Use no maximo 13 caracteres')
    .optional(),
  txid: z.string().max(STATIC_PIX_FIELD_LIMITS.txid, 'Use no maximo 25 caracteres').optional(),
  description: z
    .string()
    .max(STATIC_PIX_FIELD_LIMITS.description, 'Use no maximo 72 caracteres')
    .optional(),
})

type PixGeneratorFormValues = z.infer<typeof pixGeneratorSchema>

const defaultValues: PixFormValues = {
  branchId: '',
  identifier: '',
  purpose: '',
  copyPasteCode: '',
  expiresAt: '',
  logoUrl: '',
}

const pixGeneratorDefaultValues: PixGeneratorFormValues = {
  keyType: 'cpf',
  pixKey: '',
  merchantName: '',
  merchantCity: '',
  amount: '',
  txid: '',
  description: '',
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Nao foi possivel concluir a operacao.'
  }

  return 'Nao foi possivel concluir a operacao.'
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Sem expiracao'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateInput(value: string | null | undefined) {
  if (!value) return ''

  return new Date(value).toISOString().slice(0, 10)
}

function formatAmountLabel(value?: string) {
  if (!value) return 'Valor em aberto'

  return `R$ ${value.replace('.', ',')}`
}

function buildPayload(values: PixFormValues) {
  return {
    branchId: normalizeOptional(values.branchId),
    identifier: values.identifier.trim().toLowerCase(),
    purpose: values.purpose.trim(),
    copyPasteCode: values.copyPasteCode.trim(),
    expiresAt: normalizeOptional(values.expiresAt),
    logoUrl: normalizeOptional(values.logoUrl),
  }
}

function mapPixToFormValues(item: PixAddressRecord): PixFormValues {
  return {
    branchId: item.branchId,
    identifier: item.identifier,
    purpose: item.purpose,
    copyPasteCode: item.copyPasteCode,
    expiresAt: formatDateInput(item.expiresAt),
    logoUrl: item.logoUrl ?? '',
  }
}

function getStatusBadge(item: PixAddressRecord) {
  if (!item.isActive) return <Badge variant="warning">Inativo</Badge>
  if (item.isExpired) return <Badge variant="destructive">Expirado</Badge>
  return <Badge variant="success">Publico</Badge>
}

export function PixAddressesPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const canSelectBranch = user?.role === 'SUPER_ADMIN' || user?.role === 'BOARD_MEMBER'
  const [selectedPixId, setSelectedPixId] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    search: string
    status: PixFilterStatus
    branchId: string
  }>({
    search: '',
    status: 'all',
    branchId: '',
  })
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const [generatorFeedback, setGeneratorFeedback] = useState<FeedbackMessage | null>(null)
  const [generatedPix, setGeneratedPix] = useState<ReturnType<
    typeof buildStaticPixCopyPasteCode
  > | null>(null)
  const deferredSearch = useDeferredValue(filters.search)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PixFormValues>({
    resolver: zodResolver(pixFormSchema),
    defaultValues,
  })

  const {
    register: registerGenerator,
    handleSubmit: handleGeneratorSubmit,
    reset: resetGenerator,
    formState: { errors: generatorErrors },
  } = useForm<PixGeneratorFormValues>({
    resolver: zodResolver(pixGeneratorSchema),
    defaultValues: pixGeneratorDefaultValues,
  })

  const pixQuery = useQuery({
    queryKey: ['pix-addresses', deferredSearch, filters.status, filters.branchId],
    queryFn: () =>
      api
        .get<{ items: PixAddressRecord[] }>('/pix-addresses', {
          params: {
            search: deferredSearch || undefined,
            status: filters.status,
            branchId: filters.branchId || undefined,
          },
        })
        .then((response) => response.data),
  })

  const branchOptionsQuery = useQuery({
    queryKey: ['branch-options'],
    enabled: canSelectBranch,
    queryFn: () =>
      api.get<{ items: BranchOption[] }>('/branches/options').then((response) => response.data),
  })

  const pixAddresses = pixQuery.data?.items ?? []
  const branchOptions = branchOptionsQuery.data?.items ?? []
  const selectedPix = pixAddresses.find((item) => item.id === selectedPixId) ?? null

  useEffect(() => {
    if (selectedPix) {
      reset(mapPixToFormValues(selectedPix))
    } else {
      reset(defaultValues)
    }
  }, [reset, selectedPix])

  function invalidatePixQueries(pixId?: string) {
    queryClient.invalidateQueries({ queryKey: ['pix-addresses'] })
    queryClient.invalidateQueries({ queryKey: ['public-pix-addresses'] })

    if (pixId) {
      queryClient.invalidateQueries({ queryKey: ['pix-address', pixId] })
    }
  }

  const saveMutation = useMutation({
    mutationFn: (values: PixFormValues) => {
      const payload = buildPayload(values)

      if (selectedPix) {
        return api
          .put<{ item: PixAddressRecord }>(`/pix-addresses/${selectedPix.id}`, payload)
          .then((response) => response.data)
      }

      return api
        .post<{ item: PixAddressRecord }>('/pix-addresses', payload)
        .then((response) => response.data)
    },
    onSuccess: ({ item }) => {
      setFeedback({
        type: 'success',
        message: selectedPix
          ? 'Endereco Pix atualizado com sucesso.'
          : 'Endereco Pix criado com sucesso.',
      })
      setSelectedPixId(item.id)
      invalidatePixQueries(item.id)
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ pixId, isActive }: { pixId: string; isActive: boolean }) =>
      api
        .patch<{ item: PixAddressRecord }>(`/pix-addresses/${pixId}/status`, { isActive })
        .then((response) => response.data),
    onSuccess: ({ item }) => {
      setFeedback({
        type: 'success',
        message: item.isActive
          ? 'Endereco Pix ativado com sucesso.'
          : 'Endereco Pix desativado com sucesso.',
      })
      invalidatePixQueries(item.id)
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (pixId: string) => api.delete(`/pix-addresses/${pixId}`),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Endereco Pix excluido com sucesso.' })
      setSelectedPixId(null)
      invalidatePixQueries()
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const publicCount = pixAddresses.filter((item) => item.isPubliclyVisible).length
  const expiredCount = pixAddresses.filter((item) => item.isExpired).length
  const inactiveCount = pixAddresses.filter((item) => !item.isActive).length
  const isSaving = saveMutation.isPending
  const isRunningAction = statusMutation.isPending || deleteMutation.isPending

  function handleCreateMode() {
    setSelectedPixId(null)
    setFeedback(null)
    reset(defaultValues)
  }

  function handleGenerateStaticPixCode(values: PixGeneratorFormValues) {
    try {
      const result = buildStaticPixCopyPasteCode(values)

      setGeneratedPix(result)
      setGeneratorFeedback({ type: 'success', message: 'Codigo Pix estatico gerado.' })
    } catch (error) {
      setGeneratedPix(null)
      setGeneratorFeedback({
        type: 'error',
        message:
          error instanceof PixPayloadError ? error.message : 'Nao foi possivel gerar o codigo Pix.',
      })
    }
  }

  function handleUseGeneratedPixCode() {
    if (!generatedPix) return

    setValue('copyPasteCode', generatedPix.code, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setFeedback({ type: 'success', message: 'Codigo gerado incluido no cadastro.' })
  }

  async function handleCopyGeneratedPixCode() {
    if (!generatedPix) return

    try {
      await navigator.clipboard.writeText(generatedPix.code)
      setGeneratorFeedback({ type: 'success', message: 'Codigo gerado copiado.' })
    } catch {
      setGeneratorFeedback({
        type: 'error',
        message: 'Nao foi possivel copiar o codigo automaticamente.',
      })
    }
  }

  function handleResetGenerator() {
    resetGenerator(pixGeneratorDefaultValues)
    setGeneratedPix(null)
    setGeneratorFeedback(null)
  }

  function handleToggleStatus() {
    if (!selectedPix) return

    const nextState = !selectedPix.isActive
    const confirmed = window.confirm(
      nextState
        ? `Ativar o endereco Pix "${selectedPix.identifier}"?`
        : `Desativar o endereco Pix "${selectedPix.identifier}"?`,
    )

    if (!confirmed) return

    statusMutation.mutate({ pixId: selectedPix.id, isActive: nextState })
  }

  function handleDelete() {
    if (!selectedPix) return

    const confirmed = window.confirm(
      `Excluir permanentemente o endereco Pix "${selectedPix.identifier}"?`,
    )

    if (!confirmed) return

    deleteMutation.mutate(selectedPix.id)
  }

  return (
    <div className="page-grid">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] xl:px-8 xl:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Pix publico</Badge>
              <Badge variant="outline">{publicCount} visivel(is) na pagina publica</Badge>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Cadastre codigos Pix identificados para uso publico.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Controle identificador, finalidade, validade, codigo copia e cola e o logo usado nos
                banners gerados na pagina publica.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Cadastrados
                </p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{pixAddresses.length}</p>
              </div>
              <div className="surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Publicos
                </p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{publicCount}</p>
              </div>
              <div className="surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Restritos
                </p>
                <p className="mt-3 text-2xl font-semibold text-foreground">
                  {expiredCount + inactiveCount}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-subtle p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <QrCode className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
              Pagina publica
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Somente itens ativos e nao expirados aparecem em /pix. O visitante pode copiar o
              codigo, visualizar QR code e baixar banner em PDF ou JPG.
            </p>
            <Button asChild variant="secondary" className="mt-5 w-full">
              <a href="/pix" target="_blank" rel="noreferrer">
                <Eye className="h-4 w-4" />
                Abrir /pix
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_12rem_14rem_auto]">
          <div className="space-y-2">
            <Label htmlFor="search-pix-admin">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-pix-admin"
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Identificador, finalidade ou filial"
                className="pl-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-pix-status">Status</Label>
            <Select
              id="filter-pix-status"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as PixFilterStatus,
                }))
              }
            >
              <option value="all">Todos</option>
              <option value="public">Publicos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="expired">Expirados</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-pix-branch">Filial</Label>
            <Select
              id="filter-pix-branch"
              value={filters.branchId}
              disabled={!canSelectBranch}
              onChange={(event) =>
                setFilters((current) => ({ ...current, branchId: event.target.value }))
              }
            >
              <option value="">Todas</option>
              {branchOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <Button type="button" variant="secondary" className="w-full" onClick={handleCreateMode}>
              <Plus className="h-4 w-4" />
              Novo Pix
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.98fr)]">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Enderecos cadastrados
            </Badge>
            <CardTitle>{pixAddresses.length} resultado(s)</CardTitle>
            <CardDescription>
              Selecione um cadastro para editar ou crie uma nova finalidade publica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pixQuery.isLoading && (
              <div className="surface-subtle p-5">
                <p className="text-sm font-medium text-foreground">Carregando enderecos Pix...</p>
              </div>
            )}

            {!pixQuery.isLoading && pixAddresses.length === 0 && (
              <div className="surface-subtle p-5">
                <p className="text-sm font-medium text-foreground">
                  Nenhum endereco Pix encontrado
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastre um codigo copia e cola para disponibilizar na pagina publica.
                </p>
              </div>
            )}

            {pixAddresses.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedPixId(item.id)
                  setFeedback(null)
                }}
                className={`w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${
                  selectedPixId === item.id
                    ? 'border-primary/30 bg-primary/5 shadow-panel'
                    : 'border-border/60 bg-surface/70 hover:border-primary/20 hover:bg-surface'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{item.purpose}</p>
                      {getStatusBadge(item)}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      #{item.identifier} - {item.branch.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-secondary/75 px-3 py-2">
                    <CalendarClock className="h-4 w-4 text-secondary-foreground" />
                    <span className="text-sm font-semibold text-secondary-foreground">
                      {formatDate(item.expiresAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="surface-subtle p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Filial
                    </p>
                    <p className="mt-2 truncate text-sm font-semibold text-foreground">
                      {item.branch.name}
                    </p>
                  </div>
                  <div className="surface-subtle p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Banner
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {item.effectiveLogoUrl ? 'Com logo' : 'Sem logo'}
                    </p>
                  </div>
                  <div className="surface-subtle p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Publicacao
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {item.isPubliclyVisible ? 'Visivel' : 'Oculta'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <Badge variant={selectedPix ? 'info' : 'secondary'} className="w-fit">
                {selectedPix ? 'Edicao' : 'Novo cadastro'}
              </Badge>
              <CardTitle>
                {selectedPix ? selectedPix.identifier : 'Cadastrar Pix publico'}
              </CardTitle>
              <CardDescription>
                {selectedPix
                  ? 'Atualize os dados do Pix selecionado.'
                  : 'Preencha os dados que serao exibidos na pagina publica.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
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

              <div className="surface-subtle space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Gerador Pix copia e cola estatico
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Payload BR Code estatico com TLV, TXID e CRC16/CCITT-FALSE.
                    </p>
                  </div>
                </div>

                {generatorFeedback && (
                  <div
                    className={`rounded-[1rem] border px-3 py-2 text-sm ${
                      generatorFeedback.type === 'success'
                        ? 'border-success/20 bg-success/10 text-success'
                        : 'border-destructive/20 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {generatorFeedback.message}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pix-generator-key-type">Tipo da chave</Label>
                    <Select id="pix-generator-key-type" {...registerGenerator('keyType')}>
                      {pixKeyTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix-generator-key">Chave Pix</Label>
                    <Input
                      id="pix-generator-key"
                      {...registerGenerator('pixKey')}
                      error={!!generatorErrors.pixKey}
                      placeholder="11223344556"
                      autoCapitalize="none"
                      maxLength={STATIC_PIX_FIELD_LIMITS.pixKey}
                    />
                    {generatorErrors.pixKey && (
                      <p className="text-xs text-destructive">{generatorErrors.pixKey.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix-generator-name">Nome do recebedor</Label>
                    <Input
                      id="pix-generator-name"
                      {...registerGenerator('merchantName')}
                      error={!!generatorErrors.merchantName}
                      placeholder="Igreja Exemplo"
                      maxLength={STATIC_PIX_FIELD_LIMITS.merchantName}
                    />
                    {generatorErrors.merchantName && (
                      <p className="text-xs text-destructive">
                        {generatorErrors.merchantName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix-generator-city">Cidade</Label>
                    <Input
                      id="pix-generator-city"
                      {...registerGenerator('merchantCity')}
                      error={!!generatorErrors.merchantCity}
                      placeholder="Sao Paulo"
                      maxLength={STATIC_PIX_FIELD_LIMITS.merchantCity}
                    />
                    {generatorErrors.merchantCity && (
                      <p className="text-xs text-destructive">
                        {generatorErrors.merchantCity.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix-generator-amount">Valor fixo</Label>
                    <Input
                      id="pix-generator-amount"
                      {...registerGenerator('amount')}
                      placeholder="25,75"
                      inputMode="decimal"
                      maxLength={STATIC_PIX_FIELD_LIMITS.amountInput}
                    />
                    {generatorErrors.amount && (
                      <p className="text-xs text-destructive">{generatorErrors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix-generator-txid">Identificador (TXID)</Label>
                    <Input
                      id="pix-generator-txid"
                      {...registerGenerator('txid')}
                      placeholder="***"
                      autoCapitalize="characters"
                      maxLength={STATIC_PIX_FIELD_LIMITS.txid}
                    />
                    {generatorErrors.txid && (
                      <p className="text-xs text-destructive">{generatorErrors.txid.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pix-generator-description">Descricao</Label>
                    <Textarea
                      id="pix-generator-description"
                      {...registerGenerator('description')}
                      error={!!generatorErrors.description}
                      placeholder="Dizimos e ofertas"
                      maxLength={STATIC_PIX_FIELD_LIMITS.description}
                      className="min-h-24"
                    />
                    {generatorErrors.description && (
                      <p className="text-xs text-destructive">
                        {generatorErrors.description.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="soft"
                    onClick={handleGeneratorSubmit(handleGenerateStaticPixCode)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar codigo
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResetGenerator}>
                    <RefreshCcw className="h-4 w-4" />
                    Limpar
                  </Button>
                </div>

                {generatedPix && (
                  <div className="space-y-3 rounded-[1rem] border border-border/60 bg-surface p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">Codigo gerado</p>
                      <Badge variant="outline">
                        {formatAmountLabel(generatedPix.normalized.amount)}
                      </Badge>
                    </div>
                    <Textarea
                      readOnly
                      value={generatedPix.code}
                      className="min-h-28 font-mono text-xs leading-5"
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Recebedor: {generatedPix.normalized.merchantName} - Cidade:{' '}
                      {generatedPix.normalized.merchantCity} - TXID: {generatedPix.normalized.txid}
                      {generatedPix.normalized.description
                        ? ` - Descricao: ${generatedPix.normalized.description}`
                        : ''}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button type="button" onClick={handleUseGeneratedPixCode}>
                        <ClipboardCheck className="h-4 w-4" />
                        Incluir no cadastro
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCopyGeneratedPixCode}>
                        <Copy className="h-4 w-4" />
                        Copiar codigo
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <form
                className="space-y-5"
                onSubmit={handleSubmit((values) => {
                  setFeedback(null)
                  saveMutation.mutate(values)
                })}
              >
                <div className="space-y-2">
                  <Label htmlFor="pix-identifier">Identificador</Label>
                  <Input
                    id="pix-identifier"
                    {...register('identifier')}
                    error={!!errors.identifier}
                    placeholder="dizimo2026"
                    autoCapitalize="none"
                    maxLength={PIX_FORM_LIMITS.identifier}
                  />
                  {errors.identifier && (
                    <p className="text-xs text-destructive">{errors.identifier.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix-purpose">Finalidade</Label>
                  <Input
                    id="pix-purpose"
                    {...register('purpose')}
                    error={!!errors.purpose}
                    placeholder="Dizimos e ofertas"
                    maxLength={PIX_FORM_LIMITS.purpose}
                  />
                  {errors.purpose && (
                    <p className="text-xs text-destructive">{errors.purpose.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pix-expires-at">Data de expiracao</Label>
                    <Input id="pix-expires-at" {...register('expiresAt')} type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pix-branch">Filial</Label>
                    <Select id="pix-branch" {...register('branchId')} disabled={!canSelectBranch}>
                      <option value="">Filial da sessao</option>
                      {branchOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix-logo-url">Logo para banner</Label>
                  <Input
                    id="pix-logo-url"
                    {...register('logoUrl')}
                    error={!!errors.logoUrl}
                    placeholder="https://..."
                  />
                  {errors.logoUrl && (
                    <p className="text-xs text-destructive">{errors.logoUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pix-copy-code">Codigo copia e cola</Label>
                  <Textarea
                    id="pix-copy-code"
                    {...register('copyPasteCode')}
                    error={!!errors.copyPasteCode}
                    placeholder="000201..."
                    className="min-h-36 font-mono text-xs leading-5"
                  />
                  {errors.copyPasteCode && (
                    <p className="text-xs text-destructive">{errors.copyPasteCode.message}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" size="lg" disabled={isSaving || isRunningAction}>
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Salvando...' : selectedPix ? 'Salvar alteracoes' : 'Criar Pix'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() =>
                      reset(selectedPix ? mapPixToFormValues(selectedPix) : defaultValues)
                    }
                    disabled={isSaving || isRunningAction || !isDirty}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reverter
                  </Button>
                </div>
              </form>

              {selectedPix && (
                <div className="space-y-3 border-t border-border/60 pt-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(selectedPix.copyPasteCode)}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar codigo
                    </Button>
                    <Button asChild variant="outline">
                      <a
                        href={`/pix?chave=${selectedPix.identifier}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Eye className="h-4 w-4" />
                        Ver publico
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant={selectedPix.isActive ? 'outline' : 'secondary'}
                      onClick={handleToggleStatus}
                      disabled={isSaving || isRunningAction}
                    >
                      <Power className="h-4 w-4" />
                      {selectedPix.isActive ? 'Desativar' : 'Ativar'}
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isSaving || isRunningAction}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>

                  <div className="surface-subtle flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      O item fica publico quando esta ativo, a filial esta ativa e a data de
                      expiracao ainda nao passou.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
