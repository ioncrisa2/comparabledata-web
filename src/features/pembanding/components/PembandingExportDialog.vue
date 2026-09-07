<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import { formatDate, formatNumber } from '@/shared/formatters'

import type {
  DownloadExportOptions,
  ExportFormat,
  ExportMode,
  ExportPreviewData,
  ExportProfileName,
  ExportRunItem,
} from '../api/export.api'
import {
  useCreateExportRunMutation,
  useDownloadExportMutation,
  useDownloadExportRunMutation,
  useExportConfigurationQuery,
  useExportRunsQuery,
  usePreviewExportMutation,
  useRetryExportRunMutation,
} from '../composables/usePembandingExport'
import type { PembandingListFilters } from '../types/filters'

const props = withDefaults(
  defineProps<{
    open: boolean
    totalItems?: number
    filters?: Partial<PembandingListFilters>
    selectedIds?: (string | number)[]
  }>(),
  {
    totalItems: 0,
    filters: undefined,
    selectedIds: () => [],
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [filename: string]
}>()

// Active tab: 'form' (Unduh langsung / buat tugas) or 'runs' (Riwayat tugas ekspor)
const activeTab = ref<'form' | 'runs'>('form')

const configQuery = useExportConfigurationQuery()
const downloadMutation = useDownloadExportMutation()
const previewMutation = usePreviewExportMutation()
const createRunMutation = useCreateExportRunMutation()
const retryRunMutation = useRetryExportRunMutation()
const downloadRunMutation = useDownloadExportRunMutation()
const runsQuery = useExportRunsQuery()

const format = ref<ExportFormat>('excel')
const mode = ref<ExportMode>('summary')
const profile = ref<ExportProfileName>('ringkas')
const dataset = ref<'all' | 'complete' | 'issues'>('all')

const previewData = ref<ExportPreviewData | null>(null)
const isPreviewLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const isBusy = computed(
  () =>
    downloadMutation.isPending.value ||
    createRunMutation.isPending.value ||
    retryRunMutation.isPending.value ||
    downloadRunMutation.isPending.value,
)

const activeRunsCount = computed(() => {
  const list = runsQuery.data.value?.data ?? []
  return list.filter((r) => r.status === 'queued' || r.status === 'processing').length
})

const formatOptions = [
  { value: 'excel', label: 'Excel (.xlsx)', description: 'Spreadsheet terstruktur' },
  { value: 'pdf', label: 'PDF (.pdf)', description: 'Dokumen cetak ringkas atau detail' },
  { value: 'csv', label: 'CSV (.csv)', description: 'Format teks tabel standar' },
  { value: 'geojson', label: 'GeoJSON (.geojson)', description: 'Format pemetaan GIS' },
  { value: 'kml', label: 'KML (.kml)', description: 'Format Google Earth' },
] as const

const pdfModes = [
  {
    value: 'summary',
    label: 'Ringkasan Tabel',
    description: 'Daftar tabular baris demi baris, cocok untuk ringkasan cepat.',
  },
  {
    value: 'detail',
    label: 'Detail per Halaman',
    description: 'Setiap data ditampilkan per lembar lengkap dengan foto dan rincian.',
  },
] as const

const profileOptions: { value: ExportProfileName; label: string; description: string }[] = [
  {
    value: 'ringkas',
    label: 'Ringkas',
    description: 'Kolom utama lokasi, harga, dan karakteristik pokok',
  },
  {
    value: 'lengkap',
    label: 'Lengkap',
    description: 'Seluruh spesifikasi properti dan lingkungan',
  },
  {
    value: 'kontak',
    label: 'Kontak Narasumber',
    description: 'Fokus pada narasumber dan sumber data',
  },
  {
    value: 'geospasial',
    label: 'Geospasial',
    description: 'Alamat lengkap dan koordinat lintang/bujur',
  },
  { value: 'audit', label: 'Audit', description: 'Termasuk data pembuat dan stempel waktu' },
]

const datasetOptions = [
  { value: 'all', label: 'Semua Status Data' },
  { value: 'complete', label: 'Hanya Data Lengkap' },
  { value: 'issues', label: 'Data Bermasalah / Kurang Lengkap' },
] as const

function buildOptions(): DownloadExportOptions {
  return {
    format: format.value,
    mode: format.value === 'pdf' ? mode.value : undefined,
    profile: profile.value,
    dataset: dataset.value,
    filters: props.filters,
    ids: props.selectedIds.length ? props.selectedIds : undefined,
    scope: props.selectedIds.length ? 'selected' : 'filtered',
  }
}

async function runPreview() {
  if (!props.open) return
  isPreviewLoading.value = true
  try {
    const res = await previewMutation.mutateAsync(buildOptions())
    previewData.value = res
  } catch {
    // If preview fails, keep null so fallback to normal download button
    previewData.value = null
  } finally {
    isPreviewLoading.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      errorMessage.value = null
      successMessage.value = null
      activeTab.value = 'form'
      void runPreview()
    }
  },
  { immediate: true },
)

