import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import ProfilePage from './ProfilePage.vue'

describe('ProfilePage', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/profile', name: 'profile', component: ProfilePage }],
  })

  beforeEach(async () => {
    await router.push('/profile')
    mockServer.use(
      http.put('*/api/v1/auth/profile', async ({ request }) => {
        const body = (await request.json()) as { name: string; email: string }
        return HttpResponse.json({
          status: 'success',
          message: 'Profile updated successfully',
          data: {
            id: 1,
            name: body.name,
            email: body.email,
            roles: ['super_admin'],
            permissions: [],
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
          },
        })
      }),
      http.put('*/api/v1/auth/profile/password', async ({ request }) => {
        const body = (await request.json()) as {
          current_password: string
          password: string
          password_confirmation: string
        }

        if (body.current_password === 'wrong-password') {
          return HttpResponse.json(
            {
              message: 'Password saat ini tidak cocok.',
              errors: {
                current_password: ['Password saat ini tidak cocok.'],
              },
            },
            { status: 422 },
          )
        }

        return HttpResponse.json({
          status: 'success',
          message: 'Password updated successfully',
        })
      }),
    )
  })

  function createWrapper() {
    const pinia = createPinia()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      roles: ['super_admin'],
      permissions: ['view_search'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const wrapper = mount(ProfilePage, {
      global: {
        plugins: [pinia, router, PrimeVue, [VueQueryPlugin, { queryClient }]],
      },
    })

    return { wrapper, auth }
  }

  it('renders profile form initialized with user data', async () => {
    const { wrapper } = createWrapper()
    await router.isReady()

    expect(wrapper.text()).toContain('Pengaturan Profil & Akun')
    expect(wrapper.text()).toContain('Informasi Pribadi')
    expect(wrapper.text()).toContain('Keamanan & Kata Sandi')

    const nameInput = wrapper.find<HTMLInputElement>('[data-testid="profile-name-input"]')
    const emailInput = wrapper.find<HTMLInputElement>('[data-testid="profile-email-input"]')

    expect(nameInput.element.value).toBe('John Doe')
    expect(emailInput.element.value).toBe('john@example.com')
    expect(wrapper.text()).toContain('super admin')
  })

  it('updates profile and reflects change in store and alerts', async () => {
    const { wrapper, auth } = createWrapper()
    await router.isReady()

    const nameInput = wrapper.find<HTMLInputElement>('[data-testid="profile-name-input"]')
    await nameInput.setValue('Johnathan Doe')

    const saveBtn = wrapper.find('[data-testid="profile-save-btn"]')
    expect(saveBtn.attributes('disabled')).toBeUndefined()

    await wrapper.findAll('form')[0]!.trigger('submit.prevent')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Profil Johnathan Doe berhasil diperbarui.')
    })

    expect(auth.user?.name).toBe('Johnathan Doe')
  })

  it('validates password match on client before submitting', async () => {
    const { wrapper } = createWrapper()
    await router.isReady()

    const currentPwdInput = wrapper.find<HTMLInputElement>(
      '[data-testid="profile-current-password-input"]',
    )
    const newPwdInput = wrapper.find<HTMLInputElement>('[data-testid="profile-new-password-input"]')
    const confirmPwdInput = wrapper.find<HTMLInputElement>(
      '[data-testid="profile-password-confirmation-input"]',
    )

    await currentPwdInput.setValue('secret123')
    await newPwdInput.setValue('newsecret123')
    await confirmPwdInput.setValue('differentsecret123')

    await wrapper.findAll('form')[1]!.trigger('submit.prevent')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Konfirmasi kata sandi tidak cocok.')
    })
  })

  it('handles server 422 error for incorrect current password', async () => {
    const { wrapper } = createWrapper()
    await router.isReady()

    const currentPwdInput = wrapper.find<HTMLInputElement>(
      '[data-testid="profile-current-password-input"]',
    )
    const newPwdInput = wrapper.find<HTMLInputElement>('[data-testid="profile-new-password-input"]')
    const confirmPwdInput = wrapper.find<HTMLInputElement>(
      '[data-testid="profile-password-confirmation-input"]',
    )

    await currentPwdInput.setValue('wrong-password')
    await newPwdInput.setValue('newsecret123')
    await confirmPwdInput.setValue('newsecret123')

    await wrapper.findAll('form')[1]!.trigger('submit.prevent')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Password saat ini tidak cocok.')
    })
  })

  it('updates password successfully and clears password inputs', async () => {
    const { wrapper } = createWrapper()
    await router.isReady()

    const currentPwdInput = wrapper.find<HTMLInputElement>(
      '[data-testid="profile-current-password-input"]',
    )
    const newPwdInput = wrapper.find<HTMLInputElement>('[data-testid="profile-new-password-input"]')
    const confirmPwdInput = wrapper.find<HTMLInputElement>(
      '[data-testid="profile-password-confirmation-input"]',
    )

    await currentPwdInput.setValue('correct-old-password')
    await newPwdInput.setValue('brand-new-secret-123')
    await confirmPwdInput.setValue('brand-new-secret-123')

    await wrapper.findAll('form')[1]!.trigger('submit.prevent')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Kata sandi berhasil diperbarui.')
    })

    expect(currentPwdInput.element.value).toBe('')
    expect(newPwdInput.element.value).toBe('')
    expect(confirmPwdInput.element.value).toBe('')
  })
})
