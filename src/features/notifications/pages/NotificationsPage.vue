<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiPagination from '@/shared/components/ui/UiPagination.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDate } from '@/shared/formatters'

import {
  parseNotificationContent,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationsQuery,
} from '../composables/useNotifications'

const router = useRouter()

// Filter tab state
const activeTab = ref<'all' | 'unread'>('all')
const page = ref(1)
const perPage = ref(15)

// Query params based on tab
const queryParams = computed(() => ({
  unread: activeTab.value === 'unread',
  page: page.value,
  per_page: perPage.value,
}))

const notificationsQuery = useNotificationsQuery(queryParams, { refetchInterval: 30_000 })
const markAsReadMutation = useMarkNotificationAsReadMutation()
const markAllAsReadMutation = useMarkAllNotificationsAsReadMutation()

const notifications = computed(() => notificationsQuery.data.value?.data ?? [])
const unreadCount = computed(() => notificationsQuery.data.value?.unread_count ?? 0)
const meta = computed(() => notificationsQuery.data.value?.meta)

// Reset to page 1 on tab change
watch(activeTab, () => {
  page.value = 1
})

const tableState = computed<'loading' | 'error' | 'success' | 'empty'>(() => {
  if (notificationsQuery.isPending.value) return 'loading'
  if (notificationsQuery.isError.value) return 'error'
  if (notifications.value.length === 0) return 'empty'
  return 'success'
})

async function handleMarkRead(id: string) {
  await markAsReadMutation.mutateAsync(id)
}

async function handleMarkAllRead() {
  await markAllAsReadMutation.mutateAsync()
}

async function handleItemClick(id: string, url?: string) {
  try {
    await markAsReadMutation.mutateAsync(id)
  } catch {
    // continue
  }

  if (url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.location.href = url
    } else {
      await router.push(url)
    }
  }
}
</script>

