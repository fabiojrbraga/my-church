import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'qrcode'
import {
  ArrowRight,
  Check,
  Church,
  Copy,
  Download,
  FileImage,
  FileText,
  QrCode,
  Search,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminLoginUrl } from '@/config/links'
import { useBranding } from '@/components/BrandingProvider'
import { getReadableTextColor } from '@/lib/branding'

interface PixAddressPublicRecord {
  id: string
  branchId: string
  identifier: string
  purpose: string
  copyPasteCode: string
  expiresAt: string | null
  logoUrl: string | null
  effectiveLogoUrl: string | null
  isActive: boolean
  isExpired: boolean
  isPubliclyVisible: boolean
  branch: {
    id: string
    name: string
    isActive: boolean
  }
}

type DownloadKind = 'pdf' | 'jpg'

function formatExpiration(value: string | null) {
  if (!value) return 'Sem data de expiracao'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function downloadUrl(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      continue
    }

    if (currentLine) lines.push(currentLine)
    currentLine = word

    if (lines.length === maxLines) break
  }

  if (currentLine && lines.length < maxLines) lines.push(currentLine)

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })

  return y + lines.length * lineHeight
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      continue
    }

    if (currentLine) lines.push(currentLine)
    currentLine = word
  }

  if (currentLine) lines.push(currentLine)

  lines.forEach((line, index) => {
    ctx.fillText(line, 540, y + index * lineHeight)
  })

  return y + lines.length * lineHeight
}

async function createBannerCanvas(
  item: PixAddressPublicRecord,
  qrDataUrl: string,
  fallbackLogoUrl?: string | null,
  logoBackgroundColor = '#ffffff',
) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1600
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Canvas indisponivel')

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, canvas.width, 430)
  ctx.fillStyle = '#10b981'
  ctx.fillRect(0, 415, canvas.width, 14)
  ctx.fillStyle = '#d1fae5'
  ctx.fillRect(74, 1140, 932, 1)

  const bannerLogoUrl = item.effectiveLogoUrl ?? fallbackLogoUrl
  const logoForegroundColor = getReadableTextColor(logoBackgroundColor)

  if (bannerLogoUrl) {
    try {
      const logo = await loadImage(bannerLogoUrl)
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(72, 72, 132, 132, 24)
      ctx.clip()
      ctx.fillStyle = logoBackgroundColor
      ctx.fillRect(72, 72, 132, 132)
      ctx.drawImage(logo, 72, 72, 132, 132)
      ctx.restore()
    } catch {
      ctx.fillStyle = logoBackgroundColor
      ctx.beginPath()
      ctx.roundRect(72, 72, 132, 132, 24)
      ctx.fill()
      ctx.fillStyle = logoForegroundColor
      ctx.font = '700 54px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('PIX', 138, 150)
    }
  } else {
    ctx.fillStyle = logoBackgroundColor
    ctx.beginPath()
    ctx.roundRect(72, 72, 132, 132, 24)
    ctx.fill()
    ctx.fillStyle = logoForegroundColor
    ctx.font = '700 54px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('PIX', 138, 150)
  }

  ctx.textAlign = 'left'
  ctx.fillStyle = '#bbf7d0'
  ctx.font = '700 30px Arial'
  ctx.fillText('PIX IDENTIFICADO', 238, 106)
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 68px Arial'
  drawWrappedText(ctx, item.purpose, 238, 178, 720, 76, 2)
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.font = '400 30px Arial'
  ctx.fillText(item.branch.name, 238, 338)

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(190, 510, 700, 700, 44)
  ctx.fill()
  ctx.strokeStyle = '#dbeafe'
  ctx.lineWidth = 8
  ctx.stroke()

  const qrImage = await loadImage(qrDataUrl)
  ctx.drawImage(qrImage, 260, 580, 560, 560)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#0f172a'
  ctx.font = '700 44px Arial'
  ctx.fillText('Aponte a camera ou copie o codigo Pix', 540, 1288)
  ctx.fillStyle = '#475569'
  ctx.font = '400 30px Arial'
  drawCenteredText(ctx, `Identificador: ${item.identifier}`, 1344, 820, 38)
  drawCenteredText(ctx, `Validade: ${formatExpiration(item.expiresAt)}`, 1398, 820, 38)

  ctx.fillStyle = '#ecfdf5'
  ctx.beginPath()
  ctx.roundRect(104, 1480, 872, 64, 20)
  ctx.fill()
  ctx.fillStyle = '#065f46'
  ctx.font = '700 24px Arial'
  ctx.fillText(
    'Use somente os canais oficiais da instituicao para confirmar informacoes.',
    540,
    1522,
  )

  return canvas
}

