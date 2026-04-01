import { useDeferredValue, useEffect, useState } from 'react'
import axios from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { labels } from '@my-church/shared'
import {
  CheckCircle2,
  Church,
  HeartHandshake,
  MapPin,
  Plus,
  Power,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores/auth.store'

const memberCategoryOptions = ['MEMBER', 'KIDS_MEMBER'] as const
const genderLabels = {
  M: 'Masculino',
  F: 'Feminino',
} as const

type MemberStatusKey = keyof typeof labels.statusMembro
type MemberCategoryKey = (typeof memberCategoryOptions)[number]
type MaritalStatusKey = keyof typeof labels.estadoCivil
type KidsAgeGroupKey = keyof typeof labels.faixaEtariaKids
type GenderKey = keyof typeof genderLabels
type MemberFilterStatus = 'all' | MemberStatusKey
type MemberFilterCategory = 'all' | MemberCategoryKey

interface BranchOption {
  id: string
  name: string
  type: keyof typeof labels.tipoFilial
  isActive: boolean
}

interface MemberRecord {
  id: string
  personId: string
  branchId: string
  branch: {
    id: string
    name: string
    type: keyof typeof labels.tipoFilial
    isActive: boolean
  }
  fullName: string
  preferredName: string | null
  cpf: string | null
  rg: string | null
  birthDate: string | null
  gender: GenderKey | null
  maritalStatus: MaritalStatusKey | null
  nationality: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  addressNumber: string | null
  addressComplement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  category: MemberCategoryKey
  photoUrl: string | null
  kidsAgeGroup: KidsAgeGroupKey | null
  notes: string | null
  isActive: boolean
  membershipDate: string
  baptismDate: string | null
  baptismPlace: string | null
  previousChurch: string | null
  transferDate: string | null
  status: MemberStatusKey
  createdAt: string
  updatedAt: string
  responsible: {
    id: string
    fullName: string
  } | null
  hasUserAccount: boolean
  counts: {
    kids: number
    familyLinks: number
    boardRoles: number
    ministryLinks: number
    scheduleSlots: number
    eventRegistrations: number
    tithes: number
    namedOfferings: number
    availability: number
    userAccount: number
    total: number
  }
  canDelete: boolean
}

interface MemberOptionsResponse {
  branches: BranchOption[]
  canManageAllBranches: boolean
  currentBranchId: string
}

const memberFormSchema = z
  .object({
    branchId: z.string().trim().min(1, 'Selecione a filial'),
    fullName: z.string().trim().min(2, 'Informe o nome do membro'),
    preferredName: z.string().optional(),
    cpf: z.string().optional(),
    rg: z.string().optional(),
    birthDate: z.string().optional(),
    gender: z.enum(['', 'M', 'F']).optional(),
    maritalStatus: z.enum(['', 'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'COMMON_LAW']).optional(),
    nationality: z.string().optional(),
    email: z
      .string()
      .optional()
      .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'E-mail invalido'),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    address: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().max(2, 'Use a UF com 2 caracteres').optional(),
    zipCode: z.string().optional(),
    category: z.enum(memberCategoryOptions),
    kidsAgeGroup: z.enum(['', 'NURSERY', 'TODDLER', 'JUNIOR', 'CHILDREN', 'PRE_TEEN']).optional(),
    notes: z.string().optional(),
    membershipDate: z.string().min(1, 'Informe a data de ingresso'),
    baptismDate: z.string().optional(),
    baptismPlace: z.string().optional(),
    previousChurch: z.string().optional(),
    transferDate: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED']),
  })
  .superRefine((values, ctx) => {
    if (values.category === 'KIDS_MEMBER' && !values.kidsAgeGroup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['kidsAgeGroup'],
        message: 'Informe a faixa etaria do membro kids',
      })
    }
  })

type MemberFormValues = z.infer<typeof memberFormSchema>

