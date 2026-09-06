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
      http.get('*/api/v1/exports/download', () =>
        new HttpResponse('binary-data', {
          status: 200,
          headers: {
            'Content-Disposition': 'attachment; filename="pembanding-export.xlsx"',
          },
        }),
      ),
    )

    const wrapper = createWrapper()
    const downloadBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Unduh Sekarang'))

    expect(downloadBtn).toBeDefined()
    await downloadBtn?.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.emitted('success')).toBeTruthy()
      expect(wrapper.text()).toContain('berhasil diunduh')
    })
  })
})
