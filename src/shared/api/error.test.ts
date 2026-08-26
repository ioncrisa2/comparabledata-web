import { describe, expect, it } from 'vitest'

import { ApiError, apiErrorFromResponse, apiErrorFromUnknown } from './error'

describe('API error normalization', () => {
  it('normalizes Laravel validation responses', async () => {
    const response = new Response(
      JSON.stringify({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        errors: { alamat_data: ['Alamat wajib diisi.'] },
        request_id: 'req-123',
      }),
      {
        status: 422,
        headers: { 'content-type': 'application/json' },
      },
    )

    await expect(apiErrorFromResponse(response)).resolves.toMatchObject({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      fieldErrors: { alamat_data: ['Alamat wajib diisi.'] },
      requestId: 'req-123',
    })
  })

  it('uses response headers for operational metadata', async () => {
    const response = new Response(null, {
      status: 429,
      headers: {
        'retry-after': '30',
        'x-request-id': 'req-rate-limit',
      },
    })

    await expect(apiErrorFromResponse(response)).resolves.toMatchObject({
      status: 429,
      retryAfterSeconds: 30,
      requestId: 'req-rate-limit',
    })
  })

  it('preserves normalized errors', () => {
    const error = new ApiError({
      status: 403,
      code: 'FORBIDDEN',
      message: 'Forbidden',
    })

    expect(apiErrorFromUnknown(error)).toBe(error)
  })
})