watch([format, mode, profile, dataset], () => {
  if (props.open && activeTab.value === 'form') {
    void runPreview()
  }
})

const isQueuedRequired = computed(() => {
  if (previewData.value?.queued) return true
  // Check against static config limits if preview didn't flag it
  const limits = configQuery.data.value?.limits
  if (limits) {
    if (format.value === 'excel' && props.totalItems > limits.excel) return true
    if (format.value === 'csv' && props.totalItems > limits.csv) return true
    if (format.value === 'geojson' && props.totalItems > limits.geojson) return true
    if (format.value === 'kml' && props.totalItems > limits.kml) return true
    if (format.value === 'pdf') {
      const limit = mode.value === 'detail' ? limits.pdf_detail : limits.pdf_summary
      if (props.totalItems > limit) return true
    }
  }
  return false
})

async function handleAction() {
  errorMessage.value = null
  successMessage.value = null

  if (isQueuedRequired.value) {
    // Background async run
    try {
      const run = await createRunMutation.mutateAsync(buildOptions())
      successMessage.value = `Tugas ekspor #${run.id} berhasil dijadwalkan di latar belakang.`
      activeTab.value = 'runs'
      void runsQuery.refetch()
    } catch (err) {
      if (isApiError(err)) {
        errorMessage.value = err.message
      } else {
        errorMessage.value = 'Gagal mendaftarkan tugas ekspor ke antrean.'
      }
    }
  } else {
    // Synchronous download
    try {
      const result = await downloadMutation.mutateAsync(buildOptions())
      successMessage.value = `File "${result.filename}" berhasil diunduh.`
      emit('success', result.filename)

      setTimeout(() => {
        if (props.open && successMessage.value) {
          emit('update:open', false)
        }
      }, 1800)
    } catch (err) {
      if (isApiError(err)) {
        errorMessage.value = err.message
      } else {
        errorMessage.value = 'Gagal mengunduh file ekspor. Pastikan jaringan stabil dan coba lagi.'
      }
    }
  }
}

async function handleDownloadRun(run: ExportRunItem) {
  errorMessage.value = null
  try {
    const res = await downloadRunMutation.mutateAsync({
      runId: run.id,
      fallbackFormat: (run.format as ExportFormat) || 'excel',
    })
    successMessage.value = `Berkas "${res.filename}" berhasil diunduh.`
  } catch (err) {
    if (isApiError(err)) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Gagal mengunduh file hasil tugas ekspor.'
    }
  }
}

async function handleRetryRun(run: ExportRunItem) {
  errorMessage.value = null
  try {
    await retryRunMutation.mutateAsync({ runId: run.id })
    successMessage.value = `Tugas ekspor #${run.id} dijadwalkan ulang.`
    void runsQuery.refetch()
  } catch (err) {
    if (isApiError(err)) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Gagal menjadwalkan ulang tugas ekspor.'
    }
  }
}

function getRunStatusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'queued':
    case 'processing':
      return 'info'
    case 'failed':
      return 'danger'
    case 'expired':
    default:
      return 'neutral'
  }
}

function getRunStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Selesai'
    case 'processing':
      return 'Sedang Diproses'
    case 'queued':
      return 'Dalam Antrean'
    case 'failed':
      return 'Gagal'
    case 'expired':
      return 'Kedaluwarsa'
    default:
      return status
  }
}

