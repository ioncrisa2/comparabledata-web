import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import PembandingExportDialog from './PembandingExportDialog.vue'

describe('PembandingExportDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    mockServer.use(
      http.get('*/api/v1/exports/configuration', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Konfigurasi ekspor berhasil diambil.',
          data: {
            configuration: {
              profiles: [
                { value: 'ringkas', label: 'Ringkas', columns: ['id', 'alamat'] },
                { value: 'lengkap', label: 'Lengkap', columns: ['id', 'alamat', 'harga'] },
              ],
              columns: [],
            },
            limits: {
              excel: 5000,
              csv: 5000,
              geojson: 5000,
              kml: 5000,
              pdf_summary: 1000,
              pdf_detail: 100,
            },
            async_limits: {
              excel: 100000,
              csv: 100000,
              geojson: 50000,
              kml: 50000,
              pdf_summary: 5000,
              pdf_detail: 500,
            },
          },
        }),
      ),
      http.get('*/api/v1/exports/runs', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar riwayat tugas ekspor berhasil diambil.',
          data: [],
          meta: { current_page: 1, per_page: 25, from: null, to: null, total: 0, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
      http.post('*/api/v1/exports/preview', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Preview ekspor berhasil dihitung.',
          data: {
            count: '42',
            sync_limit: 5000,
            queued: false,
            without_coordinates: '0',
          },
        }),
      ),
    )
  })

  function createWrapper(props = {}) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return mount(PembandingExportDialog, {
      props: {
        open: true,
        totalItems: 42,
        filters: { q: 'Sudirman' },
        ...props,
      },
      global: {
        plugins: [PrimeVue, [VueQueryPlugin, { queryClient }]],
        stubs: {
          UiDialog: {
            props: ['open', 'title', 'description'],
            template: `
              <div v-if="open" class="ui-dialog-mock">
                <h2>{{ title }}</h2>
                <p v-if="description">{{ description }}</p>
                <slot />
                <slot name="footer" />
              </div>
            `,
          },
        },
      },
    })
  }

  it('renders dialog with total items scope and format options', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Ekspor Data Pembanding')
    expect(wrapper.text()).toContain('42 data')
    expect(wrapper.text()).toContain('Excel (.xlsx)')
    expect(wrapper.text()).toContain('PDF (.pdf)')
    expect(wrapper.text()).toContain('CSV (.csv)')
    expect(wrapper.text()).toContain('GeoJSON (.geojson)')
    expect(wrapper.text()).toContain('KML (.kml)')
  })

  it('shows PDF display mode options when PDF is chosen', async () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).not.toContain('Ringkasan Tabel')

    const formatSelect = wrapper.find<HTMLSelectElement>('[data-testid="export-format-select"]')
    expect(formatSelect.exists()).toBe(true)
    await formatSelect.setValue('pdf')

    expect(wrapper.text()).toContain('Tampilan Dokumen PDF')
    expect(wrapper.text()).toContain('Ringkasan Tabel')
    expect(wrapper.text()).toContain('Detail per Halaman')
  })

  it('handles download action successfully', async () => {
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-export')
    window.URL.revokeObjectURL = vi.fn()

    mockServer.use(
      http.get(
        '*/api/v1/exports/download',
        () =>
          new HttpResponse('binary-data', {
            status: 200,
            headers: {
              'Content-Disposition': 'attachment; filename="pembanding-export.xlsx"',
            },
          }),
      ),
    )

    const wrapper = createWrapper()
    await vi.waitFor(() => {
      expect(wrapper.find('.export-preview-card').exists()).toBe(true)
    })

    const downloadBtn = wrapper.findAll('button').find((b) => b.text().includes('Unduh Sekarang'))

    expect(downloadBtn).toBeDefined()
    await downloadBtn?.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.emitted('success')).toBeTruthy()
      expect(wrapper.text()).toContain('berhasil diunduh')
    })
  })

  it('displays limit warning and triggers background export when queued is required', async () => {
    mockServer.use(
      http.post('*/api/v1/exports/preview', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Preview ekspor berhasil dihitung.',
          data: {
            count: '15000',
            sync_limit: 5000,
            queued: true,
            without_coordinates: '150',
          },
        }),
      ),
      http.post('*/api/v1/exports/runs', () =>
        HttpResponse.json(
          {
            status: 'success',
            message: 'Tugas ekspor berhasil didaftarkan ke antrean.',
            data: {
              id: 88,
              status: 'queued',
              format: 'excel',
              mode: null,
              profile: 'ringkas',
              scope: 'filtered',
              total_records: 15000,
              processed_records: 0,
              created_at: '2026-09-01 10:00:00',
              expires_at: null,
              error: null,
              download_url: null,
            },
          },
          { status: 202 },
        ),
      ),
    )

    const wrapper = createWrapper({ totalItems: 15000 })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Dialihkan ke Proses Latar Belakang')
      expect(wrapper.text()).toContain('Jalankan Ekspor Latar Belakang')
    })

    const runBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Jalankan Ekspor Latar Belakang'))
    expect(runBtn).toBeDefined()
    await runBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Tugas ekspor #88 berhasil dijadwalkan')
      expect(wrapper.find('[data-testid="export-runs-section"]').exists()).toBe(true)
    })
  })

  it('renders runs list and handles retry and download run actions', async () => {
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-run-download')
    window.URL.revokeObjectURL = vi.fn()

    let retryCalled = false
    mockServer.use(
      http.get('*/api/v1/exports/runs', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar riwayat tugas ekspor berhasil diambil.',
          data: [
            {
              id: 88,
              status: 'failed',
              format: 'excel',
              mode: null,
              profile: 'ringkas',
              scope: 'filtered',
              total_records: 15000,
              processed_records: 5000,
              created_at: '2026-09-01 10:00:00',
              expires_at: null,
              error: 'Koneksi database terputus',
              download_url: null,
            },
            {
              id: 87,
              status: 'completed',
              format: 'pdf',
              mode: 'summary',
              profile: 'lengkap',
              scope: 'selected',
              total_records: 20,
              processed_records: 20,
              created_at: '2026-09-01 09:00:00',
              expires_at: '2026-09-08 09:00:00',
              error: null,
              download_url: '/api/v1/exports/runs/87/download',
            },
          ],
          meta: { current_page: 1, per_page: 25, from: 1, to: 2, total: 2, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
      http.post('*/api/v1/exports/runs/88/retry', () => {
        retryCalled = true
        return HttpResponse.json({
          status: 'success',
          message: 'Ekspor dijadwalkan ulang.',
          data: { id: 88, status: 'queued' },
        })
      }),
      http.get(
        '*/api/v1/exports/runs/87/download',
        () =>
          new HttpResponse('pdf-content', {
            status: 200,
            headers: {
              'Content-Disposition': 'attachment; filename="data-pembanding-87.pdf"',
            },
          }),
      ),
    )

    const wrapper = createWrapper()

    // Click tab "Riwayat Tugas Ekspor"
    const runsTabBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Riwayat Tugas Ekspor'))
    expect(runsTabBtn).toBeDefined()
    await runsTabBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Ekspor #88 (EXCEL)')
      expect(wrapper.text()).toContain('Koneksi database terputus')
      expect(wrapper.text()).toContain('Ekspor #87 (PDF)')
    })

    // Click retry on run 88
    const retryBtn = wrapper.findAll('button').find((b) => b.text().includes('Coba Ulang'))
    expect(retryBtn).toBeDefined()
    await retryBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(retryCalled).toBe(true)
      expect(wrapper.text()).toContain('Tugas ekspor #88 dijadwalkan ulang')
    })

    // Click download on run 87
    const downloadRunBtn = wrapper.findAll('button').find((b) => b.text().includes('Unduh Berkas'))
    expect(downloadRunBtn).toBeDefined()
    await downloadRunBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Berkas "data-pembanding-87.pdf" berhasil diunduh')
    })
  })
})
