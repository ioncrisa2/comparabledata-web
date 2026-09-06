import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import UsersPage from './UsersPage.vue'

describe('UsersPage', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/users', name: 'user.index', component: UsersPage }],
  })

  beforeEach(async () => {
    await router.push('/users')
    mockServer.use(
      http.get('*/api/v1/users', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar pengguna berhasil diambil.',
          data: [
            {
              id: 1,
              name: 'Admin Sysinfo',
              email: 'admin@sysinfo.id',
              is_active: true,
              deactivated_at: null,
              roles: ['super_admin'],
              permissions: ['view_any_user', 'create_user', 'update_user', 'delete_user', 'delete_any_user'],
              created_at: '2026-01-01 10:00:00',
              updated_at: '2026-01-01 10:00:00',
            },
            {
              id: 2,
              name: 'Siti Surveyor',
              email: 'siti@sysinfo.id',
              is_active: true,
              deactivated_at: null,
              roles: ['data_contributor'],
              permissions: ['create_data::pembanding'],
              created_at: '2026-02-15 11:30:00',
              updated_at: '2026-02-15 11:30:00',
            },
          ],
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 2,
            total: 2,
            last_page: 1,
          },
          can: {
            create: true,
            update: true,
            delete: true,
            deleteAny: true,
          },
        }),
      ),
      http.get('*/api/v1/roles/options', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar opsi role berhasil diambil.',
          data: [
            { value: 'super_admin', label: 'Super Admin' },
            { value: 'data_contributor', label: 'Kontributor Data' },
          ],
        }),
      ),
    )
  })

  function createWrapper() {
    const pinia = createPinia()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const wrapper = mount(UsersPage, {
      global: {
        plugins: [pinia, router, PrimeVue, [VueQueryPlugin, { queryClient }]],
        stubs: {
          UiDialog: {
            props: ['open', 'title'],
            template: '<div v-if="open" class="dialog-mock"><h3>{{ title }}</h3><slot /><slot name="footer" /></div>',
          },
          UiConfirmDialog: {
            props: ['open', 'title'],
            template: '<div v-if="open" class="confirm-dialog-mock"><h3>{{ title }}</h3></div>',
          },
        },
      },
    })

    const auth = useAuthStore(pinia)
    auth.user = {
      id: 1,
      name: 'Admin Sysinfo',
      email: 'admin@sysinfo.id',
      roles: ['super_admin'],
      permissions: [
        'view_any_user',
        'create_user',
        'update_user',
        'delete_user',
        'delete_any_user',
      ],
      created_at: null,
      updated_at: null,
    }

    return wrapper
  }

  it('renders users table with self-user badge and disabled delete button for self', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    expect(wrapper.text()).toContain('Manajemen Pengguna')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Admin Sysinfo')
      expect(wrapper.text()).toContain('Siti Surveyor')
      expect(wrapper.text()).toContain('Anda')
    })

    const deleteButtons = wrapper.findAll('[data-testid="user-delete-btn"]')
    expect(deleteButtons.length).toBe(2)
    // The first user is Admin Sysinfo (ID 1, self), so delete must be disabled
    expect(deleteButtons[0]!.attributes('disabled')).toBeDefined()
    // The second user is Siti (ID 2, other), so delete is enabled
    expect(deleteButtons[1]!.attributes('disabled')).toBeUndefined()
  })

  it('filters users using search box', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Admin Sysinfo')
    })

    const searchInput = wrapper.find<HTMLInputElement>('[data-testid="users-search-input"]')
    expect(searchInput.exists()).toBe(true)
    await searchInput.setValue('siti')
    await searchInput.trigger('keydown.enter')

    await vi.waitFor(() => {
      expect(router.currentRoute.value.query.search).toBe('siti')
    })
  })
})
