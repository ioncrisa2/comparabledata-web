import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import PrimeVue from 'primevue/config'
import { describe, expect, it, vi } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import ActivityLogsPage from './ActivityLogsPage.vue'

describe('ActivityLogsPage.vue', () => {
  const mockLogs = [
    {
      id: 101,
      log_name: 'pembanding',
      description: 'Menambahkan data pembanding #42',
      event: 'created',
      subject_type: 'App\\Models\\Pembanding',
      subject_id: 42,
      causer: {
        id: 7,
        name: 'Ayu Penilai',
        email: 'ayu@penilai.id',
      },
      properties: {
        attributes: { alamat: 'Jl. Riau No. 12' },
      },
      created_at: '2026-09-01 10:00:00',
    },
    {
      id: 102,
      log_name: 'user',
      description: 'Memperbarui profil pengguna #7',
      event: 'updated',
      subject_type: 'App\\Models\\User',
      subject_id: 7,
      causer: {
        id: 1,
        name: 'Super Admin',
        email: 'admin@hjar.id',
      },
      properties: {
        old: { name: 'Ayu' },
        attributes: { name: 'Ayu Penilai' },
      },
      created_at: '2026-09-01 11:30:00',
    },
  ]

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    return mount(ActivityLogsPage, {
      global: {
        plugins: [PrimeVue, [VueQueryPlugin, { queryClient }]],
        stubs: {
          ActivityLogDetailDialog: {
            props: ['open', 'logId'],
            template: '<div v-if="open" class="stubbed-detail-dialog">Detail ID: {{ logId }}</div>',
          },
        },
      },
    })
  }

  it('renders list of activity logs from API', async () => {
    mockServer.use(
      http.get('*/api/v1/activity-logs', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar activity log berhasil diambil.',
          data: mockLogs,
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 2,
            total: 2,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
    )

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Ayu Penilai')
      expect(wrapper.text()).toContain('Menambahkan data pembanding #42')
      expect(wrapper.text()).toContain('Super Admin')
      expect(wrapper.text()).toContain('Memperbarui profil pengguna #7')
    })
  })

  it('opens detail dialog when clicking Detail button', async () => {
    mockServer.use(
      http.get('*/api/v1/activity-logs', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar activity log berhasil diambil.',
          data: mockLogs,
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 2,
            total: 2,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
    )

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      expect(wrapper.findAll('[data-testid="view-log-detail-btn"]').length).toBe(2)
    })

    // Click first detail button
    await wrapper.findAll('[data-testid="view-log-detail-btn"]')[0]!.trigger('click')

    expect(wrapper.find('.stubbed-detail-dialog').exists()).toBe(true)
    expect(wrapper.text()).toContain('Detail ID: 101')
  })

  it('filters by event selection', async () => {
    let capturedEvent = ''
    mockServer.use(
      http.get('*/api/v1/activity-logs', ({ request }) => {
        const url = new URL(request.url)
        capturedEvent = url.searchParams.get('event') || ''
        return HttpResponse.json({
          status: 'success',
          message: 'Daftar activity log berhasil diambil.',
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
        })
      }),
    )

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="event-filter-select"]').exists()).toBe(true)
    })

    const select = wrapper.find('[data-testid="event-filter-select"]')
    await select.setValue('updated')

    await vi.waitFor(() => {
      expect(capturedEvent).toBe('updated')
    })
  })
})
