export interface BrandingSettings {
  id: string
  displayName: string
  shortName: string
  slogan: string | null
  description: string
  legalName: string | null
  document: string | null
  logoUrl: string | null
  logoDarkUrl: string | null
  iconUrl: string | null
  faviconUrl: string | null
  heroImageUrl: string | null
  logoBackgroundColor: string
  logoDarkBackgroundColor: string
  iconBackgroundColor: string
  theme: {
    primaryColor: string
    accentColor: string
    sidebarColor: string
    backgroundColor: string
  }
  contact: {
    publicEmail: string | null
    publicPhone: string | null
    publicWhatsapp: string | null
    addressLine: string | null
    city: string | null
    state: string | null
    instagramUrl: string | null
    youtubeUrl: string | null
    websiteUrl: string | null
  }
  seo: {
    seoTitle: string | null
    seoDescription: string | null
  }
  updatedById?: string | null
  createdAt?: string
  updatedAt?: string
}

interface HslColor {
  h: number
  s: number
  l: number
}

export const defaultBranding: BrandingSettings = {
  id: 'default',
  displayName: 'MyChurch',
  shortName: 'MyChurch',
  slogan: 'ERP e site publico para igrejas',
  description:
    'Portanto, ide, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo. Mateus 28:19',
  legalName: null,
  document: null,
  logoUrl: null,
  logoDarkUrl: null,
  iconUrl: null,
  faviconUrl: null,
  heroImageUrl: null,
  logoBackgroundColor: '#0f172a',
  logoDarkBackgroundColor: '#1e293b',
  iconBackgroundColor: '#2563eb',
  theme: {
    primaryColor: '#2563eb',
    accentColor: '#f97316',
    sidebarColor: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  contact: {
    publicEmail: null,
    publicPhone: null,
    publicWhatsapp: null,
    addressLine: null,
    city: null,
    state: null,
    instagramUrl: null,
    youtubeUrl: null,
    websiteUrl: null,
  },
  seo: {
    seoTitle: null,
    seoDescription: null,
  },
}

function hexToHsl(hex: string): HslColor {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }

    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function toCssHsl(hex: string) {
  const color = hexToHsl(hex)
  return `${color.h} ${color.s}% ${color.l}%`
}

function contrastForeground(hex: string) {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '222 47% 11%' : '0 0% 100%'
}

export function getReadableTextColor(hex: string) {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#0f172a' : '#ffffff'
}

function adjustLightness(hex: string, amount: number) {
  const color = hexToHsl(hex)
  return `${color.h} ${color.s}% ${Math.max(0, Math.min(100, color.l + amount))}%`
}

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.href = href
}

function setMetaDescription(content: string) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')

  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.appendChild(meta)
  }

  meta.content = content
}

export function applyBranding(branding: BrandingSettings) {
  const root = document.documentElement
  const { primaryColor, accentColor, sidebarColor, backgroundColor } = branding.theme

  root.style.setProperty('--primary', toCssHsl(primaryColor))
  root.style.setProperty('--primary-foreground', contrastForeground(primaryColor))
  root.style.setProperty('--ring', toCssHsl(primaryColor))
  root.style.setProperty('--accent', toCssHsl(accentColor))
  root.style.setProperty('--accent-foreground', contrastForeground(accentColor))
  root.style.setProperty('--sidebar', toCssHsl(sidebarColor))
  root.style.setProperty('--sidebar-border', adjustLightness(sidebarColor, 8))
  root.style.setProperty('--sidebar-item-active', adjustLightness(sidebarColor, 10))
  root.style.setProperty('--sidebar-item-hover', adjustLightness(sidebarColor, 6))
  root.style.setProperty('--background', toCssHsl(backgroundColor))

  document.title = branding.seo.seoTitle ?? branding.displayName
  setMetaDescription(branding.seo.seoDescription ?? branding.description)

  const favicon = branding.faviconUrl ?? branding.iconUrl
  if (favicon) setFavicon(favicon)
}
