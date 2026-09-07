import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import PrimeVue from 'primevue/config'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import UploadImportBatchDialog from './UploadImportBatchDialog.vue'

describe('UploadImportBatchDialog', () => {
  function createWrapper(props = {}) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return mount(UploadImportBatchDialog, {
      props: {
        open: true,
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
    expect(wrapper.text()).toContain('Unggah Berkas Impor Excel')
    expect(wrapper.text()).toContain('Pilih berkas Excel')
  })

  it('validates invalid file extension', async () => {
    const wrapper = createWrapper()
    const input = wrapper.find<HTMLInputElement>('input[type="file"]')

    const invalidFile = new File(['test'], 'document.pdf', { type: 'application/pdf' })
    Object.defineProperty(input.element, 'files', {
      value: [invalidFile],
    })
    await input.trigger('change')

    expect(wrapper.text()).toContain('Format file tidak didukung')
  })

  it('validates oversized file exceeding 10MB', async () => {
    const wrapper = createWrapper()
    const input = wrapper.find<HTMLInputElement>('input[type="file"]')

    // 12 MB file
    const oversizedFile = new File([new ArrayBuffer(12 * 1024 * 1024)], 'large_data.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    Object.defineProperty(input.element, 'files', {
      value: [oversizedFile],
    })
    await input.trigger('change')

    expect(wrapper.text()).toContain('melebihi batas maksimum 10 MB')
  })

  it('accepts valid file and uploads successfully', async () => {
    mockServer.use(
      http.post('*/api/v1/pembanding-imports', () =>
        HttpResponse.json(
          {
            status: 'success',
            message: 'File berhasil dibaca dan disimpan sebagai draf.',
            data: {
              batch: {
                id: 42,
                filename: 'valid_data.xlsx',
                owner: 'Admin',
                status: 'draft',
                status_label: 'Draf',
                total_rows: 15,
                selected_rows: 15,
                ready_rows: 15,
                imported_rows: 0,
                failed_rows: 0,
                processing_rows: 0,
                can_edit: true,
                can_finalize: true,
                finalize_block_reason: null,
                finalization_date: '2026-09-07',
                finalized_at: null,
                updated_at: '2026-09-07 10:00:00',
              },
              is_existing: false,
            },
          },
          { status: 201 },
        ),
      ),
    )

    const wrapper = createWrapper()
    const input = wrapper.find<HTMLInputElement>('input[type="file"]')

    const validFile = new File(['valid content'], 'valid_data.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    Object.defineProperty(input.element, 'files', {
      value: [validFile],
    })
    await input.trigger('change')

    expect(wrapper.text()).toContain('valid_data.xlsx')

    const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Unggah & Buka Draf'))
    expect(submitBtn).toBeDefined()
    await submitBtn!.trigger('click')

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })
})
