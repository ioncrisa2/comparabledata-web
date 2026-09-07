<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiPagination from '@/shared/components/ui/UiPagination.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDate, formatNumber } from '@/shared/formatters'

import type { ImportRow } from '../api/bulk-import.api'
import ImportBulkApplyDialog from '../components/ImportBulkApplyDialog.vue'
import ImportFinalizeDialog from '../components/ImportFinalizeDialog.vue'
import ImportRowEditDialog from '../components/ImportRowEditDialog.vue'
import {
  useImportBatchDetailQuery,
  useRetryImportRowMutation,
  useUpdateRowSelectionMutation,
} from '../composables/useBulkImport'

const route = useRoute()
const router = useRouter()

const batchId = computed(() => String(route.params.id || ''))

const activeFilterTab = computed<'all' | 'ready' | 'invalid' | 'duplicate' | 'imported' | 'failed'>(
  () => {
    const t = route.query.status as string
    if (['ready', 'invalid', 'duplicate', 'imported', 'failed'].includes(t)) {
      return t as 'ready' | 'invalid' | 'duplicate' | 'imported' | 'failed'
    }
    return 'all'
  },
)

const currentPage = computed(() => {
  const p = Number(route.query.page)
  return Number.isInteger(p) && p > 0 ? p : 1
})

const filters = computed(() => ({
  status: activeFilterTab.value === 'all' ? null : activeFilterTab.value,
  page: currentPage.value,
}))

const detailQuery = useImportBatchDetailQuery(batchId, filters)
const selectionMutation = useUpdateRowSelectionMutation()
const retryMutation = useRetryImportRowMutation()

const batch = computed(() => detailQuery.data.value?.batch)
const rows = computed(() => detailQuery.data.value?.data ?? [])
const meta = computed(() => detailQuery.data.value?.meta)
const options = computed(
  () =>
    detailQuery.data.value?.options ?? {
      statusPemberiInfos: [],
      bentukTanahs: [],
      posisiTanahs: [],
      kondisiTanahs: [],
      topografis: [],
      dokumenTanahs: [],
      peruntukans: [],
    },
)

const tableState = computed(() => {
  if (detailQuery.isPending.value) return 'loading'
  if (detailQuery.isError.value) return 'error'
  if (rows.value.length === 0) return 'empty'
  return 'success'
})

// Dialog states
const isBulkApplyOpen = ref(false)
const isFinalizeOpen = ref(false)
const editRowId = ref<number | null>(null)

// Feedback alerts
const feedback = ref<{
  title: string
  body: string
  tone: 'success' | 'warning' | 'info' | 'error'
} | null>(null)

function setFilterTab(tab: 'all' | 'ready' | 'invalid' | 'duplicate' | 'imported' | 'failed') {
  void router.push({
    query: {
      ...route.query,
      status: tab === 'all' ? undefined : tab,
      page: undefined,
    },
  })
}

function handlePageChange(newPage: number) {
  void router.push({
    query: {
      ...route.query,
      page: newPage > 1 ? String(newPage) : undefined,
    },
  })
}

async function toggleRowSelection(row: ImportRow) {
  try {
    await selectionMutation.mutateAsync({
      batchId: batchId.value,
      payload: {
        action: 'set_rows',
        row_ids: [row.id],
        is_selected: !row.is_selected,
      },
    })
  } catch {
    feedback.value = {
      title: 'Gagal Mengubah Pilihan',
      body: 'Terjadi gangguan saat menyimpan pilihan baris.',
      tone: 'error',
    }
  }
}

async function handleBulkSelection(action: 'select_all' | 'clear_all' | 'select_ready') {
  try {
    await selectionMutation.mutateAsync({
      batchId: batchId.value,
      payload: { action },
    })
    feedback.value = {
      title: 'Pilihan Diperbarui',
      body:
        action === 'select_all'
          ? 'Seluruh baris berhasil dipilih.'
          : action === 'clear_all'
            ? 'Seluruh pilihan baris dibatalkan.'
            : 'Baris yang siap berhasil dipilih.',
      tone: 'info',
    }
  } catch {
    feedback.value = {
      title: 'Gagal Memperbarui Pilihan',
      body: 'Gagal memperbarui seleksi massal.',
      tone: 'error',
    }
  }
}

