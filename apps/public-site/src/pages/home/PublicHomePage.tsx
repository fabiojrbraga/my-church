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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2a9.86 9.86 0 0 0-9.9 9.86c0 1.74.46 3.44 1.34 4.94L2 22l5.34-1.4a9.9 9.9 0 0 0 4.7 1.19h.01A9.86 9.86 0 0 0 21.9 11.9 9.86 9.86 0 0 0 12.04 2Zm5.82 14.1c-.25.7-1.46 1.34-2.02 1.39-.52.05-1.18.07-1.9-.12-.44-.12-1-.32-1.72-.63-3.02-1.3-4.99-4.34-5.14-4.54-.15-.2-1.23-1.64-1.23-3.12s.78-2.21 1.06-2.51c.28-.3.6-.38.8-.38h.58c.18.01.43-.07.67.52.25.6.86 2.1.94 2.25.08.15.13.33.03.53-.1.2-.15.33-.3.5-.15.18-.31.39-.45.52-.15.15-.31.31-.13.6.18.3.78 1.29 1.68 2.08 1.16.99 2.13 1.3 2.43 1.45.3.15.48.13.66-.08.18-.2.76-.88.96-1.18.2-.3.4-.25.68-.15.28.1 1.78.84 2.08.99.3.15.5.23.58.35.08.13.08.75-.17 1.45Z" />
    </svg>
  )
}

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
  const footerLogo = branding.logoDarkUrl ?? branding.logoUrl ?? branding.iconUrl
  const logoForegroundColor = getReadableTextColor(branding.logoBackgroundColor)
  const footerLogoForegroundColor = getReadableTextColor(branding.logoDarkBackgroundColor)
  const whatsappUrl = getWhatsappUrl(branding.contact.publicWhatsapp)
  const addressLabel = [branding.contact.addressLine, branding.contact.city, branding.contact.state]
    .filter(Boolean)
    .join(' - ')
  const footerInstitutionItems = [
    { label: 'Nome', value: branding.legalName ?? branding.displayName, icon: Church },
    { label: 'CNPJ', value: branding.document, icon: FileText },
  ]
  const footerContactItems = [
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
      icon: WhatsAppIcon,
      iconClassName: 'text-[#25D366]',
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
                  <a href="#em-construcao">Saiba mais sobre nós</a>
                </Button>
              </div>

              <div
                id="em-construcao"
                className="mt-6 inline-flex max-w-xl items-start gap-3 rounded-[8px] border border-white/20 bg-white/10 px-4 py-3 text-white shadow-sm shadow-slate-950/10 backdrop-blur"
              >
                <Construction className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium leading-6">
                  Esta página está em construção!
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
                    socialLinks.map(({ href, icon: Icon, iconClassName, label }) => (
                      <a
                        key={label}
                        href={href ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        <span className="inline-flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${iconClassName ?? ''}`} />
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

      <footer className="bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-white/10"
                style={{
                  backgroundColor: branding.logoDarkBackgroundColor,
                  color: footerLogoForegroundColor,
                }}
              >
                {footerLogo ? (
                  <img src={footerLogo} alt="" className="h-8 w-8 object-contain" />
                ) : (
                  <Church className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold tracking-normal text-white">
                  {branding.shortName}
                </p>
                <p className="mt-1 text-sm leading-6 text-white/55">
                  Informações oficiais da instituição.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              { title: 'Instituição', items: footerInstitutionItems },
              { title: 'Contato', items: footerContactItems },
            ].map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                  {group.title}
                </h2>
                <dl className="mt-4 space-y-4">
                  {group.items.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex gap-3 border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                    >
                      <Icon className="mt-1 h-4 w-4 shrink-0 text-white/45" />
                      <div className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                          {label}
                        </dt>
                        <dd className="mt-1 break-words text-sm font-medium leading-6 text-white">
                          {value || 'Não informado'}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
