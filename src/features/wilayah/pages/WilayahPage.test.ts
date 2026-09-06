import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import WilayahPage from './WilayahPage.vue'

describe('WilayahPage', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/wilayah', name: 'wilayah.index', component: WilayahPage }],
  })

  beforeEach(async () => {
    await router.push('/wilayah')
    mockServer.use(
      http.get('*/api/v1/geo/provinces', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data provinces berhasil diambil.',
          data: [
            { id: '31', name: 'DKI JAKARTA', regencies_count: 6 },
            { id: '32', name: 'JAWA BARAT', regencies_count: 27 },
          ],
          stats: {
            provinces: 38,
            regencies: 514,
            districts: 7277,
            villages: 83731,
          },
          resource_meta: {
            resource: 'provinces',
            label: 'Provinsi',
            singular: 'Provinsi',
            children_label: 'Kabupaten / Kota',
          },
          options: {
            provinces: [],
            regencies: [],
            districts: [],
          },
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: 2,
          },
        }),
      ),
      http.get('*/api/v1/geo/regencies', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data regencies berhasil diambil.',
          data: [
            {
              id: '3171',
              province_id: '31',
              name: 'KOTA JAKARTA SELATAN',
              districts_count: 10,
              province: { id: '31', name: 'DKI JAKARTA' },
            },
          ],
          stats: {
            provinces: 38,
            regencies: 514,
            districts: 7277,
            villages: 83731,
          },
          resource_meta: {
            resource: 'regencies',
            label: 'Kabupaten / Kota',
            singular: 'Kabupaten / Kota',
            parent_label: 'Provinsi',
            children_label: 'Kecamatan',
          },
          options: {
            provinces: [{ id: '31', name: 'DKI JAKARTA' }],
            regencies: [],
            districts: [],
          },
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: 1,
          },
        }),
      ),
    )
  })

  function createWrapper() {
    const pinia = createPinia()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const wrapper = mount(WilayahPage, {
      global: {
        plugins: [pinia, router, PrimeVue, [VueQueryPlugin, { queryClient }]],
        stubs: {
          UiDialog: {
            props: ['open', 'title'],
            template: '<div v-if="open" class="dialog-mock"><h3>{{ title }}</h3><slot /><slot name="footer" /></div>',
          },
          UiConfirmDialog: {
            props: ['open', 'title'],
            template: '<div v-if="open" class="confirm-dialog-mock"><h3>{{ title }}</h3></div>',
          },
        },
      },
    })

    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin Wilayah',
      email: 'admin@sysinfo.id',
      roles: ['super_admin'],
      permissions: [
        'view_geo_data',
        'create_geo_data',
        'update_geo_data',
        'delete_geo_data',
      ],
      created_at: null,
      updated_at: null,
    }

    return wrapper
  }

  it('renders stats summary cards and provinces list', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    expect(wrapper.text()).toContain('Manajemen Wilayah')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('DKI JAKARTA')
      expect(wrapper.text()).toContain('JAWA BARAT')
      expect(wrapper.text()).toContain('38')
      expect(wrapper.text()).toContain('514')
    })
  })

  it('switches tabs to regencies and shows parent province information', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    const regenciesTabBtn = wrapper.findAll('.wilayah-page__tab-btn').find((btn) =>
      btn.text().includes('Kabupaten / Kota'),
    )
    expect(regenciesTabBtn).toBeDefined()
    await regenciesTabBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('KOTA JAKARTA SELATAN')
      expect(wrapper.text()).toContain('DKI JAKARTA')
    })
  })
})