async function retryRow(rowId: number) {
  try {
    const res = await retryMutation.mutateAsync({
      batchId: batchId.value,
      rowId,
    })
    feedback.value = {
      title: 'Proses Ulang Baris',
      body: res.message || 'Baris sedang divalidasi ulang.',
      tone: 'info',
    }
  } catch {
    feedback.value = {
      title: 'Gagal Mengulang Baris',
      body: 'Terjadi gangguan saat mengulang proses baris.',
      tone: 'error',
    }
  }
}

function onBulkApplySuccess(updatedCount: number) {
  feedback.value = {
    title: 'Penerapan Berhasil',
    body: `${updatedCount} baris berhasil diperbarui dengan nilai baru.`,
    tone: 'success',
  }
}

function onFinalizeSuccess() {
  feedback.value = {
    title: 'Finalisasi Dimulai',
    body: 'Proses migrasi data ke tabel utama sedang berjalan di latar belakang.',
    tone: 'success',
  }
}

function getRowStatusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'ready':
    case 'imported':
      return 'success'
    case 'needs_confirmation':
    case 'duplicate':
    case 'final_duplicate':
      return 'warning'
    case 'invalid':
    case 'failed':
      return 'danger'
    case 'processing':
    case 'queued':
      return 'info'
    case 'incomplete':
    default:
      return 'neutral'
  }
}

const isProcessingBatch = computed(() => {
  if (!batch.value) return false
  return (
    batch.value.status === 'processing' ||
    batch.value.status === 'queued' ||
    batch.value.processing_rows > 0
  )
})
</script>

