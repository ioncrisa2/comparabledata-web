import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import DashboardPage from './DashboardPage.vue'

describe('DashboardPage', () => {
  it('renders role-aware statistics from the backend', async () => {
    mockServer.use(
      http.get('*/api/v1/dashboard', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data dashboard berhasil diambil.',
          data: {
            dashboard_variant: 'data_contributor',
            map_points: [],
            stats: {
              total: 12,
              this_month: 3,
              last_month: 2,
              with_coords: 10,
              province_count: 4,
            },
            jenis_listing_options: [],
            can: {},
            can_widgets: {},
            delete_request_alert: null,
          },
        }),
      ),
    )

    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.user = {
      id: 7,
      name: 'Ayu Penilai',
      email: 'ayu@example.com',
      roles: ['appraiser'],
      permissions: [],
      created_at: null,
      updated_at: null,
    }
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(DashboardPage, {
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
    })

    await vi.waitFor(() => {
      expect(wrapper.get('h1').text()).toBe('Selamat datang, Ayu Penilai')
      expect(wrapper.text()).toContain('Total pembanding')
      expect(wrapper.text()).toContain('12')
      expect(wrapper.text()).toContain('Kontributor data')
    })

    wrapper.unmount()
    queryClient.clear()
  })
})
