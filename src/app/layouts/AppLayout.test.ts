import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { useGlobalSearchState } from '@/features/search'
import { mockServer } from '@/test/mocks/server'

import AppLayout from './AppLayout.vue'

const DummyPage = defineComponent({
  template: '<div>Dummy Page Content</div>',
})

describe('AppLayout Sidebar', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    mockServer.use(
      http.get('*/api/v1/notifications', () =>
        HttpResponse.json({
          status: 'success',
          data: [],
          unread_count: 0,
          meta: { current_page: 1, per_page: 5, total: 0, last_page: 1 },
        }),
      ),
    )

    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'dashboard', component: DummyPage },
        { path: '/pembandings', name: 'pembanding.list', component: DummyPage },
        { path: '/imports', name: 'import.index', component: DummyPage },
        { path: '/moderation', name: 'moderation.index', component: DummyPage },
        { path: '/master-data', name: 'master-data.index', component: DummyPage },
        { path: '/wilayah', name: 'wilayah.index', component: DummyPage },
        { path: '/users', name: 'user.index', component: DummyPage },
        { path: '/access-control', name: 'access-control.index', component: DummyPage },
        {
          path: '/contributor-invitations',
          name: 'contributor-invitation.index',
          component: DummyPage,
        },
        { path: '/profile', name: 'profile', component: DummyPage },
        { path: '/settings', name: 'settings', component: DummyPage },
        { path: '/activity-logs', name: 'activity-log.index', component: DummyPage },
        { path: '/backup', name: 'backup.index', component: DummyPage },
        { path: '/notifications', name: 'notifications.index', component: DummyPage },
        { path: '/search', name: 'search', component: DummyPage },
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
          PrimeVue,
          [
            VueQueryPlugin,
            { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
          ],
        ],
        stubs: {
          GlobalSearchDialog: true,
        },
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
    expect(navText).toContain('Sistem')

    // All links
    expect(navText).toContain('Dashboard')
    expect(navText).toContain('Data Pembanding')
    expect(navText).toContain('Moderasi')
    expect(navText).toContain('Master Data')
    expect(navText).toContain('Wilayah')
    expect(navText).toContain('Pengguna')
    expect(navText).toContain('Hak Akses')
    expect(navText).toContain('Undangan Kontributor')
    expect(navText).toContain('Pengaturan Sistem')
    expect(navText).toContain('Log Aktivitas')
    expect(navText).toContain('Cadangan & Pemulihan')

    // Topbar notification bell
    expect(wrapper.find('[data-testid="notification-bell-btn"]').exists()).toBe(true)

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
    expect(navText).not.toContain('Sistem')
    expect(navText).not.toContain('Moderasi')
    expect(navText).not.toContain('Master Data')
    expect(navText).not.toContain('Wilayah')
    expect(navText).not.toContain('Pengguna')
    expect(navText).not.toContain('Hak Akses')
    expect(navText).not.toContain('Pengaturan Sistem')
    expect(navText).not.toContain('Log Aktivitas')
    expect(navText).not.toContain('Cadangan & Pemulihan')

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

  it('toggles sidebar collapse on desktop and persists state in localStorage', async () => {
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
    expect(sidebar.classes()).not.toContain('app-layout__sidebar--collapsed')

    // Click desktop toggle to collapse
    const desktopToggle = wrapper.find('.app-layout__desktop-toggle')
    expect(desktopToggle.exists()).toBe(true)
    await desktopToggle.trigger('click')

    expect(sidebar.classes()).toContain('app-layout__sidebar--collapsed')
    expect(localStorage.getItem('hjar_sidebar_collapsed')).toBe('true')

    // Click desktop toggle again to expand
    await desktopToggle.trigger('click')
    expect(sidebar.classes()).not.toContain('app-layout__sidebar--collapsed')
    expect(localStorage.getItem('hjar_sidebar_collapsed')).toBe('false')
  })

  it('opens and closes user dropdown menu and handles logout action', async () => {
    const auth = useAuthStore()
    auth.user = {
      id: 1,
      name: 'Budi Santoso',
      email: 'budi@hjar.id',
      roles: ['super_admin'],
      permissions: ['view_search'],
      created_at: null,
      updated_at: null,
    }

    const wrapper = createWrapper()
    await router.isReady()

    // Initially dropdown panel is not open
    expect(wrapper.find('.app-layout__user-dropdown').exists()).toBe(false)

    // Click user button to open dropdown
    const userBtn = wrapper.find('.app-layout__user-btn')
    expect(userBtn.exists()).toBe(true)
    await userBtn.trigger('click')

    // Dropdown is open
    const dropdown = wrapper.find('.app-layout__user-dropdown')
    expect(dropdown.exists()).toBe(true)
    expect(dropdown.text()).toContain('budi@hjar.id')
    expect(dropdown.text()).toContain('Budi Santoso')
    expect(dropdown.text()).toContain('Profil & Akun')
    expect(dropdown.text()).toContain('Keluar')

    // Click user button again to close
    await userBtn.trigger('click')
    expect(wrapper.find('.app-layout__user-dropdown').exists()).toBe(false)
  })

  it('closes user dropdown on Escape key', async () => {
    const auth = useAuthStore()
    auth.user = {
      id: 1,
      name: 'Budi Santoso',
      email: 'budi@hjar.id',
      roles: ['super_admin'],
      permissions: ['view_search'],
      created_at: null,
      updated_at: null,
    }

    const wrapper = createWrapper()
    await router.isReady()

    // Open dropdown
    const userBtn = wrapper.find('.app-layout__user-btn')
    await userBtn.trigger('click')
    expect(wrapper.find('.app-layout__user-dropdown').exists()).toBe(true)

    // Press Escape
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.app-layout__user-dropdown').exists()).toBe(false)
  })

  it('renders prominent global search bar in topbar when user has view_search permission', async () => {
    const auth = useAuthStore()
    auth.user = {
      id: 1,
      name: 'Budi Santoso',
      email: 'budi@hjar.id',
      roles: ['super_admin'],
      permissions: ['view_search'],
      created_at: null,
      updated_at: null,
    }

    const wrapper = createWrapper()
    await router.isReady()

    const searchBar = wrapper.find('.app-layout__search-bar')
    expect(searchBar.exists()).toBe(true)
    expect(searchBar.text()).toContain('Cari data pembanding')
    expect(searchBar.text()).toContain('Ctrl K')

    const { isSearchOpen } = useGlobalSearchState()
    isSearchOpen.value = false

    await searchBar.trigger('click')
    expect(isSearchOpen.value).toBe(true)
  })

  it('hides topbar search bar when user lacks view_search permission', async () => {
    const auth = useAuthStore()
    auth.user = {
      id: 3,
      name: 'User Without Search',
      email: 'nosearch@hjar.id',
      roles: ['guest'],
      permissions: [],
      created_at: null,
      updated_at: null,
    }

    const wrapper = createWrapper()
    await router.isReady()

    expect(wrapper.find('.app-layout__search-bar').exists()).toBe(false)
    expect(wrapper.find('.app-layout__mobile-search-btn').exists()).toBe(false)
  })
})
