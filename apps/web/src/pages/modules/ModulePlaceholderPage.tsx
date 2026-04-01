import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, LayoutTemplate, Sparkles } from 'lucide-react'
import { findNavigationItem } from '@/config/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ModulePlaceholderPage() {
  const location = useLocation()
  const item = findNavigationItem(location.pathname)

  if (!item) return null

  return (
    <div className="page-grid">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] xl:px-8 xl:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Em implantação</Badge>
              <Badge variant="secondary">Layout pronto para escalar</Badge>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {item.label}
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">{item.description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao dashboard
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/configuracoes">Ver base do sistema</Link>
              </Button>
            </div>
          </div>

          <div className="surface-subtle p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status do módulo</p>
            <p className="mt-3 text-lg font-semibold text-foreground">Estrutura navegável ativa</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A navegação, o shell responsivo e a linguagem visual já estão prontos para receber listagens, formulários
              e dashboards específicos deste contexto.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="grid gap-4 md:grid-cols-3">
          {item.highlights.map((highlight) => (
            <Card key={highlight}>
              <CardContent className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{highlight}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O design system já considera responsividade, foco visual e expansão consistente para esta área.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              Próxima implementação
            </Badge>
            <CardTitle>Checklist de UX para este módulo</CardTitle>
            <CardDescription>
              O padrão aplicado nesta fase reduz trabalho repetido quando as telas reais forem criadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              'Listagem com densidade equilibrada para desktop e mobile.',
              'Filtros e ações no topo sem sacrificar legibilidade.',
              'Detalhes e formulários reutilizando os mesmos componentes-base.',
            ].map((itemText) => (
              <div key={itemText} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{itemText}</p>
              </div>
            ))}

            <div className="surface-subtle flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Aplicação progressiva</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  A ideia é levar este mesmo padrão para tabelas, filtros e formulários complexos sem perder clareza.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <Link to="/dashboard">
                Continuar para o dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
