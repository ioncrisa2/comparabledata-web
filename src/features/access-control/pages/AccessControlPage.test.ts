import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import AccessControlPage from './AccessControlPage.vue'

describe('AccessControlPage', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/access-control', name: 'access-control.index', component: AccessControlPage }],
  })

  beforeEach(async () => {
    await router.push('/access-control')
    mockServer.use(
      http.get('*/api/v1/roles', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar role berhasil diambil.',
          data: [
            {
              id: 1,
              name: 'super_admin',
              guard_name: 'web',
              permissions_count: 50,
              users_count: 2,
              permissions: ['view_any_user', 'view_access_control', 'create_user', 'delete_user'],
              is_locked: true,
            },
            {
              id: 2,
              name: 'pimpinan',
              guard_name: 'web',
              permissions_count: 10,
              users_count: 1,
              permissions: ['view_dashboard', 'view_any_data::pembanding'],
              is_locked: false,
            },
          ],
        }),
      ),
      http.get('*/api/v1/permissions', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar permission berhasil diambil.',
          data: [
            {
              id: 1,
              name: 'view_any_user',
              guard_name: 'web',
              group: 'User',
              roles_count: 1,
              users_count: 2,
              is_locked: false,
            },
            {
              id: 2,
              name: 'create_data::pembanding',
              guard_name: 'web',
              group: 'Pembanding',
              roles_count: 2,
              users_count: 5,
              is_locked: false,
            },
          ],
        }),
      ),
    )
  })

  function createWrapper() {
    const pinia = createPinia()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const wrapper = mount(AccessControlPage, {
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
        'view_access_control',
        'create_role',
        'update_role',
        'delete_role',
        'create_permission',
        'delete_permission',
      ],
      created_at: null,
      updated_at: null,
    }

    return wrapper
  }

  it('renders roles table with locked super_admin badge and preview tags', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    expect(wrapper.text()).toContain('Manajemen Hak Akses')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('super_admin')
      expect(wrapper.text()).toContain('pimpinan')
      expect(wrapper.text()).toContain('Sistem')
      expect(wrapper.text()).toContain('view_any_user')
    })

    const deleteButtons = wrapper.findAll('[data-testid="role-delete-btn"]')
    expect(deleteButtons.length).toBe(2)
    // super_admin is locked, so delete must be disabled
    expect(deleteButtons[0]!.attributes('disabled')).toBeDefined()
    // pimpinan has users_count > 0, so delete must also be disabled
    expect(deleteButtons[1]!.attributes('disabled')).toBeDefined()
  })

  it('switches to permissions tab and displays grouped permissions list', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    const permTabBtn = wrapper.findAll('.access-control-page__tab-btn').find((btn) =>
      btn.text().includes('Izin Akses'),
    )
    expect(permTabBtn).toBeDefined()
    await permTabBtn!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('view_any_user')
      expect(wrapper.text()).toContain('create_data::pembanding')
      expect(wrapper.text()).toContain('Pembanding')
    })
  })

  it('displays descriptive error alert when fetching roles fails with 403', async () => {
    mockServer.use(
      http.get('*/api/v1/roles', () =>
        HttpResponse.json(
          {
            status: 'error',
            code: 'FORBIDDEN',
            message: 'User does not have the right permissions.',
            errors: null,
          },
          { status: 403 },
        ),
      ),
    )

    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Data gagal dimuat')
      expect(wrapper.text()).toContain('HTTP 403')
    })
  })
})
