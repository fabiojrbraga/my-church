import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Church,
  Clock,
  ExternalLink,
  HandHeart,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminLoginUrl } from '@/config/links'
import { useBranding } from '@/components/BrandingProvider'
import { getReadableTextColor } from '@/lib/branding'

interface PublicItem {
  title: string
  description: string
  icon: LucideIcon
}

interface UsefulLink extends PublicItem {
  href: string
}

const menuItems = [
  { href: '#sobre', label: 'Sobre' },
  { href: '#programacao', label: 'Programacao' },
  { href: '#ministerios', label: 'Ministerios' },
  { href: '/pix', label: 'Pix' },
  { href: '#links-uteis', label: 'Links uteis' },
  { href: '#contato', label: 'Contato' },
]

const institutionHighlights: PublicItem[] = [
  {
    title: 'Comunidade aberta',
    description: 'Um ambiente de acolhimento para familias, visitantes e pessoas em busca de cuidado espiritual.',
    icon: HeartHandshake,
  },
  {
    title: 'Vida em comunhao',
    description: 'Cultos, encontros e atividades publicas pensados para aproximar pessoas e fortalecer vinculos.',
    icon: Users,
  },
  {
    title: 'Servico e cuidado',
    description: 'Ministerios, atendimento pastoral e acoes sociais conectam a igreja as necessidades da comunidade.',
    icon: HandHeart,
  },
]

const scheduleItems: PublicItem[] = [
  {
    title: 'Cultos e celebracoes',
    description: 'Acompanhe a programacao aberta ao publico e os encontros regulares da igreja.',
    icon: Church,
  },
  {
    title: 'Agenda de eventos',
    description: 'Conferencias, cursos, encontros por faixa etaria e atividades especiais em um so lugar.',
    icon: CalendarDays,
  },
  {
    title: 'Atendimento pastoral',
    description: 'Canais para pedido de apoio, orientacao e encaminhamento para a equipe responsavel.',
    icon: MessageCircle,
  },
]

const ministryItems: PublicItem[] = [
  {
    title: 'Familias e pequenos grupos',
    description: 'Espacos de convivencia para criancas, jovens, casais e adultos durante a semana.',
    icon: Users,
  },
  {
    title: 'Ensino e discipulado',
    description: 'Classes, trilhas de formacao e conteudos para quem deseja conhecer melhor a fe crista.',
    icon: BookOpen,
  },
  {
    title: 'Voluntariado',
    description: 'Oportunidades para servir nas areas de recepcao, cuidado, louvor, midia e apoio comunitario.',
    icon: HandHeart,
  },
]

const usefulLinks: UsefulLink[] = [
  {
    href: '/pix',
    title: 'Pix identificado',
    description: 'Acesse codigos oficiais, copie para o banco ou baixe o banner com QR code.',
    icon: HandHeart,
  },
  {
    href: '#contato',
    title: 'Pedido de oracao',
    description: 'Envie uma solicitacao para que a equipe pastoral possa acompanhar sua necessidade.',
    icon: MessageCircle,
  },
  {
    href: '#ministerios',
    title: 'Servir como voluntario',
    description: 'Conheca areas de atuacao e caminhos para participar da rotina da igreja.',
    icon: HandHeart,
  },
  {
    href: '#contato',
    title: 'Contato da secretaria',
    description: 'Encontre os canais oficiais para informacoes, atendimento e atualizacao de cadastro.',
    icon: Mail,
  },
]

function PublicInfoCard({ title, description, icon: Icon }: PublicItem) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
      <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold tracking-normal text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  )
}

function UsefulLinkCard({ title, description, href, icon: Icon }: UsefulLink) {
  return (
    <a
      href={href}
      className="group flex h-full flex-col rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-panel"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <ExternalLink className="h-4 w-4 text-slate-400 transition-colors duration-200 group-hover:text-primary" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold tracking-normal text-slate-950">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        Acessar
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </a>
  )
}

