<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import NotificationBell from '@/features/notifications/components/NotificationBell.vue'
import { GlobalSearchDialog, useGlobalSearchState } from '@/features/search'
import { isApiError } from '@/shared/api/error'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { openSearch } = useGlobalSearchState()

const loggingOut = ref(false)
const logoutError = ref('')
const isMobileOpen = ref(false)
const isSidebarCollapsed = ref(false)
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const currentRouteTitle = computed(() => {
  return route.meta?.title || 'HJAR Sysinfo'
})

function openMobileMenu() {
  isMobileOpen.value = true
}

function closeMobileMenu() {
  isMobileOpen.value = false
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  try {
    localStorage.setItem('hjar_sidebar_collapsed', String(isSidebarCollapsed.value))
  } catch {
    // ignore storage restrictions
  }
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

function handleOpenSearch() {
  closeMobileMenu()
  closeUserMenu()
  openSearch()
}

// Close menus automatically on route navigation
watch(
  () => route.path,
  () => {
    closeMobileMenu()
    closeUserMenu()
  },
)

// Close on Escape key
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (isUserMenuOpen.value) {
      closeUserMenu()
    } else if (isMobileOpen.value) {
      closeMobileMenu()
    }
  }
}

// Close user dropdown on click outside
function handleClickOutside(event: MouseEvent) {
  if (
    isUserMenuOpen.value &&
    userMenuRef.value &&
    !userMenuRef.value.contains(event.target as Node)
  ) {
    closeUserMenu()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('click', handleClickOutside)

  try {
    const savedCollapsed = localStorage.getItem('hjar_sidebar_collapsed')
    if (savedCollapsed !== null) {
      isSidebarCollapsed.value = savedCollapsed === 'true'
    }
  } catch {
    // ignore storage restrictions
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('click', handleClickOutside)
})

const userInitials = computed(() => {
  const name = auth.user?.name?.trim()
  if (!name) return 'U'
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]
  const second = parts[1]
  if (first && second && first[0] && second[0]) {
    return (first[0] + second[0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const userRoleBadge = computed(() => {
  const firstRole = auth.roles[0]
  if (firstRole) {
    return firstRole.replace(/_/g, ' ')
  }
  return 'Pengguna'
})

// Section visibility guards
const hasDataGroup = computed(() =>
  auth.canAny([
    'view_master_data',
    'create_master_data',
    'update_master_data',
    'view_geo_data',
    'create_geo_data',
    'update_geo_data',
  ]),
)

const hasAccessGroup = computed(() =>
  auth.canAny([
    'view_any_user',
    'create_user',
    'update_user',
    'view_access_control',
    'create_role',
    'update_role',
    'manage_data_contributor_invitations',
    'manage_integrations',
  ]),
)

const hasSystemGroup = computed(
  () =>
    auth.roles.includes('super_admin') ||
    auth.canAny([
      'view_settings',
      'update_settings',
      'view_activity_log',
      'view_activity_logs',
      'view_audit_trail',
      'view_backup',
    ]),
)

async function handleLogout() {
  loggingOut.value = true
  logoutError.value = ''

  try {
    closeUserMenu()
    await auth.logout()
    await router.replace({ name: 'auth.login' })
  } catch (error) {
    logoutError.value = isApiError(error)
      ? error.message
      : 'Sesi belum dapat diakhiri. Silakan coba lagi.'
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="app-layout" :class="{ 'app-layout--collapsed': isSidebarCollapsed }">
    <!-- Mobile Drawer Backdrop -->
    <div
      v-if="isMobileOpen"
      class="app-layout__backdrop"
      aria-hidden="true"
      @click="closeMobileMenu"
    />

    <!-- Sidebar (Desktop sticky & Mobile Drawer) -->
    <aside
      id="app-sidebar"
      class="app-layout__sidebar"
      :class="{
        'app-layout__sidebar--open': isMobileOpen,
        'app-layout__sidebar--collapsed': isSidebarCollapsed,
      }"
      aria-label="Navigasi aplikasi"
    >
      <!-- Sidebar Brand Header -->
      <div class="app-layout__sidebar-header">
        <RouterLink class="app-layout__brand" :to="{ name: 'dashboard' }" aria-label="Dashboard">
          <span class="app-layout__mark" aria-hidden="true">HJ</span>
          <div class="app-layout__brand-info">
            <span class="app-layout__brand-title">HJAR Sysinfo</span>
            <span class="app-layout__brand-subtitle">Bank Data Pembanding</span>
          </div>
        </RouterLink>

        <button
          type="button"
          class="app-layout__drawer-close"
          aria-label="Tutup navigasi menu"
          @click="closeMobileMenu"
        >
          <i class="pi pi-times" aria-hidden="true" />
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="app-layout__nav" aria-label="Navigasi utama">
        <!-- Section: Menu Utama -->
        <div class="app-layout__nav-group">
          <span class="app-layout__nav-group-title">Menu Utama</span>
          <RouterLink
            :to="{ name: 'dashboard' }"
            class="app-layout__nav-link"
            :title="isSidebarCollapsed ? 'Dashboard' : undefined"
          >
            <i class="pi pi-home" aria-hidden="true" />
            <span class="app-layout__nav-text">Dashboard</span>
          </RouterLink>

          <RouterLink
            :to="{ name: 'pembanding.list' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('pembanding.') }"
            :title="isSidebarCollapsed ? 'Data Pembanding' : undefined"
          >
            <i class="pi pi-database" aria-hidden="true" />
            <span class="app-layout__nav-text">Data Pembanding</span>
          </RouterLink>

          <RouterLink
            v-if="
              auth.canAny([
                'create_data::pembanding',
                'update_data::pembanding',
                'view_any_data::pembanding',
              ])
            "
            :to="{ name: 'import.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('import.') }"
            :title="isSidebarCollapsed ? 'Impor Excel' : undefined"
          >
            <i class="pi pi-file-excel" aria-hidden="true" />
            <span class="app-layout__nav-text">Impor Excel</span>
          </RouterLink>

          <RouterLink
            v-if="
              auth.canAny(['approve_delete_request', 'reject_delete_request', 'view_moderation'])
            "
            :to="{ name: 'moderation.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('moderation.') }"
            :title="isSidebarCollapsed ? 'Moderasi' : undefined"
          >
            <i class="pi pi-inbox" aria-hidden="true" />
            <span class="app-layout__nav-text">Moderasi</span>
          </RouterLink>
        </div>

        <!-- Section: Data & Referensi -->
        <div v-if="hasDataGroup" class="app-layout__nav-group">
          <span class="app-layout__nav-group-title">Data & Referensi</span>
          <RouterLink
            v-if="auth.canAny(['view_master_data', 'create_master_data', 'update_master_data'])"
            :to="{ name: 'master-data.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('master-data.') }"
            :title="isSidebarCollapsed ? 'Master Data' : undefined"
          >
            <i class="pi pi-sliders-h" aria-hidden="true" />
            <span class="app-layout__nav-text">Master Data</span>
          </RouterLink>

          <RouterLink
            v-if="auth.canAny(['view_geo_data', 'create_geo_data', 'update_geo_data'])"
            :to="{ name: 'wilayah.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('wilayah.') }"
            :title="isSidebarCollapsed ? 'Wilayah' : undefined"
          >
            <i class="pi pi-map" aria-hidden="true" />
            <span class="app-layout__nav-text">Wilayah</span>
          </RouterLink>
        </div>

        <!-- Section: Akses & Pengguna -->
        <div v-if="hasAccessGroup" class="app-layout__nav-group">
          <span class="app-layout__nav-group-title">Akses & Pengguna</span>
          <RouterLink
            v-if="auth.canAny(['view_any_user', 'create_user', 'update_user'])"
            :to="{ name: 'user.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('user.') }"
            :title="isSidebarCollapsed ? 'Pengguna' : undefined"
          >
            <i class="pi pi-users" aria-hidden="true" />
            <span class="app-layout__nav-text">Pengguna</span>
          </RouterLink>

          <RouterLink
            v-if="auth.canAny(['view_access_control', 'create_role', 'update_role'])"
            :to="{ name: 'access-control.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('access-control.') }"
            :title="isSidebarCollapsed ? 'Hak Akses' : undefined"
          >
            <i class="pi pi-shield" aria-hidden="true" />
            <span class="app-layout__nav-text">Hak Akses</span>
          </RouterLink>

          <RouterLink
            v-if="
              auth.canAny(['manage_data_contributor_invitations', 'view_any_user', 'create_user'])
            "
            :to="{ name: 'contributor-invitation.index' }"
            class="app-layout__nav-link"
            :class="{
              'app-layout__nav-active': String(route.name).startsWith('contributor-invitation.'),
            }"
            :title="isSidebarCollapsed ? 'Undangan Kontributor' : undefined"
          >
            <i class="pi pi-user-plus" aria-hidden="true" />
            <span class="app-layout__nav-text">Undangan Kontributor</span>
          </RouterLink>
          <RouterLink
            v-if="auth.canAny(['manage_integrations'])"
            :to="{ name: 'integrations.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': route.name === 'integrations.index' }"
            :title="isSidebarCollapsed ? 'Integrasi aplikasi' : undefined"
          >
            <i class="pi pi-key" aria-hidden="true" />
            <span class="app-layout__nav-text">Integrasi aplikasi</span>
          </RouterLink>
        </div>

        <!-- Section: Sistem -->
        <div v-if="hasSystemGroup" class="app-layout__nav-group">
          <span class="app-layout__nav-group-title">Sistem</span>
          <RouterLink
            v-if="
              auth.roles.includes('super_admin') ||
              auth.canAny(['view_settings', 'update_settings'])
            "
            :to="{ name: 'settings' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name) === 'settings' }"
            :title="isSidebarCollapsed ? 'Pengaturan Sistem' : undefined"
          >
            <i class="pi pi-cog" aria-hidden="true" />
            <span class="app-layout__nav-text">Pengaturan Sistem</span>
          </RouterLink>

          <RouterLink
            v-if="
              auth.roles.includes('super_admin') ||
              auth.canAny(['view_activity_log', 'view_activity_logs', 'view_audit_trail'])
            "
            :to="{ name: 'activity-log.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('activity-log.') }"
            :title="isSidebarCollapsed ? 'Log Aktivitas' : undefined"
          >
            <i class="pi pi-history" aria-hidden="true" />
            <span class="app-layout__nav-text">Log Aktivitas</span>
          </RouterLink>

          <RouterLink
            v-if="auth.roles.includes('super_admin') || auth.can('view_backup')"
            :to="{ name: 'backup.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name) === 'backup.index' }"
            :title="isSidebarCollapsed ? 'Cadangan & Pemulihan' : undefined"
          >
            <i class="pi pi-database" aria-hidden="true" />
            <span class="app-layout__nav-text">Cadangan & Pemulihan</span>
          </RouterLink>
        </div>
      </nav>
    </aside>

    <!-- Content Area (Top Navbar + Page Main) -->
    <div class="app-layout__content-wrapper">
      <!-- Top Navbar -->
      <header class="app-layout__topbar">
        <!-- Left: Toggler & Page Title -->
        <div class="app-layout__topbar-left">
          <!-- Mobile Sidebar Toggle -->
          <button
            type="button"
            class="app-layout__mobile-toggle"
            aria-label="Buka navigasi menu"
            :aria-expanded="isMobileOpen"
            aria-controls="app-sidebar"
            @click="openMobileMenu"
          >
            <i class="pi pi-bars" aria-hidden="true" />
          </button>

          <!-- Desktop Sidebar Toggler (Minimize / Expand) -->
          <button
            type="button"
            class="app-layout__desktop-toggle"
            :aria-label="isSidebarCollapsed ? 'Perluas bilah navigasi' : 'Perkecil bilah navigasi'"
            :title="isSidebarCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar'"
            @click="toggleSidebar"
          >
            <i
              :class="isSidebarCollapsed ? 'pi pi-arrow-right' : 'pi pi-bars'"
              aria-hidden="true"
            />
          </button>

          <!-- Mobile Brand (Visible only on mobile header) -->
          <RouterLink
            class="app-layout__mobile-brand"
            :to="{ name: 'dashboard' }"
            aria-label="Dashboard"
          >
            <span class="app-layout__mark" aria-hidden="true">HJ</span>
            <span class="app-layout__mobile-brand-name">HJAR Sysinfo</span>
          </RouterLink>

          <!-- Desktop Route Title -->
          <div class="app-layout__topbar-title">
            <span>{{ currentRouteTitle }}</span>
          </div>
        </div>

        <!-- Center: Prominent Global Search Bar (Desktop) -->
        <div v-if="auth.can('view_search')" class="app-layout__topbar-center">
          <button
            type="button"
            class="app-layout__search-bar"
            aria-label="Cari data global (Ctrl+K)"
            @click="handleOpenSearch"
          >
            <div class="app-layout__search-bar-content">
              <i class="pi pi-search" aria-hidden="true" />
              <span class="app-layout__search-bar-placeholder">
                Cari data pembanding, wilayah, atau pengguna...
              </span>
              <span class="app-layout__search-bar-placeholder--short"> Cari apa saja... </span>
            </div>
            <kbd class="app-layout__search-bar-shortcut">Ctrl K</kbd>
          </button>
        </div>

        <!-- Right: Mobile Search & User Dropdown -->
        <div class="app-layout__topbar-right">
          <!-- Mobile Search Button (< 1024px) -->
          <button
            v-if="auth.can('view_search')"
            type="button"
            class="app-layout__mobile-search-btn"
            aria-label="Cari data global (Ctrl+K)"
            @click="handleOpenSearch"
          >
            <i class="pi pi-search" aria-hidden="true" />
          </button>

          <!-- Notification Bell -->
          <NotificationBell />

          <!-- User Menu Dropdown -->
          <div ref="userMenuRef" class="app-layout__user-menu">
            <button
              type="button"
              class="app-layout__user-btn"
              :aria-expanded="isUserMenuOpen"
              aria-label="Menu pengguna"
              @click="toggleUserMenu"
            >
              <div class="app-layout__user-avatar" aria-hidden="true">
                {{ userInitials }}
              </div>
              <div class="app-layout__user-info">
                <span class="app-layout__user-name">{{ auth.user?.name || 'Pengguna' }}</span>
                <span class="app-layout__user-role">{{ userRoleBadge }}</span>
              </div>
              <i
                class="pi pi-chevron-down app-layout__chevron"
                :class="{ 'app-layout__chevron--open': isUserMenuOpen }"
                aria-hidden="true"
              />
            </button>

            <!-- Floating User Dropdown Menu -->
            <Transition name="dropdown">
              <div
                v-if="isUserMenuOpen"
                class="app-layout__user-dropdown"
                role="region"
                aria-label="Informasi akun pengguna"
              >
                <!-- Dropdown Header: User Summary -->
                <div class="app-layout__dropdown-header">
                  <div
                    class="app-layout__user-avatar app-layout__user-avatar--lg"
                    aria-hidden="true"
                  >
                    {{ userInitials }}
                  </div>
                  <div class="app-layout__dropdown-user-details">
                    <strong class="app-layout__dropdown-user-name">
                      {{ auth.user?.name || 'Pengguna' }}
                    </strong>
                    <span class="app-layout__dropdown-user-email">
                      {{ auth.user?.email || '-' }}
                    </span>
                    <span class="app-layout__dropdown-role-badge">
                      {{ userRoleBadge }}
                    </span>
                  </div>
                </div>

                <!-- Dropdown Menu Links -->
                <div class="app-layout__dropdown-body">
                  <RouterLink
                    :to="{ name: 'profile' }"
                    class="app-layout__dropdown-link"
                    :class="{ 'app-layout__dropdown-link--active': route.name === 'profile' }"
                    @click="closeUserMenu"
                  >
                    <i class="pi pi-user" aria-hidden="true" />
                    <div class="app-layout__dropdown-link-info">
                      <span class="app-layout__dropdown-link-title">Profil & Akun</span>
                      <span class="app-layout__dropdown-link-subtitle">
                        Ubah profil dan kata sandi
                      </span>
                    </div>
                  </RouterLink>

                  <RouterLink
                    v-if="auth.can('view_search')"
                    :to="{ name: 'search' }"
                    class="app-layout__dropdown-link"
                    :class="{ 'app-layout__dropdown-link--active': route.name === 'search' }"
                    @click="closeUserMenu"
                  >
                    <i class="pi pi-search" aria-hidden="true" />
                    <div class="app-layout__dropdown-link-info">
                      <span class="app-layout__dropdown-link-title">Pencarian Global</span>
                      <span class="app-layout__dropdown-link-subtitle">
                        Halaman pencarian dan filter
                      </span>
                    </div>
                  </RouterLink>

                  <div class="app-layout__dropdown-divider" role="separator" />

                  <!-- Unified Logout Action -->
                  <button
                    type="button"
                    class="app-layout__dropdown-logout"
                    :disabled="loggingOut"
                    :aria-label="loggingOut ? 'Sedang keluar...' : 'Keluar dari aplikasi'"
                    @click="handleLogout"
                  >
                    <i
                      :class="loggingOut ? 'pi pi-spinner pi-spin' : 'pi pi-sign-out'"
                      aria-hidden="true"
                    />
                    <span>{{ loggingOut ? 'Keluar...' : 'Keluar' }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="app-layout__main">
        <UiInlineAlert
          v-if="logoutError"
          class="app-layout__alert"
          title="Gagal keluar"
          tone="error"
        >
          <p>{{ logoutError }}</p>
        </UiInlineAlert>

        <slot />
      </div>
    </div>

    <!-- Global Search Modal Dialog -->
    <GlobalSearchDialog v-if="auth.can('view_search')" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-canvas, #f8fafc);
  display: flex;
}

/* --- Sidebar --- */
.app-layout__sidebar {
  position: sticky;
  top: 0;
  width: 260px;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--color-ink-strong, #0f172a);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  z-index: 40;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-layout__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px;
  min-height: 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.app-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  overflow: hidden;
}

.app-layout__mark {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  background: var(--color-brand-amber, #f59e0b);
  color: #0f172a;
  font-weight: 800;
  font-size: 0.8125rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.app-layout__brand-info {
  display: flex;
  flex-direction: column;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.15s ease;
}

.app-layout__brand-title {
  color: #f8fafc;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.app-layout__brand-subtitle {
  color: #94a3b8;
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.3;
}

.app-layout__drawer-close {
  display: none;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.app-layout__drawer-close:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.1);
}

/* --- Navigation Group & Links --- */
.app-layout__nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-layout__nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-layout__nav-group-title {
  padding: 6px 12px 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  white-space: nowrap;
}

.app-layout__nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: var(--radius-control, 8px);
  color: #cbd5e1;
  font-size: 0.8125rem;
  font-weight: 550;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.app-layout__nav-link i {
  font-size: 0.9375rem;
  width: 18px;
  text-align: center;
  color: #94a3b8;
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.app-layout__nav-link:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #ffffff;
}

.app-layout__nav-link:hover i {
  color: #ffffff;
}

.app-layout__nav-link.router-link-exact-active,
.app-layout__nav-link.app-layout__nav-active {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-brand-amber, #f59e0b);
  font-weight: 650;
}

.app-layout__nav-link.router-link-exact-active i,
.app-layout__nav-link.app-layout__nav-active i {
  color: var(--color-brand-amber, #f59e0b);
}

/* --- Collapsed Sidebar State --- */
.app-layout__sidebar--collapsed {
  width: 72px;
}

.app-layout__sidebar--collapsed .app-layout__brand {
  justify-content: center;
  width: 100%;
}

.app-layout__sidebar--collapsed .app-layout__brand-info {
  display: none;
}

.app-layout__sidebar--collapsed .app-layout__nav-group-title {
  height: 1px;
  margin: 8px 8px;
  padding: 0;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0;
  overflow: hidden;
}

.app-layout__sidebar--collapsed .app-layout__nav-link {
  justify-content: center;
  padding: 10px 0;
}

.app-layout__sidebar--collapsed .app-layout__nav-link i {
  font-size: 1.125rem;
  width: auto;
}

.app-layout__sidebar--collapsed .app-layout__nav-text {
  display: none;
}

/* --- Content Wrapper --- */
.app-layout__content-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* --- Top Navbar --- */
.app-layout__topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-border-soft, #e2e8f0);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.app-layout__topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.app-layout__desktop-toggle {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-control, 8px);
  background: var(--color-surface-inset, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-ink-body, #334155);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-layout__desktop-toggle:hover {
  background: var(--color-surface, #ffffff);
  color: var(--color-ink-strong, #0f172a);
  border-color: #cbd5e1;
}

.app-layout__mobile-toggle {
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-surface-inset, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-ink-strong, #0f172a);
  font-size: 1rem;
  cursor: pointer;
}

.app-layout__mobile-brand {
  display: none;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.app-layout__mobile-brand .app-layout__mark {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.app-layout__mobile-brand-name {
  color: var(--color-ink-strong, #0f172a);
  font-weight: 700;
  font-size: 0.875rem;
}

.app-layout__topbar-title {
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--color-ink-strong, #0f172a);
  letter-spacing: -0.01em;
}

.app-layout__topbar-center {
  flex: 1;
  max-width: 480px;
  margin: 0 16px;
  display: flex;
  align-items: center;
}

.app-layout__search-bar {
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-radius: var(--radius-control, 10px);
  border: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-surface-inset, #f8fafc);
  color: var(--color-ink-muted, #64748b);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-layout__search-bar:hover {
  background: var(--color-surface, #ffffff);
  border-color: var(--color-brand-amber, #f59e0b);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
  color: var(--color-ink-strong, #0f172a);
}

.app-layout__search-bar-content {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}

.app-layout__search-bar-content i {
  font-size: 0.9375rem;
  color: var(--color-ink-muted, #64748b);
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.app-layout__search-bar:hover .app-layout__search-bar-content i {
  color: var(--color-brand-amber-strong, #d97706);
}

.app-layout__search-bar-placeholder {
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-ink-muted, #64748b);
}

.app-layout__search-bar-placeholder--short {
  display: none;
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-ink-muted, #64748b);
}

.app-layout__search-bar-shortcut {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #64748b;
  background: #ffffff;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 5px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  margin-left: 12px;
}

.app-layout__mobile-search-btn {
  display: none;
}

.app-layout__topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* --- User Dropdown --- */
.app-layout__user-menu {
  position: relative;
}

.app-layout__user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 4px;
  border-radius: 9999px;
  border: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-surface, #ffffff);
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-layout__user-btn:hover {
  border-color: #cbd5e1;
  background: var(--color-surface-inset, #f8fafc);
}

.app-layout__user-avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-brand-amber-strong, #d97706);
  font-weight: 700;
  font-size: 0.8125rem;
  border: 1px solid rgba(245, 158, 11, 0.3);
  flex-shrink: 0;
}

.app-layout__user-avatar--lg {
  width: 42px;
  height: 42px;
  font-size: 1rem;
}

.app-layout__user-info {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.25;
}

.app-layout__user-name {
  color: var(--color-ink-strong, #0f172a);
  font-size: 0.8125rem;
  font-weight: 600;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-layout__user-role {
  color: var(--color-ink-muted, #64748b);
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: capitalize;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-layout__chevron {
  font-size: 0.6875rem;
  color: var(--color-ink-muted, #64748b);
  transition: transform 0.2s ease;
}

.app-layout__chevron--open {
  transform: rotate(180deg);
}

/* Dropdown Menu Panel */
.app-layout__user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 270px;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border-soft, #e2e8f0);
  border-radius: var(--radius-surface, 14px);
  box-shadow:
    0 10px 25px -5px rgba(15, 23, 42, 0.12),
    0 8px 10px -6px rgba(15, 23, 42, 0.08);
  z-index: 50;
  overflow: hidden;
}

.app-layout__dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--color-surface-inset, #f8fafc);
  border-bottom: 1px solid var(--color-border-soft, #e2e8f0);
}

.app-layout__dropdown-user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-layout__dropdown-user-name {
  color: var(--color-ink-strong, #0f172a);
  font-size: 0.875rem;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.app-layout__dropdown-user-email {
  color: var(--color-ink-muted, #64748b);
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.app-layout__dropdown-role-badge {
  display: inline-block;
  align-self: flex-start;
  margin-top: 4px;
  padding: 1px 8px;
  border-radius: 9999px;
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-brand-amber-strong, #d97706);
  border: 1px solid rgba(245, 158, 11, 0.3);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.app-layout__dropdown-body {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-layout__dropdown-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-control, 8px);
  color: var(--color-ink-body, #334155);
  text-decoration: none;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.app-layout__dropdown-link i {
  font-size: 0.9375rem;
  color: var(--color-ink-muted, #64748b);
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.app-layout__dropdown-link:hover {
  background: var(--color-surface-inset, #f1f5f9);
  color: var(--color-ink-strong, #0f172a);
}

.app-layout__dropdown-link:hover i {
  color: var(--color-ink-strong, #0f172a);
}

.app-layout__dropdown-link--active {
  background: rgba(245, 158, 11, 0.12);
  color: var(--color-brand-amber-strong, #d97706);
  font-weight: 600;
}

.app-layout__dropdown-link--active i {
  color: var(--color-brand-amber-strong, #d97706);
}

.app-layout__dropdown-link-info {
  display: flex;
  flex-direction: column;
}

.app-layout__dropdown-link-title {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.25;
}

.app-layout__dropdown-link-subtitle {
  font-size: 0.6875rem;
  color: var(--color-ink-muted, #64748b);
  line-height: 1.25;
}

.app-layout__dropdown-divider {
  height: 1px;
  background: var(--color-border-soft, #e2e8f0);
  margin: 4px 0;
}

.app-layout__dropdown-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  width: 100%;
  border-radius: var(--radius-control, 8px);
  border: none;
  background: transparent;
  color: var(--color-danger, #dc2626);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.app-layout__dropdown-logout i {
  font-size: 0.9375rem;
  flex-shrink: 0;
}

.app-layout__dropdown-logout:hover:not(:disabled) {
  background: #fef2f2;
  color: #b91c1c;
}

.app-layout__dropdown-logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

/* --- Main Content Area --- */
.app-layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-layout__alert {
  width: min(100% - 32px, 1120px);
  margin: 16px auto 0;
}

/* --- Intermediate Breakpoint (< 1200px) --- */
@media (max-width: 1200px) {
  .app-layout__search-bar-placeholder {
    display: none;
  }

  .app-layout__search-bar-placeholder--short {
    display: inline;
  }

  .app-layout__topbar-center {
    max-width: 320px;
  }
}

/* --- Responsive Breakpoint (< 1024px) --- */
@media (max-width: 1023px) {
  .app-layout {
    flex-direction: column;
  }

  .app-layout__topbar {
    height: 56px;
    padding: 0 16px;
  }

  .app-layout__desktop-toggle {
    display: none;
  }

  .app-layout__mobile-toggle {
    display: grid;
  }

  .app-layout__mobile-brand {
    display: inline-flex;
  }

  .app-layout__topbar-title {
    display: none;
  }

  .app-layout__topbar-center {
    display: none;
  }

  .app-layout__mobile-search-btn {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-control, 8px);
    background: var(--color-surface-inset, #f8fafc);
    border: 1px solid var(--color-border, #e2e8f0);
    color: var(--color-ink-strong, #0f172a);
    font-size: 0.9375rem;
    cursor: pointer;
  }

  .app-layout__mobile-search-btn:hover {
    background: var(--color-surface, #ffffff);
    border-color: #cbd5e1;
  }

  .app-layout__user-info {
    display: none;
  }

  .app-layout__user-btn {
    padding: 2px;
    border: none;
    background: transparent;
  }

  .app-layout__user-btn .app-layout__chevron {
    display: none;
  }

  /* Off-canvas Drawer */
  .app-layout__sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    height: 100%;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.5),
      0 8px 10px -6px rgba(0, 0, 0, 0.5);
  }

  .app-layout__sidebar--open {
    transform: translateX(0);
  }

  .app-layout__drawer-close {
    display: block;
  }

  .app-layout__backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(2px);
    z-index: 45;
  }
}
</style>
