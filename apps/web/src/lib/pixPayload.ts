export type StaticPixKeyType = 'cpf' | 'cnpj' | 'phone' | 'email' | 'random'

export const STATIC_PIX_FIELD_LIMITS = {
  pixKey: 77,
  merchantName: 25,
  merchantCity: 15,
  txid: 25,
  description: 72,
  additionalData: 99,
  amountInput: 13,
} as const

export interface StaticPixPayloadInput {
  keyType: StaticPixKeyType
  pixKey: string
  merchantName: string
  merchantCity: string
  amount?: string
  txid?: string
  description?: string
}

export interface StaticPixPayloadResult {
  code: string
  normalized: {
    pixKey: string
    merchantName: string
    merchantCity: string
    amount?: string
    txid: string
    description?: string
  }
}

export class PixPayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PixPayloadError'
  }
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeAsciiText(value: string, maxLength: number, fieldName: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    throw new PixPayloadError(`${fieldName} e obrigatorio.`)
  }

  if (normalized.length > maxLength) {
    throw new PixPayloadError(`${fieldName} deve ter no maximo ${maxLength} caracteres.`)
  }

  return normalized
}

function normalizeOptionalAsciiText(
  value: string | undefined,
  maxLength: number,
  fieldName: string,
) {
  const trimmed = value?.trim()

  if (!trimmed) return undefined

  return normalizeAsciiText(trimmed, maxLength, fieldName)
}

function ensurePrintableAscii(value: string, fieldName: string) {
  if (!/^[\x20-\x7E]+$/.test(value)) {
    throw new PixPayloadError(`${fieldName} deve usar apenas caracteres ASCII.`)
  }
}

function normalizePixKey(input: StaticPixPayloadInput) {
  const value = input.pixKey.trim()

  if (!value) {
    throw new PixPayloadError('Informe a chave Pix.')
  }

  if (input.keyType === 'cpf') {
    const digits = onlyDigits(value)
    if (digits.length !== 11) {
      throw new PixPayloadError('CPF deve conter 11 digitos.')
    }
    return digits
  }

  if (input.keyType === 'cnpj') {
    const digits = onlyDigits(value)
    if (digits.length !== 14) {
      throw new PixPayloadError('CNPJ deve conter 14 digitos.')
    }
    return digits
  }

  if (input.keyType === 'phone') {
    const digits = onlyDigits(value)
    const normalized =
      value.trim().startsWith('+') || digits.startsWith('55') ? `+${digits}` : `+55${digits}`

    if (!/^\+\d{10,15}$/.test(normalized)) {
      throw new PixPayloadError('Telefone deve conter DDI, DDD e numero.')
    }

    return normalized
  }

  if (input.keyType === 'email') {
    const normalized = value.toLowerCase()

    ensurePrintableAscii(normalized, 'E-mail')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new PixPayloadError('Informe um e-mail valido.')
    }

    return normalized
  }

  const normalized = value.toLowerCase()
  ensurePrintableAscii(normalized, 'Chave aleatoria')

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) {
    throw new PixPayloadError('Chave aleatoria deve estar no formato UUID.')
  }

  return normalized
}

function normalizeAmount(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const compact = trimmed.replace(/\s/g, '')
  const commaIndex = compact.lastIndexOf(',')
  const dotIndex = compact.lastIndexOf('.')
  const normalized =
    commaIndex > dotIndex ? compact.replace(/\./g, '').replace(',', '.') : compact.replace(/,/g, '')

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new PixPayloadError('Valor deve usar reais e centavos, como 25,75.')
  }

  const numeric = Number(normalized)

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new PixPayloadError('Valor deve ser maior que zero.')
  }

  if (numeric > 99999999.99) {
    throw new PixPayloadError('Valor deve ser menor que 100.000.000,00.')
  }

  return numeric.toFixed(2)
}

function normalizeTxid(value?: string) {
  const normalized = value?.trim() || '***'

  if (normalized === '***') return normalized

  if (!new RegExp(`^[A-Za-z0-9]{1,${STATIC_PIX_FIELD_LIMITS.txid}}$`).test(normalized)) {
    throw new PixPayloadError(
      `Identificador deve ter ate ${STATIC_PIX_FIELD_LIMITS.txid} caracteres alfanumericos.`,
    )
  }

  return normalized
}

function emvField(id: string, value: string) {
  if (!/^\d{2}$/.test(id)) {
    throw new PixPayloadError('Identificador EMV invalido.')
  }

  if (value.length > 99) {
    throw new PixPayloadError(`Campo ${id} excede 99 caracteres.`)
  }

  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

function crc16CcittFalse(payload: string) {
  let crc = 0xffff

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildStaticPixCopyPasteCode(input: StaticPixPayloadInput): StaticPixPayloadResult {
  const pixKey = normalizePixKey(input)
  const merchantName = normalizeAsciiText(
    input.merchantName,
    STATIC_PIX_FIELD_LIMITS.merchantName,
    'Nome do recebedor',
  )
  const merchantCity = normalizeAsciiText(
    input.merchantCity,
    STATIC_PIX_FIELD_LIMITS.merchantCity,
    'Cidade',
  )
  const amount = normalizeAmount(input.amount)
  const txid = normalizeTxid(input.txid)
  const description = normalizeOptionalAsciiText(
    input.description,
    STATIC_PIX_FIELD_LIMITS.description,
    'Descricao',
  )

  if (pixKey.length > STATIC_PIX_FIELD_LIMITS.pixKey) {
    throw new PixPayloadError(
      `Chave Pix deve ter no maximo ${STATIC_PIX_FIELD_LIMITS.pixKey} caracteres.`,
    )
  }

  const merchantAccount = emvField('00', 'BR.GOV.BCB.PIX') + emvField('01', pixKey)
  const additionalData = [
    description ? emvField('02', description) : '',
    emvField('05', txid),
  ].join('')

  if (additionalData.length > STATIC_PIX_FIELD_LIMITS.additionalData) {
    throw new PixPayloadError(
      'Descricao e identificador juntos excedem o limite do campo adicional Pix.',
    )
  }

  const payloadWithoutCrc = [
    emvField('00', '01'),
    emvField('01', '11'),
    emvField('26', merchantAccount),
    emvField('52', '0000'),
    emvField('53', '986'),
    amount ? emvField('54', amount) : '',
    emvField('58', 'BR'),
    emvField('59', merchantName),
    emvField('60', merchantCity),
    emvField('62', additionalData),
    '6304',
  ].join('')

  const code = `${payloadWithoutCrc}${crc16CcittFalse(payloadWithoutCrc)}`

  return {
    code,
    normalized: {
      pixKey,
      merchantName,
      merchantCity,
      amount,
      txid,
      description,
    },
  }
}