<template>
  <main id="main-content" class="batch-detail-page" tabindex="-1">
    <!-- Breadcrumb & Heading -->
    <header class="batch-detail-header">
      <RouterLink :to="{ name: 'import.index' }" class="batch-detail-back">
        <i class="pi pi-arrow-left" aria-hidden="true" />
        Kembali ke Daftar Batch
      </RouterLink>

      <div class="batch-detail-title-row">
        <div>
          <h1>{{ batch?.filename ?? 'Detail Batch Impor' }}</h1>
          <p class="batch-detail-meta">
            <span>ID Batch: #{{ batchId }}</span>
            <span v-if="batch?.owner">• Pengunggah: {{ batch.owner }}</span>
            <span v-if="batch?.updated_at">• Diperbarui: {{ formatDate(batch.updated_at) }}</span>
          </p>
        </div>

        <div class="batch-detail-actions">
          <UiButton
            v-if="batch?.can_finalize"
            variant="primary"
            :disabled="isProcessingBatch || (batch?.ready_rows ?? 0) === 0"
            @click="isFinalizeOpen = true"
          >
            <template #icon><i class="pi pi-check-circle" aria-hidden="true" /></template>
            Finalisasi Impor ({{ formatNumber(batch?.ready_rows ?? 0) }})
          </UiButton>
        </div>
      </div>
    </header>

    <!-- Processing Banner if Job Running in Background -->
    <UiInlineAlert v-if="isProcessingBatch" tone="info" title="Proses Sedang Berjalan" class="mb-4">
      <p>
        Sistem sedang memproses {{ formatNumber(batch?.processing_rows ?? 0) }} baris data. Halaman
        ini akan diperbarui secara otomatis.
      </p>
    </UiInlineAlert>

    <!-- Notification Feedback -->
    <UiInlineAlert
      v-if="feedback"
      :tone="feedback.tone"
      :title="feedback.title"
      dismissible
      class="mb-4"
      @dismiss="feedback = null"
    >
      <p>{{ feedback.body }}</p>
    </UiInlineAlert>

    <!-- Statistics Summary Cards -->
    <div class="batch-stats-grid">
      <div class="batch-stat-card">
        <span class="batch-stat-card__label">Total Baris</span>
        <strong class="batch-stat-card__value">{{ formatNumber(batch?.total_rows ?? 0) }}</strong>
      </div>
      <div class="batch-stat-card batch-stat-card--ready">
        <span class="batch-stat-card__label">Siap Dimasukkan</span>
        <strong class="batch-stat-card__value">{{ formatNumber(batch?.ready_rows ?? 0) }}</strong>
      </div>
      <div class="batch-stat-card batch-stat-card--selected">
        <span class="batch-stat-card__label">Dipilih</span>
        <strong class="batch-stat-card__value">{{
          formatNumber(batch?.selected_rows ?? 0)
        }}</strong>
      </div>
      <div class="batch-stat-card batch-stat-card--imported">
        <span class="batch-stat-card__label">Berhasil Dimasukkan</span>
        <strong class="batch-stat-card__value">{{
          formatNumber(batch?.imported_rows ?? 0)
        }}</strong>
      </div>
      <div class="batch-stat-card batch-stat-card--failed">
        <span class="batch-stat-card__label">Gagal / Masalah</span>
        <strong class="batch-stat-card__value">{{ formatNumber(batch?.failed_rows ?? 0) }}</strong>
      </div>
    </div>

    <!-- Main Content Surface -->
    <UiSurface class="batch-detail-content">
      <!-- Toolbar & Status Tabs -->
      <div class="batch-toolbar">
        <div class="batch-filter-tabs" role="tablist" aria-label="Filter status baris">
          <button
            type="button"
            role="tab"
            class="batch-tab-btn"
            :class="{ 'batch-tab-btn--active': activeFilterTab === 'all' }"
            :aria-selected="activeFilterTab === 'all'"
            @click="setFilterTab('all')"
          >
            Semua ({{ formatNumber(batch?.total_rows ?? 0) }})
          </button>
          <button
            type="button"
            role="tab"
            class="batch-tab-btn"
            :class="{ 'batch-tab-btn--active': activeFilterTab === 'ready' }"
            :aria-selected="activeFilterTab === 'ready'"
            @click="setFilterTab('ready')"
          >
            Siap ({{ formatNumber(batch?.ready_rows ?? 0) }})
          </button>
          <button
            type="button"
            role="tab"
            class="batch-tab-btn"
            :class="{ 'batch-tab-btn--active': activeFilterTab === 'invalid' }"
            :aria-selected="activeFilterTab === 'invalid'"
            @click="setFilterTab('invalid')"
          >
            Perlu Diperbaiki
          </button>
          <button
            type="button"
            role="tab"
            class="batch-tab-btn"
            :class="{ 'batch-tab-btn--active': activeFilterTab === 'duplicate' }"
            :aria-selected="activeFilterTab === 'duplicate'"
            @click="setFilterTab('duplicate')"
          >
            Duplikat
          </button>
          <button
            type="button"
            role="tab"
            class="batch-tab-btn"
            :class="{ 'batch-tab-btn--active': activeFilterTab === 'imported' }"
            :aria-selected="activeFilterTab === 'imported'"
            @click="setFilterTab('imported')"
          >
            Berhasil ({{ formatNumber(batch?.imported_rows ?? 0) }})
          </button>
          <button
            type="button"
            role="tab"
            class="batch-tab-btn"
            :class="{ 'batch-tab-btn--active': activeFilterTab === 'failed' }"
            :aria-selected="activeFilterTab === 'failed'"
            @click="setFilterTab('failed')"
          >
            Gagal ({{ formatNumber(batch?.failed_rows ?? 0) }})
          </button>
        </div>

        <!-- Bulk Action Controls -->
        <div class="batch-selection-actions">
          <div class="batch-selection-dropdown">
            <UiButton
              size="sm"
              variant="secondary"
              :disabled="selectionMutation.isPending.value"
              @click="handleBulkSelection('select_ready')"
            >
              Pilih Yang Siap
            </UiButton>
            <UiButton
              size="sm"
              variant="secondary"
              :disabled="selectionMutation.isPending.value"
              @click="handleBulkSelection('select_all')"
            >
              Pilih Semua
            </UiButton>
            <UiButton
              size="sm"
              variant="secondary"
              :disabled="selectionMutation.isPending.value"
              @click="handleBulkSelection('clear_all')"
            >
              Batal Pilih
            </UiButton>
          </div>

          <UiButton
            size="sm"
            variant="primary"
            :disabled="(batch?.selected_rows ?? 0) === 0 || isProcessingBatch"
            @click="isBulkApplyOpen = true"
          >
            <template #icon><i class="pi pi-bolt" aria-hidden="true" /></template>
            Terapkan Massal ({{ formatNumber(batch?.selected_rows ?? 0) }})
          </UiButton>
        </div>
      </div>

      <!-- Rows Data Table -->
      <DataTableShell
        title="Daftar Baris Impor"
        :state="tableState"
        empty-title="Tidak Ada Baris"
        empty-description="Tidak ada baris data pembanding dengan filter status ini."
        @retry="detailQuery.refetch()"
      >
        <table class="batch-rows-table">
          <thead>
            <tr>
              <th scope="col" class="w-12 text-center">
                <span class="sr-only">Pilih</span>
              </th>
              <th scope="col" class="w-16">Baris</th>
              <th scope="col">Status</th>
              <th scope="col">Alamat & Lokasi</th>
              <th scope="col">Jenis Pembanding</th>
              <th scope="col">Kelengkapan & Catatan</th>
              <th scope="col" class="text-center w-16">Foto</th>
              <th scope="col" class="text-right w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" :class="{ 'row-selected': row.is_selected }">
              <td class="text-center">
                <input
                  type="checkbox"
                  :checked="row.is_selected"
                  :disabled="selectionMutation.isPending.value || isProcessingBatch"
                  aria-label="Pilih baris"
                  @change="toggleRowSelection(row)"
                />
              </td>
              <td class="font-mono text-muted">#{{ row.source_row_number }}</td>
              <td>
                <UiStatusBadge :tone="getRowStatusTone(row.status)">
                  {{ row.status_label }}
                </UiStatusBadge>
              </td>
              <td>
                <div class="row-address">
                  <strong>{{ row.alamat || 'Alamat belum terisi' }}</strong>
                  <span class="text-xs text-muted">{{ row.location }}</span>
                </div>
              </td>
              <td>{{ row.jenis_pembanding || '—' }}</td>
              <td>
                <div class="row-issues">
                  <span
                    v-if="row.missing_fields && row.missing_fields.length > 0"
                    class="issue-chip issue-chip--error"
                    :title="`Kurang: ${row.missing_fields.join(', ')}`"
                  >
                    Kurang: {{ row.missing_fields.length }} field
                  </span>
                  <span
                    v-if="row.warnings && row.warnings.length > 0"
                    class="issue-chip issue-chip--warning"
                    :title="row.warnings.join('; ')"
                  >
                    {{ row.warnings.length }} peringatan
                  </span>
                  <span
                    v-if="row.last_error"
                    class="issue-chip issue-chip--error"
                    :title="row.last_error"
                  >
                    Gagal: {{ row.last_error }}
                  </span>
                  <span
                    v-if="
                      (!row.missing_fields || row.missing_fields.length === 0) &&
                      (!row.warnings || row.warnings.length === 0) &&
                      !row.last_error
                    "
                    class="text-xs text-green-700 font-semibold"
                  >
                    ✓ Lengkap
                  </span>
                </div>
              </td>
              <td class="text-center">
                <span v-if="row.has_image" class="image-indicator" title="Memiliki foto lampiran">
                  <i class="pi pi-image text-green-600" aria-hidden="true" />
                </span>
                <span v-else class="text-muted text-xs">—</span>
              </td>
              <td class="text-right">
                <div class="row-actions">
                  <UiButton
                    size="sm"
                    variant="ghost"
                    aria-label="Edit baris"
                    @click="editRowId = row.id"
                  >
                    <i class="pi pi-pencil" aria-hidden="true" />
                  </UiButton>
                  <UiButton
                    v-if="row.status === 'failed'"
                    size="sm"
                    variant="ghost"
                    title="Coba ulang baris"
                    aria-label="Coba ulang baris"
                    :disabled="retryMutation.isPending.value"
                    @click="retryRow(row.id)"
                  >
                    <i class="pi pi-refresh text-amber-600" aria-hidden="true" />
                  </UiButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </DataTableShell>

      <!-- Pagination -->
      <div v-if="meta && meta.last_page > 1" class="batch-pagination">
        <UiPagination
          :page="meta.current_page"
          :per-page="meta.per_page"
          :total="meta.total"
          @update:page="handlePageChange"
        />
      </div>
    </UiSurface>

    <!-- Dialogs -->
    <ImportBulkApplyDialog
      v-if="batch"
      :open="isBulkApplyOpen"
      :batch-id="batchId"
      :selected-count="batch.selected_rows"
      :options="options"
      @update:open="isBulkApplyOpen = $event"
      @success="onBulkApplySuccess"
    />

    <ImportFinalizeDialog
      v-if="batch"
      :open="isFinalizeOpen"
      :batch="batch"
      @update:open="isFinalizeOpen = $event"
      @success="onFinalizeSuccess"
    />

    <ImportRowEditDialog
      :open="Boolean(editRowId)"
      :batch-id="batchId"
      :row-id="editRowId"
      @update:open="
        (val) => {
          if (!val) editRowId = null
        }
      "
      @success="
        feedback = {
          title: 'Baris Diperbarui',
          body: 'Data baris berhasil disimpan dan divalidasi ulang.',
          tone: 'success',
        }
      "
    />
  </main>
