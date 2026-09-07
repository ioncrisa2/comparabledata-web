<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'

import type { BackupArtifact } from '../api/backup.api'
import { useDeleteBackupMutation } from '../composables/useBackup'

const props = defineProps<{
  open: boolean
  artifact: BackupArtifact | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [message: string]
}>()

const confirmInput = ref('')
const errorMessage = ref('')
const deleteMutation = useDeleteBackupMutation()

watch(
  () => props.open,
  (val) => {
    if (val) {
      confirmInput.value = ''
      errorMessage.value = ''
    }
  },
)

const expectedText = computed(() => props.artifact?.id || '')
const isConfirmed = computed(() => confirmInput.value.trim() === expectedText.value)

async function handleDelete() {
  if (!props.artifact || !isConfirmed.value) return

  errorMessage.value = ''
  try {
    const msg = await deleteMutation.mutateAsync(props.artifact.id)
    emit('update:open', false)
    emit('success', msg)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      errorMessage.value = String(err.message)
    } else {
      errorMessage.value = 'Gagal menghapus berkas cadangan.'
    }
  }
}
</script>

<template>
  <UiDialog
    :open="props.open"
    title="Hapus Berkas Cadangan"
    description="Tindakan ini permanen. Berkas fisik cadangan di storage server akan dihapus."
    width="md"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="artifact" class="delete-dialog-body">
      <div v-if="errorMessage" class="form-error-alert" role="alert">
        <i class="pi pi-times-circle" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </div>

      <p class="delete-desc">
        Apakah Anda yakin ingin menghapus berkas cadangan
        <strong class="font-mono text-danger">{{ artifact.filename }}</strong>
        ({{ artifact.size_label }})?
      </p>

      <form @submit.prevent="handleDelete">
        <UiField label="Konfirmasi Penghapusan" :help="`Ketik persis ID: ${expectedText}`" required>
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="confirmInput"
              type="text"
              class="font-mono text-sm"
              :placeholder="expectedText"
              required
              data-testid="delete-confirmation-input"
            />
          </template>
        </UiField>

        <div class="dialog-actions mt-6">
          <UiButton
            type="button"
            variant="secondary"
            :disabled="deleteMutation.isPending.value"
            @click="emit('update:open', false)"
          >
            Batal
          </UiButton>
          <UiButton
            type="submit"
            variant="danger"
            :disabled="!isConfirmed || deleteMutation.isPending.value"
            :loading="deleteMutation.isPending.value"
            loading-label="Menghapus..."
            data-testid="submit-delete-backup-btn"
          >
            <template #icon><i class="pi pi-trash" aria-hidden="true" /></template>
            Hapus Cadangan
          </UiButton>
        </div>
      </form>
    </div>
  </UiDialog>
</template>

<style scoped>
.delete-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.delete-desc {
  font-size: 0.875rem;
  color: var(--text-secondary, #475569);
  margin: 0;
  line-height: 1.5;
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

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
