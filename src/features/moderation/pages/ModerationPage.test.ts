import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import ModerationPage from './ModerationPage.vue'

describe('ModerationPage', () => {
  function createTestSetup(
    permissions = [
      'approve_delete_request',
      'reject_delete_request',
      'restore_data::pembanding',
      'force_delete_data::pembanding',
      'view_moderation',
    ],
  ) {
    const pinia = createPinia()
    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      roles: ['admin'],
      permissions,
      created_at: null,
      updated_at: null,
    }

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/moderation', component: ModerationPage },
        {
          path: '/pembandings/:id',
          name: 'pembanding.detail',
          component: { template: '<div>Detail</div>' },
        },
      ],
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    return { pinia, auth, router, queryClient }
  }

  function mountPage(setup: ReturnType<typeof createTestSetup>) {
    return mount(ModerationPage, {
      global: {
        plugins: [
          setup.pinia,
          setup.router,
          PrimeVue,
          [VueQueryPlugin, { queryClient: setup.queryClient }],
        ],
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

  it('renders moderation queue and actions', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [
            {
              id: 101,
              alamat_data: 'Jl. Sudirman No. 45',
              harga: 500000000,
              deleted_at: null,
              deleted_reason: 'Data terindikasi ganda dengan listing #88',
              jenis_listing: null,
              deleted_by: null,
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
          can: { approve: 'true', reject: 'true' },
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Moderasi data')
      expect(wrapper.text()).toContain('Jl. Sudirman No. 45')
      expect(wrapper.text()).toContain('Setujui')
      expect(wrapper.text()).toContain('Tolak')
    })
  })

  it('renders nested DeleteRequest structure correctly with relations and pembanding ID link', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [
            {
              id: 8,
              pembanding_id: 42,
              reason: 'Data terduplikasi saat submit jaringan lambat',
              requested_by: { id: 5, name: 'Siti Rahma' },
              pembanding: {
                id: 42,
                alamat_data: 'Jl. Gatot Subroto No. 88, Bandung',
                harga: 450000000,
                jenis_listing: { name: 'Jual' },
              },
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
          can: { approve: 'true', reject: 'true' },
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Gatot Subroto No. 88, Bandung')
      expect(wrapper.text()).toContain('Jual')
      expect(wrapper.text()).toContain('450 Juta')
      expect(wrapper.text()).toContain('Data terduplikasi saat submit jaringan lambat')
      expect(wrapper.text()).toContain('Oleh: Siti Rahma')
    })

    const link = wrapper.find('a.moderation-page__property-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/pembandings/42')
  })

  it('renders empty state when there are no moderation items', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
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
          can: {},
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Tidak ada permohonan hapus')
    })
  })

  it('renders error state when fetch fails without crashing application', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({ message: 'Server Error' }, { status: 500 }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Moderasi data')
      expect(wrapper.text()).toContain('Data gagal dimuat')
    })
  })

  it('switches to trash tab and renders trash-specific items and actions', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', ({ request }) => {
        const url = new URL(request.url)
        const tab = url.searchParams.get('tab')
        if (tab === 'trash') {
          return HttpResponse.json({
            status: 'success',
            message: 'Data tempat sampah berhasil diambil.',
            tab: 'trash',
            data: [
              {
                id: 202,
                alamat_data: 'Jl. Merdeka No. 10',
                harga: 850000000,
                deleted_at: '2026-09-01T12:00:00Z',
                deleted_reason: 'Listing sudah terjual',
                jenis_listing: { name: 'Jual' },
                deleted_by: { name: 'Budi Moderator' },
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
            can: {},
          })
        }
        return HttpResponse.json({
          status: 'success',
          message: 'Data permohonan.',
          tab: 'requests',
          data: [],
          meta: { current_page: 1, per_page: 15, from: null, to: null, total: 0, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        })
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation?tab=trash')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.find('section.data-table-shell').attributes('aria-label')).toBe(
        'Daftar tempat sampah',
      )
      expect(wrapper.text()).toContain('Jl. Merdeka No. 10')
      expect(wrapper.text()).toContain('Waktu Hapus & Oleh')
      expect(wrapper.text()).toContain('Pulihkan')
      expect(wrapper.text()).toContain('Hapus Permanen')
    })
  })

  it('handles pagination URL query update', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi.',
          tab: 'requests',
          data: [
            {
              id: 1,
              alamat_data: 'Jl. Page One',
              harga: 100000000,
              deleted_at: null,
              deleted_reason: 'Tes',
              jenis_listing: null,
              deleted_by: null,
            },
          ],
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 15,
            total: 30,
            last_page: 2,
          },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.find('.moderation-page__pagination').exists()).toBe(true)
    })

    const nextBtn = wrapper.find('[data-testid="pagination-next"]')
    if (nextBtn.exists()) {
      await nextBtn.trigger('click')
      expect(setup.router.currentRoute.value.query.page).toBe('2')
    }
  })

  it('approves a delete request with target summary card and displays success alert', async () => {
    let approveCalledWithId: string | null = null

    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [
            {
              id: 101,
              pembanding_id: 101,
              alamat_data: 'Jl. Sudirman No. 45',
              harga: 500000000,
              deleted_at: null,
              deleted_reason: 'Data terindikasi ganda dengan listing #88',
              jenis_listing: { name: 'Jual' },
              deleted_by: { name: 'Bambang' },
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: { approve: 'true', reject: 'true' },
        }),
      ),
      http.post('*/api/v1/moderation/delete-requests/:id/approve', ({ params }) => {
        approveCalledWithId = String(params.id)
        return HttpResponse.json({
          status: 'success',
          message: 'Permohonan disetujui.',
          data: null,
        })
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Sudirman No. 45')
    })

    const approveBtn = wrapper.findAll('button').find((b) => b.text().includes('Setujui'))
    expect(approveBtn).toBeDefined()
    await approveBtn!.trigger('click')

    // Confirm dialog opens with target summary
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Setujui permohonan hapus?')
      expect(wrapper.text()).toContain('Jl. Sudirman No. 45')
      expect(wrapper.text()).toContain('500 Juta')
      expect(wrapper.text()).toContain('Bambang')
      expect(wrapper.text()).toContain('Data terindikasi ganda dengan listing #88')
    })

    // Click confirm button
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Ya, setujui hapus'))
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(approveCalledWithId).toBe('101')
      expect(wrapper.text()).toContain('Permohonan disetujui')
    })
  })

  it('handles concurrent conflict ALREADY_PROCESSED gracefully during approve', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [
            {
              id: 101,
              alamat_data: 'Jl. Sudirman No. 45',
              harga: 500000000,
              deleted_at: null,
              deleted_reason: 'Duplikat',
              jenis_listing: null,
              deleted_by: null,
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: { approve: 'true', reject: 'true' },
        }),
      ),
      http.post('*/api/v1/moderation/delete-requests/:id/approve', () => {
        return HttpResponse.json(
          {
            status: 'error',
            code: 'ALREADY_PROCESSED',
            message: 'Permohonan hapus sudah diproses sebelumnya.',
          },
          { status: 422 },
        )
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Sudirman No. 45')
    })

    const approveBtn = wrapper.findAll('button').find((b) => b.text().includes('Setujui'))
    await approveBtn!.trigger('click')

    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Ya, setujui hapus'))
    await confirmBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Konflik Moderasi Terdeteksi')
      expect(wrapper.text()).toContain('Permohonan hapus sudah diproses sebelumnya.')
    })
  })

  it('restores pembanding from trash with target summary and handles success', async () => {
    let restoredId: string | null = null

    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data tempat sampah.',
          tab: 'trash',
          data: [
            {
              id: 55,
              pembanding_id: 55,
              alamat_data: 'Jl. Diponegoro No. 12',
              harga: 900000000,
              deleted_at: '2026-09-02T10:00:00Z',
              deleted_reason: 'Salah ketik',
              jenis_listing: { name: 'Jual' },
              deleted_by: { name: 'Siti' },
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        }),
      ),
      http.post('*/api/v1/moderation/pembandings/:id/restore', ({ params }) => {
        restoredId = String(params.id)
        return HttpResponse.json({
          status: 'success',
          message: 'Data pembanding dipulihkan.',
          data: null,
        })
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation?tab=trash')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Diponegoro No. 12')
    })

    const restoreBtn = wrapper.findAll('button').find((b) => b.text().includes('Pulihkan'))
    expect(restoreBtn).toBeDefined()
    await restoreBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Pulihkan data pembanding?')
      expect(wrapper.text()).toContain('Jl. Diponegoro No. 12')
    })

    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Ya, pulihkan'))
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(restoredId).toBe('55')
      expect(wrapper.text()).toContain('Data dipulihkan')
    })
  })

  it('enforces high-friction confirmation for force delete', async () => {
    let forceDeletedId: string | null = null

    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data tempat sampah.',
          tab: 'trash',
          data: [
            {
              id: 99,
              pembanding_id: 99,
              alamat_data: 'Jl. Hayam Wuruk No. 8',
              harga: 1500000000,
              deleted_at: '2026-09-03T11:00:00Z',
              deleted_reason: 'Permintaan pemilik',
              jenis_listing: { name: 'Jual' },
              deleted_by: { name: 'Admin' },
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        }),
      ),
      http.delete('*/api/v1/moderation/pembandings/:id', ({ params }) => {
        forceDeletedId = String(params.id)
        return HttpResponse.json({
          status: 'success',
          message: 'Data pembanding berhasil dihapus permanen.',
          data: null,
        })
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation?tab=trash')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Hayam Wuruk No. 8')
    })

    const forceDeleteBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Hapus Permanen'))
    expect(forceDeleteBtn).toBeDefined()
    await forceDeleteBtn!.trigger('click')

    // High friction modal opens
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Hapus Permanen Data Pembanding')
      expect(wrapper.text()).toContain('Peringatan Kritis')
      expect(wrapper.text()).toContain('Jl. Hayam Wuruk No. 8')
    })

    const confirmForceBtn = wrapper.find<HTMLButtonElement>(
      '[data-testid="confirm-force-delete-btn"]',
    )
    expect(confirmForceBtn.exists()).toBe(true)
    // Confirm button is disabled initially
    expect(confirmForceBtn.element.disabled).toBe(true)

    // Check the mandatory confirmation checkbox
    const checkbox = wrapper.find<HTMLInputElement>('[data-testid="force-delete-checkbox"]')
    expect(checkbox.exists()).toBe(true)
    await checkbox.setValue(true)

    // Button should now be enabled
    expect(confirmForceBtn.element.disabled).toBe(false)

    // Click confirm force delete
    await confirmForceBtn.trigger('click')

    await vi.waitFor(() => {
      expect(forceDeletedId).toBe('99')
      expect(wrapper.text()).toContain('Data dihapus permanen')
    })
  })

  it('enforces permission matrix for moderation actions', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi.',
          tab: 'requests',
          data: [
            {
              id: 101,
              alamat_data: 'Jl. Sudirman No. 45',
              harga: 500000000,
              deleted_at: null,
              deleted_reason: 'Duplikat',
              jenis_listing: null,
              deleted_by: null,
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        }),
      ),
    )

    // User has view_moderation only, lacks approve and reject permissions
    const setup = createTestSetup(['view_moderation'])
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Sudirman No. 45')
    })

    const buttons = wrapper.findAll('button').map((b) => b.text())
    expect(buttons.some((t) => t.includes('Setujui'))).toBe(false)
    expect(buttons.some((t) => t.includes('Tolak'))).toBe(false)
  })

  it('handles reject flow success and conflict emissions', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data moderasi.',
          tab: 'requests',
          data: [
            {
              id: 101,
              alamat_data: 'Jl. Sudirman No. 45',
              harga: 500000000,
              deleted_at: null,
              deleted_reason: 'Duplikat',
              jenis_listing: null,
              deleted_by: null,
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: { approve: 'true', reject: 'true' },
        }),
      ),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Sudirman No. 45')
    })

    const rejectBtn = wrapper.findAll('button').find((b) => b.text().includes('Tolak'))
    expect(rejectBtn).toBeDefined()
    await rejectBtn!.trigger('click')

    // Find the RejectDeleteRequestDialog component
    const rejectDialog = wrapper.findComponent({ name: 'RejectDeleteRequestDialog' })
    expect(rejectDialog.exists()).toBe(true)

    // Simulate success emission
    rejectDialog.vm.$emit('success')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Permohonan ditolak')
    })

    // Simulate conflict emission
    rejectDialog.vm.$emit('conflict', 'Permohonan telah disetujui moderator lain.')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Konflik Moderasi Terdeteksi')
      expect(wrapper.text()).toContain('Permohonan telah disetujui moderator lain.')
    })
  })

  it('handles concurrent conflict ALREADY_PROCESSED gracefully during restore and force delete', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data tempat sampah.',
          tab: 'trash',
          data: [
            {
              id: 77,
              pembanding_id: 77,
              alamat_data: 'Jl. Malioboro No. 20',
              harga: 600000000,
              deleted_at: '2026-09-02T10:00:00Z',
              deleted_reason: 'Duplikat',
              jenis_listing: null,
              deleted_by: null,
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        }),
      ),
      http.post('*/api/v1/moderation/pembandings/:id/restore', () => {
        return HttpResponse.json(
          {
            status: 'error',
            code: 'ALREADY_PROCESSED',
            message: 'Data ini telah dipulihkan atau diproses sebelumnya.',
          },
          { status: 422 },
        )
      }),
      http.delete('*/api/v1/moderation/pembandings/:id', () => {
        return HttpResponse.json(
          {
            status: 'error',
            code: 'ALREADY_PROCESSED',
            message: 'Data ini telah dihapus sebelumnya oleh pengguna lain.',
          },
          { status: 422 },
        )
      }),
    )

    const setup = createTestSetup()
    await setup.router.push('/moderation?tab=trash')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Malioboro No. 20')
    })

    // Test restore conflict
    const restoreBtn = wrapper.findAll('button').find((b) => b.text().includes('Pulihkan'))
    await restoreBtn!.trigger('click')

    const confirmRestoreBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Ya, pulihkan'))
    await confirmRestoreBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Konflik Moderasi Terdeteksi')
      expect(wrapper.text()).toContain('Data ini telah dipulihkan atau diproses sebelumnya.')
    })

    // Test force delete conflict
    const forceDeleteBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Hapus Permanen'))
    await forceDeleteBtn!.trigger('click')

    const checkbox = wrapper.find<HTMLInputElement>('[data-testid="force-delete-checkbox"]')
    await checkbox.setValue(true)

    const confirmForceBtn = wrapper.find('[data-testid="confirm-force-delete-btn"]')
    await confirmForceBtn.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Konflik Moderasi Terdeteksi')
      expect(wrapper.text()).toContain('Data ini telah dihapus sebelumnya oleh pengguna lain.')
    })
  })

  it('enforces permission matrix for trash tab actions', async () => {
    mockServer.use(
      http.get('*/api/v1/moderation', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data tempat sampah.',
          tab: 'trash',
          data: [
            {
              id: 77,
              pembanding_id: 77,
              alamat_data: 'Jl. Malioboro No. 20',
              harga: 600000000,
              deleted_at: '2026-09-02T10:00:00Z',
              deleted_reason: 'Duplikat',
              jenis_listing: null,
              deleted_by: null,
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        }),
      ),
    )

    // User only has view_moderation, lacks restore and force delete permissions
    const setup = createTestSetup(['view_moderation'])
    await setup.router.push('/moderation?tab=trash')
    await setup.router.isReady()

    const wrapper = mountPage(setup)

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Jl. Malioboro No. 20')
    })

    const buttons = wrapper.findAll('button').map((b) => b.text())
    expect(buttons.some((t) => t.includes('Pulihkan'))).toBe(false)
    expect(buttons.some((t) => t.includes('Hapus Permanen'))).toBe(false)
  })
})
