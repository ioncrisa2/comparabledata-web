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

export function formatCurrency(
  value: number | null | undefined,
  currency = 'IDR',
  locale = 'id-ID',
) {
  return formatNumber(value, { style: 'currency', currency, maximumFractionDigits: 0 }, locale)
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
  const international = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  const normalized = international.startsWith('62') ? international : digits
  const groups = normalized.match(/^62(\d{3})(\d{3,4})(\d{3,4})$/)
  return groups ? `+62 ${groups[1]}-${groups[2]}-${groups[3]}` : value.trim()
}