<template>
  <main id="main-content" class="notifications-page" tabindex="-1">
    <!-- Header -->
    <header class="notifications-header">
      <div class="notifications-header__titles">
        <h1>Pusat Notifikasi</h1>
        <p>
          Pantau seluruh pemberitahuan sistem, proses impor/ekspor data, dan permohonan moderasi.
        </p>
      </div>

      <div class="notifications-header__actions">
        <UiButton
          variant="secondary"
          :disabled="unreadCount === 0 || markAllAsReadMutation.isPending.value"
          :loading="markAllAsReadMutation.isPending.value"
          loading-label="Menandai..."
          data-testid="page-mark-all-read-btn"
          @click="handleMarkAllRead"
        >
          <template #icon><i class="pi pi-check-circle" aria-hidden="true" /></template>
          Tandai Semua Dibaca
        </UiButton>
      </div>
    </header>

    <!-- Tabs & Filter Bar -->
    <div class="notifications-tabs-bar">
      <div class="tabs-nav" role="tablist" aria-label="Filter Notifikasi">
        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'all' }"
          :aria-selected="activeTab === 'all'"
          data-testid="tab-all-notifications"
          @click="activeTab = 'all'"
        >
          Semua Notifikasi
          <span v-if="meta?.total" class="tab-count-pill">{{ meta.total }}</span>
        </button>

        <button
          type="button"
          role="tab"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'unread' }"
          :aria-selected="activeTab === 'unread'"
          data-testid="tab-unread-notifications"
          @click="activeTab = 'unread'"
        >
          Belum Dibaca
          <span v-if="unreadCount > 0" class="tab-count-pill tab-count-pill--unread">
            {{ unreadCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Notification List Surface -->
    <UiSurface class="notifications-table-surface">
      <DataTableShell
        title="Daftar Notifikasi"
        :state="tableState"
        :filtered="activeTab === 'unread'"
        empty-title="Tidak ada notifikasi"
        :empty-description="
          activeTab === 'unread'
            ? 'Hebat! Anda telah membaca semua notifikasi yang ada.'
            : 'Belum ada notifikasi yang diterima.'
        "
        @retry="notificationsQuery.refetch()"
      >
        <div class="notifications-list">
          <article
            v-for="item in notifications"
            :key="item.id"
            class="notif-row"
            :class="{ 'notif-row--unread': !item.read_at }"
            data-testid="notification-row"
          >
            <div class="notif-row__icon-wrap">
              <i class="pi pi-bell text-primary" aria-hidden="true" />
            </div>

            <div
              class="notif-row__main"
              @click="handleItemClick(item.id, parseNotificationContent(item).url)"
            >
              <div class="notif-row__heading">
                <strong class="notif-row__title">
                  {{ parseNotificationContent(item).title }}
                </strong>
                <UiStatusBadge :tone="item.read_at ? 'neutral' : 'info'">
                  {{ item.read_at ? 'Sudah Dibaca' : 'Belum Dibaca' }}
                </UiStatusBadge>
              </div>

              <p class="notif-row__desc">
                {{ parseNotificationContent(item).message }}
              </p>

              <div class="notif-row__meta">
                <span class="text-xs text-muted">
                  <i class="pi pi-clock mr-1" aria-hidden="true" />
                  {{ formatDate(item.created_at) }}
                </span>
                <span v-if="parseNotificationContent(item).url" class="notif-row__link-indicator">
                  Buka tautan <i class="pi pi-external-link text-xs ml-1" aria-hidden="true" />
                </span>
              </div>
            </div>

            <div class="notif-row__actions">
              <UiButton
                v-if="!item.read_at"
                size="sm"
                variant="secondary"
                data-testid="mark-item-read-btn"
                :loading="markAsReadMutation.isPending.value"
                @click="handleMarkRead(item.id)"
              >
                Tandai Dibaca
              </UiButton>
            </div>
          </article>
        </div>

        <template v-if="meta" #pagination>
          <UiPagination
            :page="meta.current_page"
            :per-page="meta.per_page"
            :total="meta.total"
            :per-page-options="[15, 25, 50]"
            :disabled="notificationsQuery.isFetching.value"
            @update:page="page = $event"
            @update:per-page="perPage = $event"
          />
        </template>
      </DataTableShell>
    </UiSurface>
  </main>
</template>

<style scoped>
.notifications-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.notifications-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .notifications-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.notifications-header__titles h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 0.25rem 0;
}

.notifications-header__titles p {
  color: var(--text-muted, #64748b);
  font-size: 0.875rem;
  margin: 0;
}

.notifications-tabs-bar {
  display: flex;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
  margin-bottom: 1.25rem;
}

.tabs-nav {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary, #475569);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary, #0f172a);
}

.tab-btn--active {
  color: var(--primary-text, #2563eb);
  border-bottom-color: var(--primary-solid, #2563eb);
  font-weight: 600;
}

.tab-count-pill {
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  background: var(--surface-muted, #f1f5f9);
  color: var(--text-muted, #64748b);
}

.tab-count-pill--unread {
  background: var(--danger-subtle, #fef2f2);
  color: var(--danger-text, #dc2626);
  font-weight: 700;
}

.notifications-table-surface {
  padding: 1.25rem;
  border-radius: 0.75rem;
}

.notifications-list {
  display: flex;
  flex-direction: column;
}

.notif-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-subtle, #f1f5f9);
  transition: background 0.15s ease;
}

.notif-row:hover {
  background: var(--surface-hover, #f8fafc);
}

.notif-row--unread {
  background: rgba(37, 99, 235, 0.03);
}

.notif-row__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: var(--primary-subtle, #eff6ff);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.notif-row__main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.notif-row__heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
}

.notif-row__title {
  font-size: 0.9375rem;
  color: var(--text-primary, #0f172a);
}

.notif-row__desc {
  font-size: 0.875rem;
  color: var(--text-secondary, #475569);
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
}

.notif-row__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notif-row__link-indicator {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--primary-text, #2563eb);
}

.notif-row__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
</style>