export function PublicHomePage() {
  const branding = useBranding()
  const logo = branding.logoUrl ?? branding.iconUrl
  const heroImageUrl = branding.heroImageUrl ?? '/images/public-home-hero.png'
  const logoForegroundColor = getReadableTextColor(branding.logoBackgroundColor)
  const locationLabel = [branding.contact.addressLine, branding.contact.city, branding.contact.state]
    .filter(Boolean)
    .join(' - ')
  const serviceContact = branding.contact.publicPhone ?? branding.contact.publicWhatsapp
  const messageContact = branding.contact.publicEmail ?? branding.contact.websiteUrl

  return (
    <div className="min-h-screen bg-background text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="flex min-w-0 items-center gap-3" aria-label={`${branding.shortName} pagina inicial`}>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-slate-200/70"
              style={{ backgroundColor: branding.logoBackgroundColor, color: logoForegroundColor }}
            >
              {logo ? <img src={logo} alt="" className="h-7 w-7 object-contain" /> : <Church className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold tracking-normal text-slate-950">{branding.shortName}</p>
              <p className="truncate text-xs font-medium text-slate-500">
                {branding.slogan ?? 'Instituicao e comunidade'}
              </p>
            </div>
          </a>

          <div className="ml-auto hidden items-center gap-1 md:flex">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-[8px] px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </a>
            ))}
          </div>

          <Button asChild size="md" className="ml-auto md:ml-2">
            <a href={adminLoginUrl}>
              Entrar
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </nav>

        <div className="border-t border-slate-200/80 md:hidden">
          <div className="flex gap-1 overflow-x-auto px-4 py-2">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-[8px] px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[calc(100svh-8rem)] overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Pessoas chegando em um ambiente acolhedor da igreja"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.84)_0%,rgba(15,23,42,0.66)_42%,rgba(15,23,42,0.16)_82%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <Badge variant="outline" className="border-white/25 bg-white/10 text-white">
                Aberta ao publico
              </Badge>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
                {branding.displayName}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
                {branding.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a href={adminLoginUrl}>
                    Entrar
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="secondary" size="lg" className="bg-white/90 text-slate-950 hover:bg-white">
                  <a href="#sobre">Conhecer a instituicao</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
            <div>
              <Badge variant="success" className="w-fit">
                Sobre a instituicao
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl">
                Informacoes publicas para quem deseja conhecer a igreja.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Esta pagina reune conteudos de interesse geral: apresentacao institucional, programacao publica,
                ministerios, formas de contato e caminhos uteis para visitantes, membros e comunidade local.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {institutionHighlights.map((item) => (
                <PublicInfoCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section id="programacao" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <Badge variant="info" className="w-fit">
                  Programacao publica
                </Badge>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl">
                  Cultos, encontros e eventos em destaque.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-600">
                A agenda pode ser conectada ao modulo administrativo de eventos quando a publicacao online estiver
                habilitada.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {scheduleItems.map((item) => (
                <PublicInfoCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section id="ministerios" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-white text-emerald-700 shadow-sm shadow-emerald-950/5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-normal text-slate-950">
                Caminhos para participar com clareza.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                O menu publico destaca areas de cuidado, ensino e servico. A administracao continua protegida no
                painel interno para manter dados sensiveis separados da comunicacao publica.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {ministryItems.map((item) => (
                <PublicInfoCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section id="links-uteis" className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-2xl">
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white/80">
                Links uteis
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-normal text-white sm:text-4xl">
                Acessos rapidos para visitantes e comunidade.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {usefulLinks.map((item) => (
                <UsefulLinkCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div>
              <Badge variant="secondary" className="w-fit">
                Contato
              </Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl">
                Canais oficiais de {branding.shortName}.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Use esta area para orientar visitantes sobre secretaria, localizacao, atendimento pastoral e canais de
                comunicacao oficiais.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[8px] border border-slate-200 bg-white p-5">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-display text-base font-semibold tracking-normal text-slate-950">
                  Localizacao
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {locationLabel || 'Endereco e orientacoes de chegada podem ser publicados aqui.'}
                </p>
              </div>
              <div className="rounded-[8px] border border-slate-200 bg-white p-5">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-display text-base font-semibold tracking-normal text-slate-950">
                  Atendimento
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {serviceContact || 'Horarios da secretaria e canais de suporte ficam disponiveis ao publico.'}
                </p>
              </div>
              <div className="rounded-[8px] border border-slate-200 bg-white p-5">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="mt-4 font-display text-base font-semibold tracking-normal text-slate-950">
                  Mensagens
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {messageContact || 'Direcione pedidos de informacao, visitas, oracao e contato pastoral.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{branding.shortName} - informacoes publicas da instituicao.</p>
          <a href={adminLoginUrl} className="inline-flex items-center gap-2 font-semibold text-primary">
            Entrar na administracao
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </footer>
    </div>
  )
}