const defaultValues: MemberFormValues = {
  branchId: '',
  fullName: '',
  preferredName: '',
  cpf: '',
  rg: '',
  birthDate: '',
  gender: '',
  maritalStatus: '',
  nationality: 'Brasileiro',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  addressNumber: '',
  addressComplement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  category: 'MEMBER',
  kidsAgeGroup: '',
  notes: '',
  membershipDate: '',
  baptismDate: '',
  baptismPlace: '',
  previousChurch: '',
  transferDate: '',
  status: 'ACTIVE',
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function buildPayload(values: MemberFormValues) {
  return {
    branchId: values.branchId,
    fullName: values.fullName.trim(),
    preferredName: normalizeOptional(values.preferredName),
    cpf: normalizeOptional(values.cpf),
    rg: normalizeOptional(values.rg),
    birthDate: normalizeOptional(values.birthDate),
    gender: normalizeOptional(values.gender),
    maritalStatus: normalizeOptional(values.maritalStatus),
    nationality: normalizeOptional(values.nationality),
    email: normalizeOptional(values.email),
    phone: normalizeOptional(values.phone),
    whatsapp: normalizeOptional(values.whatsapp),
    address: normalizeOptional(values.address),
    addressNumber: normalizeOptional(values.addressNumber),
    addressComplement: normalizeOptional(values.addressComplement),
    neighborhood: normalizeOptional(values.neighborhood),
    city: normalizeOptional(values.city),
    state: normalizeOptional(values.state)?.toUpperCase(),
    zipCode: normalizeOptional(values.zipCode),
    category: values.category,
    kidsAgeGroup: values.category === 'KIDS_MEMBER' ? normalizeOptional(values.kidsAgeGroup) : undefined,
    notes: normalizeOptional(values.notes),
    membershipDate: values.membershipDate,
    baptismDate: normalizeOptional(values.baptismDate),
    baptismPlace: normalizeOptional(values.baptismPlace),
    previousChurch: normalizeOptional(values.previousChurch),
    transferDate: normalizeOptional(values.transferDate),
    status: values.status,
  }
}

function mapMemberToFormValues(member: MemberRecord): MemberFormValues {
  return {
    branchId: member.branchId,
    fullName: member.fullName,
    preferredName: member.preferredName ?? '',
    cpf: member.cpf ?? '',
    rg: member.rg ?? '',
    birthDate: toDateInput(member.birthDate),
    gender: member.gender ?? '',
    maritalStatus: member.maritalStatus ?? '',
    nationality: member.nationality ?? 'Brasileiro',
    email: member.email ?? '',
    phone: member.phone ?? '',
    whatsapp: member.whatsapp ?? '',
    address: member.address ?? '',
    addressNumber: member.addressNumber ?? '',
    addressComplement: member.addressComplement ?? '',
    neighborhood: member.neighborhood ?? '',
    city: member.city ?? '',
    state: member.state ?? '',
    zipCode: member.zipCode ?? '',
    category: member.category,
    kidsAgeGroup: member.kidsAgeGroup ?? '',
    notes: member.notes ?? '',
    membershipDate: toDateInput(member.membershipDate),
    baptismDate: toDateInput(member.baptismDate),
    baptismPlace: member.baptismPlace ?? '',
    previousChurch: member.previousChurch ?? '',
    transferDate: toDateInput(member.transferDate),
    status: member.status,
  }
}

function getStatusBadgeVariant(status: MemberStatusKey) {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'warning'
    case 'TRANSFERRED':
      return 'info'
    case 'DECEASED':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function MembersPage() {
  const queryClient = useQueryClient()
  const authUser = useAuthStore((state) => state.user)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    search: string
    status: MemberFilterStatus
    category: MemberFilterCategory
    branchId: 'all' | string
  }>({
    search: '',
    status: 'all',
    category: 'all',
    branchId: 'all',
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
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues,
  })

  const watchedCategory = watch('category')
  const watchedBranchId = watch('branchId')

  const memberOptionsQuery = useQuery({
    queryKey: ['member-options'],
    queryFn: () => api.get<MemberOptionsResponse>('/members/options').then((response) => response.data),
  })

  const membersQuery = useQuery({
    queryKey: ['members', deferredSearch, filters.status, filters.category, filters.branchId],
    queryFn: () =>
      api
        .get<{ items: MemberRecord[] }>('/members', {
          params: {
            search: deferredSearch || undefined,
            status: filters.status,
            category: filters.category,
            branchId: filters.branchId === 'all' ? undefined : filters.branchId,
          },
        })
        .then((response) => response.data),
  })

  const selectedMemberQuery = useQuery({
    queryKey: ['member', selectedMemberId],
    enabled: !!selectedMemberId,
    queryFn: () =>
      api
        .get<{ item: MemberRecord }>(`/members/${selectedMemberId}`)
        .then((response) => response.data.item),
  })

  const members = membersQuery.data?.items ?? []
  const accessibleBranches = memberOptionsQuery.data?.branches ?? []
  const canManageAllBranches = memberOptionsQuery.data?.canManageAllBranches ?? false
  const currentBranchId = memberOptionsQuery.data?.currentBranchId ?? authUser?.branchId ?? ''
  const selectedMember =
    selectedMemberQuery.data ?? members.find((member) => member.id === selectedMemberId) ?? null
  const createDefaults: MemberFormValues = {
    ...defaultValues,
    branchId: currentBranchId || accessibleBranches[0]?.id || '',
  }

  useEffect(() => {
    if (!canManageAllBranches && currentBranchId && filters.branchId !== currentBranchId) {
      setFilters((current) => ({ ...current, branchId: currentBranchId }))
    }
  }, [canManageAllBranches, currentBranchId, filters.branchId])

  useEffect(() => {
    if (watchedCategory !== 'KIDS_MEMBER') {
      setValue('kidsAgeGroup', '')
    }
  }, [setValue, watchedCategory])

  useEffect(() => {
    if (selectedMember) {
      reset(mapMemberToFormValues(selectedMember))
      return
    }

    if (!isDirty && createDefaults.branchId && watchedBranchId !== createDefaults.branchId) {
      reset(createDefaults)
    }
  }, [createDefaults, isDirty, reset, selectedMember, watchedBranchId])

  function invalidateMemberQueries(memberId?: string) {
    queryClient.invalidateQueries({ queryKey: ['members'] })
    queryClient.invalidateQueries({ queryKey: ['member-options'] })

    if (memberId) {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
    }
  }

  const saveMutation = useMutation({
    mutationFn: (values: MemberFormValues) => {
      const payload = buildPayload(values)

      if (selectedMember) {
        return api.put<{ item: MemberRecord }>(`/members/${selectedMember.id}`, payload).then((response) => response.data)
      }

      return api.post<{ item: MemberRecord }>('/members', payload).then((response) => response.data)
    },
    onSuccess: ({ item }) => {
      setFeedback({
        type: 'success',
        message: selectedMember ? 'Membro atualizado com sucesso.' : 'Membro cadastrado com sucesso.',
      })
      setSelectedMemberId(item.id)
      invalidateMemberQueries(item.id)
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: MemberStatusKey }) =>
      api.patch<{ item: MemberRecord }>(`/members/${memberId}/status`, { status }).then((response) => response.data),
    onSuccess: ({ item }) => {
      setFeedback({
        type: 'success',
        message: `Status atualizado para ${labels.statusMembro[item.status]}.`,
      })
      invalidateMemberQueries(item.id)
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (memberId: string) => api.delete(`/members/${memberId}`),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Membro excluido com sucesso.' })
      setSelectedMemberId(null)
      invalidateMemberQueries()
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const totalMembers = members.length
  const activeMembers = members.filter((member) => member.status === 'ACTIVE').length
  const kidsMembers = members.filter((member) => member.category === 'KIDS_MEMBER').length
  const branchesRepresented = new Set(members.map((member) => member.branchId)).size
  const selectedScopeBranch = accessibleBranches.find((branch) => branch.id === filters.branchId) ?? null
  const isSaving = saveMutation.isPending
  const isRunningAction = statusMutation.isPending || deleteMutation.isPending

  function handleCreateMode() {
    setSelectedMemberId(null)
    setFeedback(null)
    reset(createDefaults)
  }

  function handleSelectMember(memberId: string) {
    setSelectedMemberId(memberId)
    setFeedback(null)
  }

  function handleToggleStatus() {
    if (!selectedMember) return

    const nextStatus: MemberStatusKey = selectedMember.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const confirmed = window.confirm(
      nextStatus === 'ACTIVE'
        ? `Ativar o cadastro de "${selectedMember.fullName}"?`
        : `Inativar o cadastro de "${selectedMember.fullName}"?`,
    )

    if (!confirmed) return

    statusMutation.mutate({ memberId: selectedMember.id, status: nextStatus })
  }

  function handleDelete() {
    if (!selectedMember) return

    const confirmed = window.confirm(
      `Excluir permanentemente o membro "${selectedMember.fullName}"? Esta acao nao pode ser desfeita.`,
    )

    if (!confirmed) return

    deleteMutation.mutate(selectedMember.id)
  }

  return (
    <div className="page-grid">
      <MembersHero
        totalMembers={totalMembers}
        activeMembers={activeMembers}
        kidsMembers={kidsMembers}
        branchesRepresented={branchesRepresented}
        canManageAllBranches={canManageAllBranches}
        accessibleBranches={accessibleBranches}
        selectedScopeBranch={selectedScopeBranch}
        selectedMember={selectedMember}
      />

      <MembersFiltersCard
        filters={filters}
        setFilters={setFilters}
        canManageAllBranches={canManageAllBranches}
        accessibleBranches={accessibleBranches}
        onCreate={handleCreateMode}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.98fr)]">
        <MembersListCard
          members={members}
          isLoading={membersQuery.isLoading}
          selectedMemberId={selectedMemberId}
          canManageAllBranches={canManageAllBranches}
          onSelect={handleSelectMember}
        />

        <div className="xl:sticky xl:top-24 xl:self-start">
          <MembersEditorCard
            selectedMember={selectedMember}
            feedback={feedback}
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            reset={reset}
            createDefaults={createDefaults}
            accessibleBranches={accessibleBranches}
            canManageAllBranches={canManageAllBranches}
            watchedCategory={watchedCategory}
            isDirty={isDirty}
            isSaving={isSaving}
            isRunningAction={isRunningAction}
            saveMutation={saveMutation}
            onClearFeedback={() => setFeedback(null)}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  )
}

interface MembersHeroProps {
  totalMembers: number
  activeMembers: number
  kidsMembers: number
  branchesRepresented: number
  canManageAllBranches: boolean
  accessibleBranches: BranchOption[]
  selectedScopeBranch: BranchOption | null
  selectedMember: MemberRecord | null
}

function MembersHero({
  totalMembers,
  activeMembers,
  kidsMembers,
  branchesRepresented,
  canManageAllBranches,
  accessibleBranches,
  selectedScopeBranch,
  selectedMember,
}: MembersHeroProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] xl:px-8 xl:py-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Cadastro de membros</Badge>
            <Badge variant="outline">
              {totalMembers} registro{totalMembers === 1 ? '' : 's'} no recorte atual
            </Badge>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Centralize o historico dos membros com um fluxo simples de cadastro e consulta.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Mantenha dados pessoais, contato, situacao eclesiastica e filial de referencia organizados em uma tela
              responsiva para o dia a dia da secretaria e da lideranca.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="surface-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Membros</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{totalMembers}</p>
              <p className="mt-1 text-sm text-muted-foreground">Cadastros retornados pelos filtros atuais.</p>
            </div>

            <div className="surface-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ativos</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{activeMembers}</p>
              <p className="mt-1 text-sm text-muted-foreground">Membros em situacao ativa para operacao.</p>
            </div>

            <div className="surface-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Kids</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{kidsMembers}</p>
              <p className="mt-1 text-sm text-muted-foreground">Cadastros infantis acompanhados na base.</p>
            </div>

            <div className="surface-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Filiais</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{branchesRepresented}</p>
              <p className="mt-1 text-sm text-muted-foreground">Unidades representadas no resultado filtrado.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="surface-subtle p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Church className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Escopo atual</p>
                <p className="text-sm text-muted-foreground">
                  {selectedScopeBranch
                    ? selectedScopeBranch.name
                    : canManageAllBranches
                      ? 'Todas as filiais acessiveis'
                      : accessibleBranches[0]?.name ?? 'Filial atual'}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {canManageAllBranches
                ? 'Use o filtro de filial para acompanhar a base por unidade ou trabalhe com a visao consolidada da organizacao.'
                : 'Seu perfil opera dentro da filial vinculada a sessao, mantendo o cadastro focado na unidade atual.'}
            </p>
          </div>

          <div className="surface-subtle p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedMember ? 'Membro selecionado' : 'Proximo passo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedMember
                    ? selectedMember.fullName
                    : totalMembers > 0
                      ? 'Selecione um cadastro para editar ou revisar seus dados.'
                      : 'Cadastre o primeiro membro para iniciar a base.'}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {selectedMember
                ? `${labels.statusMembro[selectedMember.status]} na ${selectedMember.branch.name}, com ${selectedMember.counts.total} vinculo${
                    selectedMember.counts.total === 1 ? '' : 's'
                  } relacionado${selectedMember.counts.total === 1 ? '' : 's'}.`
                : totalMembers > 0
                  ? 'Os filtros ajudam a encontrar rapidamente membros por status, categoria ou filial.'
                  : 'Comece por filial, nome completo e data de ingresso. O restante pode ser completado depois.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MembersFiltersCardProps {
  filters: {
    search: string
    status: MemberFilterStatus
    category: MemberFilterCategory
    branchId: 'all' | string
  }
  setFilters: React.Dispatch<
    React.SetStateAction<{
      search: string
      status: MemberFilterStatus
      category: MemberFilterCategory
      branchId: 'all' | string
    }>
  >
  canManageAllBranches: boolean
  accessibleBranches: BranchOption[]
  onCreate: () => void
}

