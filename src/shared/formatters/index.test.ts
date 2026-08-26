import { describe, expect, it } from 'vitest'

import { formatCurrency, formatDate, formatNumber, formatPercent, formatPhone } from './index'

describe('formatters', () => {
  it('formats localized domain values and preserves empty values', () => {
    expect(formatNumber(12500)).toContain('12.500')
    expect(formatCurrency(2500000)).toContain('2.500.000')
    expect(formatPercent(0.125)).toContain('12,5')
    expect(formatDate(null)).toBe('—')
    expect(formatDate('invalid')).toBe('—')
    expect(formatPhone('081234567890')).toBe('+62 812-3456-7890')
  })
})
