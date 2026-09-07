import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { mockServer } from '@/test/mocks/server'

import PembandingDuplicateReviewPage from './PembandingDuplicateReviewPage.vue'

describe('PembandingDuplicateReviewPage', () => {
  let queryClient: QueryClient
  let router: ReturnType<typeof createRouter>

  const mockReviewData = {
    submission: {
      id: 'sub-100',
      expires_at: '2026-12-31T23:59:59Z',
      image_url: 'https://example.com/new.jpg',
      rows: [{ key: 'alamat', label: 'Alamat', value: 'Jl. Merdeka No. 1' }],
    },
    candidates: [
      {
        id: 77,
        created_by: 'Budi Appraiser',
        updated_at: null,
        deleted: false,
        can_update: 'yes',
        image_url: 'https://example.com/old.jpg',
        rows: [{ key: 'alamat', label: 'Alamat', value: 'Jl. Merdeka No. 1B' }],
      },
    ],
  }

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/pembandings/submissions/:submissionId',
          name: 'pembanding.duplicate-review',
          component: PembandingDuplicateReviewPage,
        },
        {
          path: '/pembandings',
          name: 'pembanding.list',
          component: { template: '<div>List</div>' },
        },
      ],
    })

    await router.push('/pembandings/submissions/sub-100')
    await router.isReady()
  })

  function createWrapper() {
    return mount(PembandingDuplicateReviewPage, {
      global: {
        plugins: [createPinia(), [VueQueryPlugin, { queryClient }], router],
      },
    })
  }

  it('renders loading skeleton when fetching duplicate review', () => {
    mockServer.use(http.get('*/api/v1/pembanding-submissions/sub-100', () => new Promise(() => {})))

    const wrapper = createWrapper()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Memuat data duplikat')
  })

  it('renders error alert when fetching fails', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-submissions/sub-100', () =>
        HttpResponse.json(
          { status: 'error', message: 'Sesi duplikat tidak ditemukan atau telah kedaluwarsa.' },
          { status: 404 },
        ),
      ),
    )

    const wrapper = createWrapper()
    await new Promise((resolve) => setTimeout(resolve, 60))

    expect(wrapper.text()).toContain('Gagal memuat data duplikat')
    expect(wrapper.text()).toContain('Sesi duplikat tidak ditemukan atau telah kedaluwarsa.')
  })

  it('renders submission and candidate details and resolves with use_existing strategy', async () => {
    let resolutionBody: Record<string, unknown> | null = null

    mockServer.use(
      http.get('*/api/v1/pembanding-submissions/sub-100', () =>
        HttpResponse.json({
          status: 'success',
          data: mockReviewData,
        }),
      ),
      http.post('*/api/v1/pembanding-submissions/sub-100/resolution', async ({ request }) => {
        resolutionBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: 'success',
          message: 'Duplikat berhasil ditangani.',
          data: {},
        })
      }),
    )

    const wrapper = createWrapper()
    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(wrapper.text()).toContain('Tinjau data duplikat')
    expect(wrapper.text()).toContain('Data baru yang Anda masukkan')
    expect(wrapper.text()).toContain('Jl. Merdeka No. 1')
    expect(wrapper.text()).toContain('#77 — Dibuat oleh Budi Appraiser')
    expect(wrapper.text()).toContain('Jl. Merdeka No. 1B')

    // Select candidate
    const candidateBtn = wrapper.find('.duplicate-review__candidate-selector')
    expect(candidateBtn.exists()).toBe(true)
    await candidateBtn.trigger('click')

    expect(wrapper.text()).toContain('Pertahankan data lama ini, batalkan input baru')
    expect(wrapper.text()).toContain('Ganti data lama ini dengan input baru')

    // Click "Pertahankan data lama..."
    const useExistingBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Pertahankan data lama ini, batalkan input baru'))
    expect(useExistingBtn).toBeDefined()
    await useExistingBtn!.trigger('click')

    expect(wrapper.text()).toContain('Data baru dibatalkan. Data lama yang ada tetap digunakan.')

    // Confirm resolution
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Ya, lanjutkan'))
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')

    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(resolutionBody).toEqual({
      strategy: 'use_existing',
      candidate_id: 77,
    })

    expect(wrapper.text()).toContain('Duplikat berhasil ditangani')
  })

  it('resolves with replace_existing strategy', async () => {
    let resolutionBody: Record<string, unknown> | null = null

    mockServer.use(
      http.get('*/api/v1/pembanding-submissions/sub-100', () =>
        HttpResponse.json({
          status: 'success',
          data: mockReviewData,
        }),
      ),
      http.post('*/api/v1/pembanding-submissions/sub-100/resolution', async ({ request }) => {
        resolutionBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: 'success',
          message: 'Record lama berhasil diperbarui.',
          data: {},
        })
      }),
    )

    const wrapper = createWrapper()
    await new Promise((resolve) => setTimeout(resolve, 80))

    // Select candidate
    await wrapper.find('.duplicate-review__candidate-selector').trigger('click')

    // Choose replace_existing
    const replaceBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Ganti data lama ini dengan input baru'))
    expect(replaceBtn).toBeDefined()
    await replaceBtn!.trigger('click')

    expect(wrapper.text()).toContain(
      'Data yang ada akan diganti dengan data baru yang Anda masukkan.',
    )

    // Confirm resolution
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Ya, lanjutkan'))
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')

    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(resolutionBody).toEqual({
      strategy: 'replace_existing',
      candidate_id: 77,
    })

    expect(wrapper.text()).toContain('Duplikat berhasil ditangani')
  })
})