</template>

<style scoped>
.batch-detail-page {
  width: min(100% - 32px, 1280px);
  margin-inline: auto;
  padding-block: 24px 64px;
}

.batch-detail-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-ink-muted);
  font-size: 0.875rem;
  text-decoration: none;
  margin-bottom: 12px;
}

.batch-detail-back:hover {
  color: var(--color-action-primary);
  text-decoration: underline;
}

.batch-detail-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}

.batch-detail-title-row h1 {
  margin: 0 0 6px;
  font-size: 1.75rem;
  letter-spacing: -0.02em;
}

.batch-detail-meta {
  margin: 0;
  display: flex;
  gap: 8px;
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.batch-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.batch-stat-card {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: var(--radius-card, 10px);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
}

.batch-stat-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.batch-stat-card__value {
  font-size: 1.625rem;
  line-height: 1.1;
  color: var(--color-ink-strong);
  font-variant-numeric: tabular-nums;
}

.batch-stat-card--ready {
  border-left: 4px solid var(--color-success, #16a34a);
}

.batch-stat-card--selected {
  border-left: 4px solid var(--color-action-primary, #b45309);
}

.batch-stat-card--imported {
  border-left: 4px solid var(--color-info, #2563eb);
}

.batch-stat-card--failed {
  border-left: 4px solid var(--color-danger, #dc2626);
}

.batch-detail-content {
  padding: 20px;
}

.batch-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-soft);
}

.batch-filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.batch-tab-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink-body);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.batch-tab-btn:hover {
  background: var(--color-surface-inset);
  color: var(--color-ink-strong);
}

.batch-tab-btn--active {
  border-color: var(--color-action-primary);
  background: var(--color-brand-amber-soft, #fef3c7);
  color: var(--color-action-primary);
}

.batch-selection-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-selection-dropdown {
  display: flex;
  gap: 6px;
}

.batch-rows-table {
  width: 100%;
  border-collapse: collapse;
}

.batch-rows-table th,
.batch-rows-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-soft);
  font-size: 0.875rem;
}

.row-selected {
  background: #fffbeb;
}

.row-address {
  display: grid;
  gap: 2px;
  max-width: 320px;
}

.row-issues {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.issue-chip {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}

.issue-chip--error {
  background: #fee2e2;
  color: #991b1b;
}

.issue-chip--warning {
  background: #fef9c3;
  color: #854d0e;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.batch-pagination {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-soft);
}

.w-12 {
  width: 48px;
}
.w-16 {
  width: 64px;
}
.w-24 {
  width: 96px;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.font-mono {
  font-variant-numeric: tabular-nums;
}
.text-muted {
  color: var(--color-ink-muted);
}
.text-xs {
  font-size: 0.75rem;
}

@media (max-width: 767px) {
  .batch-detail-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .batch-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .batch-selection-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
