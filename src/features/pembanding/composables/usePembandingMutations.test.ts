import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/api/error'

import { extractFieldErrors } from './usePembandingMutations'

describe('extractFieldErrors', () => {
  it('returns empty object if error is not ApiError', () => {
    expect(extractFieldErrors(new Error('Unknown'))).toEqual({})
    expect(extractFieldErrors(null)).toEqual({})
    expect(extractFieldErrors(undefined)).toEqual({})
  })

  it('extracts first error message per field from 422 errors payload', () => {
    const error = new ApiError({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      fieldErrors: {
        alamat_data: ['Alamat wajib diisi.', 'Alamat terlalu pendek.'],
        harga: ['Harga harus berupa angka.'],
      },
    })
    // ApiError fieldErrors is also accessible or raw errors object
    ;(error as unknown as { errors: Record<string, string[]> }).errors = {
      alamat_data: ['Alamat wajib diisi.', 'Alamat terlalu pendek.'],
      harga: ['Harga harus berupa angka.'],
    }

    const result = extractFieldErrors(error)
    expect(result).toEqual({
      alamat_data: 'Alamat wajib diisi.',
      harga: 'Harga harus berupa angka.',
    })
  })
})
