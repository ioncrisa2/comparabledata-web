<script setup lang="ts">
import { ref } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'

import { useImportBackupMutation } from '../composables/useBackup'

const props = defineProps<{
  open: boolean
  maxPackageMb?: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [message: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const errorMessage = ref('')
const importMutation = useImportBackupMutation()

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    const maxMb = props.maxPackageMb || 1024
    if (file.size > maxMb * 1024 * 1024) {
      errorMessage.value = `Ukuran berkas melebihi batas maksimal (${maxMb} MB).`
      selectedFile.value = null
      return
    }

    selectedFile.value = file
    errorMessage.value = ''
  }
}

async function handleImport() {
  if (!selectedFile.value) {
    errorMessage.value = 'Silakan pilih berkas paket cadangan terlebih dahulu.'
    return
  }

  errorMessage.value = ''
  try {
    const res = await importMutation.mutateAsync(selectedFile.value)
    selectedFile.value = null
    emit('update:open', false)
    emit('success', res.message)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      errorMessage.value = String(err.message)
    } else {
      errorMessage.value = 'Gagal mengimpor berkas cadangan.'
    }
  }
}
</script>

<template>
  <UiDialog
    :open="props.open"
    title="Impor Paket Cadangan"
    description="Unggah berkas paket cadangan (.tar.gz / .zip) untuk diverifikasi dan ditambahkan ke katalog."
    width="md"
    @update:open="emit('update:open', $event)"
  >
    <form class="import-backup-form" @submit.prevent="handleImport">
      <div v-if="errorMessage" class="form-error-alert" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </div>

      <div class="file-drop-area">
        <i class="pi pi-upload drop-icon" aria-hidden="true" />
        <label class="drop-label">
          <span>Pilih Berkas Cadangan</span>
          <input
            ref="fileInput"
            type="file"
            accept=".gz,.tar.gz,.tgz,.zip"
            class="sr-only"
            data-testid="backup-file-input"
            @change="handleFileSelect"
          />
        </label>
        <p class="drop-hint">
          Format berkas: .tar.gz, .tgz, .zip (Maksimal {{ props.maxPackageMb || 1024 }} MB).
        </p>

        <div v-if="selectedFile" class="selected-file-info" data-testid="selected-file-info">
          <i class="pi pi-file mr-2 text-primary" aria-hidden="true" />
          <span class="font-medium">{{ selectedFile.name }}</span>
          <span class="text-xs text-muted ml-2">
            ({{ (selectedFile.size / (1024 * 1024)).toFixed(2) }} MB)
          </span>
        </div>
      </div>

      <div class="dialog-actions mt-6">
        <UiButton
          type="button"
          variant="secondary"
          :disabled="importMutation.isPending.value"
          @click="emit('update:open', false)"
        >
          Batal
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          :disabled="!selectedFile"
          :loading="importMutation.isPending.value"
          loading-label="Mengunggah & Memverifikasi..."
          data-testid="submit-import-backup-btn"
        >
          <template #icon><i class="pi pi-upload" aria-hidden="true" /></template>
          Unggah & Verifikasi
        </UiButton>
      </div>
    </form>
  </UiDialog>
</template>

<style scoped>
.import-backup-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--danger-subtle, #fef2f2);
  color: var(--danger-text, #991b1b);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.file-drop-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  border: 2px dashed var(--border-subtle, #cbd5e1);
  border-radius: 0.75rem;
  background: var(--surface-muted, #f8fafc);
  text-align: center;
}

.drop-icon {
  font-size: 2.25rem;
  color: var(--text-muted, #94a3b8);
  margin-bottom: 0.75rem;
}

.drop-label {
  display: inline-flex;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.375rem;
  background: var(--primary-solid, #2563eb);
  color: #ffffff;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.drop-label:hover {
  opacity: 0.9;
}

.drop-hint {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
  margin: 0.5rem 0 0 0;
}

.selected-file-info {
  display: flex;
  align-items: center;
  margin-top: 1rem;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
