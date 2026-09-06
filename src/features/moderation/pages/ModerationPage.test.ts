import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import ModerationPage from './ModerationPage.vue'

describe('ModerationPage', () => {
  it('renders moderation queue and actions', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [
            {
              id: 101,
              alamat_data: 'Jl. Sudirman No. 45',
              harga: 500000000,
              deleted_at: null,
              deleted_reason: 'Data terindikasi ganda dengan listing #88',
              jenis_listing: null,
              deleted_by: null,
            },
          ],
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 1,
            total: 1,
            last_page: 1,
          },
          links: {
            first: '',
            last: '',
            prev: null,
            next: null,
          },
          can: {
            approve: 'true',
            reject: 'true',
          },
        }),
      ),
    )

    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      roles: ['admin'],
      permissions: ['approve_delete_request', 'reject_delete_request', 'view_moderation'],
      created_at: null,
      updated_at: null,
    }

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/moderation', component: ModerationPage },
        { path: '/pembandings/:id', name: 'pembanding.detail', component: { template: '<div></div>' } },
      ],
    })
    await router.push('/moderation')
    await router.isReady()

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(ModerationPage, {
      global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Moderasi data')
      expect(wrapper.text()).toContain('Jl. Sudirman No. 45')
      expect(wrapper.text()).toContain('Setujui')
      expect(wrapper.text()).toContain('Tolak')
    })
  })

  it('renders nested DeleteRequest structure correctly with relations and pembanding ID link', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [
            {
              id: 8,
              pembanding_id: 42,
              reason: 'Data terduplikasi saat submit jaringan lambat',
              requested_by: { id: 5, name: 'Siti Rahma' },
              pembanding: {
                id: 42,
                alamat_data: 'Jl. Gatot Subroto No. 88, Bandung',
                harga: 450000000,
                jenis_listing: { name: 'Jual' },
              },
            },
          ],
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 1,
            total: 1,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
          can: { approve: 'true', reject: 'true' },
        }),
      ),
    )

    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      roles: ['admin'],
      permissions: ['approve_delete_request', 'reject_delete_request', 'view_moderation'],
      created_at: null,
      updated_at: null,
    }

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/moderation', component: ModerationPage },
        { path: '/pembandings/:id', name: 'pembanding.detail', component: { template: '<div>Detail</div>' } },
      ],
    })
    await router.push('/moderation')
    await router.isReady()

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(ModerationPage, {
      global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Gatot Subroto No. 88, Bandung')
      expect(wrapper.text()).toContain('Jual')
      expect(wrapper.text()).toContain('450 Juta')
      expect(wrapper.text()).toContain('Data terduplikasi saat submit jaringan lambat')
      expect(wrapper.text()).toContain('Oleh: Siti Rahma')
    })

    // Verify detail link points to pembanding_id (42), not delete request ID (8)
    const link = wrapper.find('a.moderation-page__property-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/pembandings/42')
  })

  it('renders empty state when there are no moderation items', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [],
          meta: {
            current_page: 1,
            per_page: 15,
            from: null,
            to: null,
            total: 0,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        }),
      ),
    )

    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      roles: ['admin'],
      permissions: ['approve_delete_request', 'reject_delete_request', 'view_moderation'],
      created_at: null,
      updated_at: null,
    }

    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/moderation', component: ModerationPage }],
    })
    await router.push('/moderation')
    await router.isReady()

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(ModerationPage, {
      global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Tidak ada permohonan hapus')
    })
  })

  it('renders error state when fetch fails without crashing application', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({ message: 'Server Error' }, { status: 500 }),
      ),
    )

    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      roles: ['admin'],
      permissions: ['approve_delete_request'],
      created_at: null,
      updated_at: null,
    }

    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/moderation', component: ModerationPage }],
    })
    await router.push('/moderation')
    await router.isReady()

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(ModerationPage, {
      global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
    })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Moderasi data')
      expect(wrapper.text()).toContain('Data gagal dimuat')
    })
  })

})