function MembersFiltersCard({
  filters,
  setFilters,
  canManageAllBranches,
  accessibleBranches,
  onCreate,
}: MembersFiltersCardProps) {
  return (
    <Card>
      <CardContent
        className={`grid gap-3 ${
          canManageAllBranches
            ? 'sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_14rem_12rem_12rem_auto]'
            : 'sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_12rem_12rem_auto]'
        }`}
      >
        <div className="space-y-2">
          <Label htmlFor="search-members">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-members"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Nome, CPF, e-mail, telefone ou WhatsApp"
              className="pl-11"
            />
          </div>
        </div>

        {canManageAllBranches && (
          <div className="space-y-2">
            <Label htmlFor="filter-branch">Filial</Label>
            <Select
              id="filter-branch"
              value={filters.branchId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  branchId: event.target.value,
                }))
              }
            >
              <option value="all">Todas</option>
              {accessibleBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="filter-category">Categoria</Label>
          <Select
            id="filter-category"
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value as MemberFilterCategory,
              }))
            }
          >
            <option value="all">Todas</option>
            {memberCategoryOptions.map((value) => (
              <option key={value} value={value}>
                {labels.tipoPessoa[value]}
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
                status: event.target.value as MemberFilterStatus,
              }))
            }
          >
            <option value="all">Todos</option>
            {Object.entries(labels.statusMembro).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button type="button" variant="secondary" className="w-full" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Novo membro
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface MembersListCardProps {
  members: MemberRecord[]
  isLoading: boolean
  selectedMemberId: string | null
  canManageAllBranches: boolean
  onSelect: (memberId: string) => void
}

function MembersListCard({
  members,
  isLoading,
  selectedMemberId,
  canManageAllBranches,
  onSelect,
}: MembersListCardProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Membros cadastrados
        </Badge>
        <CardTitle>{members.length} resultado(s)</CardTitle>
        <CardDescription>
          Selecione um membro para editar ou crie um novo cadastro a partir do painel lateral.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="surface-subtle p-5">
            <p className="text-sm font-medium text-foreground">Carregando membros...</p>
            <p className="mt-1 text-sm text-muted-foreground">Buscando cadastros disponiveis para consulta.</p>
          </div>
        )}

        {!isLoading && members.length === 0 && (
          <div className="surface-subtle p-5">
            <p className="text-sm font-medium text-foreground">Nenhum membro encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou cadastre um novo membro para iniciar esta base.
            </p>
          </div>
        )}

        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            className={`w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${
              selectedMemberId === member.id
                ? 'border-primary/30 bg-primary/5 shadow-panel'
                : 'border-border/60 bg-surface/70 hover:border-primary/20 hover:bg-surface'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">{member.fullName}</p>
                  <Badge variant={getStatusBadgeVariant(member.status)}>{labels.statusMembro[member.status]}</Badge>
                  <Badge variant="secondary">{labels.tipoPessoa[member.category]}</Badge>
                  {canManageAllBranches && <Badge variant="outline">{member.branch.name}</Badge>}
                  {member.hasUserAccount && <Badge variant="info">Acesso ao app</Badge>}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {member.preferredName
                    ? `Nome social: ${member.preferredName}`
                    : member.city || member.state
                      ? `${member.city ?? 'Cidade nao informada'}${member.state ? `, ${member.state}` : ''}`
                      : 'Sem localizacao informada'}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-secondary/75 px-3 py-2">
                <Users className="h-4 w-4 text-secondary-foreground" />
                <span className="text-sm font-semibold text-secondary-foreground">{member.counts.total}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="surface-subtle p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ingresso</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(member.membershipDate)}</p>
              </div>
              <div className="surface-subtle p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Familias</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{member.counts.familyLinks}</p>
              </div>
              <div className="surface-subtle p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ministerios</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{member.counts.ministryLinks}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {member.cpf && <span>CPF: {member.cpf}</span>}
              {member.phone && <span>Telefone: {member.phone}</span>}
              {member.whatsapp && <span>WhatsApp: {member.whatsapp}</span>}
              {member.email && <span>E-mail: {member.email}</span>}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

interface MembersEditorCardProps {
  selectedMember: MemberRecord | null
  feedback: { type: 'success' | 'error'; message: string } | null
  register: ReturnType<typeof useForm<MemberFormValues>>['register']
  handleSubmit: ReturnType<typeof useForm<MemberFormValues>>['handleSubmit']
  errors: ReturnType<typeof useForm<MemberFormValues>>['formState']['errors']
  reset: ReturnType<typeof useForm<MemberFormValues>>['reset']
  createDefaults: MemberFormValues
  accessibleBranches: BranchOption[]
  canManageAllBranches: boolean
  watchedCategory: MemberCategoryKey
  isDirty: boolean
  isSaving: boolean
  isRunningAction: boolean
  saveMutation: {
    mutate: (values: MemberFormValues) => void
  }
  onClearFeedback: () => void
  onToggleStatus: () => void
  onDelete: () => void
}

function MembersEditorCard({
  selectedMember,
  feedback,
  register,
  handleSubmit,
  errors,
  reset,
  createDefaults,
  accessibleBranches,
  canManageAllBranches,
  watchedCategory,
  isDirty,
  isSaving,
  isRunningAction,
  saveMutation,
  onClearFeedback,
  onToggleStatus,
  onDelete,
}: MembersEditorCardProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant={selectedMember ? 'info' : 'secondary'} className="w-fit">
          {selectedMember ? 'Edicao' : 'Novo cadastro'}
        </Badge>
        <CardTitle>{selectedMember ? selectedMember.fullName : 'Cadastrar membro'}</CardTitle>
        <CardDescription>
          {selectedMember
            ? 'Atualize os dados do membro selecionado e use as acoes laterais para status ou exclusao.'
            : 'Preencha os dados essenciais para adicionar um novo membro na filial desejada.'}
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
            onClearFeedback()
            saveMutation.mutate(values)
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-branch">Filial</Label>
              <Select
                id="member-branch"
                {...register('branchId')}
                disabled={!canManageAllBranches && accessibleBranches.length <= 1}
                error={!!errors.branchId}
              >
                <option value="">Selecione</option>
                {accessibleBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
              {errors.branchId && <p className="text-xs text-destructive">{errors.branchId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-category">Categoria</Label>
              <Select id="member-category" {...register('category')} error={!!errors.category}>
                {memberCategoryOptions.map((value) => (
                  <option key={value} value={value}>
                    {labels.tipoPessoa[value]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-name">Nome completo</Label>
            <Input
              id="member-name"
              {...register('fullName')}
              error={!!errors.fullName}
              placeholder="Ex.: Maria de Souza"
            />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-preferred-name">Como gosta de ser chamado(a)</Label>
              <Input id="member-preferred-name" {...register('preferredName')} placeholder="Opcional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-status">Status</Label>
              <Select id="member-status" {...register('status')} error={!!errors.status}>
                {Object.entries(labels.statusMembro).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-cpf">CPF</Label>
              <Input id="member-cpf" {...register('cpf')} placeholder="000.000.000-00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-rg">RG</Label>
              <Input id="member-rg" {...register('rg')} placeholder="Documento opcional" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="member-birth-date">Nascimento</Label>
              <Input id="member-birth-date" type="date" {...register('birthDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-gender">Genero</Label>
              <Select id="member-gender" {...register('gender')}>
                <option value="">Nao informado</option>
                {Object.entries(genderLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-marital-status">Estado civil</Label>
              <Select id="member-marital-status" {...register('maritalStatus')}>
                <option value="">Nao informado</option>
                {Object.entries(labels.estadoCivil).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-nationality">Nacionalidade</Label>
              <Input id="member-nationality" {...register('nationality')} placeholder="Brasileiro" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-kids-age-group">Faixa etaria kids</Label>
              <Select
                id="member-kids-age-group"
                {...register('kidsAgeGroup')}
                disabled={watchedCategory !== 'KIDS_MEMBER'}
                error={!!errors.kidsAgeGroup}
              >
                <option value="">Nao se aplica</option>
                {Object.entries(labels.faixaEtariaKids).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {errors.kidsAgeGroup && <p className="text-xs text-destructive">{errors.kidsAgeGroup.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-email">E-mail</Label>
              <Input
                id="member-email"
                {...register('email')}
                error={!!errors.email}
                placeholder="contato@igreja.com"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-phone">Telefone</Label>
              <Input id="member-phone" {...register('phone')} placeholder="(11) 99999-0000" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-whatsapp">WhatsApp</Label>
              <Input id="member-whatsapp" {...register('whatsapp')} placeholder="(11) 99999-0000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-membership-date">Data de ingresso</Label>
              <Input
                id="member-membership-date"
                type="date"
                {...register('membershipDate')}
                error={!!errors.membershipDate}
              />
              {errors.membershipDate && <p className="text-xs text-destructive">{errors.membershipDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-address">Endereco</Label>
            <Input id="member-address" {...register('address')} placeholder="Rua, avenida ou referencia principal" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="member-address-number">Numero</Label>
              <Input id="member-address-number" {...register('addressNumber')} placeholder="123" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="member-address-complement">Complemento</Label>
              <Input id="member-address-complement" {...register('addressComplement')} placeholder="Casa, apto, bloco" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="member-neighborhood">Bairro</Label>
              <Input id="member-neighborhood" {...register('neighborhood')} placeholder="Bairro" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-zip-code">CEP</Label>
              <Input id="member-zip-code" {...register('zipCode')} placeholder="00000-000" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="member-city">Cidade</Label>
              <Input id="member-city" {...register('city')} placeholder="Cidade" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-state">UF</Label>
              <Input id="member-state" {...register('state')} error={!!errors.state} placeholder="SP" maxLength={2} />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-baptism-date">Data de batismo</Label>
              <Input id="member-baptism-date" type="date" {...register('baptismDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-baptism-place">Local de batismo</Label>
              <Input id="member-baptism-place" {...register('baptismPlace')} placeholder="Igreja ou cidade" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-previous-church">Igreja anterior</Label>
              <Input id="member-previous-church" {...register('previousChurch')} placeholder="Opcional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-transfer-date">Data de transferencia</Label>
              <Input id="member-transfer-date" type="date" {...register('transferDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-notes">Observacoes</Label>
            <Textarea
              id="member-notes"
              {...register('notes')}
              placeholder="Informacoes pastorais, administrativas ou observacoes gerais."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={isSaving || isRunningAction}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : selectedMember ? 'Salvar alteracoes' : 'Criar membro'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={!selectedMember && !isDirty}
              onClick={() => {
                if (selectedMember) {
                  reset(mapMemberToFormValues(selectedMember))
                } else {
                  reset(createDefaults)
                }
                onClearFeedback()
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
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedMember ? 'Resumo do membro selecionado' : 'Acoes disponiveis'}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {selectedMember
                  ? `Ingresso em ${formatDate(selectedMember.membershipDate)} e ultima atualizacao em ${formatDate(selectedMember.updatedAt)}.`
                  : 'Novos cadastros ja entram prontos para consulta, edicao e mudanca de status.'}
              </p>
            </div>
          </div>

          {selectedMember ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Familias</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{selectedMember.counts.familyLinks}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ministerios</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{selectedMember.counts.ministryLinks}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Agenda</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {selectedMember.counts.scheduleSlots + selectedMember.counts.eventRegistrations}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-surface/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Vinculos totais</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{selectedMember.counts.total}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={selectedMember.status === 'ACTIVE' ? 'outline' : 'default'}
                  disabled={isSaving || isRunningAction}
                  onClick={onToggleStatus}
                >
                  <Power className="h-4 w-4" />
                  {selectedMember.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSaving || isRunningAction || !selectedMember.canDelete}
                  onClick={onDelete}
                  title={
                    selectedMember.canDelete ? 'Excluir membro' : 'O membro possui vinculos e nao pode ser excluido'
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
                      {selectedMember.responsible ? `Responsavel vinculado: ${selectedMember.responsible.fullName}. ` : ''}
                      {selectedMember.canDelete
                        ? 'Este cadastro pode ser excluido com seguranca caso tenha sido criado por engano.'
                        : 'A exclusao esta bloqueada por relacionamentos ja existentes com este membro.'}
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
                  <p className="text-sm font-semibold text-foreground">Cadastro inicial recomendado</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Comece por filial, nome completo, categoria, data de ingresso e forma de contato. O restante pode
                    ser enriquecido ao longo do acompanhamento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
