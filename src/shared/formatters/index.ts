const EMPTY_VALUE = '—'

function finiteNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
  locale = 'id-ID',
) {
  const number = finiteNumber(value)
  return number === undefined ? EMPTY_VALUE : new Intl.NumberFormat(locale, options).format(number)
}

export type FormatCurrencyOptions = {
  currency?: string
  compact?: boolean
  withPrefix?: boolean
}

export function formatCurrency(
  value: number | null | undefined,
  options?: FormatCurrencyOptions | string,
  locale = 'id-ID',
) {
  const number = finiteNumber(value)
  if (number === undefined) return EMPTY_VALUE

  const opts: FormatCurrencyOptions =
    typeof options === 'string' ? { currency: options } : (options ?? {})
  const { currency = 'IDR', compact = true, withPrefix = true } = opts

  if (compact && currency === 'IDR') {
    const abs = Math.abs(number)
    const sign = number < 0 ? '-' : ''
    const prefix = withPrefix ? 'Rp ' : ''

    // Triliun (>= 1e12): disingkat jika bulat / maks 2 desimal (kelipatan 10 Miliar / 1e10)
    if (abs >= 1e12 && abs % 1e10 === 0) {
      const formatted = (abs / 1e12).toString()
      return `${sign}${prefix}${formatted} T`
    }

    // Miliar (>= 1e9): disingkat jika bulat / maks 2 desimal (kelipatan 10 Juta / 1e7, misal 1.23 M)
    if (abs >= 1e9 && abs % 1e7 === 0) {
      const formatted = (abs / 1e9).toString()
      return `${sign}${prefix}${formatted} M`
    }

    // Juta (>= 1e6): disingkat jika bulat / maks 2 desimal (kelipatan 10 Ribu / 1e4, misal 450 Juta atau 2.5 Juta)
    if (abs >= 1e6 && abs % 1e4 === 0) {
      const formatted = (abs / 1e6).toString()
      return `${sign}${prefix}${formatted} Juta`
    }

    // Ribu (>= 1e3 & < 1e6): disingkat jika kelipatan 1.000 (misal 750 Ribu)
    if (abs >= 1e3 && abs < 1e6 && abs % 1e3 === 0) {
      const formatted = (abs / 1e3).toString()
      return `${sign}${prefix}${formatted} Ribu`
    }

    // Jika withPrefix === false untuk angka detail
    if (!withPrefix) {
      return `${sign}${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(abs)}`
    }
  }

  return formatNumber(number, { style: 'currency', currency, maximumFractionDigits: 0 }, locale)
}

export function formatPercent(
  value: number | null | undefined,
  locale = 'id-ID',
  maximumFractionDigits = 1,
) {
  return formatNumber(value, { style: 'percent', maximumFractionDigits }, locale)
}

function validDate(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined || value === '') return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function formatDate(value: string | number | Date | null | undefined, locale = 'id-ID') {
  const date = validDate(value)
  return date
    ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(
        date,
      )
    : EMPTY_VALUE
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale = 'id-ID',
  timeZone = 'Asia/Jakarta',
) {
  const date = validDate(value)
  return date
    ? new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
      }).format(date)
    : EMPTY_VALUE
}

export function formatPhone(value: string | null | undefined) {
  if (!value?.trim()) return EMPTY_VALUE
  const digits = value.replace(/\D/g, '')
  const international = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
      ? `62${digits}`
      : digits
  const normalized = international.startsWith('62') ? international : digits
  const groups = normalized.match(/^62(\d{3})(\d{3,4})(\d{3,5})$/)
  return groups ? `+62 ${groups[1]}-${groups[2]}-${groups[3]}` : value.trim()
}

/**
 * Normalizes and formats Indonesian phone numbers for live input.
 * When the user types '8', '08', '628', or '+628', it formats as '+62 8...'.
 * Groups digits cleanly: +62 8xx xxxx xxxx (up to 13 digits)
 */
export function formatPhoneInput(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''

  // If user only typed '+', '+6', '+62', or '0'
  if (/^(\+?(62?)?|0)\s*$/.test(trimmed)) {
    if (trimmed === '0' || trimmed === '+62' || trimmed === '+62 ' || trimmed === '+') {
      return '+62 '
    }
    return ''
  }

  // Remove international/trunk prefix to isolate subscriber digits
  let raw = trimmed
  if (raw.startsWith('+62')) {
    raw = raw.slice(3)
  } else if (raw.startsWith('62')) {
    raw = raw.slice(2)
  } else if (raw.startsWith('0')) {
    raw = raw.slice(1)
  }

  // Strip non-digits
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''

  // Max 12 digits after +62 (matches up to 13 digits national format starting with 08)
  const capped = digits.slice(0, 12)

  // Indonesian number formatting:
  // part 1: up to 3 digits (e.g. 812, 858)
  // part 2: next 4 digits (e.g. 3819)
  // part 3: next 4-5 digits (e.g. 8537 or 85371)
  if (capped.length <= 3) {
    return `+62 ${capped}`
  }
  if (capped.length <= 7) {
    return `+62 ${capped.slice(0, 3)} ${capped.slice(3)}`
  }
  return `+62 ${capped.slice(0, 3)} ${capped.slice(3, 7)} ${capped.slice(7)}`
}

