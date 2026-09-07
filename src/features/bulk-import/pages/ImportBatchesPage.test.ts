import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import ImportBatchesPage from './ImportBatchesPage.vue'

describe('ImportBatchesPage', () => {
  function createTestSetup() {
    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      roles: ['super_admin'],
      permissions: ['create_data::pembanding', 'view_any_data::pembanding'],
      created_at: null,
      updated_at: null,
    }

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/imports', name: 'import.index', component: ImportBatchesPage },
        {
          path: '/imports/:id',
          name: 'import.detail',
          component: { template: '<div>Batch Detail</div>' },
        },
      ],
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    return { pinia, auth, router, queryClient }
  }

  function mountPage(setup: ReturnType<typeof createTestSetup>) {
    return mount(ImportBatchesPage, {
      global: {
        plugins: [
          setup.pinia,
          setup.router,
          PrimeVue,
          [VueQueryPlugin, { queryClient: setup.queryClient }],
        ],
        stubs: {
          UiDialog: {
            props: ['open', 'title'],
            template: '<div v-if="open" class="dialog-mock"><h3>{{ title }}</h3><slot /></div>',
          },
        },
      },
    })
  }

  it('renders batch list successfully', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar batch impor Excel berhasil diambil.',
          data: [
            {
              id: 101,
              filename: 'pembanding_bandung_utara.xlsx',
              owner: 'Budi Appraiser',
              status: 'ready',
              status_label: 'Draf',
              total_rows: 35,
              selected_rows: 35,
              ready_rows: 30,
              imported_rows: 0,
              failed_rows: 5,
              processing_rows: 0,
              can_edit: true,
              can_finalize: true,
              finalize_block_reason: null,
              finalization_date: '2026-09-01',
              finalized_at: null,
              updated_at: '2026-09-01 10:00:00',
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
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/imports')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Impor Data Pembanding')
      expect(wrapper.text()).toContain('pembanding_bandung_utara.xlsx')
      expect(wrapper.text()).toContain('Budi Appraiser')
      expect(wrapper.text()).toContain('35')
      expect(wrapper.text()).toContain('30')
      expect(wrapper.text()).toContain('Buka Draf')
    })
  })

  it('renders empty state when there are no import batches', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar batch impor Excel berhasil diambil.',
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
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/imports')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Belum Ada Batch Impor')
      expect(wrapper.text()).toContain('Unggah Berkas Pertama')
    })
  })

  it('opens upload dialog when clicking Unggah Berkas Baru', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar batch impor Excel berhasil diambil.',
          data: [],
          meta: { current_page: 1, per_page: 15, from: null, to: null, total: 0, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/imports')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Impor Data Pembanding')
    })

    const uploadBtn = wrapper.findAll('button').find((b) => b.text().includes('Unggah Berkas Baru'))
    expect(uploadBtn).toBeDefined()
    await uploadBtn!.trigger('click')

    const uploadDialog = wrapper.findComponent({ name: 'UploadImportBatchDialog' })
    expect(uploadDialog.props('open')).toBe(true)
  })
})
