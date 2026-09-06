import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import MasterDataPage from './MasterDataPage.vue'

describe('MasterDataPage', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/master-data', name: 'master-data.index', component: MasterDataPage }],
  })

  beforeEach(async () => {
    await router.push('/master-data?type=jenis-objek')
    mockServer.use(
      http.get('*/api/v1/dictionaries', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar kategori dictionary berhasil diambil.',
          data: [
            {
              type: 'jenis-objek',
              label: 'Jenis Objek',
              icon: 'pi-building',
              description: 'Kategori properti.',
              stats: { total: 2, active: 2, inactive: 0 },
            },
          ],
        }),
      ),
      http.get('*/api/v1/dictionaries/jenis-objek', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data dictionary jenis-objek',
          data: [
            {
              id: 10,
              name: 'Rumah Tinggal',
              slug: 'rumah-tinggal',
              sort_order: 1,
              is_active: true,
              pembandings_count: 15,
            },
            {
              id: 11,
              name: 'Tanah Kosong',
              slug: 'tanah-kosong',
              sort_order: 2,
              is_active: true,
              pembandings_count: 5,
            },
          ],
        }),
      ),
    )
  })

  function createWrapper() {
    const pinia = createPinia()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const wrapper = mount(MasterDataPage, {
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
      name: 'Admin Master',
      email: 'admin@sysinfo.id',
      roles: ['super_admin'],
      permissions: [
        'view_master_data',
        'create_master_data',
        'update_master_data',
        'update_master_data_status',
        'delete_master_data',
      ],
      created_at: null,
      updated_at: null,
    }

    return wrapper
  }

  it('renders category navigation and items table', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    expect(wrapper.text()).toContain('Manajemen Master Data')

    // Wait for items to be displayed
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Rumah Tinggal')
      expect(wrapper.text()).toContain('Tanah Kosong')
      expect(wrapper.text()).toContain('15 listing')
    })
  })

  it('filters items locally using the search box', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Rumah Tinggal')
    })

    const searchInput = wrapper.find<HTMLInputElement>('.master-data-page__search-input')
    expect(searchInput.exists()).toBe(true)
    await searchInput.setValue('kosong')

    expect(wrapper.text()).not.toContain('Rumah Tinggal')
    expect(wrapper.text()).toContain('Tanah Kosong')
  })
})
