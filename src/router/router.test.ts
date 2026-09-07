import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { pinia } from '@/app/providers/installPinia'
import { useAuthStore } from '@/features/auth'
import { env } from '@/shared/config/env'
import { mockServer } from '@/test/mocks/server'

import router, { ROUTE_NAMES } from './index'

describe('router navigation guards', () => {
  const auth = useAuthStore(pinia)

  beforeEach(async () => {
    auth.clearSession()
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 }),
      ),
    )
    await router.push('/403')
  })

  it('redirects unauthenticated users from protected routes to login with redirect query', async () => {
    await router.push('/pembandings')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.AUTH_LOGIN)
    expect(router.currentRoute.value.query.redirect).toBe('/pembandings')
  })

  it('allows unauthenticated users to access guestOnly login page', async () => {
    await router.push('/login')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.AUTH_LOGIN)
    expect(document.title).toBe(`Masuk · ${env.VITE_APP_NAME}`)
  })

  it('redirects authenticated users away from guestOnly login to dashboard', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({
          data: {
            id: 1,
            name: 'Test User',
            email: 'user@example.test',
            roles: ['user'],
            permissions: [],
          },
        }),
      ),
    )
    await auth.initialize({ force: true })

    await router.push('/login')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.DASHBOARD)
  })

  it('redirects authenticated users away from login to safe redirect query', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({
          data: {
            id: 1,
            name: 'Test User',
            email: 'user@example.test',
            roles: ['user'],
            permissions: [],
          },
        }),
      ),
    )
    await auth.initialize({ force: true })

    await router.push('/login?redirect=%2Fpembandings')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.PEMBANDING_LIST)
  })

  it('blocks access and redirects to 403 when user lacks required permission', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({
          data: {
            id: 2,
            name: 'Viewer Only',
            email: 'viewer@example.test',
            roles: ['viewer'],
            permissions: ['view_any_data::pembanding'],
          },
        }),
      ),
    )
    await auth.initialize({ force: true })

    // /pembandings/new requires 'create_data::pembanding'
    await router.push('/pembandings/new')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.FORBIDDEN)
  })

  it('allows access when user has the required permission', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({
          data: {
            id: 3,
            name: 'Creator User',
            email: 'creator@example.test',
            roles: ['appraiser'],
            permissions: ['create_data::pembanding'],
          },
        }),
      ),
    )
    await auth.initialize({ force: true })

    await router.push('/pembandings/new')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.PEMBANDING_CREATE)
  })

  it('supports permissionMode any for multi-permission routes', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({
          data: {
            id: 4,
            name: 'Moderator User',
            email: 'mod@example.test',
            roles: ['moderator'],
            // /moderation requires one of ['approve_delete_request', 'reject_delete_request', 'view_moderation']
            permissions: ['view_moderation'],
          },
        }),
      ),
    )
    await auth.initialize({ force: true })

    await router.push('/moderation')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.MODERATION_INDEX)
  })

  it('navigates to /profile when authenticated', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({
          data: {
            id: 5,
            name: 'Profile User',
            email: 'profile@example.test',
            roles: ['user'],
            permissions: [],
          },
        }),
      ),
    )
    await auth.initialize({ force: true })

    await router.push('/profile')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.PROFILE)
    expect(document.title).toBe(`Profil Pengguna · ${env.VITE_APP_NAME}`)
  })

  it('navigates to /search when user has view_search permission', async () => {
    mockServer.use(
      http.get('*/api/v1/auth/me', () =>
        HttpResponse.json({
          data: {
            id: 6,
            name: 'Searcher User',
            email: 'searcher@example.test',
            roles: ['user'],
            permissions: ['view_search'],
          },
        }),
      ),
    )
    await auth.initialize({ force: true })

    await router.push('/search')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.SEARCH)
    expect(document.title).toBe(`Pencarian Global · ${env.VITE_APP_NAME}`)
  })

  it('resolves unknown routes to not-found', async () => {
    await router.push('/this-route-definitely-does-not-exist')

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.NOT_FOUND)
  })

  it('provides top: 0 scrollBehavior', () => {
    const scroll = router.options.scrollBehavior?.({} as never, {} as never, null)
    expect(scroll).toEqual({ top: 0 })
  })
})
