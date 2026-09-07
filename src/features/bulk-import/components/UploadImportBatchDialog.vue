<script setup lang="ts">
import { ref } from 'vue'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import type { ImportBatch } from '../api/bulk-import.api'
import { useUploadImportBatchMutation } from '../composables/useBulkImport'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [batch: ImportBatch, isExisting: boolean]
}>()

const uploadMutation = useUploadImportBatchMutation()

const selectedFile = ref<File | null>(null)
const validationError = ref('')
const uploadError = ref('')
const isDragging = ref(false)

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']

function validateFile(file: File): boolean {
  validationError.value = ''
  uploadError.value = ''

  const name = file.name.toLowerCase()
  const isExtensionValid = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))

  if (!isExtensionValid) {
    validationError.value =
      'Format file tidak didukung. Harap pilih file spreadsheet Excel (.xlsx atau .xls).'
    return false
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
    validationError.value = `Ukuran file (${sizeMb} MB) melebihi batas maksimum 10 MB.`
    return false
  }

  return true
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (validateFile(file)) {
      selectedFile.value = file
    } else {
      selectedFile.value = null
    }
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (validateFile(file)) {
      selectedFile.value = file
    } else {
      selectedFile.value = null
    }
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function submitUpload() {
  if (!selectedFile.value) return
  uploadError.value = ''

  try {
    const result = await uploadMutation.mutateAsync(selectedFile.value)
    emit('success', result.batch, result.is_existing)
    emit('update:open', false)
    selectedFile.value = null
  } catch (err) {
    if (isApiError(err)) {
      uploadError.value = err.message
    } else {
      uploadError.value = 'Gagal mengunggah file. Silakan periksa koneksi dan coba lagi.'
    }
  }
}

function closeDialog() {
  if (uploadMutation.isPending.value) return
  selectedFile.value = null
  validationError.value = ''
  uploadError.value = ''
  uploadMutation.reset()
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Unggah Berkas Impor Excel"
    description="Impor banyak data pembanding sekaligus menggunakan template spreadsheet."
    width="md"
    :dismissable="!uploadMutation.isPending.value"
    @update:open="closeDialog"
  >
    <div class="upload-dialog">
      <!-- Drag & Drop Zone -->
      <div
        class="upload-dropzone"
        :class="{
          'upload-dropzone--active': isDragging,
          'upload-dropzone--has-file': Boolean(selectedFile),
        }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <input
          id="file-upload-input"
          type="file"
          accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          class="upload-dropzone__input"
          :disabled="uploadMutation.isPending.value"
          @change="handleFileInput"
        />

        <div v-if="!selectedFile" class="upload-dropzone__content">
          <i class="pi pi-file-excel upload-dropzone__icon" aria-hidden="true" />
          <label for="file-upload-input" class="upload-dropzone__label">
            <strong>Pilih berkas Excel</strong> atau tarik dan lepaskan di sini
          </label>
          <span class="upload-dropzone__hint">Format didukung: .xlsx, .xls (Maksimum 10 MB)</span>
        </div>

        <div v-else class="upload-dropzone__selected">
          <i
            class="pi pi-file-check upload-dropzone__icon upload-dropzone__icon--selected"
            aria-hidden="true"
          />
          <div class="upload-dropzone__info">
            <strong class="upload-dropzone__filename">{{ selectedFile.name }}</strong>
            <span class="upload-dropzone__filesize">{{ formatBytes(selectedFile.size) }}</span>
          </div>
          <button
            type="button"
            class="upload-dropzone__remove"
            :disabled="uploadMutation.isPending.value"
            aria-label="Ganti berkas"
            @click="selectedFile = null"
          >
            <i class="pi pi-times" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Validation error -->
      <UiInlineAlert v-if="validationError" tone="warning" title="Berkas Tidak Memenuhi Syarat">
        <p>{{ validationError }}</p>
      </UiInlineAlert>

      <!-- Server error -->
      <UiInlineAlert v-if="uploadError" tone="error" title="Gagal Mengunggah Berkas">
        <p>{{ uploadError }}</p>
      </UiInlineAlert>

      <!-- Upload Progress Indicator -->
      <div v-if="uploadMutation.isPending.value" class="upload-progress">
        <div class="upload-progress__bar">
          <div class="upload-progress__indeterminate" />
        </div>
        <span class="upload-progress__text">
          Sedang membaca dan memvalidasi struktur berkas Excel...
        </span>
      </div>
    </div>

    <template #footer>
      <UiButton variant="secondary" :disabled="uploadMutation.isPending.value" @click="closeDialog">
        Batal
      </UiButton>
      <UiButton
        variant="primary"
        :disabled="!selectedFile || uploadMutation.isPending.value"
        :loading="uploadMutation.isPending.value"
        @click="submitUpload"
      >
        <template #icon><i class="pi pi-upload" aria-hidden="true" /></template>
        Unggah & Buka Draf
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.upload-dialog {
  display: grid;
  gap: 16px;
}

.upload-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-card, 12px);
  background: var(--color-surface-inset);
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
  text-align: center;
}

.upload-dropzone:hover {
  border-color: var(--color-action-primary);
  background: var(--color-brand-amber-soft, #fef3c7);
}

.upload-dropzone--active {
  border-color: var(--color-action-primary);
  background: var(--color-brand-amber-soft, #fef3c7);
  transform: scale(1.01);
}

.upload-dropzone--has-file {
  border-style: solid;
  border-color: var(--color-border-soft);
  background: var(--color-surface);
  cursor: default;
}

.upload-dropzone__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.upload-dropzone--has-file .upload-dropzone__input {
  display: none;
}

.upload-dropzone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-dropzone__icon {
  font-size: 2.25rem;
  color: var(--color-action-primary, #b45309);
}

.upload-dropzone__icon--selected {
  color: var(--color-success, #15803d);
}

.upload-dropzone__label {
  font-size: 0.9375rem;
  color: var(--color-ink-strong);
  cursor: pointer;
}

.upload-dropzone__hint {
  font-size: 0.75rem;
  color: var(--color-ink-muted);
}

.upload-dropzone__selected {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 8px 12px;
}

.upload-dropzone__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  text-align: left;
}

.upload-dropzone__filename {
  font-size: 0.875rem;
  color: var(--color-ink-strong);
  word-break: break-all;
}

.upload-dropzone__filesize {
  font-size: 0.75rem;
  color: var(--color-ink-muted);
}

.upload-dropzone__remove {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-ink-muted);
  padding: 6px;
  border-radius: var(--radius-control);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-dropzone__remove:hover {
  background: var(--color-surface-inset);
  color: var(--color-danger, #dc2626);
}

.upload-progress {
  display: grid;
  gap: 6px;
}

.upload-progress__bar {
  width: 100%;
  height: 6px;
  background: var(--color-border-soft);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.upload-progress__indeterminate {
  width: 40%;
  height: 100%;
  background: var(--color-action-primary);
  border-radius: 999px;
  position: absolute;
  animation: indeterminate 1.5s infinite ease-in-out;
}

@keyframes indeterminate {
  0% {
    left: -40%;
  }
  50% {
    left: 40%;
    width: 60%;
  }
  100% {
    left: 100%;
    width: 40%;
  }
}

.upload-progress__text {
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
  text-align: center;
}
</style>
