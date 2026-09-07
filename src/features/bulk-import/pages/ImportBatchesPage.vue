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

import type { ImportBatch } from '../api/bulk-import.api'
import UploadImportBatchDialog from '../components/UploadImportBatchDialog.vue'
import { useImportBatchesQuery } from '../composables/useBulkImport'

const route = useRoute()
const router = useRouter()

const currentPage = computed(() => {
  const p = Number(route.query.page)
  return Number.isInteger(p) && p > 0 ? p : 1
})

const isUploadOpen = ref(false)
const notification = ref<{
  title: string
  body: string
  tone: 'success' | 'info' | 'warning'
} | null>(null)

const batchesQuery = useImportBatchesQuery(
  computed(() => ({
    page: currentPage.value,
    per_page: 15,
  })),
)

const batches = computed(() => batchesQuery.data.value?.data ?? [])
const meta = computed(() => batchesQuery.data.value?.meta)

const tableState = computed(() => {
  if (batchesQuery.isPending.value) return 'loading'
  if (batchesQuery.isError.value) return 'error'
  if (batches.value.length === 0) return 'empty'
  return 'success'
})

function handlePageChange(newPage: number) {
  void router.push({
    query: {
      ...route.query,
      page: newPage > 1 ? String(newPage) : undefined,
    },
  })
}

function onUploadSuccess(batch: ImportBatch, isExisting: boolean) {
  if (isExisting) {
    notification.value = {
      title: 'Draf Sebelumnya Ditemukan',
      body: `File ${batch.filename} sudah pernah diunggah. Draf sebelumnya dibuka kembali.`,
      tone: 'info',
    }
  } else {
    notification.value = {
      title: 'Berkas Berhasil Diunggah',
      body: `File ${batch.filename} berhasil diunggah dengan total ${batch.total_rows} baris data.`,
      tone: 'success',
    }
  }
  // Navigate to batch detail page
  void router.push({ name: 'import.detail', params: { id: batch.id } })
}

function getStatusBadgeTone(
  statusLabel: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (statusLabel) {
    case 'Selesai':
      return 'success'
    case 'Sedang dimasukkan':
      return 'info'
    case 'Sebagian perlu diperbaiki':
      return 'warning'
    case 'Perlu diperbaiki':
      return 'danger'
    case 'Draf':
    default:
      return 'neutral'
  }
}
</script>

<template>
  <main id="main-content" class="import-batches-page" tabindex="-1">
    <header class="import-batches-page__header">
      <div>
        <h1>Impor Data Pembanding</h1>
        <p>
          Unggah dan kelola kumpulan data pembanding dalam jumlah besar dari berkas spreadsheet
          Excel.
        </p>
      </div>

      <UiButton variant="primary" @click="isUploadOpen = true">
        <template #icon><i class="pi pi-upload" aria-hidden="true" /></template>
        Unggah Berkas Baru
      </UiButton>
    </header>

    <UiInlineAlert
      v-if="notification"
      :tone="notification.tone"
      :title="notification.title"
      dismissible
      class="mb-4"
      @dismiss="notification = null"
    >
      <p>{{ notification.body }}</p>
    </UiInlineAlert>

    <UiSurface class="import-batches-page__content">
      <DataTableShell
        title="Daftar Batch Impor Excel"
        :state="tableState"
        empty-title="Belum Ada Batch Impor"
        empty-description="Belum ada riwayat batch impor yang diunggah. Mulai dengan mengunggah berkas spreadsheet Excel."
        @retry="batchesQuery.refetch()"
      >
        <template #emptyActions>
          <UiButton variant="primary" @click="isUploadOpen = true">
            <template #icon><i class="pi pi-upload" aria-hidden="true" /></template>
            Unggah Berkas Pertama
          </UiButton>
        </template>

        <table class="import-batches-table">
          <thead>
            <tr>
              <th scope="col" class="w-16">ID</th>
              <th scope="col">Nama Berkas</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-right">Total Baris</th>
              <th scope="col" class="text-right">Siap</th>
              <th scope="col" class="text-right">Berhasil</th>
              <th scope="col" class="text-right">Gagal</th>
              <th scope="col">Waktu Unggah / Update</th>
              <th scope="col" class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="batch in batches" :key="batch.id">
              <td class="text-muted">#{{ batch.id }}</td>
              <td>
                <RouterLink
                  :to="{ name: 'import.detail', params: { id: batch.id } }"
                  class="import-batch-link"
                >
                  <strong>{{ batch.filename }}</strong>
                </RouterLink>
                <div class="text-xs text-muted">Oleh: {{ batch.owner }}</div>
              </td>
              <td>
                <UiStatusBadge :tone="getStatusBadgeTone(batch.status_label)">
                  {{ batch.status_label }}
                </UiStatusBadge>
              </td>
              <td class="text-right font-mono">{{ formatNumber(batch.total_rows) }}</td>
              <td class="text-right font-mono text-green-700 font-semibold">
                {{ formatNumber(batch.ready_rows) }}
              </td>
              <td class="text-right font-mono text-blue-700">
                {{ formatNumber(batch.imported_rows) }}
              </td>
              <td
                class="text-right font-mono"
                :class="{ 'text-red-600 font-semibold': batch.failed_rows > 0 }"
              >
                {{ formatNumber(batch.failed_rows) }}
              </td>
              <td class="text-sm">{{ formatDate(batch.updated_at) }}</td>
              <td class="text-right">
                <UiButton
                  variant="secondary"
                  size="sm"
                  @click="router.push({ name: 'import.detail', params: { id: batch.id } })"
                >
                  <template #icon><i class="pi pi-arrow-right" aria-hidden="true" /></template>
                  Buka Draf
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </DataTableShell>

      <div v-if="meta && meta.last_page > 1" class="import-batches-pagination">
        <UiPagination
          :page="meta.current_page"
          :per-page="meta.per_page"
          :total="meta.total"
          @update:page="handlePageChange"
        />
      </div>
    </UiSurface>

    <UploadImportBatchDialog
      :open="isUploadOpen"
      @update:open="isUploadOpen = $event"
      @success="onUploadSuccess"
    />
  </main>
</template>

<style scoped>
.import-batches-page {
  width: min(100% - 32px, 1200px);
  margin-inline: auto;
  padding-block: 28px 64px;
}

.import-batches-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}

.import-batches-page__header h1 {
  margin: 0 0 6px;
  font-size: 1.75rem;
  letter-spacing: -0.02em;
}

.import-batches-page__header p {
  margin: 0;
  color: var(--color-ink-muted);
}

.import-batches-page__content {
  padding: 20px;
}

.import-batches-table {
  width: 100%;
  border-collapse: collapse;
}

.import-batches-table th,
.import-batches-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border-soft);
  font-size: 0.875rem;
}

.import-batch-link {
  color: var(--color-ink-strong);
  text-decoration: none;
}

.import-batch-link:hover {
  color: var(--color-action-primary);
  text-decoration: underline;
}

.import-batches-pagination {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-soft);
}

.text-muted {
  color: var(--color-ink-muted);
}

.text-right {
  text-align: right;
}

.font-mono {
  font-variant-numeric: tabular-nums;
}

.w-16 {
  width: 64px;
}

@media (max-width: 767px) {
  .import-batches-page {
    width: min(100% - 24px, 1200px);
  }

  .import-batches-page__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
