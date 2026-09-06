<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
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

function openMobileMenu() {
  isMobileOpen.value = true
}

function closeMobileMenu() {
  isMobileOpen.value = false
}

function handleOpenSearch() {
  closeMobileMenu()
  openSearch()
}

// Close drawer automatically on route navigation
watch(
  () => route.path,
  () => {
    closeMobileMenu()
  },
)

// Close on Escape key
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isMobileOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
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
  ]),
)

async function handleLogout() {
  loggingOut.value = true
  logoutError.value = ''

  try {
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
  <div class="app-layout">
    <!-- Mobile topbar (< 1024px) -->
    <header class="app-layout__mobile-header">
      <div class="app-layout__mobile-header-left">
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

        <RouterLink class="app-layout__mobile-brand" :to="{ name: 'dashboard' }" aria-label="Dashboard">
          <span class="app-layout__mark" aria-hidden="true">HJ</span>
          <span class="app-layout__mobile-brand-name">HJAR Sysinfo</span>
        </RouterLink>
      </div>

      <div class="app-layout__mobile-header-right">
        <button
          v-if="auth.can('view_search')"
          type="button"
          class="app-layout__mobile-search-btn"
          aria-label="Cari data global (Ctrl+K)"
          @click="handleOpenSearch"
        >
          <i class="pi pi-search" aria-hidden="true" />
        </button>

        <div class="app-layout__mobile-user-avatar" :title="auth.user?.name">
          {{ userInitials }}
        </div>
      </div>
    </header>

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
      :class="{ 'app-layout__sidebar--open': isMobileOpen }"
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

      <!-- Global Search Trigger -->
      <div v-if="auth.can('view_search')" class="app-layout__search-wrapper">
        <button
          type="button"
          class="app-layout__search-btn"
          aria-label="Cari data global (Ctrl+K)"
          @click="handleOpenSearch"
        >
          <div class="app-layout__search-btn-content">
            <i class="pi pi-search" aria-hidden="true" />
            <span class="app-layout__search-label">Cari apa saja...</span>
          </div>
          <kbd class="app-layout__search-shortcut">Ctrl K</kbd>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="app-layout__nav" aria-label="Navigasi utama">
        <!-- Section: Menu Utama -->
        <div class="app-layout__nav-group">
          <span class="app-layout__nav-group-title">Menu Utama</span>
          <RouterLink :to="{ name: 'dashboard' }" class="app-layout__nav-link">
            <i class="pi pi-home" aria-hidden="true" />
            <span>Dashboard</span>
          </RouterLink>

          <RouterLink
            v-if="auth.can('view_any_data::pembanding')"
            :to="{ name: 'pembanding.list' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('pembanding.') }"
          >
            <i class="pi pi-database" aria-hidden="true" />
            <span>Data Pembanding</span>
          </RouterLink>

          <RouterLink
            v-if="auth.canAny(['approve_delete_request', 'reject_delete_request', 'view_moderation'])"
            :to="{ name: 'moderation.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('moderation.') }"
          >
            <i class="pi pi-inbox" aria-hidden="true" />
            <span>Moderasi</span>
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
          >
            <i class="pi pi-sliders-h" aria-hidden="true" />
            <span>Master Data</span>
          </RouterLink>

          <RouterLink
            v-if="auth.canAny(['view_geo_data', 'create_geo_data', 'update_geo_data'])"
            :to="{ name: 'wilayah.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('wilayah.') }"
          >
            <i class="pi pi-map" aria-hidden="true" />
            <span>Wilayah</span>
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
          >
            <i class="pi pi-users" aria-hidden="true" />
            <span>Pengguna</span>
          </RouterLink>

          <RouterLink
            v-if="auth.canAny(['view_access_control', 'create_role', 'update_role'])"
            :to="{ name: 'access-control.index' }"
            class="app-layout__nav-link"
            :class="{ 'app-layout__nav-active': String(route.name).startsWith('access-control.') }"
          >
            <i class="pi pi-shield" aria-hidden="true" />
            <span>Hak Akses</span>
          </RouterLink>
        </div>
      </nav>

      <!-- Sidebar User Footer -->
      <div class="app-layout__sidebar-footer">
        <div class="app-layout__user-card">
          <div class="app-layout__user-avatar">
            {{ userInitials }}
          </div>
          <div class="app-layout__user-details">
            <strong class="app-layout__user-name">{{ auth.user?.name || 'Pengguna' }}</strong>
            <span class="app-layout__user-role">{{ userRoleBadge }}</span>
          </div>
        </div>

        <button
          type="button"
          class="app-layout__logout-button"
          :disabled="loggingOut"
          :aria-label="loggingOut ? 'Sedang keluar...' : 'Keluar dari aplikasi'"
          @click="handleLogout"
        >
          <i :class="loggingOut ? 'pi pi-spinner pi-spin' : 'pi pi-sign-out'" aria-hidden="true" />
          <span>{{ loggingOut ? 'Keluar...' : 'Keluar' }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="app-layout__main">
      <UiInlineAlert v-if="logoutError" class="app-layout__alert" title="Gagal keluar" tone="error">
        <p>{{ logoutError }}</p>
      </UiInlineAlert>

      <slot />
    </div>

    <!-- Global Search Modal Dialog -->
    <GlobalSearchDialog v-if="auth.can('view_search')" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-canvas, #F8FAFC);
  display: flex;
}

/* --- Mobile Header (< 1024px) --- */
.app-layout__mobile-header {
  display: none;
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
  background: var(--color-ink-strong, #0F172A);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  color: #F8FAFC;
  z-index: 40;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.app-layout__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.app-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.app-layout__mark {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  background: var(--color-brand-amber, #F59E0B);
  color: #0F172A;
  font-weight: 800;
  font-size: 0.8125rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.app-layout__brand-info {
  display: flex;
  flex-direction: column;
}

.app-layout__brand-title {
  color: #F8FAFC;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.app-layout__brand-subtitle {
  color: #94A3B8;
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.3;
}

.app-layout__drawer-close {
  display: none;
  background: transparent;
  border: none;
  color: #94A3B8;
  font-size: 1rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.app-layout__drawer-close:hover {
  color: #F8FAFC;
  background: rgba(255, 255, 255, 0.1);
}

/* --- Search Trigger --- */
.app-layout__search-wrapper {
  padding: 14px 16px 8px;
}

.app-layout__search-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--radius-control, 10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #94A3B8;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--transition-normal, 0.15s ease);
}

.app-layout__search-btn:hover {
  border-color: var(--color-brand-amber, #F59E0B);
  background: rgba(255, 255, 255, 0.08);
  color: #F8FAFC;
}

.app-layout__search-btn-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.app-layout__search-shortcut {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #CBD5E1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

/* --- Navigation Group & Links --- */
.app-layout__nav {
  flex: 1;
  padding: 8px 12px;
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
  color: #64748B;
}

.app-layout__nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: var(--radius-control, 8px);
  color: #CBD5E1;
  font-size: 0.8125rem;
  font-weight: 550;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.app-layout__nav-link i {
  font-size: 0.9375rem;
  width: 18px;
  text-align: center;
  color: #94A3B8;
  transition: color 0.15s ease;
}

.app-layout__nav-link:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #FFFFFF;
}

.app-layout__nav-link:hover i {
  color: #FFFFFF;
}

.app-layout__nav-link.router-link-exact-active,
.app-layout__nav-link.app-layout__nav-active {
  background: rgba(245, 158, 11, 0.15);
  color: var(--color-brand-amber, #F59E0B);
  font-weight: 650;
}

.app-layout__nav-link.router-link-exact-active i,
.app-layout__nav-link.app-layout__nav-active i {
  color: var(--color-brand-amber, #F59E0B);
}

/* --- Sidebar Footer --- */
.app-layout__sidebar-footer {
  margin-top: auto;
  padding: 14px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(0, 0, 0, 0.15);
}

.app-layout__user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;
}

.app-layout__user-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.2);
  color: var(--color-brand-amber, #F59E0B);
  font-weight: 700;
  font-size: 0.8125rem;
  border: 1px solid rgba(245, 158, 11, 0.3);
  flex-shrink: 0;
}

.app-layout__user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-layout__user-name {
  color: #F8FAFC;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.app-layout__user-role {
  color: #94A3B8;
  font-size: 0.6875rem;
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.app-layout__logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 6px 12px;
  border-radius: var(--radius-control, 8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #CBD5E1;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-layout__logout-button:hover:not(:disabled) {
  border-color: rgba(220, 38, 38, 0.5);
  background: rgba(220, 38, 38, 0.15);
  color: #FCA5A5;
}

.app-layout__logout-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* --- Responsive Breakpoint (< 1024px) --- */
@media (max-width: 1023px) {
  .app-layout {
    flex-direction: column;
  }

  .app-layout__mobile-header {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 16px;
    background: var(--color-ink-strong, #0F172A);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .app-layout__mobile-header-left,
  .app-layout__mobile-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-layout__mobile-toggle {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #F8FAFC;
    font-size: 1rem;
    cursor: pointer;
  }

  .app-layout__mobile-toggle:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .app-layout__mobile-brand {
    display: inline-flex;
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
    color: #F8FAFC;
    font-weight: 700;
    font-size: 0.875rem;
  }

  .app-layout__mobile-search-btn {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #F8FAFC;
    cursor: pointer;
  }

  .app-layout__mobile-search-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .app-layout__mobile-user-avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.2);
    color: var(--color-brand-amber, #F59E0B);
    font-weight: 700;
    font-size: 0.75rem;
    border: 1px solid rgba(245, 158, 11, 0.3);
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
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
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
