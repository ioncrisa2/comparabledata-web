import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { csrfHeaders, initializeCsrf, readXsrfToken } from './csrf'
import { ApiError } from './error'

describe('Sanctum CSRF integration', () => {
  it('reads and decodes Laravel XSRF cookie values', () => {
    expect(readXsrfToken('session=opaque; XSRF-TOKEN=token%3Dvalue; theme=light')).toBe(
      'token=value',
    )
  })

  it('adds the XSRF header only to state-changing requests', () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

    expect(csrfHeaders('/api/v1/auth/session', { method: 'POST' }).get('X-XSRF-TOKEN')).toBe(
      'csrf-token',
    )
    expect(csrfHeaders('/api/v1/auth/me').has('X-XSRF-TOKEN')).toBe(false)

    document.cookie = 'XSRF-TOKEN=; max-age=0; path=/'
  })

  it('initializes the CSRF cookie against the unversioned Sanctum endpoint', async () => {
    mockServer.use(
      http.get('https://api.example.com/sanctum/csrf-cookie', ({ request }) => {
        expect(request.credentials).toBe('include')
        expect(request.headers.get('x-requested-with')).toBe('XMLHttpRequest')
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(initializeCsrf({ baseUrl: 'https://api.example.com/' })).resolves.toBeUndefined()
  })

  it('normalizes a failed CSRF initialization', async () => {
    mockServer.use(
      http.get('https://api.example.com/sanctum/csrf-cookie', () =>
        HttpResponse.json({ code: 'SERVER_ERROR', message: 'Server unavailable' }, { status: 500 }),
      ),
    )

    await expect(initializeCsrf({ baseUrl: 'https://api.example.com' })).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({
        status: 500,
        code: 'SERVER_ERROR',
      }),
    )
  })
})
