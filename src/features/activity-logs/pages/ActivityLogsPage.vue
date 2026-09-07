<script setup lang="ts">
import { computed, ref } from 'vue'

import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import FilterBar, { type ActiveFilter } from '@/shared/components/patterns/FilterBar.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiPagination from '@/shared/components/ui/UiPagination.vue'
import UiStatusBadge, { type StatusTone } from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDate, formatNumber } from '@/shared/formatters'

import type { ActivityLogFilterParams, ActivityLogItem } from '../api/activity-logs.api'
import ActivityLogDetailDialog from '../components/ActivityLogDetailDialog.vue'
import { useActivityLogsQuery } from '../composables/useActivityLogs'

// Filter states
const search = ref('')
const selectedEvent = ref('')
const selectedLogName = ref('')
const fromDate = ref('')
const toDate = ref('')
const page = ref(1)
const perPage = ref(15)

// Modal state
const selectedLogId = ref<number | null>(null)
const isDetailDialogOpen = ref(false)

const filters = computed<ActivityLogFilterParams>(() => ({
  page: page.value,
  per_page: perPage.value,
  search: search.value.trim() || undefined,
  event: selectedEvent.value || undefined,
  log_name: selectedLogName.value || undefined,
  from_date: fromDate.value || undefined,
  to_date: toDate.value || undefined,
}))

const query = useActivityLogsQuery(filters)

const logs = computed(() => query.data.value?.data || [])
const meta = computed(() => query.data.value?.meta)

const tableState = computed(() => {
  if (query.isPending.value) return 'loading'
  if (query.isError.value) return 'error'
  return logs.value.length > 0 ? 'success' : 'empty'
})

const isFiltered = computed(
  () =>
    Boolean(search.value) ||
    Boolean(selectedEvent.value) ||
    Boolean(selectedLogName.value) ||
    Boolean(fromDate.value) ||
    Boolean(toDate.value),
)

const activeFilterChips = computed<ActiveFilter[]>(() => {
  const list: ActiveFilter[] = []
  if (search.value) {
    list.push({ key: 'search', label: 'Kata kunci', value: search.value })
  }
  if (selectedEvent.value) {
    list.push({ key: 'event', label: 'Aksi', value: getEventLabel(selectedEvent.value) })
  }
  if (selectedLogName.value) {
    list.push({ key: 'log_name', label: 'Modul', value: selectedLogName.value })
  }
  if (fromDate.value) {
    list.push({ key: 'from_date', label: 'Dari', value: fromDate.value })
  }
  if (toDate.value) {
    list.push({ key: 'to_date', label: 'Sampai', value: toDate.value })
  }
  return list
})

function removeFilter(key: string) {
  if (key === 'search') search.value = ''
  if (key === 'event') selectedEvent.value = ''
  if (key === 'log_name') selectedLogName.value = ''
  if (key === 'from_date') fromDate.value = ''
  if (key === 'to_date') toDate.value = ''
  page.value = 1
}

function resetFilters() {
  search.value = ''
  selectedEvent.value = ''
  selectedLogName.value = ''
  fromDate.value = ''
  toDate.value = ''
  page.value = 1
}

function openDetail(item: ActivityLogItem) {
  selectedLogId.value = item.id
  isDetailDialogOpen.value = true
}

function getEventTone(event?: string | null): StatusTone {
  switch (event) {
    case 'created':
      return 'success'
    case 'updated':
      return 'warning'
    case 'deleted':
      return 'danger'
    case 'restored':
      return 'info'
    default:
      return 'neutral'
  }
}

function getEventLabel(event?: string | null): string {
  switch (event) {
    case 'created':
      return 'Dibuat'
    case 'updated':
      return 'Diperbarui'
    case 'deleted':
      return 'Dihapus'
    case 'restored':
      return 'Dipulihkan'
    default:
      return event || 'Aktivitas'
  }
}

function formatSubjectType(type?: string | null): string {
  if (!type) return '—'
  const parts = type.split('\\')
  return parts[parts.length - 1] || type
}
</script>

