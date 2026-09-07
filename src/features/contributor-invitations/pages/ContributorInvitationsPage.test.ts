import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { mockServer } from '@/test/mocks/server'

import ContributorInvitationsPage from './ContributorInvitationsPage.vue'

describe('ContributorInvitationsPage', () => {
  let router: ReturnType<typeof createRouter>
  let queryClient: QueryClient
  let wrapper: ReturnType<typeof mount>

  afterEach(() => {
    wrapper?.unmount()
    queryClient?.clear()
  })

  beforeEach(async () => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/contributor-invitations',
          name: 'contributor-invitation.index',
          component: ContributorInvitationsPage,
        },
      ],
    })
    await router.push('/contributor-invitations')

    mockServer.use(
      http.get('*/api/v1/data-contributor-invitations', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar token undangan berhasil diambil.',
          data: [
            {
              id: 1,
              token_fingerprint: 'fp-token-active-123',
              status: 'active',
              expires_at: '2026-09-14T00:00:00Z',
              used_at: null,
              created_at: '2026-09-07T00:00:00Z',
              created_by: 'Admin Sysinfo',
              request: null,
            },
            {
              id: 2,
              token_fingerprint: 'fp-token-used-456',
              status: 'used',
              expires_at: '2026-09-10T00:00:00Z',
              used_at: '2026-09-08T00:00:00Z',
              created_at: '2026-09-03T00:00:00Z',
              created_by: 'Admin Sysinfo',
              request: {
                display_name: 'Budi Penilai',
                generated_email: 'budi.penilai@contributor.local',
                status: 'accepted',
                submitted_at: '2026-09-08T00:00:00Z',
              },
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 2, total: 2, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
      http.get('*/api/v1/data-contributor-registration-requests', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar pengajuan registrasi berhasil diambil.',
          data: [
            {
              id: 10,
              display_name: 'Calon Kontributor 1',
              generated_email: 'calon1@contributor.local',
              phone: '081234567890',
              status: 'pending',
              submitted_at: '2026-09-07T00:00:00Z',
              generated_by: 'System',
              accepted_at: null,
              accepted_by: '',
              rejected_at: null,
              rejected_by: '',
              reject_reason: null,
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
      http.get('*/api/v1/users', () =>
        HttpResponse.json({
          status: 'success',
          data: [],
          meta: { current_page: 1, per_page: 15, from: 0, to: 0, total: 0, last_page: 1 },
        }),
      ),
    )
  })

  function createWrapper() {
    const pinia = createPinia()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    wrapper = mount(ContributorInvitationsPage, {
      global: {
        plugins: [pinia, router, PrimeVue, [VueQueryPlugin, { queryClient }]],
        stubs: {
          UiDialog: {
            props: ['open', 'title', 'description'],
            template:
              '<div v-if="open" class="dialog-mock" data-testid="ui-dialog"><h3>{{ title }}</h3><slot /><slot name="footer" /><slot name="actions" /></div>',
          },
          UiConfirmDialog: {
            props: ['open', 'title', 'description'],
            emits: ['confirm', 'cancel'],
            template:
              '<div v-if="open" class="confirm-dialog-mock" data-testid="ui-confirm-dialog"><h3>{{ title }}</h3><p>{{ description }}</p><button class="confirm-btn" @click="$emit(\'confirm\')">Confirm</button><button class="cancel-btn" @click="$emit(\'cancel\')">Cancel</button></div>',
          },
        },
      },
    })
    return wrapper
  }

  it('renders invitations list and switches tabs with url query', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    expect(wrapper.text()).toContain('Undangan & Registrasi Kontributor')

    // Wait for invitations to load
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('fp-token-active-123')
      expect(wrapper.text()).toContain('fp-token-used-456')
      expect(wrapper.text()).toContain('Budi Penilai')
    })

    // Click tab Pengajuan Registrasi
    const tabs = wrapper.findAll('.invitations-page__tab')
    expect(tabs.length).toBe(2)
    await tabs[1]!.trigger('click')

    await vi.waitFor(() => {
      expect(router.currentRoute.value.query.tab).toBe('requests')
      expect(wrapper.text()).toContain('Calon Kontributor 1')
      expect(wrapper.text()).toContain('calon1@contributor.local')
    })
  })

  it('handles create invitation and displays new registration url', async () => {
    mockServer.use(
      http.post('*/api/v1/data-contributor-invitations', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Undangan kontributor berhasil dibuat.',
          data: {
            id: 99,
            raw_token: 'secret_raw_token_xyz',
            registration_url: 'http://localhost:5173/register-contributor/secret_raw_token_xyz',
            expires_at: '2026-09-14T00:00:00Z',
          },
        }),
      ),
    )

    const wrapper = createWrapper()
    await router.isReady()

    // Find and click "Buat Tautan Undangan"
    const createBtn = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Buat Tautan Undangan'))
    expect(createBtn).toBeDefined()
    await createBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="ui-dialog"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Tautan Undangan Berhasil Dibuat')
      expect(wrapper.text()).toContain('secret_raw_token_xyz')
    })
  })

  it('handles revoking an active invitation', async () => {
    let revokedId = 0
    mockServer.use(
      http.delete('*/api/v1/data-contributor-invitations/:invite', ({ params }) => {
        revokedId = Number(params.invite)
        return HttpResponse.json({
          status: 'success',
          message: 'Undangan berhasil dicabut.',
        })
      }),
    )

    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('fp-token-active-123')
    })

    // Find "Cabut" button
    const revokeBtn = wrapper.findAll('button').find((btn) => btn.text().includes('Cabut'))
    expect(revokeBtn).toBeDefined()
    await revokeBtn!.trigger('click')

    // Confirm dialog should appear
    expect(wrapper.find('[data-testid="ui-confirm-dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Cabut Tautan Undangan?')

    // Trigger confirm
    await wrapper.find('.confirm-btn').trigger('click')

    await vi.waitFor(() => {
      expect(revokedId).toBe(1)
    })
  })

  it('handles accepting a pending registration request', async () => {
    let acceptedId = 0
    mockServer.use(
      http.post('*/api/v1/data-contributor-registration-requests/:id/accept', ({ params }) => {
        acceptedId = Number(params.id)
        return HttpResponse.json({
          status: 'success',
          message: 'Pengajuan disetujui.',
        })
      }),
    )

    await router.push('/contributor-invitations?tab=requests')
    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Calon Kontributor 1')
    })

    const acceptBtn = wrapper.findAll('button').find((btn) => btn.text().includes('Setujui'))
    expect(acceptBtn).toBeDefined()
    await acceptBtn!.trigger('click')

    expect(wrapper.find('[data-testid="ui-confirm-dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Setujui Permohonan Kontributor?')

    await wrapper.find('.confirm-btn').trigger('click')

    await vi.waitFor(() => {
      expect(acceptedId).toBe(10)
    })
  })

  it('validates mandatory reject reason when rejecting request', async () => {
    let rejectedPayload: unknown = null
    mockServer.use(
      http.post(
        '*/api/v1/data-contributor-registration-requests/:id/reject',
        async ({ request }) => {
          rejectedPayload = await request.json()
          return HttpResponse.json({
            status: 'success',
            message: 'Pengajuan ditolak.',
          })
        },
      ),
    )

    await router.push('/contributor-invitations?tab=requests')
    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Calon Kontributor 1')
    })

    const rejectBtn = wrapper.findAll('button').find((btn) => btn.text().includes('Tolak'))
    expect(rejectBtn).toBeDefined()
    await rejectBtn!.trigger('click')

    // Rejection dialog opens
    expect(wrapper.text()).toContain('Tolak Permohonan Registrasi')

    // Try submit without reason
    const submitRejectBtn = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Tolak Permohonan'))
    expect(submitRejectBtn).toBeDefined()
    await submitRejectBtn!.trigger('click')

    // Error alert shows
    expect(wrapper.text()).toContain('Alasan penolakan wajib diisi.')
    expect(rejectedPayload).toBeNull()

    // Now fill reason and submit
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Nomor telepon tidak valid')
    await submitRejectBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(rejectedPayload).toEqual({ reject_reason: 'Nomor telepon tidak valid' })
    })
  })
})
