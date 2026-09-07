import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/api/error'
import { mockServer } from '@/test/mocks/server'

import { createPembanding, updatePembanding } from '../api/pembanding.api'
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
    const result = extractFieldErrors(error)
    expect(result).toEqual({
      alamat_data: 'Alamat wajib diisi.',
      harga: 'Harga harus berupa angka.',
    })
  })

  it.each(['create', 'update'])(
    'maps server validation errors from an actual %s request',
    async (action) => {
      mockServer.use(
        http.post(action === 'create' ? '*/api/v1/pembandings' : '*/api/v1/pembandings/42', () =>
          HttpResponse.json(
            {
              message: 'Validation failed',
              errors: {
                harga: ['Harga wajib diisi.'],
                image: ['Foto maksimal 15 MB.'],
              },
            },
            { status: 422 },
          ),
        ),
      )

      const request =
        action === 'create'
          ? createPembanding(new FormData())
          : updatePembanding('42', new FormData())
      const error: unknown = await request.catch((error: unknown) => error)

      expect(error).toBeInstanceOf(ApiError)
      expect(extractFieldErrors(error)).toEqual({
        harga: 'Harga wajib diisi.',
        image: 'Foto maksimal 15 MB.',
      })
    },
  )
})
