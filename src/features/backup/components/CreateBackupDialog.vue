<script setup lang="ts">
import { ref } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'

import type { BackupType } from '../api/backup.api'
import { useCreateBackupMutation } from '../composables/useBackup'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [message: string]
}>()

const selectedType = ref<BackupType>('database')
const createMutation = useCreateBackupMutation()
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  try {
    const res = await createMutation.mutateAsync(selectedType.value)
    emit('update:open', false)
    emit('success', res.message)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      errorMessage.value = String(err.message)
    } else {
      errorMessage.value = 'Terjadi kesalahan saat memicu pembuatan cadangan.'
    }
  }
}
</script>

<template>
  <UiDialog
    :open="props.open"
    title="Buat Berkas Cadangan Baru"
    description="Pilih cakupan data yang ingin diarsipkan menjadi paket cadangan server."
    width="md"
    @update:open="emit('update:open', $event)"
  >
    <form class="create-backup-form" @submit.prevent="handleSubmit">
      <div v-if="errorMessage" class="form-error-alert" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </div>

      <div class="backup-types-list">
        <!-- Database -->
        <label
          class="backup-type-card"
          :class="{ 'backup-type-card--selected': selectedType === 'database' }"
        >
          <input
            v-model="selectedType"
            type="radio"
            name="backup_type"
            value="database"
            data-testid="backup-type-database"
          />
          <div class="backup-type-card__icon">
            <i class="pi pi-database text-primary" aria-hidden="true" />
          </div>
          <div class="backup-type-card__info">
            <strong>Basis Data (Database)</strong>
            <p>
              Mencakup seluruh tabel, data pembanding, riwayat penilaian, pengguna, dan hak akses.
            </p>
          </div>
        </label>

        <!-- Uploads -->
        <label
          class="backup-type-card"
          :class="{ 'backup-type-card--selected': selectedType === 'uploads' }"
        >
          <input
            v-model="selectedType"
            type="radio"
            name="backup_type"
            value="uploads"
            data-testid="backup-type-uploads"
          />
          <div class="backup-type-card__icon">
            <i class="pi pi-images text-emerald-600" aria-hidden="true" />
          </div>
          <div class="backup-type-card__info">
            <strong>Berkas Unggahan (Uploads)</strong>
            <p>
              Mencakup seluruh foto properti pembanding dan lampiran dokumen yang tersimpan di
              storage.
            </p>
          </div>
        </label>

        <!-- Full -->
        <label
          class="backup-type-card"
          :class="{ 'backup-type-card--selected': selectedType === 'full' }"
        >
          <input
            v-model="selectedType"
            type="radio"
            name="backup_type"
            value="full"
            data-testid="backup-type-full"
          />
          <div class="backup-type-card__icon">
            <i class="pi pi-server text-purple-600" aria-hidden="true" />
          </div>
          <div class="backup-type-card__info">
            <strong>Cadangan Lengkap (Full System)</strong>
            <p>
              Paket gabungan seluruh basis data dan berkas unggahan dalam satu arsip terkompresi.
            </p>
          </div>
        </label>
      </div>

      <div class="dialog-actions mt-6">
        <UiButton
          type="button"
          variant="secondary"
          :disabled="createMutation.isPending.value"
          @click="emit('update:open', false)"
        >
          Batal
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          :loading="createMutation.isPending.value"
          loading-label="Membuat Cadangan..."
          data-testid="submit-create-backup-btn"
        >
          <template #icon><i class="pi pi-check" aria-hidden="true" /></template>
          Mulai Buat Cadangan
        </UiButton>
      </div>
    </form>
  </UiDialog>
</template>

<style scoped>
.create-backup-form {
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

.backup-types-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.backup-type-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 0.625rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--surface-panel, #ffffff);
}

.backup-type-card:hover {
  background: var(--surface-hover, #f8fafc);
  border-color: var(--border-focus, #cbd5e1);
}

.backup-type-card--selected {
  border-color: var(--primary-solid, #2563eb);
  background: rgba(37, 99, 235, 0.03);
}

.backup-type-card input[type='radio'] {
  margin-top: 0.25rem;
}

.backup-type-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background: var(--surface-muted, #f1f5f9);
  flex-shrink: 0;
}

.backup-type-card__info strong {
  display: block;
  font-size: 0.9375rem;
  color: var(--text-primary, #0f172a);
  margin-bottom: 0.25rem;
}

.backup-type-card__info p {
  font-size: 0.8125rem;
  color: var(--text-secondary, #64748b);
  margin: 0;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
