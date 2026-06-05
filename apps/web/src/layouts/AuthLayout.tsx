import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useBranding } from '@/components/BrandingProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Church, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

const adminHighlights = [
  {
    title: 'Operacao clara',
    description: 'Fluxos pensados para reduzir atrito em cadastros, eventos e tesouraria.',
    icon: Workflow,
  },
  {
    title: 'Seguranca e contexto',
    description: 'Autenticacao, escopo por unidade e expansao preparada para permissoes.',
    icon: ShieldCheck,
  },
  {
    title: 'Rotina escalavel',
    description: 'Componentes e layout responsivo para crescer sem perder consistencia.',
    icon: Sparkles,
  },
]

const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'http://localhost:5174'

export function AuthLayout() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const branding = useBranding()
  const logo = branding.logoDarkUrl ?? branding.logoUrl
  const compactLogo = branding.iconUrl ?? branding.logoUrl

  if (accessToken && user) return <Navigate to="/dashboard" replace />

  return (
    <div className="relative min-h-screen overflow-hidden bg-sidebar text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.18),transparent_22%)]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
        <section className="hidden border-r border-white/10 px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-black/15">
              {logo ? (
                <img src={logo} alt="" className="h-8 w-8 object-contain" />
              ) : (
                <Church className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight text-white">{branding.shortName}</p>
              <p className="text-sm text-white/60">{branding.slogan ?? 'Plataforma operacional'}</p>
            </div>
          </div>

          <div className="max-w-xl space-y-8">
            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80">
              Acesso administrativo
            </Badge>

            <div className="space-y-4">
              <h1 className="font-display text-4xl font-semibold leading-tight text-balance text-white xl:text-5xl">
                Area interna para a operacao administrativa.
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/70">
                Use sua conta autorizada para acessar cadastros, filiais, membros, eventos, escalas, tesouraria e os
                demais modulos internos do sistema.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {adminHighlights.map(({ title, description, icon: Icon }) => (
                <div key={title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/60">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm font-medium text-white/70">Separacao entre publico e administrativo</p>
            <p className="mt-2 text-lg font-light leading-8 text-white">
              A pagina inicial publica apresenta {branding.shortName}. Esta area permanece reservada para a equipe autorizada.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-[28rem] animate-scale-in rounded-[2rem] border border-white/10 bg-background/95 p-5 text-foreground shadow-soft backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
                {compactLogo ? (
                  <img src={compactLogo} alt="" className="h-7 w-7 object-contain" />
                ) : (
                  <Church className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">{branding.shortName}</p>
                <p className="text-sm text-muted-foreground">Painel administrativo</p>
              </div>
            </div>

            <Outlet />

            <Button asChild variant="ghost" className="mt-6 w-full">
              <a href={publicSiteUrl}>Voltar para a pagina publica</a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
