import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import ImportBatchDetailPage from './ImportBatchDetailPage.vue'

describe('ImportBatchDetailPage', () => {
  const mockBatch = {
    id: 101,
    filename: 'test_import.xlsx',
    owner: 'Admin Tester',
    status: 'ready',
    status_label: 'Draf',
    total_rows: 2,
    selected_rows: 2,
    ready_rows: 1,
    imported_rows: 0,
    failed_rows: 1,
    processing_rows: 0,
    can_edit: true,
    can_finalize: true,
    finalize_block_reason: null,
    finalization_date: '2026-09-01',
    finalized_at: null,
    updated_at: '2026-09-01 10:00:00',
  }

  const mockRows = [
    {
      id: 1,
      source_row_number: 2,
      status: 'ready',
      status_label: 'Siap',
      is_selected: true,
      alamat: 'Jl. Riau No. 12',
      location: 'Bandung Wetan, Bandung, Jawa Barat',
      jenis_pembanding: 'Penawaran',
      luas_tanah: 250,
      luas_bangunan: 180,
      nilai_transaksi_terkoreksi: 2500000000,
      warnings: [],
      missing_fields: [],
      last_error: null,
      has_image: true,
      image_source: 'staged',
      image_preview_url: '/staged/foto1.jpg',
    },
    {
      id: 2,
      source_row_number: 3,
      status: 'failed',
      status_label: 'Gagal',
      is_selected: false,
      alamat: 'Jl. Merdeka No. 45',
      location: 'Sumur Bandung, Bandung, Jawa Barat',
      jenis_pembanding: 'Transaksi',
      luas_tanah: 150,
      luas_bangunan: 0,
      nilai_transaksi_terkoreksi: 1200000000,
      warnings: ['Perbedaan harga signifikan'],
      missing_fields: ['latitude', 'longitude'],
      last_error: 'Koordinat tidak valid',
      has_image: false,
      image_source: null,
      image_preview_url: null,
    },
  ]

  function createTestSetup() {
    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin Tester',
      email: 'admin@example.com',
      roles: ['super_admin'],
      permissions: ['create_data::pembanding', 'view_any_data::pembanding'],
      created_at: null,
      updated_at: null,
    }

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/imports', name: 'import.index', component: { template: '<div>List</div>' } },
        {
          path: '/imports/:id',
          name: 'import.detail',
          component: ImportBatchDetailPage,
        },
      ],
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    return { pinia, auth, router, queryClient }
  }

  function mountPage(setup: ReturnType<typeof createTestSetup>) {
    return mount(ImportBatchDetailPage, {
      global: {
        plugins: [
          setup.pinia,
          setup.router,
          PrimeVue,
          [VueQueryPlugin, { queryClient: setup.queryClient }],
        ],
        stubs: {
          ImportBulkApplyDialog: {
            props: ['open', 'batchId', 'selectedCount'],
            template: '<div v-if="open" data-testid="bulk-apply-dialog">Bulk Apply Mock</div>',
          },
          ImportFinalizeDialog: {
            props: ['open', 'batch'],
            template: '<div v-if="open" data-testid="finalize-dialog">Finalize Mock</div>',
          },
          ImportRowEditDialog: {
            props: ['open', 'batchId', 'rowId'],
            template: '<div v-if="open" data-testid="row-edit-dialog">Row Edit Mock</div>',
          },
        },
      },
    })
  }

  it('renders batch details, summary cards, and row items', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports/:id', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail batch impor Excel berhasil diambil.',
          data: mockRows,
          batch: mockBatch,
          options: {
            statusPemberiInfos: [],
            bentukTanahs: [],
            posisiTanahs: [],
            kondisiTanahs: [],
            topografis: [],
            dokumenTanahs: [],
            peruntukans: [],
          },
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

    const setup = createTestSetup()
    await setup.router.push('/imports/101')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('test_import.xlsx')
      expect(wrapper.text()).toContain('Pengunggah: Admin Tester')
      expect(wrapper.text()).toContain('Jl. Riau No. 12')
      expect(wrapper.text()).toContain('Jl. Merdeka No. 45')
      expect(wrapper.text()).toContain('Koordinat tidak valid')
    })
  })

  it('allows toggling individual row selection', async () => {
    let patchedPayload: unknown = null
    mockServer.use(
      http.get('*/api/v1/pembanding-imports/:id', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail batch impor Excel berhasil diambil.',
          data: mockRows,
          batch: mockBatch,
          meta: { current_page: 1, per_page: 15, from: 1, to: 2, total: 2, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
      http.patch('*/api/v1/pembanding-imports/:id/selection', async ({ request }) => {
        patchedPayload = await request.json()
        return HttpResponse.json({
          status: 'success',
          message: 'Pilihan baris berhasil diperbarui.',
          data: { selected_rows: 1 },
        })
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/imports/101')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Riau No. 12')
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
    // Click first row checkbox (row 1 is currently selected: true, toggling should send is_selected: false)
    await checkboxes[0]!.setValue(false)

    await vi.waitFor(() => {
      expect(patchedPayload).toEqual({
        action: 'set_rows',
        row_ids: [1],
        is_selected: false,
      })
    })
  })

  it('handles bulk selection actions', async () => {
    let bulkAction: unknown = null
    mockServer.use(
      http.get('*/api/v1/pembanding-imports/:id', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail batch impor Excel berhasil diambil.',
          data: mockRows,
          batch: mockBatch,
          meta: { current_page: 1, per_page: 15, from: 1, to: 2, total: 2, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
      http.patch('*/api/v1/pembanding-imports/:id/selection', async ({ request }) => {
        bulkAction = await request.json()
        return HttpResponse.json({
          status: 'success',
          message: 'Pilihan baris berhasil diperbarui.',
          data: { selected_rows: 2 },
        })
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/imports/101')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Pilih Semua')
    })

    const selectAllBtn = wrapper.findAll('button').find((b) => b.text().includes('Pilih Semua'))
    expect(selectAllBtn).toBeDefined()
    await selectAllBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(bulkAction).toEqual({ action: 'select_all' })
    })
  })

  it('allows retrying a failed row', async () => {
    let retriedRowId: string | null = null
    mockServer.use(
      http.get('*/api/v1/pembanding-imports/:id', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail batch impor Excel berhasil diambil.',
          data: mockRows,
          batch: mockBatch,
          meta: { current_page: 1, per_page: 15, from: 1, to: 2, total: 2, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
      http.post('*/api/v1/pembanding-imports/:id/rows/:rowId/retry', ({ params }) => {
        retriedRowId = params.rowId as string
        return HttpResponse.json({
          status: 'success',
          message: 'Baris sedang divalidasi ulang.',
          data: { id: 2, status: 'processing' },
        })
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/imports/101')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Merdeka No. 45')
    })

    const retryBtn = wrapper.find('button[aria-label="Coba ulang baris"]')
    expect(retryBtn.exists()).toBe(true)
    await retryBtn.trigger('click')

    await vi.waitFor(() => {
      expect(retriedRowId).toBe('2')
    })
  })

  it('opens finalize dialog when clicking Finalisasi Impor', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports/:id', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail batch impor Excel berhasil diambil.',
          data: mockRows,
          batch: mockBatch,
          meta: { current_page: 1, per_page: 15, from: 1, to: 2, total: 2, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/imports/101')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Finalisasi Impor')
    })

    const finalizeBtn = wrapper.findAll('button').find((b) => b.text().includes('Finalisasi Impor'))
    expect(finalizeBtn).toBeDefined()
    await finalizeBtn!.trigger('click')

    expect(wrapper.find('[data-testid="finalize-dialog"]').exists()).toBe(true)
  })

  it('opens bulk apply dialog when clicking Terapkan Massal', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports/:id', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail batch impor Excel berhasil diambil.',
          data: mockRows,
          batch: mockBatch,
          meta: { current_page: 1, per_page: 15, from: 1, to: 2, total: 2, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/imports/101')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Terapkan Massal (2)')
    })

    const bulkBtn = wrapper.findAll('button').find((b) => b.text().includes('Terapkan Massal'))
    expect(bulkBtn).toBeDefined()
    await bulkBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="bulk-apply-dialog"]').exists()).toBe(true)
    })
  })
})