function handleClose() {
  if (isBusy.value) return
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Ekspor Data Pembanding"
    description="Unduh langsung berkas data atau pantau tugas ekspor latar belakang."
    width="md"
    :dismissable="!isBusy"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="pembanding-export-dialog">
      <!-- Tabs header -->
      <div class="pembanding-export-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="export-tab-btn"
          :class="{ 'export-tab-btn--active': activeTab === 'form' }"
          :aria-selected="activeTab === 'form'"
          @click="activeTab = 'form'"
        >
          <i class="pi pi-file-export" aria-hidden="true" />
          Ekspor Baru
        </button>
        <button
          type="button"
          role="tab"
          class="export-tab-btn"
          :class="{ 'export-tab-btn--active': activeTab === 'runs' }"
          :aria-selected="activeTab === 'runs'"
          @click="activeTab = 'runs'"
        >
          <i class="pi pi-history" aria-hidden="true" />
          Riwayat Tugas Ekspor
          <span v-if="activeRunsCount > 0" class="export-tab-badge">
            {{ activeRunsCount }}
          </span>
        </button>
      </div>

      <!-- Feedback notifications -->
      <UiInlineAlert
        v-if="errorMessage"
        class="pembanding-export-dialog__alert"
        tone="error"
        title="Terjadi Kesalahan"
        dismissible
        @dismiss="errorMessage = null"
      >
        <p>{{ errorMessage }}</p>
      </UiInlineAlert>

      <UiInlineAlert
        v-if="successMessage"
        class="pembanding-export-dialog__alert"
        tone="success"
        title="Berhasil"
        dismissible
        @dismiss="successMessage = null"
      >
        <p>{{ successMessage }}</p>
      </UiInlineAlert>

      <!-- TAB 1: FORM EKSPOR -->
      <div v-if="activeTab === 'form'" class="export-form-section">
        <!-- Scope indicator -->
        <div class="pembanding-export-dialog__scope" aria-live="polite">
          <i class="pi pi-info-circle" aria-hidden="true" />
          <div>
            <span>Cakupan data:</span>
            <strong>{{ formatNumber(totalItems) }} data</strong>
            <small v-if="selectedIds.length"> (Berdasarkan data yang dipilih pada tabel)</small>
            <small v-else> (Sesuai filter pencarian aktif)</small>
          </div>
        </div>

        <!-- Limit Warning Alert when Queued Required -->
        <UiInlineAlert
          v-if="isQueuedRequired"
          class="pembanding-export-dialog__alert"
          tone="warning"
          title="Dialihkan ke Proses Latar Belakang"
        >
          <p>
            Jumlah data ({{
              formatNumber(previewData?.count ? Number(previewData.count) : totalItems)
            }}
            baris) melebihi batas unduh langsung ({{
              formatNumber(previewData?.sync_limit ?? 5000)
            }}
            baris). Tugas akan diproses oleh antrean worker latar belakang.
          </p>
        </UiInlineAlert>

        <div class="export-form-grid">
          <!-- Format selector dropdown -->
          <UiField label="Format File" required>
            <select
              id="export-format-select"
              v-model="format"
              class="pembanding-export-dialog__select"
              :disabled="isBusy"
              data-testid="export-format-select"
            >
              <option v-for="opt in formatOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <p class="pembanding-export-dialog__hint">
              {{ formatOptions.find((opt) => opt.value === format)?.description }}
            </p>
          </UiField>

          <!-- Dataset status selector -->
          <UiField label="Kondisi Kelengkapan Data">
            <select
              id="export-dataset-select"
              v-model="dataset"
              class="pembanding-export-dialog__select"
              :disabled="isBusy"
              data-testid="export-dataset-select"
            >
              <option v-for="d in datasetOptions" :key="d.value" :value="d.value">
                {{ d.label }}
              </option>
            </select>
          </UiField>

          <!-- PDF Mode sub-option (jika format PDF dipilih) -->
          <UiField v-if="format === 'pdf'" label="Tampilan Dokumen PDF">
            <select
              id="export-pdf-mode-select"
              v-model="mode"
              class="pembanding-export-dialog__select"
              :disabled="isBusy"
              data-testid="export-pdf-mode-select"
            >
              <option v-for="m in pdfModes" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
            <p class="pembanding-export-dialog__hint">
              {{ pdfModes.find((m) => m.value === mode)?.description }}
            </p>
          </UiField>

          <!-- Profile selector dropdown -->
          <UiField label="Profil Data (Kolom yang Disertakan)">
            <select
              id="export-profile-select"
              v-model="profile"
              class="pembanding-export-dialog__select"
              :disabled="isBusy"
              data-testid="export-profile-select"
            >
              <option
                v-for="prof in configQuery.data.value?.configuration.profiles || profileOptions"
                :key="prof.value"
                :value="prof.value"
              >
                {{ prof.label }}
              </option>
            </select>
            <p class="pembanding-export-dialog__hint">
              {{ profileOptions.find((p) => p.value === profile)?.description }}
            </p>
          </UiField>
        </div>

        <!-- Preview Card -->
        <div v-if="previewData" class="export-preview-card" data-testid="export-preview-card">
          <div class="preview-item">
            <span class="preview-label">Estimasi Baris:</span>
            <strong class="preview-val">{{ formatNumber(Number(previewData.count)) }}</strong>
          </div>
          <div class="preview-item">
            <span class="preview-label">Batas Sinkron:</span>
            <span class="preview-val">{{ formatNumber(previewData.sync_limit) }}</span>
          </div>
          <div v-if="Number(previewData.without_coordinates) > 0" class="preview-item">
            <span class="preview-label">Tanpa Koordinat:</span>
            <span class="preview-val text-amber-600">{{
              formatNumber(Number(previewData.without_coordinates))
            }}</span>
          </div>
        </div>
      </div>

      <!-- TAB 2: RIWAYAT TUGAS EKSPOR -->
      <div v-else class="export-runs-section" data-testid="export-runs-section">
        <div v-if="runsQuery.isPending.value" class="export-runs-loading">
          <i class="pi pi-spin pi-spinner" aria-hidden="true" />
          <p>Memuat riwayat tugas ekspor...</p>
        </div>

        <div
          v-else-if="!runsQuery.data.value?.data || runsQuery.data.value.data.length === 0"
          class="export-runs-empty"
        >
          <i class="pi pi-inbox" aria-hidden="true" />
          <p>Belum ada riwayat tugas ekspor.</p>
        </div>

        <div v-else class="export-runs-list">
          <div v-for="run in runsQuery.data.value.data" :key="run.id" class="export-run-card">
            <div class="run-card-header">
              <div class="run-card-title">
                <strong>Ekspor #{{ run.id }} ({{ run.format.toUpperCase() }})</strong>
                <span class="text-xs text-muted"
                  >Profil: {{ run.profile }} •
                  {{ run.scope === 'selected' ? 'Data Pilihan' : 'Hasil Filter' }}</span
                >
              </div>
              <UiStatusBadge :tone="getRunStatusTone(run.status)">
                {{ getRunStatusLabel(run.status) }}
              </UiStatusBadge>
            </div>

            <!-- Progress bar for processing or queued -->
            <div
              v-if="run.status === 'processing' || run.status === 'queued'"
              class="run-progress-wrap"
            >
              <div class="run-progress-text">
                <span class="text-xs">
                  {{
                    run.status === 'queued'
                      ? 'Menunggu antrean worker...'
                      : `Memproses ${formatNumber(run.processed_records)} dari ${formatNumber(run.total_records)} baris`
                  }}
                </span>
                <span class="text-xs font-semibold">
                  {{
                    run.total_records > 0
                      ? Math.round((run.processed_records / run.total_records) * 100)
                      : 0
                  }}%
                </span>
              </div>
              <div class="run-progress-bar">
                <div
                  class="run-progress-fill"
                  :style="{
                    width: `${run.total_records > 0 ? Math.min(100, Math.round((run.processed_records / run.total_records) * 100)) : 10}%`,
                  }"
                />
              </div>
            </div>

            <!-- Meta / Timestamps -->
            <div class="run-card-meta">
              <span>Dibuat: {{ formatDate(run.created_at) }}</span>
              <span v-if="run.expires_at">• Kedaluwarsa: {{ formatDate(run.expires_at) }}</span>
            </div>

            <!-- Error message if failed -->
            <p v-if="run.error" class="run-card-error">
              <i class="pi pi-exclamation-triangle" aria-hidden="true" />
              {{ run.error }}
            </p>

            <!-- Actions -->
            <div class="run-card-actions">
              <UiButton
                v-if="run.status === 'completed'"
                size="sm"
                variant="primary"
                :loading="downloadRunMutation.isPending.value"
                @click="handleDownloadRun(run)"
              >
                <template #icon><i class="pi pi-download" aria-hidden="true" /></template>
                Unduh Berkas
              </UiButton>

              <UiButton
                v-if="run.status === 'failed'"
                size="sm"
                variant="secondary"
                :loading="retryRunMutation.isPending.value"
                @click="handleRetryRun(run)"
              >
                <template #icon><i class="pi pi-refresh" aria-hidden="true" /></template>
                Coba Ulang
              </UiButton>

              <span v-if="run.status === 'expired'" class="text-xs text-muted">
                Berkas telah kedaluwarsa dan dihapus otomatis dari server.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="pembanding-export-dialog__footer">
        <UiButton variant="secondary" :disabled="isBusy" @click="handleClose"> Tutup </UiButton>

        <UiButton
          v-if="activeTab === 'form'"
          variant="primary"
          :loading="isBusy"
          :loading-label="isQueuedRequired ? 'Mendaftarkan...' : 'Mengunduh...'"
          @click="handleAction"
        >
          <template #icon>
            <i :class="isQueuedRequired ? 'pi pi-clock' : 'pi pi-download'" aria-hidden="true" />
          </template>
          {{ isQueuedRequired ? 'Jalankan Ekspor Latar Belakang' : 'Unduh Sekarang' }}
        </UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.pembanding-export-dialog {
  display: grid;
  gap: 16px;
}

