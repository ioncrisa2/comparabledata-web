import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { mockServer } from '@/test/mocks/server'

import PublicContributorRegistrationPage from './PublicContributorRegistrationPage.vue'

describe('PublicContributorRegistrationPage', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/register-contributor/:token',
          name: 'contributor.register',
          component: PublicContributorRegistrationPage,
        },
        {
          path: '/login',
          name: 'auth.login',
          component: { template: '<div>Login Page</div>' },
        },
      ],
    })
  })

  function createWrapper() {
    const pinia = createPinia()
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return mount(PublicContributorRegistrationPage, {
      global: {
        plugins: [pinia, router, PrimeVue, [VueQueryPlugin, { queryClient }]],
      },
    })
  }

  it('renders invalid token message when token is invalid or expired', async () => {
    mockServer.use(
      http.get('*/api/v1/public/data-contributor-registration/bad_token', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Token undangan tidak valid atau kedaluwarsa.',
          data: {
            is_valid: false,
            valid: false,
            message: 'Link registrasi tidak valid, sudah digunakan, atau sudah kedaluwarsa.',
          },
        }),
      ),
    )

    await router.push('/register-contributor/bad_token')
    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Tautan Tidak Valid')
      expect(wrapper.text()).toContain(
        'Link registrasi tidak valid, sudah digunakan, atau sudah kedaluwarsa.',
      )
      expect(wrapper.text()).toContain('Kembali ke Halaman Masuk')
    })
  })

  it('renders registration form when token is valid', async () => {
    mockServer.use(
      http.get('*/api/v1/public/data-contributor-registration/valid_token_123', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Token undangan valid.',
          data: {
            is_valid: true,
            valid: true,
            expires_at: '2026-09-14T00:00:00Z',
          },
        }),
      ),
    )

    await router.push('/register-contributor/valid_token_123')
    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Pendaftaran Kontributor')
      expect(wrapper.text()).toContain('Undangan Terverifikasi')
      expect(wrapper.find('input[name="display_name"]').exists()).toBe(true)
      expect(wrapper.find('input[name="phone"]').exists()).toBe(true)
      expect(wrapper.find('input[name="password"]').exists()).toBe(true)
      expect(wrapper.find('input[name="password_confirmation"]').exists()).toBe(true)
    })
  })

  it('validates required fields and password confirmation on submit', async () => {
    mockServer.use(
      http.get('*/api/v1/public/data-contributor-registration/valid_token_123', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Token undangan valid.',
          data: {
            is_valid: true,
            valid: true,
            expires_at: '2026-09-14T00:00:00Z',
          },
        }),
      ),
    )

    await router.push('/register-contributor/valid_token_123')
    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.find('form').exists()).toBe(true)
    })

    // Submit empty form
    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Nama lengkap minimal 3 karakter.')
    })

    // Fill password and mismatched confirmation
    await wrapper.find('input[name="display_name"]').setValue('Ahmad Fauzi')
    await wrapper.find('input[name="phone"]').setValue('081299988877')
    await wrapper.find('input[name="password"]').setValue('SecretPass123')
    await wrapper.find('input[name="password_confirmation"]').setValue('WrongPass123')

    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Konfirmasi kata sandi tidak cocok.')
    })
  })

  it('submits registration form successfully and displays generated email', async () => {
    let submittedPayload: unknown = null

    mockServer.use(
      http.get('*/api/v1/public/data-contributor-registration/valid_token_123', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Token undangan valid.',
          data: {
            is_valid: true,
            valid: true,
            expires_at: '2026-09-14T00:00:00Z',
          },
        }),
      ),
      http.post(
        '*/api/v1/public/data-contributor-registration/valid_token_123',
        async ({ request }) => {
          submittedPayload = await request.json()
          return HttpResponse.json(
            {
              status: 'success',
              message: 'Pendaftaran kontributor berhasil dikirim.',
              data: {
                generated_email: 'ahmad.fauzi@contributor.local',
                message:
                  'Pendaftaran berhasil dikirim. Tunggu persetujuan admin untuk mengaktifkan akun Anda.',
              },
            },
            { status: 201 },
          )
        },
      ),
    )

    await router.push('/register-contributor/valid_token_123')
    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.find('form').exists()).toBe(true)
    })

    await wrapper.find('input[name="display_name"]').setValue('Ahmad Fauzi')
    await wrapper.find('input[name="phone"]').setValue('081299988877')
    await wrapper.find('input[name="password"]').setValue('SecretPass123')
    await wrapper.find('input[name="password_confirmation"]').setValue('SecretPass123')

    await wrapper.find('form').trigger('submit')

    await vi.waitFor(() => {
      expect(submittedPayload).toEqual({
        display_name: 'Ahmad Fauzi',
        phone: '081299988877',
        password: 'SecretPass123',
        password_confirmation: 'SecretPass123',
      })
      expect(wrapper.text()).toContain('Pendaftaran Terkirim!')
      expect(wrapper.text()).toContain('ahmad.fauzi@contributor.local')
      expect(wrapper.text()).toContain('Ke Halaman Masuk')
    })
  })
})
