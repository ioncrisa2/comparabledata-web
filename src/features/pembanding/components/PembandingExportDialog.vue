<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import { formatNumber } from '@/shared/formatters'

import type { ExportFormat, ExportMode, ExportProfileName } from '../api/export.api'
import {
  useDownloadExportMutation,
  useExportConfigurationQuery,
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

const configQuery = useExportConfigurationQuery()
const downloadMutation = useDownloadExportMutation()

const format = ref<ExportFormat>('excel')
const mode = ref<ExportMode>('summary')
const profile = ref<ExportProfileName>('ringkas')
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const isBusy = computed(() => downloadMutation.isPending.value)

const formatOptions = [
  { value: 'excel', label: 'Excel (.xlsx)', description: 'Spreadsheet terstruktur' },
  { value: 'pdf', label: 'PDF (.pdf)', description: 'Dokumen cetak ringkas atau detail' },
  { value: 'csv', label: 'CSV (.csv)', description: 'Format teks tabel standar' },
  { value: 'geojson', label: 'GeoJSON (.geojson)', description: 'Format pemetaan GIS' },
  { value: 'kml', label: 'KML (.kml)', description: 'Format Google Earth' },
] as const

const pdfModes = [
  { value: 'summary', label: 'Ringkasan Tabel', description: 'Daftar tabular baris demi baris, cocok untuk ringkasan cepat.' },
  { value: 'detail', label: 'Detail per Halaman', description: 'Setiap data ditampilkan per lembar lengkap dengan foto dan rincian.' },
] as const

const profileOptions: { value: ExportProfileName; label: string; description: string }[] = [
  { value: 'ringkas', label: 'Ringkas', description: 'Kolom utama lokasi, harga, dan karakteristik pokok' },
  { value: 'lengkap', label: 'Lengkap', description: 'Seluruh spesifikasi properti dan lingkungan' },
  { value: 'kontak', label: 'Kontak Narasumber', description: 'Fokus pada narasumber dan sumber data' },
  { value: 'geospasial', label: 'Geospasial', description: 'Alamat lengkap dan koordinat lintang/bujur' },
  { value: 'audit', label: 'Audit', description: 'Termasuk data pembuat dan stempel waktu' },
]

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      errorMessage.value = null
      successMessage.value = null
    }
  },
)

async function handleDownload() {
  errorMessage.value = null
  successMessage.value = null

  try {
    const result = await downloadMutation.mutateAsync({
      format: format.value,
      mode: format.value === 'pdf' ? mode.value : undefined,
      profile: profile.value,
      filters: props.filters,
      ids: props.selectedIds.length ? props.selectedIds : undefined,
      scope: props.selectedIds.length ? 'selected' : 'filtered',
    })

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

function handleClose() {
  if (isBusy.value) return
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Ekspor Data Pembanding"
    description="Pilih format dan profil data yang ingin diunduh ke komputer Anda."
    width="sm"
    :dismissable="!isBusy"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="pembanding-export-dialog">
      <!-- Status & Error notifications -->
      <UiInlineAlert
        v-if="errorMessage"
        class="pembanding-export-dialog__alert"
        tone="error"
        title="Ekspor gagal"
      >
        <p>{{ errorMessage }}</p>
      </UiInlineAlert>

      <UiInlineAlert
        v-if="successMessage"
        class="pembanding-export-dialog__alert"
        tone="success"
        title="Berhasil mengunduh"
      >
        <p>{{ successMessage }}</p>
      </UiInlineAlert>

      <!-- Scope / data count indicator -->
      <div class="pembanding-export-dialog__scope" aria-live="polite">
        <i class="pi pi-info-circle" aria-hidden="true" />
        <div>
          <span>Cakupan data:</span>
          <strong>{{ formatNumber(totalItems) }} data</strong>
          <small v-if="selectedIds.length"> (Berdasarkan data yang dipilih)</small>
          <small v-else> (Sesuai filter pencarian aktif)</small>
        </div>
      </div>

      <!-- Format selector dropdown -->
      <UiField label="Format File" required>
        <select
          id="export-format-select"
          v-model="format"
          class="pembanding-export-dialog__select"
          :disabled="isBusy"
          data-testid="export-format-select"
        >
          <option
            v-for="opt in formatOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        <p class="pembanding-export-dialog__hint">
          {{ formatOptions.find((opt) => opt.value === format)?.description }}
        </p>
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
          <option
            v-for="m in pdfModes"
            :key="m.value"
            :value="m.value"
          >
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
            v-for="prof in (configQuery.data.value?.configuration.profiles || profileOptions)"
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

    <template #footer>
      <div class="pembanding-export-dialog__footer">
        <UiButton
          variant="secondary"
          :disabled="isBusy"
          @click="handleClose"
        >
          Batal
        </UiButton>
        <UiButton
          variant="primary"
          :loading="isBusy"
          loading-label="Mengunduh..."
          @click="handleDownload"
        >
          <template #icon><i class="pi pi-download" aria-hidden="true" /></template>
          Unduh Sekarang
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

.pembanding-export-dialog__alert {
  margin-bottom: 2px;
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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
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

.pembanding-export-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
