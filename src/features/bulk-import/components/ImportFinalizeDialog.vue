<script setup lang="ts">
import { computed, ref } from 'vue'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import { formatNumber } from '@/shared/formatters'

import type { ImportBatch } from '../api/bulk-import.api'
import { useFinalizeImportBatchMutation } from '../composables/useBulkImport'

const props = defineProps<{
  open: boolean
  batch: ImportBatch
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [batch: ImportBatch]
}>()

const finalizeMutation = useFinalizeImportBatchMutation()
const confirmed = ref(false)
const errorMessage = ref('')

const readyToImportCount = computed(() => props.batch.ready_rows ?? 0)
const unreadyCount = computed(() => {
  const total = props.batch.total_rows ?? 0
  const ready = props.batch.ready_rows ?? 0
  return Math.max(0, total - ready)
})

async function submitFinalize() {
  errorMessage.value = ''
  if (!confirmed.value) return

  try {
    const res = await finalizeMutation.mutateAsync({
      batchId: props.batch.id,
      confirmed: true,
    })
    emit('success', res.batch)
    emit('update:open', false)
    confirmed.value = false
  } catch (err) {
    if (isApiError(err)) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Gagal memfinalisasi batch impor. Silakan coba kembali.'
    }
  }
}

function close() {
  if (finalizeMutation.isPending.value) return
  confirmed.value = false
  errorMessage.value = ''
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Finalisasi Batch Impor Data"
    description="Proses seluruh data yang telah berstatus siap ke dalam tabel data pembanding utama."
    width="md"
    :dismissable="!finalizeMutation.isPending.value"
    @update:open="close"
  >
    <div class="finalize-dialog">
      <!-- Target Summary -->
      <div class="finalize-dialog__stats">
        <div class="finalize-stat-card finalize-stat-card--success">
          <span class="finalize-stat-card__label">Data Siap Dimasukkan</span>
          <strong class="finalize-stat-card__value">{{ formatNumber(readyToImportCount) }}</strong>
          <small class="finalize-stat-card__hint">Akan menjadi listing aktif</small>
        </div>
        <div v-if="unreadyCount > 0" class="finalize-stat-card finalize-stat-card--warning">
          <span class="finalize-stat-card__label">Belum Lengkap / Gagal</span>
          <strong class="finalize-stat-card__value">{{ formatNumber(unreadyCount) }}</strong>
          <small class="finalize-stat-card__hint">Akan dilewati</small>
        </div>
      </div>

      <UiInlineAlert v-if="unreadyCount > 0" tone="warning" title="Perhatian Data Dilewati">
        <p>
          Terdapat {{ unreadyCount }} baris data yang belum lengkap, gagal, atau tidak dipilih.
          Baris-baris tersebut tidak akan dimasukkan ke tabel data pembanding utama.
        </p>
      </UiInlineAlert>

      <UiInlineAlert v-else tone="info" title="Seluruh Data Siap">
        <p>
          Semua {{ readyToImportCount }} baris data pada berkas ini telah tervalidasi lengkap dan
          siap dimigrasikan.
        </p>
      </UiInlineAlert>

      <!-- Mandatory Acknowledgement Checkbox -->
      <label class="finalize-confirm-box">
        <input
          v-model="confirmed"
          type="checkbox"
          data-testid="finalize-confirm-checkbox"
          :disabled="finalizeMutation.isPending.value || readyToImportCount === 0"
        />
        <span>
          Saya memahami bahwa data yang telah difinalisasi akan langsung dimasukkan ke database data
          pembanding dan proses ini bersifat idempoten serta tidak dapat dibatalkan.
        </span>
      </label>

      <UiInlineAlert v-if="errorMessage" tone="error" title="Gagal Memproses Finalisasi">
        <p>{{ errorMessage }}</p>
      </UiInlineAlert>
    </div>

    <template #footer>
      <UiButton variant="secondary" :disabled="finalizeMutation.isPending.value" @click="close">
        Batal
      </UiButton>
      <UiButton
        variant="primary"
        data-testid="confirm-finalize-btn"
        :disabled="!confirmed || readyToImportCount === 0 || finalizeMutation.isPending.value"
        :loading="finalizeMutation.isPending.value"
        @click="submitFinalize"
      >
        <template #icon><i class="pi pi-check-circle" aria-hidden="true" /></template>
        Mulai Finalisasi ({{ formatNumber(readyToImportCount) }} Data)
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.finalize-dialog {
  display: grid;
  gap: 16px;
}

.finalize-dialog__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.finalize-stat-card {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: var(--radius-control, 8px);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface-inset);
}

.finalize-stat-card--success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.finalize-stat-card--warning {
  background: #fefce8;
  border-color: #fef08a;
  color: #854d0e;
}

.finalize-stat-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.finalize-stat-card__value {
  font-size: 1.75rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.finalize-stat-card__hint {
  font-size: 0.75rem;
  opacity: 0.8;
}

.finalize-confirm-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: var(--color-surface-inset);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--color-ink-strong);
  cursor: pointer;
}

.finalize-confirm-box input[type='checkbox'] {
  margin-top: 3px;
  accent-color: var(--color-action-primary);
}
</style>
