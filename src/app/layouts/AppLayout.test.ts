import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'

import AppLayout from './AppLayout.vue'

const DummyPage = defineComponent({
  template: '<div>Dummy Page Content</div>',
})

describe('AppLayout Sidebar', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'dashboard', component: DummyPage },
        { path: '/pembandings', name: 'pembanding.list', component: DummyPage },
        { path: '/moderation', name: 'moderation.index', component: DummyPage },
        { path: '/master-data', name: 'master-data.index', component: DummyPage },
        { path: '/wilayah', name: 'wilayah.index', component: DummyPage },
        { path: '/users', name: 'user.index', component: DummyPage },
        { path: '/access-control', name: 'access-control.index', component: DummyPage },
        { path: '/login', name: 'auth.login', component: DummyPage },
      ],
    })
    await router.push('/')
  })

  function createWrapper() {
    return mount(AppLayout, {
      global: {
        plugins: [
          pinia,
          router,
          [VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }],
        ],
      },
      slots: {
        default: '<main id="main-content">Slot Content</main>',
      },
    })
  }

  it('renders brand and complete grouped navigation for super admin', async () => {
    const auth = useAuthStore()
    auth.user = {
      id: 1,
      name: 'Budi Santoso',
      email: 'budi@hjar.id',
      roles: ['super_admin'],
      permissions: [
        'view_any_data::pembanding',
        'approve_delete_request',
        'view_moderation',
        'view_master_data',
        'view_geo_data',
        'view_any_user',
        'view_access_control',
        'view_search',
      ],
      created_at: null,
      updated_at: null,
    }

    const wrapper = createWrapper()
    await router.isReady()

    // Brand and logo mark
    expect(wrapper.text()).toContain('HJAR Sysinfo')
    expect(wrapper.text()).toContain('HJ')

    // Navigation groups
    const navText = wrapper.find('.app-layout__nav').text()
    expect(navText).toContain('Menu Utama')
    expect(navText).toContain('Data & Referensi')
    expect(navText).toContain('Akses & Pengguna')

    // All links
    expect(navText).toContain('Dashboard')
    expect(navText).toContain('Data Pembanding')
    expect(navText).toContain('Moderasi')
    expect(navText).toContain('Master Data')
    expect(navText).toContain('Wilayah')
    expect(navText).toContain('Pengguna')
    expect(navText).toContain('Hak Akses')

    // User details & avatar
    expect(wrapper.text()).toContain('Budi Santoso')
    expect(wrapper.text()).toContain('BS')
    expect(wrapper.text()).toContain('super admin')
  })

  it('hides restricted navigation groups for contributor user', async () => {
    const auth = useAuthStore()
    auth.user = {
      id: 2,
      name: 'Ahmad Kontributor',
      email: 'ahmad@hjar.id',
      roles: ['data_contributor'],
      permissions: ['view_any_data::pembanding', 'create_data::pembanding'],
      created_at: null,
      updated_at: null,
    }

    const wrapper = createWrapper()
    await router.isReady()

    const navText = wrapper.find('.app-layout__nav').text()

    // Common navigation exists
    expect(navText).toContain('Dashboard')
    expect(navText).toContain('Data Pembanding')

    // Restricted groups should NOT exist in navigation
    expect(navText).not.toContain('Data & Referensi')
    expect(navText).not.toContain('Akses & Pengguna')
    expect(navText).not.toContain('Moderasi')
    expect(navText).not.toContain('Master Data')
    expect(navText).not.toContain('Wilayah')
    expect(navText).not.toContain('Pengguna')
    expect(navText).not.toContain('Hak Akses')

    // User avatar initials
    expect(wrapper.text()).toContain('AK')
    expect(wrapper.text()).toContain('data contributor')
  })

  it('handles mobile drawer opening and closing via backdrop and close button', async () => {
    const auth = useAuthStore()
    auth.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@hjar.id',
      roles: ['super_admin'],
      permissions: ['view_search'],
      created_at: null,
      updated_at: null,
    }

    const wrapper = createWrapper()
    await router.isReady()

    const sidebar = wrapper.find('.app-layout__sidebar')
    expect(sidebar.classes()).not.toContain('app-layout__sidebar--open')

    // Open mobile drawer
    const toggleButton = wrapper.find('.app-layout__mobile-toggle')
    await toggleButton.trigger('click')
    expect(sidebar.classes()).toContain('app-layout__sidebar--open')

    // Close mobile drawer via close button
    const closeButton = wrapper.find('.app-layout__drawer-close')
    await closeButton.trigger('click')
    expect(sidebar.classes()).not.toContain('app-layout__sidebar--open')

    // Open again and close via backdrop
    await toggleButton.trigger('click')
    expect(sidebar.classes()).toContain('app-layout__sidebar--open')
    const backdrop = wrapper.find('.app-layout__backdrop')
    expect(backdrop.exists()).toBe(true)
    await backdrop.trigger('click')
    expect(sidebar.classes()).not.toContain('app-layout__sidebar--open')
  })
})
