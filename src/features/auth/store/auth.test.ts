import { http, HttpResponse } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { queryClient } from '@/shared/query/client'
import { mockServer } from '@/test/mocks/server'

import { useAuthStore } from './auth'

const user = {
  id: 7,
  name: 'Ayu Penilai',
  email: 'ayu@example.com',
  roles: ['appraiser'],
  permissions: ['view_any_data::pembanding', 'create_data::pembanding'],
  created_at: null,
  updated_at: null,
}

beforeEach(() => {
  setActivePinia(createPinia())
  queryClient.clear()
})

describe('useAuthStore', () => {
  it('refreshes effective access explicitly while keeping ordinary initialization cached', async () => {
    let requests = 0
    let currentUser = user
    mockServer.use(
      http.get('*/api/v1/auth/me', () => {
        requests++
        return HttpResponse.json({ data: currentUser })
      }),
    )

    const auth = useAuthStore()
    await auth.initialize()
    currentUser = { ...user, roles: ['reviewer'], permissions: ['view_dashboard'] }
    await auth.initialize()
    expect(requests).toBe(1)
    expect(auth.can('create_data::pembanding')).toBe(true)

    await Promise.all([auth.initialize({ force: true }), auth.initialize({ force: true })])

    expect(requests).toBe(2)
    expect(auth.initialized).toBe(true)
    expect(auth.authenticated).toBe(true)
    expect(auth.roles).toEqual(['reviewer'])
    expect(auth.can('create_data::pembanding')).toBe(false)
    expect(auth.can('view_dashboard')).toBe(true)
  })

  it('restores an authenticated session and exposes its capabilities', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({
          status: 'success',
          message: 'User data retrieved successfully',
          data: user,
        }),
      ),
    )

    const auth = useAuthStore()
    await auth.initialize()

    expect(auth.initialized).toBe(true)
    expect(auth.authenticated).toBe(true)
    expect(auth.user).toEqual(user)
    expect(auth.can('create_data::pembanding')).toBe(true)
    expect(auth.canAny(['view_backup', 'view_any_data::pembanding'])).toBe(true)
  })

  it('treats a missing server session as an initialized guest', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 }),
      ),
    )

    const auth = useAuthStore()
    await auth.initialize()

    expect(auth.initialized).toBe(true)
    expect(auth.authenticated).toBe(false)
    expect(auth.initializationError).toBeNull()
  })

  it('logs in with CSRF, then logs out and clears cached server state', async () => {
    mockServer.use(
      http.get('*/sanctum/csrf-cookie', () => new HttpResponse(null, { status: 204 })),
      http.post('*/api/v1/auth/session', () =>
        HttpResponse.json({ status: 'success', message: 'Login berhasil.', data: user }),
      ),
      http.delete('*/api/v1/auth/session', () =>
        HttpResponse.json({ status: 'success', message: 'Logout berhasil.', data: null }),
      ),
    )

    const auth = useAuthStore()
    await auth.login({ email: 'ayu@example.com', password: 'secret', remember: true })
    queryClient.setQueryData(['private-data'], { id: 1 })

    expect(auth.authenticated).toBe(true)
    expect(queryClient.getQueryData(['private-data'])).toEqual({ id: 1 })

    await auth.logout()

    expect(auth.authenticated).toBe(false)
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined()
  })
})