async function generateQrDataUrl(code: string) {
  return QRCode.toDataURL(code, {
    width: 640,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  })
}

async function downloadBanner(
  item: PixAddressPublicRecord,
  qrDataUrl: string,
  kind: DownloadKind,
  fallbackLogoUrl?: string | null,
  logoBackgroundColor?: string,
) {
  const canvas = await createBannerCanvas(item, qrDataUrl, fallbackLogoUrl, logoBackgroundColor)
  const filename = `pix-${item.identifier}.${kind}`

  if (kind === 'jpg') {
    downloadUrl(canvas.toDataURL('image/jpeg', 0.94), filename)
    return
  }

  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, canvas.width, canvas.height)
  pdf.save(filename)
}

export function PublicPixPage() {
  const branding = useBranding()
  const logo = branding.logoUrl ?? branding.iconUrl
  const logoForegroundColor = getReadableTextColor(branding.logoBackgroundColor)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState<DownloadKind | null>(null)

  const pixQuery = useQuery({
    queryKey: ['public-pix-addresses'],
    queryFn: () =>
      api
        .get<{ items: PixAddressPublicRecord[] }>('/pix-addresses/public')
        .then((response) => response.data),
  })

  const items = pixQuery.data?.items ?? []
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items

    return items.filter((item) =>
      [item.identifier, item.purpose, item.branch.name].some((value) =>
        value.toLowerCase().includes(term),
      ),
    )
  }, [items, search])

  const selectedIdentifier = searchParams.get('chave')
  const selectedItem =
    items.find((item) => item.identifier === selectedIdentifier) ??
    filteredItems[0] ??
    items[0] ??
    null

  useEffect(() => {
    if (!selectedItem) return

    setSearchParams({ chave: selectedItem.identifier }, { replace: true })
  }, [selectedItem, setSearchParams])

  useEffect(() => {
    let isMounted = true
    setQrDataUrl(null)

    if (!selectedItem) return

    generateQrDataUrl(selectedItem.copyPasteCode).then((dataUrl) => {
      if (isMounted) setQrDataUrl(dataUrl)
    })

    return () => {
      isMounted = false
    }
  }, [selectedItem])

  async function handleCopy() {
    if (!selectedItem) return

    await navigator.clipboard.writeText(selectedItem.copyPasteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function handleDownload(kind: DownloadKind) {
    if (!selectedItem || !qrDataUrl) return

    setDownloading(kind)

    try {
      await downloadBanner(selectedItem, qrDataUrl, kind, logo, branding.logoBackgroundColor)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            aria-label={`${branding.shortName} pagina inicial`}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-slate-200/70"
              style={{ backgroundColor: branding.logoBackgroundColor, color: logoForegroundColor }}
            >
              {logo ? <img src={logo} alt="" className="h-7 w-7 object-contain" /> : <Church className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold tracking-normal text-slate-950">
                {branding.shortName}
              </p>
              <p className="truncate text-xs font-medium text-slate-500">Pix publico</p>
            </div>
          </Link>

          <div className="ml-auto hidden items-center gap-1 md:flex">
            <Link
              className="rounded-[8px] px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              to="/"
            >
              Instituicao
            </Link>
            <Link
              className="rounded-[8px] bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-950"
              to="/pix"
            >
              Pix
            </Link>
          </div>

          <Button asChild size="md" className="ml-auto md:ml-2">
            <a href={adminLoginUrl}>
              Entrar
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:px-8">
        <section className="space-y-6">
          <div>
            <Badge variant="success" className="w-fit">
              Pix identificado
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl">
              Chaves Pix oficiais de {branding.shortName}.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Escolha uma finalidade, copie o codigo para usar no banco ou gere um banner com QR
              code.
            </p>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
            <label htmlFor="search-pix" className="text-sm font-semibold text-slate-700">
              Buscar Pix
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="search-pix"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Finalidade, identificador ou unidade"
                className="bg-white pl-11"
              />
            </div>
          </div>

          <div className="space-y-3">
            {pixQuery.isLoading && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-5 text-sm text-slate-600">
                Carregando enderecos Pix...
              </div>
            )}

            {!pixQuery.isLoading && filteredItems.length === 0 && (
              <div className="rounded-[8px] border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-950">
                  Nenhum Pix publico disponivel
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Chaves expiradas ou desativadas nao aparecem nesta pagina.
                </p>
              </div>
            )}

            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSearchParams({ chave: item.identifier })}
                className={`w-full rounded-[8px] border p-4 text-left transition-all duration-200 ${
                  selectedItem?.id === item.id
                    ? 'border-primary/40 bg-primary/5 shadow-panel'
                    : 'border-slate-200 bg-white hover:border-primary/25'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold tracking-normal text-slate-950">
                      {item.purpose}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{item.branch.name}</p>
                  </div>
                  <Badge variant="success">Disponivel</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <span>#{item.identifier}</span>
                  <span>{formatExpiration(item.expiresAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="lg:sticky lg:top-24 lg:self-start">
          {!selectedItem && (
            <div className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5">
              <QrCode className="h-8 w-8 text-primary" />
              <p className="mt-4 font-display text-xl font-semibold tracking-normal">
                Nenhum Pix selecionado
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Quando houver cadastros ativos e nao expirados, eles ficarao disponiveis nesta
                pagina.
              </p>
            </div>
          )}

          {selectedItem && (
            <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft">
              <div className="bg-slate-950 px-5 py-5 text-white sm:px-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-white/15 bg-white/5 text-white/80">
                    {selectedItem.identifier}
                  </Badge>
                  <Badge variant="success">Nao expirado</Badge>
                </div>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-normal text-white">
                  {selectedItem.purpose}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/70">{selectedItem.branch.name}</p>
              </div>

              <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,0.92fr)_minmax(18rem,1.08fr)]">
                <div className="space-y-4">
                  <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Validade
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {formatExpiration(selectedItem.expiresAt)}
                    </p>
                  </div>

                  <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Codigo copia e cola
                    </p>
                    <textarea
                      readOnly
                      value={selectedItem.copyPasteCode}
                      className="mt-3 min-h-36 w-full resize-none rounded-[8px] border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-700 outline-none"
                    />
                    <Button type="button" onClick={handleCopy} className="mt-3 w-full">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Codigo copiado' : 'Copiar codigo'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[8px] border border-slate-200 bg-white p-4 text-center">
                    <div className="mx-auto flex aspect-square w-full max-w-sm items-center justify-center rounded-[8px] bg-slate-50 p-4">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`QR code Pix ${selectedItem.identifier}`}
                          className="h-full w-full"
                        />
                      ) : (
                        <QrCode className="h-12 w-12 text-slate-300" />
                      )}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      QR code gerado a partir do codigo copia e cola cadastrado pela administracao.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDownload('pdf')}
                      disabled={!qrDataUrl || !!downloading}
                    >
                      <FileText className="h-4 w-4" />
                      {downloading === 'pdf' ? 'Gerando...' : 'Baixar PDF'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDownload('jpg')}
                      disabled={!qrDataUrl || !!downloading}
                    >
                      <FileImage className="h-4 w-4" />
                      {downloading === 'jpg' ? 'Gerando...' : 'Baixar JPG'}
                    </Button>
                  </div>

                  <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <Download className="mt-0.5 h-5 w-5 text-emerald-700" />
                      <p className="text-sm leading-6 text-emerald-900">
                        O banner inclui a finalidade, identificador, validade e QR code centralizado
                        para uso em tela ou impressao.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