.pembanding-export-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 8px;
}

.export-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-control);
  cursor: pointer;
  transition: all 0.15s ease;
}

.export-tab-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-ink-strong);
}

.export-tab-btn--active {
  background: var(--color-surface-inset);
  color: var(--color-action-primary);
}

.export-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 9999px;
  background: var(--color-action-primary);
  color: #fff;
}

.pembanding-export-dialog__alert {
  margin-bottom: 2px;
}

.export-form-section {
  display: grid;
  gap: 16px;
}

.export-form-grid {
  display: grid;
  gap: 12px;
}

.pembanding-export-dialog__scope {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-control);
  background: var(--color-surface-inset);
  border: 1px solid var(--color-border-soft);
  color: var(--color-ink-body);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.pembanding-export-dialog__scope i {
  color: var(--color-action-primary);
  font-size: 1.125rem;
  flex-shrink: 0;
}

.pembanding-export-dialog__scope strong {
  margin-inline: 4px;
  color: var(--color-ink-strong);
  font-weight: 700;
}

.pembanding-export-dialog__scope small {
  color: var(--color-ink-muted);
}

.pembanding-export-dialog__select {
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink-strong);
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.pembanding-export-dialog__select:focus {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.pembanding-export-dialog__hint {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--color-ink-muted);
  line-height: 1.35;
}

