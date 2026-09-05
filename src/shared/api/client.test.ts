import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { apiClient, setUnauthorizedHandler } from './client'

const user = {
  id: 7,
  name: 'Ayu Penilai',
  email: 'ayu@example.com',
  roles: ['appraiser'],
  permissions: ['view_any_data::pembanding'],
  created_at: null,
  updated_at: null,
}

afterEach(() => {
  setUnauthorizedHandler(undefined)
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
})

describe('authenticated API client', () => {
  it('notifies the application when a response expires the session', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)

    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 }),
      ),
    )

    await expect(apiClient.GET('/v1/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('refreshes CSRF and retries a rejected mutation only once', async () => {
    const receivedTokens: (string | null)[] = []
    let attempts = 0
    document.cookie = 'XSRF-TOKEN=expired; path=/'

    mockServer.use(
      http.get('*/sanctum/csrf-cookie', () => {
        document.cookie = 'XSRF-TOKEN=fresh; path=/'
        return new HttpResponse(null, { status: 204 })
      }),
      http.post('*/api/v1/auth/session', ({ request }) => {
        attempts += 1
        receivedTokens.push(request.headers.get('x-xsrf-token'))

        if (attempts === 1) {
          return HttpResponse.json({ message: 'CSRF token mismatch.' }, { status: 419 })
        }

        return HttpResponse.json({ status: 'success', message: 'Login berhasil.', data: user })
      }),
    )

    await expect(
      apiClient.POST('/v1/auth/session', {
        body: { email: 'ayu@example.com', password: 'secret' },
      }),
    ).resolves.toMatchObject({ data: { data: user } })
    expect(attempts).toBe(2)
    expect(receivedTokens).toEqual(['expired', 'fresh'])
  })
})
