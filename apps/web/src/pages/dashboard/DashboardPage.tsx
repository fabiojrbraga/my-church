import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { api } from '@/lib/api'
import { quickActionItems } from '@/config/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { labels } from '@my-church/shared'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

interface AuthMeResponse {
  id: string
  email: string
  role: keyof typeof labels.papelUsuario
  isActive: boolean
  lastLoginAt: string | null
  branch: {
    name: string
    type: keyof typeof labels.tipoFilial
  }
  person: {
    fullName: string | null
    phone: string | null
    photoUrl: string | null
  } | null
}

function formatLastAccess(value: string | null | undefined) {
  if (!value) return 'Primeira sessão registrada'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function DashboardPage() {
  const authUser = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<AuthMeResponse>('/auth/me').then((response) => response.data),
  })

  const displayName = data?.person?.fullName ?? authUser?.name ?? 'Administrador'
  const role = data?.role ?? (authUser?.role as keyof typeof labels.papelUsuario | undefined)
  const branchName = data?.branch?.name ?? 'Unidade principal'
  const branchType = data?.branch?.type

  const overviewCards = [
    {
      label: 'Perfil de acesso',
      value: role ? labels.papelUsuario[role] : 'Equipe',
      description: 'Permissões aplicadas à sessão atual',
      icon: ShieldCheck,
      tone: 'info' as const,
    },
    {
      label: 'Unidade atual',
      value: branchName,
      description: branchType ? labels.tipoFilial[branchType] : 'Escopo em carregamento',
      icon: Building2,
      tone: 'warning' as const,
    },
    {
      label: 'Contato principal',
      value: data?.email ?? authUser?.email ?? 'Conta autenticada',
      description: data?.isActive === false ? 'Conta sinalizada como inativa' : 'Conta habilitada para operação',
      icon: Users,
      tone: data?.isActive === false ? ('warning' as const) : ('success' as const),
    },
    {
      label: 'Último acesso',
      value: isLoading ? 'Carregando...' : formatLastAccess(data?.lastLoginAt),
      description: 'Acompanhamento de sessão e auditoria operacional',
      icon: Layers3,
      tone: 'secondary' as const,
    },
  ]

  return (
    <div className="page-grid">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] xl:px-8 xl:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Dashboard operacional</Badge>
              <Badge variant={data?.isActive === false ? 'warning' : 'success'}>
                {data?.isActive === false ? 'Conta com atenção' : 'Sessão autenticada'}
              </Badge>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Olá, {displayName.split(' ')[0]}.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                O painel foi reorganizado como base do novo design system: navegação clara, superfícies mais leves e
                uma estrutura consistente para crescer com membros, eventos, escalas e tesouraria.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/membros">
                  Explorar módulos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/configuracoes">Ajustar preferências</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="surface-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Unidade</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{branchName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {branchType ? labels.tipoFilial[branchType] : 'Escopo operacional ativo'}
              </p>
            </div>

            <div className="surface-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Perfil</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {role ? labels.papelUsuario[role] : 'Equipe administrativa'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Permissões e navegação alinhadas à sessão atual.</p>
            </div>

            <div className="surface-subtle p-4 sm:col-span-2 xl:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Próximo passo</p>
              <p className="mt-3 text-lg font-semibold text-foreground">Expandir módulos com a mesma linguagem</p>
              <p className="mt-1 text-sm text-muted-foreground">
                O shell responsivo e os componentes base já estão prontos para receber as próximas telas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="grid gap-4 md:grid-cols-2">
          {overviewCards.map(({ label, value, description, icon: Icon, tone }) => (
            <Card key={label}>
              <CardContent className="flex h-full flex-col justify-between gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-lg font-semibold leading-7 text-foreground">{value}</p>
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      tone === 'info'
                        ? 'bg-info/10 text-info'
                        : tone === 'warning'
                          ? 'bg-warning/10 text-warning-foreground'
                          : tone === 'success'
                            ? 'bg-success/10 text-success'
                            : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Padrões aplicados
            </Badge>
            <CardTitle>Base visual pronta para expansão</CardTitle>
            <CardDescription>
              Esta primeira iteração reorganiza o frontend usando padrões de app shell, tokens semânticos e
              componentes reutilizáveis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              'Navegação lateral fixa no desktop e drawer no mobile.',
              'Tokens de cor, superfícies e foco alinhados para consistência.',
              'Rotas de módulo com placeholders funcionais em vez de links quebrados.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Estrutura aplicada para aumentar clareza visual e reduzir atrito conforme o produto crescer.
                  </p>
                </div>
              </div>
            ))}

            <div className="surface-subtle flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Próxima etapa recomendada</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Levar este padrão para páginas de listagem, formulários e detalhes de cada módulo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acessos rápidos</CardTitle>
          <CardDescription>
            Cada módulo já responde dentro do novo shell e serve como base para a próxima fase de implementação.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActionItems.map(({ label, to, icon: Icon, status, description }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-[1.5rem] border border-border/60 bg-surface/75 p-4 shadow-sm shadow-slate-950/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-panel"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={status === 'active' ? 'success' : 'warning'}>
                  {status === 'active' ? 'Pronto' : 'Preview'}
                </Badge>
              </div>

              <div className="mt-5">
                <p className="text-base font-semibold text-foreground">{label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
                Abrir módulo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
