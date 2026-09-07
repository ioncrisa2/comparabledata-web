import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { mockServer } from '@/test/mocks/server'

import NotificationsPage from './NotificationsPage.vue'

describe('NotificationsPage', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/notifications', name: 'notifications.index', component: { template: '<div/>' } },
      ],
    })
    await router.push('/notifications')
  })

  function createWrapper(initialData?: unknown) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    if (initialData) {
      queryClient.setQueryData(
        ['notifications', 'list', { unread: false, page: 1, per_page: 15 }],
        initialData,
      )
    }

    return mount(NotificationsPage, {
      global: {
        plugins: [router, [VueQueryPlugin, { queryClient }]],
        stubs: {
          UiPagination: true,
        },
      },
    })
  }

  it('renders page header, tabs, and notifications list', () => {
    const data = {
      unread_count: 2,
      data: [
        {
          id: 'n-1',
          type: 'moderation',
          data: { title: 'Permohonan Hapus Baru', message: 'Ada data yang butuh moderasi' },
          read_at: null,
          created_at: '2026-09-07T08:00:00Z',
        },
      ],
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
    }

    mockServer.use(http.get('*/api/v1/notifications', () => HttpResponse.json(data)))

    const wrapper = createWrapper(data)

    expect(wrapper.text()).toContain('Pusat Notifikasi')
    expect(wrapper.find('[data-testid="tab-all-notifications"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-unread-notifications"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Permohonan Hapus Baru')
    expect(wrapper.find('[data-testid="page-mark-all-read-btn"]').exists()).toBe(true)
  })

  it('displays empty state when no notifications', () => {
    const data = {
      unread_count: 0,
      data: [],
      meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 },
    }

    mockServer.use(http.get('*/api/v1/notifications', () => HttpResponse.json(data)))

    const wrapper = createWrapper(data)

    expect(wrapper.text()).toContain('Tidak ada notifikasi')
  })
})