.export-preview-card {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 14px;
  background: var(--color-surface-inset);
  border-radius: var(--radius-control);
  border: 1px dashed var(--color-border-strong);
  font-size: 0.8125rem;
}

.preview-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.preview-label {
  color: var(--color-ink-muted);
}

.preview-val {
  font-weight: 600;
  color: var(--color-ink-strong);
}

.export-runs-section {
  display: grid;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.export-runs-loading,
.export-runs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--color-ink-muted);
  gap: 8px;
  font-size: 0.875rem;
}

.export-runs-list {
  display: grid;
  gap: 12px;
}

.export-run-card {
  padding: 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  display: grid;
  gap: 8px;
}

.run-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.run-card-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.run-progress-wrap {
  display: grid;
  gap: 4px;
}

.run-progress-text {
  display: flex;
  justify-content: space-between;
  color: var(--color-ink-muted);
}

.run-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--color-surface-inset);
  border-radius: 9999px;
  overflow: hidden;
}

.run-progress-fill {
  height: 100%;
  background: var(--color-action-primary);
  transition: width 0.3s ease;
}

.run-card-meta {
  font-size: 0.75rem;
  color: var(--color-ink-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.run-card-error {
  font-size: 0.75rem;
  color: var(--color-feedback-error);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.run-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.pembanding-export-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
