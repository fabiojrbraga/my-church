import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { labels } from '@my-church/shared'
import { Link2, Minus, Move, Network, Plus, RefreshCcw, Trash2, UserRound } from 'lucide-react'
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
  onNavigateToMember: (memberId: string) => void
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
  onNavigateToMember,
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
          <RelationshipGraph
            currentMember={selectedMember}
            relationships={relationships}
            onNavigateToMember={onNavigateToMember}
          />

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
  onNavigateToMember: (memberId: string) => void
}

const GRAPH_PADDING = 40
const GRAPH_CARD_WIDTH = 188
const GRAPH_CARD_HEIGHT = 102
const GRAPH_CENTER_CARD_WIDTH = 236
const GRAPH_CENTER_CARD_HEIGHT = 118
const GRAPH_BASE_RADIUS_X = 190
const GRAPH_BASE_RADIUS_Y = 140
const GRAPH_RADIUS_STEP_X = 120
const GRAPH_RADIUS_STEP_Y = 95

interface GraphTransform {
  x: number
  y: number
  scale: number
}

interface PositionedRelationship {
  relationship: RelationshipItem
  x: number
  y: number
  labelX: number
  labelY: number
  controlX: number
  controlY: number
  ringIndex: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getRelationshipName(relationship: RelationshipItem) {
  return relationship.member?.preferredName ?? relationship.member?.fullName ?? 'Membro sem cadastro'
}

function truncateLabel(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value
}

function getGraphStatusClasses(status: MemberStatusKey) {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'INACTIVE':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'TRANSFERRED':
      return 'border-sky-200 bg-sky-50 text-sky-700'
    case 'DECEASED':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

function buildGraphLayout(relationships: RelationshipItem[]) {
  const rings: RelationshipItem[][] = []
  let currentIndex = 0
  let ringCapacity = 6

  while (currentIndex < relationships.length) {
    const nextIndex = currentIndex + ringCapacity
    rings.push(relationships.slice(currentIndex, nextIndex))
    currentIndex = nextIndex
    ringCapacity += 4
  }

  const ringCount = rings.length
  const maxRadiusX = ringCount > 0 ? GRAPH_BASE_RADIUS_X + GRAPH_RADIUS_STEP_X * (ringCount - 1) : 0
  const maxRadiusY = ringCount > 0 ? GRAPH_BASE_RADIUS_Y + GRAPH_RADIUS_STEP_Y * (ringCount - 1) : 0

  const worldWidth = Math.max(
    980,
    GRAPH_CENTER_CARD_WIDTH + 2 * (maxRadiusX + GRAPH_CARD_WIDTH / 2 + GRAPH_PADDING),
  )
  const worldHeight = Math.max(
    720,
    GRAPH_CENTER_CARD_HEIGHT + 2 * (maxRadiusY + GRAPH_CARD_HEIGHT / 2 + GRAPH_PADDING),
  )
  const centerX = worldWidth / 2
  const centerY = worldHeight / 2

  const positionedRelationships = rings.flatMap((ring, ringIndex) => {
    const radiusX = GRAPH_BASE_RADIUS_X + GRAPH_RADIUS_STEP_X * ringIndex
    const radiusY = GRAPH_BASE_RADIUS_Y + GRAPH_RADIUS_STEP_Y * ringIndex

    return ring.map((relationship, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / ring.length
      const x = centerX + Math.cos(angle) * radiusX
      const y = centerY + Math.sin(angle) * radiusY
      const labelX = centerX + Math.cos(angle) * (radiusX * 0.56)
      const labelY = centerY + Math.sin(angle) * (radiusY * 0.56)
      const controlX = centerX + Math.cos(angle) * (radiusX * 0.36)
      const controlY = centerY + Math.sin(angle) * (radiusY * 0.36)

      return { relationship, x, y, labelX, labelY, controlX, controlY, ringIndex }
    })
  })

  return {
    worldWidth,
    worldHeight,
    centerX,
    centerY,
    positionedRelationships,
  }
}

function RelationshipGraph({ currentMember, relationships, onNavigateToMember }: RelationshipGraphProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState<GraphTransform>({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [hoveredRelationshipId, setHoveredRelationshipId] = useState<string | null>(null)

  const layout = useMemo(() => buildGraphLayout(relationships), [relationships])
  const hoveredRelationship =
    relationships.find((relationship) => relationship.id === hoveredRelationshipId) ?? null

  const fitGraph = useCallback(() => {
    if (!viewportSize.width || !viewportSize.height) return

    const nextScale = clamp(
      Math.min(
        (viewportSize.width - GRAPH_PADDING * 2) / layout.worldWidth,
        (viewportSize.height - GRAPH_PADDING * 2) / layout.worldHeight,
      ),
      0.58,
      1.12,
    )

    setTransform({
      scale: nextScale,
      x: (viewportSize.width - layout.worldWidth * nextScale) / 2,
      y: (viewportSize.height - layout.worldHeight * nextScale) / 2,
    })
  }, [layout.worldHeight, layout.worldWidth, viewportSize.height, viewportSize.width])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const resizeObserver = new ResizeObserver(([entry]) => {
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    resizeObserver.observe(viewport)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    fitGraph()
  }, [fitGraph])

  const zoomAtPoint = useCallback((pointX: number, pointY: number, multiplier: number) => {
    setTransform((current) => {
      const nextScale = clamp(current.scale * multiplier, 0.48, 1.8)

      if (nextScale === current.scale) return current

      const worldX = (pointX - current.x) / current.scale
      const worldY = (pointY - current.y) / current.scale

      return {
        scale: nextScale,
        x: pointX - worldX * nextScale,
        y: pointY - worldY * nextScale,
      }
    })
  }, [])

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault()

      const bounds = event.currentTarget.getBoundingClientRect()
      const pointX = event.clientX - bounds.left
      const pointY = event.clientY - bounds.top
      const multiplier = event.deltaY < 0 ? 1.12 : 1 / 1.12

      zoomAtPoint(pointX, pointY, multiplier)
    },
    [zoomAtPoint],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('[data-graph-node="true"]')) {
        return
      }

      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: transform.x,
        originY: transform.y,
      }

      setIsPanning(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [transform.x, transform.y],
  )

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current

    if (!dragState || dragState.pointerId !== event.pointerId) return

    setTransform((current) => ({
      ...current,
      x: dragState.originX + (event.clientX - dragState.startX),
      y: dragState.originY + (event.clientY - dragState.startY),
    }))
  }, [])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current

    if (!dragState || dragState.pointerId !== event.pointerId) return

    dragStateRef.current = null
    setIsPanning(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  if (relationships.length === 0) {
    return (
      <div className="surface-subtle flex min-h-[22rem] items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <p className="text-sm font-semibold text-foreground">Mapa interativo pronto para uso</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Assim que os vinculos forem cadastrados, esta area passa a exibir o membro no centro e os parentes conectados ao redor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="surface-subtle overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Mapa interativo da rede familiar</p>
          <p className="text-sm text-muted-foreground">
            Role o mouse para zoom, arraste o fundo para navegar e clique em um parente para abrir o cadastro dele.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {Math.round(transform.scale * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Reduzir zoom"
            onClick={() => zoomAtPoint(viewportSize.width / 2, viewportSize.height / 2, 1 / 1.12)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Aumentar zoom"
            onClick={() => zoomAtPoint(viewportSize.width / 2, viewportSize.height / 2, 1.12)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="Recentralizar mapa" onClick={fitGraph}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative h-[34rem] overflow-hidden rounded-lg border border-border/60 bg-background/80 ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={fitGraph}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-lg border border-border/60 bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm shadow-slate-950/5">
          <Move className="h-3.5 w-3.5 text-primary" />
          <span>Duplo clique recentra o mapa</span>
        </div>

        <div
          className="absolute left-0 top-0"
          style={{
            width: layout.worldWidth,
            height: layout.worldHeight,
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: 'top left',
            willChange: 'transform',
          }}
        >
          <svg
            viewBox={`0 0 ${layout.worldWidth} ${layout.worldHeight}`}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="familyGraphGlow" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.16)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0)" />
              </radialGradient>
            </defs>

            <circle cx={layout.centerX} cy={layout.centerY} r="120" fill="url(#familyGraphGlow)" />

            {layout.positionedRelationships.map(({ relationship, x, y, labelX, labelY, controlX, controlY }) => {
              const isHovered = hoveredRelationshipId === relationship.id

              return (
                <g key={relationship.id}>
                  <path
                    d={`M ${layout.centerX} ${layout.centerY} Q ${controlX} ${controlY} ${x} ${y}`}
                    fill="none"
                    stroke={isHovered ? '#2563eb' : '#94a3b8'}
                    strokeOpacity={isHovered ? 0.78 : 0.46}
                    strokeWidth={isHovered ? 4 : 2.5}
                    strokeLinecap="round"
                  />
                  <circle cx={labelX} cy={labelY} r={isHovered ? 18 : 16} fill={isHovered ? '#dbeafe' : '#eff6ff'} />
                </g>
              )
            })}
          </svg>

          <div
            className="absolute rounded-lg border border-primary/30 bg-white/96 p-4 shadow-lg shadow-slate-950/10"
            style={{
              width: GRAPH_CENTER_CARD_WIDTH,
              minHeight: GRAPH_CENTER_CARD_HEIGHT,
              left: layout.centerX - GRAPH_CENTER_CARD_WIDTH / 2,
              top: layout.centerY - GRAPH_CENTER_CARD_HEIGHT / 2,
              zIndex: 12,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                  Membro central
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {currentMember.preferredName ?? currentMember.fullName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{currentMember.branch.name}</p>
                </div>
              </div>
            </div>
          </div>

          {layout.positionedRelationships.map(({ relationship, labelX, labelY }) => {
            const isHovered = hoveredRelationshipId === relationship.id

            return (
              <div
                key={`${relationship.id}-label`}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  isHovered
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'border border-sky-200 bg-sky-50 text-sky-700'
                }`}
                style={{ left: labelX, top: labelY, zIndex: 5 }}
              >
                {truncateLabel(relationship.label, 18)}
              </div>
            )
          })}

          {layout.positionedRelationships.map(({ relationship, x, y, ringIndex }) => {
            const member = relationship.member
            const isHovered = hoveredRelationshipId === relationship.id

            return (
              <button
                key={`${relationship.id}-card`}
                type="button"
                data-graph-node="true"
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white/96 p-3 text-left shadow-sm transition-all duration-200 ${
                  isHovered
                    ? 'border-primary/40 shadow-lg shadow-primary/15'
                    : 'border-border/70 shadow-slate-950/5 hover:border-primary/30 hover:shadow-md'
                }`}
                style={{
                  width: GRAPH_CARD_WIDTH,
                  minHeight: GRAPH_CARD_HEIGHT,
                  left: x,
                  top: y,
                  zIndex: isHovered ? 14 : ringIndex + 2,
                }}
                onMouseEnter={() => setHoveredRelationshipId(relationship.id)}
                onMouseLeave={() => setHoveredRelationshipId((current) => (current === relationship.id ? null : current))}
                onFocus={() => setHoveredRelationshipId(relationship.id)}
                onBlur={() => setHoveredRelationshipId((current) => (current === relationship.id ? null : current))}
                onClick={() => {
                  if (member) {
                    onNavigateToMember(member.id)
                  }
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
                      {truncateLabel(relationship.label, 18)}
                    </span>
                    {member && (
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${getGraphStatusClasses(member.status)}`}
                      >
                        {labels.statusMembro[member.status]}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">{getRelationshipName(relationship)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{member?.branchName ?? 'Filial nao informada'}</p>
                  </div>

                  <p className="text-[11px] font-medium text-primary/85">Abrir cadastro</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
        <p className="max-w-2xl leading-5">
          O mapa abre centralizado no membro atual. Use a lista de vinculos abaixo para detalhes completos e o mapa para explorar rapidamente as conexoes familiares.
        </p>
        {hoveredRelationship && (
          <p className="max-w-md leading-5 text-foreground">
            <span className="font-semibold">{getRelationshipName(hoveredRelationship)}</span>
            {hoveredRelationship.notes ? ` · ${hoveredRelationship.notes}` : ` · ${hoveredRelationship.label}`}
          </p>
        )}
      </div>
    </div>
  )
}
