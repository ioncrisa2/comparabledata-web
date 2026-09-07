import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import PembandingHistoryPanel from './PembandingHistoryPanel.vue'

describe('PembandingHistoryPanel', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  function createWrapper(props = { pembandingId: '42' }) {
    return mount(PembandingHistoryPanel, {
      props,
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    })
  }

  it('renders a loading skeleton when query is pending', () => {
    mockServer.use(http.get('*/api/v1/pembandings/42/history', () => new Promise(() => {})))

    const wrapper = createWrapper()

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Memuat riwayat perubahan')
  })

  it('renders an empty state when history list is empty', async () => {
    mockServer.use(
      http.get('*/api/v1/pembandings/42/history', () =>
        HttpResponse.json({
          status: 'success',
          data: [],
        }),
      ),
    )

    const wrapper = createWrapper()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Belum ada riwayat tercatat')
  })

  it('renders error alert and supports retrying when query fails', async () => {
    let callCount = 0
    mockServer.use(
      http.get('*/api/v1/pembandings/42/history', () => {
        callCount++
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 })
        }
        return HttpResponse.json({
          status: 'success',
          data: [],
        })
      }),
    )

    const wrapper = createWrapper()
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Riwayat gagal dimuat')

    const retryBtn = wrapper.find('button')
    expect(retryBtn.exists()).toBe(true)
    expect(retryBtn.text()).toContain('Coba lagi')

    await retryBtn.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(callCount).toBe(2)
  })

  it('renders history entries with event, causer, timestamp, and field changes', async () => {
    mockServer.use(
      http.get('*/api/v1/pembandings/42/history', () =>
        HttpResponse.json({
          status: 'success',
          data: [
            {
              id: 101,
              event: 'created',
              causer: 'Budi Santoso',
              causer_email: 'budi@example.test',
              created_at: '2026-08-30 10:15:00',
              changes: [
                {
                  field: 'harga',
                  old: null,
                  new: 2400000000,
                },
                {
                  field: 'alamat_data',
                  old: null,
                  new: 'Jl. Sudirman No. 42',
                },
              ],
            },
            {
              id: 102,
              event: 'updated',
              causer: 'Admin Sysinfo',
              causer_email: null,
              created_at: '2026-09-01T14:30:00+07:00',
              changes: [
                {
                  field: 'catatan',
                  old: 'Catatan awal',
                  new: 'Catatan diperbarui',
                },
              ],
            },
            {
              id: 103,
              event: 'deleted',
              causer: 'Moderator',
              causer_email: 'mod@example.test',
              created_at: null,
              changes: [],
            },
          ],
        }),
      ),
    )

    const wrapper = createWrapper()
    await new Promise((resolve) => setTimeout(resolve, 60))

    expect(wrapper.text()).toContain('Historis perubahan')
    expect(wrapper.text()).toContain('Data ditambahkan')
    expect(wrapper.text()).toContain('Budi Santoso · budi@example.test')
    expect(wrapper.text()).toContain('Harga')
    expect(wrapper.text()).toMatch(/Rp[\s\u00a0]2\.400\.000\.000/)
    expect(wrapper.text()).toContain('Alamat')
    expect(wrapper.text()).toContain('Jl. Sudirman No. 42')

    // Updated entry
    expect(wrapper.text()).toContain('Data diubah')
    expect(wrapper.text()).toContain('Admin Sysinfo')
    expect(wrapper.text()).toContain('Catatan')
    expect(wrapper.text()).toContain('Catatan awal')
    expect(wrapper.text()).toContain('Catatan diperbarui')

    // Deleted entry without details
    expect(wrapper.text()).toContain('Data dihapus')
    expect(wrapper.text()).toContain('Waktu tidak tercatat')
    expect(wrapper.text()).toContain(
      'Tidak ada rincian perubahan field yang tercatat untuk aktivitas ini.',
    )
  })
})
