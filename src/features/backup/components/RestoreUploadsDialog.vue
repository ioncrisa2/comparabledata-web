<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'

import type { BackupArtifact } from '../api/backup.api'
import { useRestoreUploadsMutation } from '../composables/useBackup'

const props = defineProps<{
  open: boolean
  artifact: BackupArtifact | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [message: string]
}>()

const currentPassword = ref('')
const confirmationText = ref('')
const errorMessage = ref('')

const restoreMutation = useRestoreUploadsMutation()

// Reset fields on dialog open
watch(
  () => props.open,
  (val) => {
    if (val) {
      currentPassword.value = ''
      confirmationText.value = ''
      errorMessage.value = ''
    }
  },
)

const expectedConfirmation = computed(() => props.artifact?.id || '')
const isConfirmed = computed(
  () =>
    confirmationText.value.trim() === expectedConfirmation.value &&
    currentPassword.value.length > 0,
)

async function handleRestore() {
  if (!props.artifact || !isConfirmed.value) return

  errorMessage.value = ''
  try {
    const res = await restoreMutation.mutateAsync({
      artifact: props.artifact.id,
      payload: {
        current_password: currentPassword.value,
        confirmation: confirmationText.value.trim(),
      },
    })
    emit('update:open', false)
    emit('success', res.message)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      errorMessage.value = String(err.message)
    } else {
      errorMessage.value = 'Gagal memulihkan berkas unggahan. Periksa kembali kata sandi Anda.'
    }
  }
}
</script>

<template>
  <UiDialog
    :open="props.open"
    title="Konfirmasi Pemulihan Berkas Unggahan"
    description="Tindakan berisiko tinggi: Memulihkan berkas foto properti dari paket cadangan."
    width="md"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="artifact" class="restore-dialog-body">
      <!-- High risk warning alert -->
      <div class="risk-warning-box">
        <div class="risk-warning-icon">
          <i class="pi pi-exclamation-triangle" aria-hidden="true" />
        </div>
        <div class="risk-warning-content">
          <strong>Perhatian: Berkas foto properti akan ditimpa!</strong>
          <p>
            Proses ini akan menimpa direktori berkas foto properti yang ada di server dengan isi
            paket cadangan
            <span class="font-mono font-semibold text-danger">{{ artifact.filename }}</span
            >. Sistem akan membuat berkas cadangan keselamatan otomatis sebelum pemulihan dimulai.
          </p>
        </div>
      </div>

      <div v-if="errorMessage" class="form-error-alert" role="alert">
        <i class="pi pi-times-circle" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="restore-form" @submit.prevent="handleRestore">
        <UiField
          label="Konfirmasi Identitas Cadangan"
          :help="`Ketik persis ID paket: ${expectedConfirmation}`"
          required
        >
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="confirmationText"
              type="text"
              class="font-mono text-sm"
              :placeholder="expectedConfirmation"
              required
              data-testid="restore-confirmation-input"
            />
          </template>
        </UiField>

        <UiField
          label="Kata Sandi Akun Anda (Step-up Verification)"
          help="Masukkan kata sandi login Anda saat ini untuk mengotorisasi tindakan."
          required
        >
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="currentPassword"
              type="password"
              placeholder="Kata sandi akun Super Admin"
              required
              data-testid="restore-password-input"
            />
          </template>
        </UiField>

        <div class="dialog-actions mt-6">
          <UiButton
            type="button"
            variant="secondary"
            :disabled="restoreMutation.isPending.value"
            @click="emit('update:open', false)"
          >
            Batal
          </UiButton>
          <UiButton
            type="submit"
            variant="danger"
            :disabled="!isConfirmed || restoreMutation.isPending.value"
            :loading="restoreMutation.isPending.value"
            loading-label="Memulihkan Berkas..."
            data-testid="submit-restore-btn"
          >
            <template #icon><i class="pi pi-refresh" aria-hidden="true" /></template>
            Ya, Pulihkan Berkas Sekarang
          </UiButton>
        </div>
      </form>
    </div>
  </UiDialog>
</template>

<style scoped>
.restore-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.risk-warning-box {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--danger-subtle, #fef2f2);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.risk-warning-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--danger-text, #dc2626);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.risk-warning-content strong {
  display: block;
  font-size: 0.875rem;
  color: var(--danger-text, #991b1b);
  margin-bottom: 0.25rem;
}

.risk-warning-content p {
  font-size: 0.8125rem;
  color: var(--danger-text, #991b1b);
  margin: 0;
  line-height: 1.45;
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

.restore-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
