import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import DashboardChart from '../components/DashboardChart.vue'
import DashboardMapCanvas from '../components/DashboardMapCanvas.vue'
import { dashboardResponse } from '../test/fixtures'
import DashboardPage from './DashboardPage.vue'

const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((dispose) => dispose()))

async function renderDashboard(response = dashboardResponse()) {
  mockServer.use(http.get('*/api/v1/dashboard', () => HttpResponse.json(response)))
  const pinia = createPinia()
  useAuthStore(pinia).user = {
    id: 7,
    name: 'Ayu Penilai',
    email: 'ayu@example.com',
    roles: ['appraiser'],
    permissions: [],
    created_at: null,
    updated_at: null,
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/pembandings/:id', name: 'pembanding.detail', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  const wrapper = mount(DashboardPage, {
    global: {
      plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      stubs: { DashboardChart: true, DashboardMapCanvas: true },
    },
  })
  cleanup.push(() => {
    wrapper.unmount()
    queryClient.clear()
  })
  await vi.waitFor(() => expect(wrapper.text()).toContain('Dashboard aktif'))
  return { wrapper, router, queryClient }
}

describe('dashboard widgets', () => {
  it('renders permitted widgets and keeps zero months in the accessible table', async () => {
    const { wrapper } = await renderDashboard(
      dashboardResponse({
        monthly_data: [
          { month: 'Jul 2026', count: 0 },
          { month: 'Agu 2026', count: 18 },
        ],
      }),
    )
    expect(wrapper.text()).toContain('Peta sebaran data')
    expect(wrapper.text()).toContain('Tren input data pembanding')
    expect(wrapper.text()).toContain('Komposisi jenis listing')
    expect(wrapper.text()).toContain('Kontributor teratas')
    expect(wrapper.text()).toContain('Tanpa tanggal data')
    const chart = wrapper.findAllComponents(DashboardChart)[0]!
    expect(chart.props('data').datasets[0]?.data).toEqual([0, 18])
    expect(wrapper.find('[aria-label="Tabel tren bulanan"]').text()).toContain('Jul 20260')
  })

  it('hides data for denied widgets and shows an intentional no-access state', async () => {
    const { wrapper } = await renderDashboard(dashboardResponse({ can_widgets: { map: 'false' } }))
    expect(wrapper.text()).toContain('Belum ada widget yang dapat diakses')
    expect(wrapper.text()).not.toContain('Peta sebaran data')
    expect(wrapper.text()).not.toContain('Tren input data pembanding')
    expect(wrapper.text()).not.toContain('Total pembanding')
    expect(wrapper.text()).not.toContain('Ayu Penilai42')
    expect(wrapper.findComponent(DashboardChart).exists()).toBe(false)
    expect(wrapper.findComponent(DashboardMapCanvas).exists()).toBe(false)
  })

  it('filters map points through the URL and clears selection when the point is excluded', async () => {
    const { wrapper, router } = await renderDashboard()
    const map = wrapper.findComponent(DashboardMapCanvas)
    map.vm.$emit('select', 42)
    await vi.waitFor(() =>
      expect(wrapper.find('[aria-label="Lokasi terpilih"]').text()).toContain('Juanda'),
    )
    expect(wrapper.find('[aria-label="Lokasi terpilih"] a').attributes('href')).toBe(
      '/pembandings/42',
    )
    await wrapper.get('#dashboard-map-listing').setValue('2')
    await vi.waitFor(() => {
      expect(router.currentRoute.value.query.map_listing).toBe('2')
      expect(map.props('points').map((point: { id: number }) => point.id)).toEqual([43])
    })
    expect(wrapper.find('[aria-label="Lokasi terpilih"]').exists()).toBe(false)
    await router.push('/?map_listing=999')
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('Tidak ada titik untuk jenis listing ini'),
    )
    expect(wrapper.findComponent(DashboardMapCanvas).exists()).toBe(false)
  })

  it('shows empty states for allowed widgets without inventing data', async () => {
    const { wrapper } = await renderDashboard(
      dashboardResponse({
        map_points: [],
        monthly_data: [],
        listing_ratio_monthly: { labels: [], series: [], month_totals: [] },
        top_contributors: [],
      }),
    )
    expect(wrapper.text()).toContain('Belum ada lokasi untuk ditampilkan')
    expect(wrapper.text()).toContain('Belum ada tren input')
    expect(wrapper.text()).toContain('Belum ada komposisi listing')
    expect(wrapper.text()).toContain('Belum ada data ringkasan')
  })

  it('keeps loaded widgets visible when a background refresh fails', async () => {
    const { wrapper, queryClient } = await renderDashboard()
    mockServer.use(http.get('*/api/v1/dashboard', () => new HttpResponse(null, { status: 500 })))
    await queryClient.refetchQueries({ queryKey: ['dashboard'] })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Pembaruan dashboard gagal'))
    expect(wrapper.text()).toContain('Tren input data pembanding')
    expect(wrapper.text()).toContain('Data terakhir tetap ditampilkan')
  })
})
