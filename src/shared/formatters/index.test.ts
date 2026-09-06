import { describe, expect, it } from 'vitest'

import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatPhone,
  formatPhoneInput,
} from './index'


describe('formatters', () => {
  it('formats localized domain values and preserves empty values', () => {
    expect(formatNumber(12500)).toContain('12.500')
    expect(formatCurrency(2500000, { compact: false })).toContain('2.500.000')
    expect(formatPercent(0.125)).toContain('12,5')
    expect(formatDate(null)).toBe('—')
    expect(formatDate('invalid')).toBe('—')
    expect(formatPhone('081234567890')).toBe('+62 812-3456-7890')
  })

  it('formats phone numbers starting with 8, 08, 62, or +62', () => {
    // Dimulai dengan 0
    expect(formatPhone('081234567890')).toBe('+62 812-3456-7890')
    // Dimulai langsung dengan 8 (seperti di screenshot pengguna)
    expect(formatPhone('85838198537')).toBe('+62 858-3819-8537')
    expect(formatPhone('858 3819 8537')).toBe('+62 858-3819-8537')
    // Dimulai dengan +62
    expect(formatPhone('+62 858 3819 8537')).toBe('+62 858-3819-8537')
    expect(formatPhone('+6285838198537')).toBe('+62 858-3819-8537')
    // 13 digit
    expect(formatPhone('0812345678901')).toBe('+62 812-3456-78901')
    // Nilai kosong
    expect(formatPhone(null)).toBe('—')
    expect(formatPhone(undefined)).toBe('—')
    expect(formatPhone('')).toBe('—')
  })

  it('formats live phone inputs dynamically starting with 8 or 08', () => {
    // User ketik '8' -> otomatis terformat jadi '+62 8'
    expect(formatPhoneInput('8')).toBe('+62 8')
    expect(formatPhoneInput('85')).toBe('+62 85')
    expect(formatPhoneInput('858')).toBe('+62 858')
    expect(formatPhoneInput('8583')).toBe('+62 858 3')
    expect(formatPhoneInput('8583819')).toBe('+62 858 3819')
    expect(formatPhoneInput('85838198537')).toBe('+62 858 3819 8537')

    // Paste dari screenshot: '858 3819 8537'
    expect(formatPhoneInput('858 3819 8537')).toBe('+62 858 3819 8537')

    // User ketik '08' atau '0'
    expect(formatPhoneInput('08')).toBe('+62 8')
    expect(formatPhoneInput('085838198537')).toBe('+62 858 3819 8537')
    expect(formatPhoneInput('0')).toBe('+62 ')

    // Prefix +62
    expect(formatPhoneInput('+62')).toBe('+62 ')
    expect(formatPhoneInput('+62 858 3819 8537')).toBe('+62 858 3819 8537')
    expect(formatPhoneInput('6285838198537')).toBe('+62 858 3819 8537')

    // Kosong
    expect(formatPhoneInput('')).toBe('')
    expect(formatPhoneInput(null)).toBe('')
    expect(formatPhoneInput(undefined)).toBe('')
  })

  it('formats round prices compactly and detailed prices in full', () => {
    // Bulat: Juta & Miliar
    expect(formatCurrency(450000000)).toBe('Rp 450 Juta')
    expect(formatCurrency(1230000000)).toBe('Rp 1.23 M')
    expect(formatCurrency(1000000000)).toBe('Rp 1 M')
    expect(formatCurrency(2500000)).toBe('Rp 2.5 Juta')
    expect(formatCurrency(750000)).toBe('Rp 750 Ribu')

    // Tanpa prefix Rp
    expect(formatCurrency(450000000, { withPrefix: false })).toBe('450 Juta')
    expect(formatCurrency(1230000000, { withPrefix: false })).toBe('1.23 M')

    // Detail: semua angka tetap ditampilkan
    expect(formatCurrency(450111442)).toContain('450.111.442')
    expect(formatCurrency(1234444120)).toContain('1.234.444.120')

    // Opsi compact: false
    expect(formatCurrency(450000000, { compact: false })).toContain('450.000.000')
  })
})