<template>
  <main id="main-content" class="activity-logs-page" tabindex="-1">
    <header class="activity-logs-header">
      <div>
        <h1>Log Aktivitas Sistem</h1>
        <p>
          Jejak audit dan rekaman seluruh perubahan data, aksi pengguna, dan peristiwa operasional
          sistem.
        </p>
      </div>

      <div class="activity-logs-summary">
        <span class="summary-label">Total Aktivitas</span>
        <strong class="summary-val">{{ formatNumber(meta?.total || 0) }}</strong>
      </div>
    </header>

    <!-- Filter Bar -->
    <UiSurface class="filters-card">
      <FilterBar :filters="activeFilterChips" @remove="removeFilter" @reset="resetFilters">
        <div class="filters-controls-wrap">
          <UiField label="Cari Log">
            <template #default="{ inputId }">
              <input
                :id="inputId"
                v-model="search"
                type="text"
                placeholder="Cari kata kunci, deskripsi, atau aktor..."
                data-testid="activity-search-input"
                @keyup.enter="page = 1"
              />
            </template>
          </UiField>

          <div class="filters-grid">
            <UiField label="Jenis Aksi (Event)">
              <select
                id="filter-event-select"
                v-model="selectedEvent"
                class="filter-select"
                data-testid="event-filter-select"
                @change="page = 1"
              >
                <option value="">Semua Aksi</option>
                <option value="created">Dibuat (Created)</option>
                <option value="updated">Diperbarui (Updated)</option>
                <option value="deleted">Dihapus (Deleted)</option>
                <option value="restored">Dipulihkan (Restored)</option>
              </select>
            </UiField>

            <UiField label="Modul / Kategori">
              <select
                id="filter-logname-select"
                v-model="selectedLogName"
                class="filter-select"
                data-testid="module-filter-select"
                @change="page = 1"
              >
                <option value="">Semua Modul</option>
                <option value="pembanding">Data Pembanding</option>
                <option value="user">Pengguna (Users)</option>
                <option value="role">Hak Akses (Roles)</option>
                <option value="setting">Pengaturan Sistem</option>
                <option value="moderation">Moderasi Data</option>
                <option value="bulk_import">Impor Massal</option>
              </select>
            </UiField>

            <UiField label="Dari Tanggal">
              <input v-model="fromDate" type="date" class="filter-input" @change="page = 1" />
            </UiField>

            <UiField label="Sampai Tanggal">
              <input v-model="toDate" type="date" class="filter-input" @change="page = 1" />
            </UiField>
          </div>
        </div>
      </FilterBar>
    </UiSurface>

    <!-- Data Table Shell -->
    <UiSurface class="logs-table-surface">
      <DataTableShell
        title="Daftar Rekaman Jejak Audit"
        :state="tableState"
        :filtered="isFiltered"
        empty-title="Belum ada rekaman aktivitas"
        empty-description="Tidak ditemukan aktivitas yang sesuai dengan kriteria filter yang diterapkan."
        @retry="query.refetch()"
      >
        <table class="activity-table">
          <thead>
            <tr>
              <th scope="col">Waktu</th>
              <th scope="col">Pengguna (Aktor)</th>
              <th scope="col">Aksi</th>
              <th scope="col">Entitas Target</th>
              <th scope="col">Deskripsi Aktivitas</th>
              <th scope="col" class="text-right">Rincian</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in logs" :key="item.id">
              <td class="whitespace-nowrap text-muted text-sm">
                {{ formatDate(item.created_at) }}
              </td>
              <td>
                <div class="actor-info">
                  <strong>{{ item.causer?.name || 'Sistem' }}</strong>
                  <span v-if="item.causer?.email" class="text-xs text-muted">{{
                    item.causer.email
                  }}</span>
                </div>
              </td>
              <td>
                <UiStatusBadge :tone="getEventTone(item.event)">
                  {{ getEventLabel(item.event) }}
                </UiStatusBadge>
              </td>
              <td>
                <span class="subject-tag">
                  {{ formatSubjectType(item.subject_type) }} #{{ item.subject_id ?? '—' }}
                </span>
              </td>
              <td>
                <p class="log-desc">{{ item.description }}</p>
              </td>
              <td class="text-right">
                <UiButton
                  size="sm"
                  variant="secondary"
                  data-testid="view-log-detail-btn"
                  @click="openDetail(item)"
                >
                  <template #icon><i class="pi pi-eye" aria-hidden="true" /></template>
                  Detail
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>

        <template v-if="meta" #pagination>
          <UiPagination
            :page="meta.current_page"
            :per-page="meta.per_page"
            :total="meta.total"
            :per-page-options="[15, 25, 50, 100]"
            :disabled="query.isFetching.value"
            @update:page="page = $event"
            @update:per-page="perPage = $event"
          />
        </template>
      </DataTableShell>
    </UiSurface>

    <!-- Detail Dialog -->
    <ActivityLogDetailDialog
      :open="isDetailDialogOpen"
      :log-id="selectedLogId"
      @update:open="isDetailDialogOpen = $event"
    />
  </main>
</template>

<style scoped>
.activity-logs-page {
  width: min(100% - 32px, 1280px);
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
}

.activity-logs-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.activity-logs-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.activity-logs-header p {
  font-size: 0.9375rem;
  color: var(--color-muted);
  margin: 0.25rem 0 0;
}

.activity-logs-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background-color: var(--color-surface);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.summary-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted);
}

.summary-val {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.filters-card {
  padding: 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  margin-bottom: 1.25rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

@media (max-width: 900px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}

.filter-select,
.filter-input {
  width: 100%;
}

.logs-table-surface {
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
}

.activity-table th,
.activity-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.activity-table th {
  background-color: var(--color-surface-subtle, #f8fafc);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.actor-info {
  display: flex;
  flex-direction: column;
}

.actor-info strong {
  font-size: 0.875rem;
  color: var(--color-text);
}

.subject-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-subtle, #f1f5f9);
  border: 1px solid var(--color-border);
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
  color: var(--color-text);
}

.log-desc {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.4;
  max-width: 400px;
}

.whitespace-nowrap {
  white-space: nowrap;
}

.text-right {
  text-align: right;
}
</style>
