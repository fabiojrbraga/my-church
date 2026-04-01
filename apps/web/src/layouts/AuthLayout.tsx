import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import { Church, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

const designHighlights = [
  {
    title: 'Operação clara',
    description: 'Fluxos pensados para reduzir atrito em cadastros, eventos e tesouraria.',
    icon: Workflow,
  },
  {
    title: 'Segurança e contexto',
    description: 'Autenticação, escopo por unidade e expansão preparada para permissões.',
    icon: ShieldCheck,
  },
  {
    title: 'Design escalável',
    description: 'Tokens, componentes e layout responsivo para crescer sem perder consistência.',
    icon: Sparkles,
  },
]

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="relative min-h-screen overflow-hidden bg-sidebar text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.18),transparent_22%)]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
        <section className="hidden border-r border-white/10 px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-black/15">
              <Church className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight text-white">MyChurch</p>
              <p className="text-sm text-white/60">Plataforma operacional da igreja</p>
            </div>
          </div>

          <div className="max-w-xl space-y-8">
            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80">
              Design System Web
            </Badge>

            <div className="space-y-4">
              <h1 className="font-display text-4xl font-semibold leading-tight text-balance text-white xl:text-5xl">
                Um app shell moderno para uma operação administrativa simples e intuitiva.
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/68">
                A base visual da aplicação foi reorganizada para telas grandes e pequenas, com navegação clara,
                superfícies consistentes e componentes preparados para crescer junto com os módulos do ERP.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {designHighlights.map(({ title, description, icon: Icon }) => (
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
            <p className="text-sm font-medium text-white/70">Base de design aplicada</p>
            <p className="mt-2 text-lg font-light leading-8 text-white">
              “Tokens semânticos, navegação responsiva e componentes reutilizáveis para reduzir inconsistência e
              acelerar a evolução das próximas telas.”
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-[28rem] animate-scale-in rounded-[2rem] border border-white/10 bg-background/94 p-5 text-foreground shadow-soft backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
                <Church className="h-4 w-4" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">MyChurch</p>
                <p className="text-sm text-muted-foreground">Painel administrativo</p>
              </div>
            </div>

            <Outlet />
          </div>
        </section>
      </div>
    </div>
  )
}
