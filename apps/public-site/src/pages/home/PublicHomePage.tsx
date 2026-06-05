import {
  ArrowRight,
  CalendarDays,
  Church,
  Clock,
  Construction,
  FileText,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Youtube,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBranding } from '@/components/BrandingProvider'
import { getReadableTextColor } from '@/lib/branding'

const serviceTimes = [
  {
    day: 'Domingos',
    time: '9h',
    title: 'Escola Bíblica Dominical (EBD)',
  },
  {
    day: 'Domingos',
    time: '18h',
    title: 'Culto',
  },
  {
    day: 'Quartas-feiras',
    time: '19h',
    title: 'Culto de Oração',
  },
]

function getWhatsappUrl(value: string | null) {
  if (!value) return null

  const trimmed = value.trim()

  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const digits = trimmed.replace(/\D/g, '')

  if (!digits) return null

  const internationalDigits = digits.startsWith('55') ? digits : `55${digits}`

  return `https://wa.me/${internationalDigits}`
}

export function PublicHomePage() {
  const branding = useBranding()
  const logo = branding.logoUrl ?? branding.iconUrl
  const heroImageUrl = branding.heroImageUrl ?? '/images/public-home-hero.png'
  const logoForegroundColor = getReadableTextColor(branding.logoBackgroundColor)
  const whatsappUrl = getWhatsappUrl(branding.contact.publicWhatsapp)
  const addressLabel = [branding.contact.addressLine, branding.contact.city, branding.contact.state]
    .filter(Boolean)
    .join(' - ')
  const footerItems = [
    { label: 'Nome', value: branding.legalName ?? branding.displayName, icon: Church },
    { label: 'CNPJ', value: branding.document, icon: FileText },
    { label: 'Endereço', value: addressLabel, icon: MapPin },
    { label: 'E-mail', value: branding.contact.publicEmail, icon: Mail },
    { label: 'Telefone', value: branding.contact.publicPhone, icon: Phone },
  ]
  const socialLinks = [
    {
      label: 'YouTube',
      href: branding.contact.youtubeUrl,
      icon: Youtube,
    },
    {
      label: 'Instagram',
      href: branding.contact.instagramUrl,
      icon: Instagram,
    },
    {
      label: 'WhatsApp',
      href: whatsappUrl,
      icon: MessageCircle,
    },
  ].filter((item) => item.href)

  return (
    <div className="min-h-screen bg-background text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label={`${branding.shortName} página inicial`}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-slate-200/70"
              style={{ backgroundColor: branding.logoBackgroundColor, color: logoForegroundColor }}
            >
              {logo ? (
                <img src={logo} alt="" className="h-7 w-7 object-contain" />
              ) : (
                <Church className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold tracking-normal text-slate-950">
                {branding.shortName}
              </p>
              <p className="truncate text-xs font-medium text-slate-500">
                {branding.slogan ?? 'Comunidade e informação pública'}
              </p>
            </div>
          </a>

          <div className="ml-auto hidden items-center gap-1 md:flex">
            <a
              href="/pix"
              className="rounded-[8px] px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              Pix
            </a>
          </div>

          <Button type="button" size="md" className="ml-auto md:ml-2">
            Entrar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </nav>

        <div className="border-t border-slate-200/80 md:hidden">
          <div className="flex px-4 py-2">
            <a
              href="/pix"
              className="rounded-[8px] bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-950"
            >
              Pix
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[calc(100svh-7.5rem)] overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Pessoas chegando em um ambiente acolhedor da igreja"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.86)_0%,rgba(15,23,42,0.68)_46%,rgba(15,23,42,0.2)_86%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-7.5rem)] w-full max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <Badge variant="outline" className="border-white/25 bg-white/10 text-white">
                Aberta ao público
              </Badge>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
                {branding.displayName}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
                {branding.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button type="button" size="lg">
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="bg-white/90 text-slate-950 hover:bg-white"
                >
                  <a href="#em-construcao">Conhecer instituição</a>
                </Button>
              </div>

              <div
                id="em-construcao"
                className="mt-6 inline-flex max-w-xl items-start gap-3 rounded-[8px] border border-white/20 bg-white/10 px-4 py-3 text-white shadow-sm shadow-slate-950/10 backdrop-blur"
              >
                <Construction className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium leading-6">
                  Esta página está em construção. Em breve teremos mais informações públicas sobre a
                  instituição.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="horarios-canais" className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft">
            <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <div className="p-5 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <Badge variant="secondary" className="w-fit">
                      Horários
                    </Badge>
                    <h2 className="mt-2 font-display text-2xl font-semibold tracking-normal text-slate-950">
                      Cultos e encontros
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {serviceTimes.map((item) => (
                    <div
                      key={`${item.day}-${item.time}`}
                      className="rounded-[8px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Clock className="h-4 w-4" />
                        <span>
                          {item.day} às {item.time}
                        </span>
                      </div>
                      <p className="mt-3 font-display text-lg font-semibold tracking-normal text-slate-950">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-950 p-5 text-white sm:p-7 lg:border-l lg:border-t-0">
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white/80">
                  Canais oficiais
                </Badge>
                <h2 className="mt-4 font-display text-2xl font-semibold tracking-normal text-white">
                  Acompanhe também online
                </h2>
                <div className="mt-5 grid gap-3">
                  {socialLinks.length > 0 ? (
                    socialLinks.map(({ href, icon: Icon, label }) => (
                      <a
                        key={label}
                        href={href ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        <span className="inline-flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ))
                  ) : (
                    <p className="rounded-[8px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white/70">
                      Os links de YouTube, Instagram e WhatsApp serão exibidos aqui quando estiverem
                      cadastrados.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="font-display text-lg font-semibold tracking-normal text-slate-950">
              {branding.shortName}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Dados públicos cadastrados para identificação e contato da instituição.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {footerItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </div>
                <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">
                  {value || 'Não informado'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
