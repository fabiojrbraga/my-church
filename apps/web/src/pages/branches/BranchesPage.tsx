import { useDeferredValue, useEffect, useState } from 'react'
import axios from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { labels } from '@my-church/shared'
import {
  CheckCircle2,
  GitBranch,
  Landmark,
  MapPin,
  Plus,
  Power,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

type BranchTypeKey = keyof typeof labels.tipoFilial
type BranchFilterStatus = 'all' | 'active' | 'inactive'

interface BranchOption {
  id: string
  name: string
  type: BranchTypeKey
  isActive: boolean
  parentId: string | null
}

interface BranchRecord {
  id: string
  name: string
  type: BranchTypeKey
  parentId: string | null
  cnpj: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  logoUrl: string | null
  pixKey: string | null
  pixKeyType: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  parent: {
    id: string
    name: string
    type: BranchTypeKey
    isActive: boolean
  } | null
  counts: {
    children: number
    persons: number
    users: number
    events: number
    ministries: number
    schedules: number
    serviceTypes: number
    accounts: number
    categories: number
    transactions: number
    contracts: number
    boardMembers: number
    total: number
  }
  isCurrentUserBranch: boolean
  canDelete: boolean
}

const branchFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da filial'),
  type: z.enum(['HEADQUARTERS', 'BRANCH', 'CONGREGATION']),
  parentId: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'E-mail invalido'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, 'Use a UF com 2 caracteres').optional(),
  zipCode: z.string().optional(),
  logoUrl: z
    .string()
    .optional()
    .refine((value) => !value || /^https?:\/\//i.test(value), 'Informe uma URL valida'),
  pixKey: z.string().optional(),
  pixKeyType: z.string().optional(),
})

type BranchFormValues = z.infer<typeof branchFormSchema>

