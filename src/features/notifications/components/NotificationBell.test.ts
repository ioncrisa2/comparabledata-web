import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import NotificationBell from './NotificationBell.vue'

describe('NotificationBell', () => {
  let router: ReturnType<typeof createRouter>
  let pinia: ReturnType<typeof createPinia>

  const mockPayload = {
    unread_count: 5,
    data: [
      {
        id: '1',
        type: 'info',
        data: { title: 'Pemberitahuan Uji', message: 'Isi pengujian' },
        read_at: null,
        created_at: '2026-09-07T08:00:00Z',
      },
    ],
    meta: { current_page: 1, per_page: 5, total: 1, last_page: 1 },
  }

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    auth.user = {
      id: 1,
      name: 'Super Admin',
      email: 'admin@hjar.id',
      roles: ['super_admin'],
      permissions: ['view_search'],
      created_at: null,
      updated_at: null,
    }

    mockServer.use(http.get('*/api/v1/notifications', () => HttpResponse.json(mockPayload)))

    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/notifications', name: 'notifications.index', component: { template: '<div/>' } },
      ],
    })
    await router.push('/')
  })

  function createWrapper(initialData?: unknown) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    if (initialData) {
      queryClient.setQueryData(['notifications', 'list', { per_page: 5 }], initialData)
    }

    return mount(NotificationBell, {
      global: {
        plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      },
    })
  }

  it('renders bell button and badge when unread notifications exist', () => {
    const wrapper = createWrapper(mockPayload)

    expect(wrapper.find('[data-testid="notification-bell-btn"]').exists()).toBe(true)
    const badge = wrapper.find('[data-testid="notification-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('opens dropdown on bell click and shows items', async () => {
    const wrapper = createWrapper(mockPayload)

    expect(wrapper.find('[data-testid="notification-dropdown"]').exists()).toBe(false)
    await wrapper.find('[data-testid="notification-bell-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="notification-dropdown"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pemberitahuan Uji')
  })
})
