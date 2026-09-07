<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { formatDate } from '@/shared/formatters'

import {
  parseNotificationContent,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from '../composables/useNotifications'

const router = useRouter()
const auth = useAuthStore()

const isOpen = ref(false)
const bellRef = ref<HTMLElement | null>(null)

// Fetch top 5 notifications for preview dropdown, polling every 30s
const notificationsQuery = useNotificationsQuery(
  { per_page: 5 },
  {
    refetchInterval: 30_000,
    enabled: computed(() => auth.authenticated),
  },
)

const markAsReadMutation = useMarkNotificationAsReadMutation()
const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation()

const unreadCount = computed(() => notificationsQuery.data.value?.unread_count ?? 0)
const notifications = computed(() => notificationsQuery.data.value?.data ?? [])

const unreadBadgeText = computed(() => {
  if (unreadCount.value > 99) return '99+'
  return String(unreadCount.value)
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

async function handleNotificationClick(id: string, url?: string) {
  try {
    await markAsReadMutation.mutateAsync(id)
  } catch {
    // continue navigation even if mark read fails
  }

  closeDropdown()
  if (url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.location.href = url
    } else {
      await router.push(url)
    }
  }
}

async function handleMarkAllAsRead() {
  await markAllAsReadMutation.mutateAsync()
}

function handleViewAll() {
  closeDropdown()
  void router.push({ name: 'notifications.index' })
}

function handleClickOutside(event: MouseEvent) {
  if (isOpen.value && bellRef.value && !bellRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div ref="bellRef" class="notif-bell-wrap">
    <!-- Bell Button -->
    <button
      type="button"
      class="notif-bell-btn"
      :aria-expanded="isOpen"
      aria-label="Pemberitahuan / Notifikasi"
      data-testid="notification-bell-btn"
      @click="toggleDropdown"
    >
      <i class="pi pi-bell" aria-hidden="true" />
      <span
        v-if="unreadCount > 0"
        class="notif-badge"
        data-testid="notification-badge"
        :aria-label="`${unreadCount} notifikasi belum dibaca`"
      >
        {{ unreadBadgeText }}
      </span>
    </button>

    <!-- Dropdown Popover -->
    <div
      v-if="isOpen"
      class="notif-dropdown"
      data-testid="notification-dropdown"
      role="region"
      aria-label="Daftar Notifikasi Terbaru"
    >
      <!-- Header -->
      <div class="notif-dropdown-header">
        <div class="notif-dropdown-title">
          <strong>Notifikasi</strong>
          <span v-if="unreadCount > 0" class="notif-header-pill"> {{ unreadCount }} baru </span>
        </div>

        <button
          v-if="unreadCount > 0"
          type="button"
          class="mark-all-btn"
          :disabled="markAllAsReadMutation.isPending.value"
          data-testid="mark-all-read-btn"
          @click="handleMarkAllAsRead"
        >
          <i class="pi pi-check-circle" aria-hidden="true" />
          <span>Tandai Semua Dibaca</span>
        </button>
      </div>

      <!-- Items List -->
      <div class="notif-dropdown-body">
        <div v-if="notificationsQuery.isPending.value" class="notif-loading">
          <div v-for="i in 3" :key="i" class="notif-skeleton-item" />
        </div>

        <div
          v-else-if="notifications.length === 0"
          class="notif-empty"
          data-testid="notifications-empty"
        >
          <i class="pi pi-bell-slash text-muted" aria-hidden="true" />
          <p>Belum ada notifikasi baru untuk Anda.</p>
        </div>

        <ul v-else class="notif-list">
          <li
            v-for="item in notifications"
            :key="item.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !item.read_at }"
            data-testid="notification-item"
            @click="handleNotificationClick(item.id, parseNotificationContent(item).url)"
          >
            <div class="notif-item-icon">
              <i class="pi pi-info-circle text-primary" aria-hidden="true" />
            </div>

            <div class="notif-item-content">
              <div class="notif-item-header">
                <span class="notif-item-title">
                  {{ parseNotificationContent(item).title }}
                </span>
                <span class="notif-item-time">
                  {{ formatDate(item.created_at) }}
                </span>
              </div>

              <p class="notif-item-desc">
                {{ parseNotificationContent(item).message }}
              </p>
            </div>

            <span v-if="!item.read_at" class="unread-dot" aria-label="Belum dibaca" />
          </li>
        </ul>
      </div>

      <!-- Footer -->
      <div class="notif-dropdown-footer">
        <button
          type="button"
          class="view-all-btn"
          data-testid="view-all-notifications-btn"
          @click="handleViewAll"
        >
          Lihat Semua Notifikasi
          <i class="pi pi-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notif-bell-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.notif-bell-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  border: 1px solid var(--border-subtle, #e2e8f0);
  background: var(--surface-panel, #ffffff);
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: all 0.15s ease;
}

.notif-bell-btn:hover,
.notif-bell-btn:focus-visible {
  background: var(--surface-hover, #f8fafc);
  color: var(--text-primary, #0f172a);
  border-color: var(--border-focus, #cbd5e1);
  outline: none;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1;
  border-radius: 9999px;
  background: var(--danger-solid, #ef4444);
  color: #ffffff;
  border: 2px solid var(--surface-panel, #ffffff);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.notif-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: min(calc(100vw - 2rem), 380px);
  max-height: 480px;
  display: flex;
  flex-direction: column;
  background: var(--surface-panel, #ffffff);
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 0.75rem;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
}

.notif-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
  background: var(--surface-muted, #f8fafc);
}

.notif-dropdown-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-primary, #0f172a);
}

.notif-header-pill {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: var(--primary-subtle, #eff6ff);
  color: var(--primary-text, #2563eb);
  border-radius: 9999px;
}

.mark-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--primary-text, #2563eb);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.375rem;
  border-radius: 0.25rem;
}

.mark-all-btn:hover:not(:disabled) {
  background: var(--primary-subtle, #eff6ff);
}

.mark-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notif-dropdown-body {
  overflow-y: auto;
  flex: 1;
  max-height: 340px;
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  text-align: center;
  gap: 0.5rem;
  color: var(--text-muted, #64748b);
  font-size: 0.875rem;
}

.notif-empty i {
  font-size: 1.5rem;
}

.notif-loading {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notif-skeleton-item {
  height: 3.5rem;
  background: var(--surface-hover, #f1f5f9);
  border-radius: 0.375rem;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.notif-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle, #f1f5f9);
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
}

.notif-item:hover {
  background: var(--surface-hover, #f8fafc);
}

.notif-item--unread {
  background: rgba(37, 99, 235, 0.04);
}

.notif-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: var(--primary-subtle, #eff6ff);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.notif-item-icon i {
  font-size: 0.875rem;
  color: var(--primary-text, #2563eb);
}

.notif-item-content {
  flex: 1;
  min-width: 0;
}

.notif-item-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.notif-item-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item-time {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
  white-space: nowrap;
  flex-shrink: 0;
}

.notif-item-desc {
  font-size: 0.75rem;
  color: var(--text-secondary, #475569);
  line-height: 1.35;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unread-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--primary-solid, #2563eb);
  margin-top: 0.625rem;
  flex-shrink: 0;
}

.notif-dropdown-footer {
  padding: 0.625rem 1rem;
  border-top: 1px solid var(--border-subtle, #e2e8f0);
  background: var(--surface-muted, #f8fafc);
  text-align: center;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--primary-text, #2563eb);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.view-all-btn:hover {
  text-decoration: underline;
}
</style>
