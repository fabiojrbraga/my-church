import { useEffect, useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { labels } from '@my-church/shared'
import { GitBranch, Link2, Network, Plus, Trash2, UserRound } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const relationshipTypeOptions = [
  { value: 'PARENT_OF', label: 'Pai/Mae de' },
  { value: 'CHILD_OF', label: 'Filho(a) de' },
  { value: 'SPOUSE_OF', label: 'Conjuge de' },
  { value: 'SIBLING_OF', label: 'Irmao(irma) de' },
  { value: 'GRANDPARENT_OF', label: 'Avo de' },
  { value: 'GRANDCHILD_OF', label: 'Neto(a) de' },
  { value: 'GUARDIAN_OF', label: 'Responsavel por' },
  { value: 'DEPENDENT_OF', label: 'Dependente de' },
  { value: 'OTHER', label: 'Vinculo familiar' },
] as const

type RelationshipFormType = (typeof relationshipTypeOptions)[number]['value']
type MemberStatusKey = keyof typeof labels.statusMembro

interface SelectedMemberSummary {
  id: string
  personId: string
  fullName: string
  preferredName: string | null
  gender: string | null
  branch: {
    id: string
    name: string
  }
}

interface RelationshipOption {
  id: string
  personId: string
  fullName: string
  preferredName: string | null
  branchId: string
  branchName: string
  status: MemberStatusKey
}

interface RelationshipItem {
  id: string
  type: keyof typeof labels.tipoVinculoFamiliar
  label: string
  notes: string | null
  createdAt: string
  updatedAt: string
  member: {
    id: string
    personId: string
    fullName: string
    preferredName: string | null
    branchId: string
    branchName: string
    gender: string | null
    status: MemberStatusKey
  } | null
}

interface MemberFamilyRelationshipsSectionProps {
  selectedMember: SelectedMemberSummary
  onRelationshipsChanged: () => void
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Nao foi possivel concluir a operacao.'
  }

  return 'Nao foi possivel concluir a operacao.'
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

export function MemberFamilyRelationshipsSection({
  selectedMember,
  onRelationshipsChanged,
}: MemberFamilyRelationshipsSectionProps) {
  const queryClient = useQueryClient()
  const [relatedMemberId, setRelatedMemberId] = useState('')
  const [relationshipType, setRelationshipType] = useState<RelationshipFormType | ''>('')
  const [notes, setNotes] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const relationshipsQuery = useQuery({
    queryKey: ['member-relationships', selectedMember.id],
    queryFn: () =>
      api.get<{ items: RelationshipItem[] }>(`/members/${selectedMember.id}/relationships`).then((response) => response.data),
  })

  const optionsQuery = useQuery({
    queryKey: ['member-relationship-options', selectedMember.id],
    queryFn: () =>
      api
        .get<{ items: RelationshipOption[] }>(`/members/${selectedMember.id}/relationship-options`)
        .then((response) => response.data),
  })

  useEffect(() => {
    setRelatedMemberId('')
    setRelationshipType('')
    setNotes('')
    setFeedback(null)
  }, [selectedMember.id])

  const createMutation = useMutation({
    mutationFn: () =>
      api
        .post<{ item: RelationshipItem }>(`/members/${selectedMember.id}/relationships`, {
          relatedMemberId,
          type: relationshipType,
          notes: notes.trim() || undefined,
        })
        .then((response) => response.data),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Vinculo familiar cadastrado com sucesso.' })
      setRelatedMemberId('')
      setRelationshipType('')
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['member-relationships', selectedMember.id] })
      onRelationshipsChanged()
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (relationshipId: string) => api.delete(`/members/${selectedMember.id}/relationships/${relationshipId}`),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Vinculo familiar removido com sucesso.' })
      queryClient.invalidateQueries({ queryKey: ['member-relationships', selectedMember.id] })
      onRelationshipsChanged()
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getErrorMessage(error) })
    },
  })

  const relationships = relationshipsQuery.data?.items.filter((item) => item.member) ?? []
  const relatedOptions = optionsQuery.data?.items ?? []
  const isBusy = createMutation.isPending || deleteMutation.isPending

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          Familia e vinculos
        </Badge>
        <CardTitle>Mapa familiar de {selectedMember.fullName}</CardTitle>
        <CardDescription>
          Registre parentescos e visualize a rede familiar do membro selecionado sem duplicar a mesma relacao dos dois lados.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(23rem,0.9fr)]">
        <div className="space-y-4">
          <RelationshipGraph currentMember={selectedMember} relationships={relationships} />

          <div className="surface-subtle space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Vinculos cadastrados</p>
                <p className="text-sm text-muted-foreground">
                  {relationships.length === 0
                    ? 'Nenhum vinculo registrado ainda.'
                    : `${relationships.length} vinculo${relationships.length === 1 ? '' : 's'} familiar${relationships.length === 1 ? '' : 'es'} encontrado${relationships.length === 1 ? '' : 's'}.`}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Network className="h-4 w-4" />
              </div>
            </div>

            {relationships.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-surface/70 px-4 py-5 text-sm text-muted-foreground">
                Selecione um membro relacionado ao lado para iniciar o mapa familiar.
              </div>
            )}

            {relationships.map((relationship) => (
              <div
                key={relationship.id}
                className="rounded-[1.25rem] border border-border/60 bg-surface/80 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">{relationship.label}</Badge>
                      {relationship.member && (
                        <Badge variant={getStatusBadgeVariant(relationship.member.status)}>
                          {labels.statusMembro[relationship.member.status]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {relationship.member?.preferredName ?? relationship.member?.fullName ?? 'Membro sem cadastro'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {relationship.member?.branchName ?? 'Filial nao informada'}
                    </p>
                    {relationship.notes && <p className="text-sm leading-6 text-muted-foreground">{relationship.notes}</p>}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isBusy}
                    onClick={() => deleteMutation.mutate(relationship.id)}
                    aria-label="Remover vinculo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-subtle space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Novo vinculo familiar</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Informe o parentesco a partir da perspectiva de {selectedMember.preferredName ?? selectedMember.fullName}.
              </p>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="relationship-member">Membro relacionado</Label>
            <Select
              id="relationship-member"
              value={relatedMemberId}
              onChange={(event) => setRelatedMemberId(event.target.value)}
            >
              <option value="">Selecione</option>
              {relatedOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.fullName} · {option.branchName}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship-type">Tipo de vinculo</Label>
            <Select
              id="relationship-type"
              value={relationshipType}
              onChange={(event) => setRelationshipType(event.target.value as RelationshipFormType | '')}
            >
              <option value="">Selecione</option>
              {relationshipTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship-notes">Observacoes</Label>
            <Textarea
              id="relationship-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: casamento celebrado em 2014, responsavel legal, observacao interna."
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={isBusy || !relatedMemberId || !relationshipType}
            onClick={() => {
              setFeedback(null)
              createMutation.mutate()
            }}
          >
            <Plus className="h-4 w-4" />
            Adicionar vinculo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface RelationshipGraphProps {
  currentMember: SelectedMemberSummary
  relationships: RelationshipItem[]
}

function RelationshipGraph({ currentMember, relationships }: RelationshipGraphProps) {
  const visibleRelationships = relationships.slice(0, 8)

  if (visibleRelationships.length === 0) {
    return (
      <div className="surface-subtle flex min-h-[22rem] items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-sm font-semibold text-foreground">Graph familiar pronto para uso</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Assim que os vinculos forem cadastrados, esta area passa a exibir o membro no centro e os parentes conectados ao redor.
          </p>
        </div>
      </div>
    )
  }

  const width = 720
  const height = 380
  const centerX = width / 2
  const centerY = height / 2
  const radiusX = 220
  const radiusY = 120

  const positionedRelationships = visibleRelationships.map((relationship, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / visibleRelationships.length
    const x = centerX + Math.cos(angle) * radiusX
    const y = centerY + Math.sin(angle) * radiusY
    const midX = centerX + Math.cos(angle) * (radiusX * 0.52)
    const midY = centerY + Math.sin(angle) * (radiusY * 0.52)

    return { relationship, x, y, midX, midY }
  })

  return (
    <div className="surface-subtle overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Graph da rede familiar</p>
          <p className="text-sm text-muted-foreground">
            Visualizacao centrada em {currentMember.preferredName ?? currentMember.fullName}.
          </p>
        </div>
        {relationships.length > visibleRelationships.length && (
          <Badge variant="outline">+{relationships.length - visibleRelationships.length} vinculos na lista</Badge>
        )}
      </div>

      <div className="relative overflow-x-auto">
        <div className="relative mx-auto h-[23.75rem] min-w-[45rem]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {positionedRelationships.map(({ relationship, x, y, midX, midY }) => (
              <g key={relationship.id}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-border"
                />
                <circle cx={midX} cy={midY} r="22" className="fill-surface stroke-border" />
                <text
                  x={midX}
                  y={midY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[9px] font-semibold uppercase tracking-[0.12em]"
                >
                  {relationship.label.length > 14 ? `${relationship.label.slice(0, 14)}...` : relationship.label}
                </text>
              </g>
            ))}
          </svg>

          <div
            className="absolute left-1/2 top-1/2 w-56 -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4 shadow-panel"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{currentMember.preferredName ?? currentMember.fullName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{currentMember.branch.name}</p>
              </div>
            </div>
          </div>

          {positionedRelationships.map(({ relationship, x, y }) => (
            <div
              key={`${relationship.id}-card`}
              className="absolute w-44 -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] border border-border/60 bg-surface/95 p-3 shadow-sm shadow-slate-950/5"
              style={{ left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%` }}
            >
              <div className="space-y-2">
                <Badge variant="info" className="max-w-full">
                  {relationship.label}
                </Badge>
                <p className="text-sm font-semibold text-foreground">
                  {relationship.member?.preferredName ?? relationship.member?.fullName ?? 'Membro'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{relationship.member?.branchName ?? 'Filial'}</span>
                  {relationship.member && (
                    <Badge variant={getStatusBadgeVariant(relationship.member.status)}>
                      {labels.statusMembro[relationship.member.status]}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