const defaultValues: BranchFormValues = {
  name: '',
  type: 'BRANCH',
  parentId: '',
  cnpj: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  logoUrl: '',
  pixKey: '',
  pixKeyType: '',
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

function buildPayload(values: BranchFormValues) {
  return {
    name: values.name.trim(),
    type: values.type,
    parentId: normalizeOptional(values.parentId),
    cnpj: normalizeOptional(values.cnpj),
    phone: normalizeOptional(values.phone),
    email: normalizeOptional(values.email),
    address: normalizeOptional(values.address),
    city: normalizeOptional(values.city),
    state: normalizeOptional(values.state)?.toUpperCase(),
    zipCode: normalizeOptional(values.zipCode),
    logoUrl: normalizeOptional(values.logoUrl),
    pixKey: normalizeOptional(values.pixKey),
    pixKeyType: normalizeOptional(values.pixKeyType),
  }
}

function mapBranchToFormValues(branch: BranchRecord): BranchFormValues {
  return {
    name: branch.name,
    type: branch.type,
    parentId: branch.parentId ?? '',
    cnpj: branch.cnpj ?? '',
    phone: branch.phone ?? '',
    email: branch.email ?? '',
    address: branch.address ?? '',
    city: branch.city ?? '',
    state: branch.state ?? '',
    zipCode: branch.zipCode ?? '',
    logoUrl: branch.logoUrl ?? '',
    pixKey: branch.pixKey ?? '',
    pixKeyType: branch.pixKeyType ?? '',
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function BranchesPage() {
  const queryClient = useQueryClient()
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    search: string
    type: BranchTypeKey | 'all'
    status: BranchFilterStatus
  }>({
    search: '',
    type: 'all',
    status: 'all',
  })
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const deferredSearch = useDeferredValue(filters.search)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues,
  })

  const watchedType = watch('type')

  const branchesQuery = useQuery({
    queryKey: ['branches', deferredSearch, filters.type, filters.status],
    queryFn: () =>
      api
        .get<{ items: BranchRecord[] }>('/branches', {
          params: {
            search: deferredSearch || undefined,
            type: filters.type === 'all' ? undefined : filters.type,
            status: filters.status,
          },
        })
        .then((response) => response.data),
  })

  const branchOptionsQuery = useQuery({
    queryKey: ['branch-options'],
    queryFn: () => api.get<{ items: BranchOption[] }>('/branches/options').then((response) => response.data),
  })

  const selectedBranchQuery = useQuery({
    queryKey: ['branch', selectedBranchId],
    enabled: !!selectedBranchId,
    queryFn: () =>
      api
        .get<{ item: BranchRecord }>(`/branches/${selectedBranchId}`)
        .then((response) => response.data.item),
  })

  const branches = branchesQuery.data?.items ?? []
  const branchOptions = branchOptionsQuery.data?.items ?? []
  const selectedBranch =
    selectedBranchQuery.data ?? branches.find((branch) => branch.id === selectedBranchId) ?? null

  useEffect(() => {
    if (watchedType === 'HEADQUARTERS') {
      setValue('parentId', '')
    }
  }, [setValue, watchedType])

  useEffect(() => {
    if (selectedBranch) {
      reset(mapBranchToFormValues(selectedBranch))
    } else {
      reset(defaultValues)
    }
  }, [reset, selectedBranch])

  function invalidateBranchQueries(branchId?: string) {
    queryClient.invalidateQueries({ queryKey: ['branches'] })
    queryClient.invalidateQueries({ queryKey: ['branch-options'] })

    if (branchId) {
      queryClient.invalidateQueries({ queryKey: ['branch', branchId] })
    }
  }

  const saveMutation = useMutation({
    mutationFn: (values: BranchFormValues) => {
      const payload = buildPayload(values)

      if (selectedBranch) {
        return api.put<{ item: BranchRecord }>(`/branches/${selectedBranch.id}`, payload).then((response) => response.data)
      }

      return api.post<{ item: BranchRecord }>('/branches', payload).then((response) => response.data)
    },
    onSuccess: ({ item }) => {
      setFeedback({
        type: 'success',
        message: selectedBranch ? 'Filial atualizada com sucesso.' : 'Filial criada com sucesso.',
      })
      setSelectedBranchId(item.id)
      invalidateBranchQueries(item.id)
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ branchId, isActive }: { branchId: string; isActive: boolean }) =>
      api.patch<{ item: BranchRecord }>(`/branches/${branchId}/status`, { isActive }).then((response) => response.data),
    onSuccess: ({ item }) => {
      setFeedback({
        type: 'success',
        message: item.isActive ? 'Filial ativada com sucesso.' : 'Filial desativada com sucesso.',
      })
      invalidateBranchQueries(item.id)
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (branchId: string) => api.delete(`/branches/${branchId}`),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Filial excluida com sucesso.' })
      setSelectedBranchId(null)
      invalidateBranchQueries()
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const totalUnits = branchOptions.length
  const activeUnits = branchOptions.filter((item) => item.isActive).length
  const headquartersCount = branchOptions.filter((item) => item.type === 'HEADQUARTERS').length
  const branchCount = branchOptions.filter((item) => item.type === 'BRANCH').length
  const congregationsCount = branchOptions.filter((item) => item.type === 'CONGREGATION').length
  const headquarters = branchOptions.find((item) => item.type === 'HEADQUARTERS') ?? null
  const availableParentOptions = branchOptions.filter((item) => item.id !== selectedBranch?.id)
  const isSaving = saveMutation.isPending
  const isRunningAction = statusMutation.isPending || deleteMutation.isPending

  function handleCreateMode() {
    setSelectedBranchId(null)
    setFeedback(null)
    reset(defaultValues)
  }

  function handleSelectBranch(branchId: string) {
    setSelectedBranchId(branchId)
    setFeedback(null)
  }

  function handleToggleStatus() {
    if (!selectedBranch) return

    const nextState = !selectedBranch.isActive
    const confirmed = window.confirm(
      nextState
        ? `Ativar a unidade "${selectedBranch.name}"?`
        : `Desativar a unidade "${selectedBranch.name}"?`,
    )

    if (!confirmed) return

    statusMutation.mutate({ branchId: selectedBranch.id, isActive: nextState })
  }

  function handleDelete() {
    if (!selectedBranch) return

    const confirmed = window.confirm(
      `Excluir permanentemente a unidade "${selectedBranch.name}"? Esta acao nao pode ser desfeita.`,
    )

    if (!confirmed) return

    deleteMutation.mutate(selectedBranch.id)
  }

  return (
    <div className="page-grid">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] xl:px-8 xl:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Gestao de unidades</Badge>
              <Badge variant="outline">
                {activeUnits} ativa{activeUnits === 1 ? '' : 's'} de {totalUnits}
              </Badge>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Organize a estrutura da igreja com uma visao clara das unidades.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Cadastre matriz, filiais e congregacoes, mantenha os dados atualizados e acompanhe a hierarquia em um
                fluxo simples para a equipe administrativa.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Unidades</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{totalUnits}</p>
                <p className="mt-1 text-sm text-muted-foreground">Estrutura total cadastrada.</p>
              </div>

              <div className="surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ativas</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{activeUnits}</p>
                <p className="mt-1 text-sm text-muted-foreground">Unidades disponiveis para operacao.</p>
              </div>

              <div className="surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Matriz</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{headquartersCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">Base central da organizacao.</p>
              </div>

              <div className="surface-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Filiais</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{branchCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">Unidades com operacao administrativa propria.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="surface-subtle p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Matriz atual</p>
                  <p className="text-sm text-muted-foreground">{headquarters?.name ?? 'Nenhuma matriz cadastrada'}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {headquarters
                  ? 'Use a matriz como referencia principal da estrutura e vincule filiais e congregacoes conforme a organizacao local.'
                  : 'Cadastre a matriz primeiro para centralizar a estrutura da igreja e organizar as demais unidades.'}
              </p>
            </div>

            <div className="surface-subtle p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedBranch ? 'Unidade selecionada' : 'Proximo passo'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBranch
                      ? selectedBranch.name
                      : totalUnits > 0
                        ? 'Selecione uma unidade para editar ou revisar seus dados.'
                        : 'Cadastre a primeira unidade para iniciar a estrutura.'}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {selectedBranch
                  ? `${labels.tipoFilial[selectedBranch.type]} ${selectedBranch.isActive ? 'ativa' : 'inativa'}${
                      selectedBranch.parent ? `, vinculada a ${selectedBranch.parent.name}.` : ', sem unidade pai definida.'
                    }`
                  : totalUnits > 0
                    ? `Hoje voce possui ${branchCount} filiais e ${congregationsCount} congregacao${
                        congregationsCount === 1 ? '' : 'es'
                      } cadastrada${congregationsCount === 1 ? '' : 's'}.`
                    : 'Comece pela matriz e depois vincule filiais e congregacoes conforme a estrutura da igreja.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_12rem_12rem_auto]">
          <div className="space-y-2">
            <Label htmlFor="search-branches">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-branches"
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                placeholder="Nome, CNPJ, cidade ou e-mail"
                className="pl-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-type">Tipo</Label>
            <Select
              id="filter-type"
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  type: event.target.value as BranchTypeKey | 'all',
                }))
              }
            >
              <option value="all">Todos</option>
              {Object.entries(labels.tipoFilial).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              id="filter-status"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as BranchFilterStatus,
                }))
              }
            >
              <option value="all">Todos</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button type="button" variant="secondary" className="w-full" onClick={handleCreateMode}>
              <Plus className="h-4 w-4" />
              Nova filial
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.95fr)]">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Unidades cadastradas
            </Badge>
            <CardTitle>{branches.length} resultado(s)</CardTitle>
            <CardDescription>
              Selecione uma unidade para editar ou crie uma nova a partir do painel lateral.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {branchesQuery.isLoading && (
              <div className="surface-subtle p-5">
                <p className="text-sm font-medium text-foreground">Carregando filiais...</p>
                <p className="mt-1 text-sm text-muted-foreground">Buscando unidades disponiveis no backend.</p>
              </div>
            )}

            {!branchesQuery.isLoading && branches.length === 0 && (
              <div className="surface-subtle p-5">
                <p className="text-sm font-medium text-foreground">Nenhuma unidade encontrada</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ajuste os filtros ou cadastre uma nova filial para iniciar a estrutura.
                </p>
              </div>
            )}

            {branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => handleSelectBranch(branch.id)}
                className={`w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${
                  selectedBranchId === branch.id
                    ? 'border-primary/30 bg-primary/5 shadow-panel'
                    : 'border-border/60 bg-surface/70 hover:border-primary/20 hover:bg-surface'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{branch.name}</p>
                      <Badge variant={branch.isActive ? 'success' : 'warning'}>
                        {branch.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="secondary">{labels.tipoFilial[branch.type]}</Badge>
                      {branch.isCurrentUserBranch && <Badge variant="info">Sessao atual</Badge>}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {branch.city || branch.state
                        ? `${branch.city ?? 'Cidade nao informada'}${branch.state ? `, ${branch.state}` : ''}`
                        : 'Localizacao nao informada'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-secondary/75 px-3 py-2">
                    <Users className="h-4 w-4 text-secondary-foreground" />
                    <span className="text-sm font-semibold text-secondary-foreground">{branch.counts.total}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="surface-subtle p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Filial pai</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{branch.parent?.name ?? 'Sem vinculo'}</p>
                  </div>
                  <div className="surface-subtle p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pessoas</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{branch.counts.persons}</p>
                  </div>
                  <div className="surface-subtle p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Usuarios</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{branch.counts.users}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {branch.cnpj && <span>CNPJ: {branch.cnpj}</span>}
                  {branch.phone && <span>Telefone: {branch.phone}</span>}
                  {branch.email && <span>E-mail: {branch.email}</span>}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <Badge variant={selectedBranch ? 'info' : 'secondary'} className="w-fit">
                {selectedBranch ? 'Edicao' : 'Novo cadastro'}
              </Badge>
              <CardTitle>{selectedBranch ? selectedBranch.name : 'Cadastrar filial'}</CardTitle>
              <CardDescription>
                {selectedBranch
                  ? 'Atualize os dados da unidade selecionada e use as acoes laterais para status ou exclusao.'
                  : 'Preencha os dados essenciais para adicionar uma nova unidade na estrutura.'}
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

              <form
                className="space-y-5"
                onSubmit={handleSubmit((values) => {
                  setFeedback(null)
                  saveMutation.mutate(values)
                })}
              >
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Nome da unidade</Label>
                  <Input
                    id="branch-name"
                    {...register('name')}
                    error={!!errors.name}
                    placeholder="Ex.: Igreja Central - Zona Norte"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branch-type">Tipo</Label>
                    <Select id="branch-type" {...register('type')} error={!!errors.type}>
                      {Object.entries(labels.tipoFilial).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch-parent">Filial pai</Label>
                    <Select id="branch-parent" {...register('parentId')} disabled={watchedType === 'HEADQUARTERS'}>
                      <option value="">Sem vinculo</option>
                      {availableParentOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} · {labels.tipoFilial[option.type]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branch-cnpj">CNPJ</Label>
                    <Input id="branch-cnpj" {...register('cnpj')} placeholder="00.000.000/0001-00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch-phone">Telefone</Label>
                    <Input id="branch-phone" {...register('phone')} placeholder="(11) 99999-0000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch-email">E-mail</Label>
                  <Input
                    id="branch-email"
                    {...register('email')}
                    error={!!errors.email}
                    placeholder="contato@igreja.com"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch-address">Endereco</Label>
                  <Input id="branch-address" {...register('address')} placeholder="Rua, avenida ou referencia principal" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="branch-city">Cidade</Label>
                    <Input id="branch-city" {...register('city')} placeholder="Cidade" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch-state">UF</Label>
                    <Input
                      id="branch-state"
                      {...register('state')}
                      error={!!errors.state}
                      placeholder="SP"
                      maxLength={2}
                    />
                    {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branch-zip-code">CEP</Label>
                    <Input id="branch-zip-code" {...register('zipCode')} placeholder="00000-000" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch-logo-url">Logo URL</Label>
                    <Input
                      id="branch-logo-url"
                      {...register('logoUrl')}
                      error={!!errors.logoUrl}
                      placeholder="https://..."
                    />
                    {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="branch-pix-key">Chave PIX</Label>
                    <Input id="branch-pix-key" {...register('pixKey')} placeholder="CPF, e-mail ou chave aleatoria" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch-pix-key-type">Tipo da chave</Label>
                    <Select id="branch-pix-key-type" {...register('pixKeyType')}>
                      <option value="">Nao informado</option>
                      <option value="CPF">CPF</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="PHONE">Telefone</option>
                      <option value="RANDOM">Aleatoria</option>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" size="lg" disabled={isSaving || isRunningAction}>
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Salvando...' : selectedBranch ? 'Salvar alteracoes' : 'Criar filial'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={!selectedBranch && !isDirty}
                    onClick={() => {
                      if (selectedBranch) {
                        reset(mapBranchToFormValues(selectedBranch))
                      } else {
                        reset(defaultValues)
                      }
                      setFeedback(null)
                    }}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Resetar formulario
                  </Button>
                </div>
              </form>

              <div className="surface-subtle space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedBranch ? 'Resumo da unidade selecionada' : 'Acoes disponiveis'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {selectedBranch
                        ? `Criada em ${formatDate(selectedBranch.createdAt)} e atualizada em ${formatDate(selectedBranch.updatedAt)}.`
                        : 'Novas unidades sao criadas ativas por padrao e entram imediatamente na estrutura.'}
                    </p>
                  </div>
                </div>

                {selectedBranch ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pessoas</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{selectedBranch.counts.persons}</p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Usuarios</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{selectedBranch.counts.users}</p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Filiais filhas</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{selectedBranch.counts.children}</p>
                      </div>
                      <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Vinculos totais</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{selectedBranch.counts.total}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant={selectedBranch.isActive ? 'outline' : 'default'}
                        disabled={isSaving || isRunningAction || (selectedBranch.isCurrentUserBranch && selectedBranch.isActive)}
                        onClick={handleToggleStatus}
                      >
                        <Power className="h-4 w-4" />
                        {selectedBranch.isActive ? 'Desativar' : 'Ativar'}
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isSaving || isRunningAction || !selectedBranch.canDelete}
                        onClick={handleDelete}
                        title={
                          selectedBranch.canDelete
                            ? 'Excluir unidade'
                            : 'A unidade possui vinculos e nao pode ser excluida'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-surface/80 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Observacoes operacionais</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {selectedBranch.parent
                              ? `Vinculada a ${selectedBranch.parent.name}.`
                              : 'Sem filial pai definida.'}{' '}
                            {selectedBranch.canDelete
                              ? 'Esta unidade pode ser excluida com seguranca.'
                              : 'A exclusao esta bloqueada por vinculos ja existentes.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-surface/80 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Regras aplicadas automaticamente</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          O backend valida CNPJ unico, impede ciclos na hierarquia e evita mais de uma matriz na base.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
