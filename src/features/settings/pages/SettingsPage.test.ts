import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import PrimeVue from 'primevue/config'
import { describe, expect, it, vi } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import SettingsPage from './SettingsPage.vue'

describe('SettingsPage.vue', () => {
  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    return mount(SettingsPage, {
      global: {
        plugins: [PrimeVue, [VueQueryPlugin, { queryClient }]],
        stubs: {
          UiConfirmDialog: {
            props: ['open', 'title', 'loading'],
            template: `
              <div v-if="open" class="stubbed-confirm-dialog">
                <span>{{ title }}</span>
                <button class="confirm-btn" @click="$emit('confirm')">Konfirmasi</button>
                <button class="cancel-btn" @click="$emit('cancel')">Batal</button>
              </div>
            `,
          },
        },
      },
    })
  }

  it('renders settings fields with fetched data', async () => {
    mockServer.use(
      http.get('*/api/v1/settings', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Pengaturan sistem berhasil diambil.',
          data: {
            settings: {
              company_name: 'PT Penilai Properti Indonesia',
              support_email: 'halo@penilai.id',
              app_version: '2.4.0',
              primary_color: '#0d9488',
              system_mode: 'live',
              app_logo: 'https://example.test/logo.png',
            },
            can: {
              update_settings: 'true',
            },
          },
        }),
      ),
    )

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="company-name-input"]').exists()).toBe(true)
    })

    const companyInput = wrapper.find<HTMLInputElement>('[data-testid="company-name-input"]')
    expect(companyInput.element.value).toBe('PT Penilai Properti Indonesia')

    const emailInput = wrapper.find<HTMLInputElement>('[data-testid="support-email-input"]')
    expect(emailInput.element.value).toBe('halo@penilai.id')

    const versionInput = wrapper.find<HTMLInputElement>('[data-testid="app-version-input"]')
    expect(versionInput.element.value).toBe('2.4.0')
  })

  it('submits updated settings successfully', async () => {
    let updateCalled = false
    mockServer.use(
      http.get('*/api/v1/settings', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Pengaturan sistem berhasil diambil.',
          data: {
            settings: {
              company_name: 'PT HJAR Valuasi',
              support_email: 'support@hjar.id',
              app_version: '1.0.0',
              primary_color: '#2563eb',
              system_mode: 'live',
            },
            can: { update_settings: 'true' },
          },
        }),
      ),
      http.post('*/api/v1/settings', () => {
        updateCalled = true
        return HttpResponse.json({
          status: 'success',
          message: 'Pengaturan berhasil diperbarui.',
          data: {},
        })
      }),
    )

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="company-name-input"]').exists()).toBe(true)
    })

    const companyInput = wrapper.find('[data-testid="company-name-input"]')
    await companyInput.setValue('PT HJAR Indonesia Baru')

    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    await vi.waitFor(() => {
      expect(updateCalled).toBe(true)
      expect(wrapper.text()).toContain('Pengaturan berhasil diperbarui.')
    })
  })

  it('handles clear cache workflow through confirmation dialog', async () => {
    let clearCacheCalled = false
    mockServer.use(
      http.get('*/api/v1/settings', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Pengaturan sistem berhasil diambil.',
          data: {
            settings: {
              company_name: 'PT HJAR Valuasi',
              support_email: 'support@hjar.id',
              app_version: '1.0.0',
              primary_color: '#2563eb',
              system_mode: 'live',
            },
          },
        }),
      ),
      http.post('*/api/v1/settings/clear-cache', () => {
        clearCacheCalled = true
        return HttpResponse.json({
          status: 'success',
          message: 'Semua cache berhasil dibersihkan.',
          data: null,
        })
      }),
    )

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="clear-cache-button"]').exists()).toBe(true)
    })

    // Click clear cache trigger button
    await wrapper.find('[data-testid="clear-cache-button"]').trigger('click')

    // Confirm dialog should be open
    const confirmDialog = wrapper.find('.stubbed-confirm-dialog')
    expect(confirmDialog.exists()).toBe(true)

    // Confirm action
    await confirmDialog.find('.confirm-btn').trigger('click')

    await vi.waitFor(() => {
      expect(clearCacheCalled).toBe(true)
      expect(wrapper.text()).toContain('Semua cache berhasil dibersihkan.')
    })
  })
})
