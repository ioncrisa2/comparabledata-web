import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import PrimeVue from 'primevue/config'
import { describe, expect, it, vi } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import RejectDeleteRequestDialog from './RejectDeleteRequestDialog.vue'

describe('RejectDeleteRequestDialog', () => {
  function createWrapper(props = {}) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return mount(RejectDeleteRequestDialog, {
      props: {
        open: true,
        requestId: 10,
        targetLabel: 'Jl. Riau No. 12',
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

  it('renders correctly when open', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Tolak permohonan hapus')
    expect(wrapper.text()).toContain('Jl. Riau No. 12')
    expect(wrapper.text()).toContain('Catatan review')
  })

  it('validates mandatory review note before submitting', async () => {
    const wrapper = createWrapper()

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Tolak Permohonan'))
    expect(submitBtn).toBeDefined()
    await submitBtn!.trigger('click')

    expect(wrapper.text()).toContain('Catatan review penolakan wajib diisi.')
    expect(wrapper.emitted('success')).toBeUndefined()
  })

  it('submits successfully with valid review note', async () => {
    let capturedBody: Record<string, unknown> | null = null

    mockServer.use(
      http.post('*/api/v1/moderation/delete-requests/10/reject', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: 'success',
          message: 'Permohonan ditolak.',
          data: null,
        })
      }),
    )

    const wrapper = createWrapper()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Data valid dan listing masih aktif.')

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Tolak Permohonan'))
    await submitBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.emitted('success')).toBeTruthy()
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    })

    expect(capturedBody).toEqual({ review_note: 'Data valid dan listing masih aktif.' })
  })

  it('emits conflict event when API returns 422 ALREADY_PROCESSED', async () => {
    mockServer.use(
      http.post('*/api/v1/moderation/delete-requests/10/reject', () => {
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

    const wrapper = createWrapper()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Catatan review')

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Tolak Permohonan'))
    await submitBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.emitted('conflict')).toBeTruthy()
      expect(wrapper.emitted('conflict')?.[0]).toEqual([
        'Permohonan hapus sudah diproses sebelumnya.',
      ])
    })
  })
})
