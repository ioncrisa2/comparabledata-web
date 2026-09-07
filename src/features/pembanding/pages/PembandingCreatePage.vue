<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { useUnsavedChangesGuard } from '@/shared/composables/useUnsavedChangesGuard'

import PembandingFormStep1 from '../components/PembandingFormStep1.vue'
import PembandingFormStep2 from '../components/PembandingFormStep2.vue'
import PembandingFormStep3 from '../components/PembandingFormStep3.vue'
import PembandingFormStep4 from '../components/PembandingFormStep4.vue'
import PembandingFormStepper from '../components/PembandingFormStepper.vue'
import {
  extractFieldErrors,
  useCreatePembandingMutation,
} from '../composables/usePembandingMutations'
import { usePembandingFormOptionsQuery } from '../composables/usePembandingQueries'
import { findStepForError } from '../schemas/form.schema'
import { emptyFormData, FORM_STEPS, type FormErrors, toFormData } from '../types/form'

const router = useRouter()
const optionsQuery = usePembandingFormOptionsQuery()
const createMutation = useCreatePembandingMutation()

const currentStep = ref(0)
const form = ref(emptyFormData())
const fieldErrors = ref<FormErrors>({})
const isSubmitted = ref(false)

function isFormDirty(): boolean {
  if (isSubmitted.value) return false
  if (currentStep.value > 0) return true
  if (form.value.image !== null) return true
  return Object.values(form.value).some((val) => val !== '' && val !== null)
}

const { showPrompt, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty: isFormDirty,
})

function onLeaveDialogClose(open: boolean) {
  if (!open) cancelLeave()
}

// Info duplikat dari response 409
const duplicateInfo = ref<{
  submission_id: string
  submission_url: string
  expires_at: string | null
} | null>(null)

const isLastStep = computed(() => currentStep.value === FORM_STEPS.length - 1)
const isSubmitting = computed(() => createMutation.isPending.value)

function nextStep() {
  if (currentStep.value < FORM_STEPS.length - 1) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function goToStep(step: number) {
  if (step <= currentStep.value) {
    currentStep.value = step
  }
}

function submit() {
  fieldErrors.value = {}
  duplicateInfo.value = null

  const fd = toFormData(form.value)

  createMutation.mutate(fd, {
    onSuccess: (record) => {
      isSubmitted.value = true
      void router.push({ name: 'pembanding.detail', params: { id: record.id } })
    },
    onError: (error) => {
      if (isApiError(error)) {
        if (error.status === 409 && error.code === 'DUPLICATE_REVIEW_REQUIRED') {
          const dup = (error as { duplicate?: typeof duplicateInfo.value }).duplicate
          if (dup) duplicateInfo.value = dup
          return
        }
        if (error.status === 422) {
          fieldErrors.value = extractFieldErrors(error)
          const targetStep = findStepForError(fieldErrors.value)
          if (targetStep !== null) {
            currentStep.value = targetStep
          }
        }
      }
    },
  })
}

function goToDuplicateReview() {
  if (duplicateInfo.value) {
    isSubmitted.value = true
    void router.push({
      name: 'pembanding.duplicate-review',
      params: { submissionId: duplicateInfo.value.submission_id },
    })
  }
}
</script>

<template>
  <main id="main-content" class="pembanding-create" tabindex="-1">
    <header class="pembanding-create__heading">
      <div>
        <RouterLink class="pembanding-create__back" :to="{ name: 'pembanding.list' }">
          <i class="pi pi-arrow-left" aria-hidden="true" /> Kembali ke daftar
        </RouterLink>
        <h1>Tambah data pembanding</h1>
        <p>Isi formulir berikut secara bertahap untuk menambahkan data pembanding baru.</p>
      </div>
    </header>

    <!-- Duplikat alert -->
    <UiInlineAlert
      v-if="duplicateInfo"
      class="pembanding-create__duplicate-alert"
      tone="warning"
      title="Data terindikasi duplikat"
    >
      <p>
        Data yang Anda masukkan mirip dengan data yang sudah ada. Silakan tinjau data duplikat dan
        tentukan tindakan yang sesuai.
      </p>
      <UiButton variant="primary" size="sm" @click="goToDuplicateReview">
        Tinjau data duplikat
      </UiButton>
    </UiInlineAlert>

    <UiSurface class="pembanding-create__card">
      <PembandingFormStepper :current-step="currentStep" @go-to="goToStep" />

      <div class="pembanding-create__form-body">
        <!-- Step 1: Dasar -->
        <PembandingFormStep1
          v-if="currentStep === 0"
          v-model="form"
          :options="optionsQuery.data.value"
          :errors="fieldErrors"
          :disabled="isSubmitting"
        />

        <!-- Step 2: Lokasi -->
        <PembandingFormStep2
          v-else-if="currentStep === 1"
          v-model="form"
          :errors="fieldErrors"
          :disabled="isSubmitting"
        />

        <!-- Step 3: Properti -->
        <PembandingFormStep3
          v-else-if="currentStep === 2"
          v-model="form"
          :options="optionsQuery.data.value"
          :errors="fieldErrors"
          :disabled="isSubmitting"
        />

        <!-- Step 4: Sumber & Foto -->
        <PembandingFormStep4
          v-else-if="currentStep === 3"
          v-model="form"
          :options="optionsQuery.data.value"
          :errors="fieldErrors"
          :disabled="isSubmitting"
        />

        <!-- Error umum -->
        <UiInlineAlert
          v-if="createMutation.isError.value && !duplicateInfo && createMutation.error.value"
          tone="error"
          title="Penyimpanan gagal"
        >
          <p>
            {{
              isApiError(createMutation.error.value) && createMutation.error.value.status !== 422
                ? createMutation.error.value.message
                : 'Periksa kembali isian formulir dan coba lagi.'
            }}
          </p>
        </UiInlineAlert>
      </div>

      <footer class="pembanding-create__actions">
        <UiButton v-if="currentStep > 0" :disabled="isSubmitting" @click="prevStep">
          <template #icon><i class="pi pi-arrow-left" aria-hidden="true" /></template>
          Sebelumnya
        </UiButton>
        <span v-else />

        <div class="pembanding-create__nav-right">
          <span class="pembanding-create__step-count">
            Langkah {{ currentStep + 1 }} dari {{ FORM_STEPS.length }}
          </span>
          <UiButton v-if="!isLastStep" variant="primary" :disabled="isSubmitting" @click="nextStep">
            Selanjutnya
            <template #icon><i class="pi pi-arrow-right" aria-hidden="true" /></template>
          </UiButton>
          <UiButton
            v-else
            variant="primary"
            :loading="isSubmitting"
            loading-label="Menyimpan data"
            @click="submit"
          >
            <template #icon><i class="pi pi-save" aria-hidden="true" /></template>
            Simpan data pembanding
          </UiButton>
        </div>
      </footer>
    </UiSurface>

    <!-- Dialog Konfirmasi Tinggalkan Halaman -->
    <UiConfirmDialog
      :open="showPrompt"
      title="Tinggalkan formulir?"
      description="Perubahan yang belum disimpan akan hilang jika Anda meninggalkan halaman ini."
      confirm-label="Ya, tinggalkan"
      cancel-label="Tetap di sini"
      confirm-variant="danger"
      @update:open="onLeaveDialogClose"
      @confirm="confirmLeave"
    />
  </main>
</template>

<style scoped>
.pembanding-create {
  width: min(100% - 32px, 860px);
  margin-inline: auto;
  padding-block: 28px 64px;
}

.pembanding-create__back {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--color-ink-body);
  font-size: 0.8125rem;
  font-weight: 650;
  text-decoration: none;
}

.pembanding-create__back:hover {
  color: var(--color-action-primary);
}

.pembanding-create__heading {
  margin-bottom: 24px;
}

.pembanding-create__heading h1 {
  margin-bottom: 8px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.pembanding-create__heading p {
  margin: 0;
  color: var(--color-ink-muted);
}

.pembanding-create__duplicate-alert {
  margin-bottom: 16px;
}

.pembanding-create__duplicate-alert :deep(p) {
  margin-bottom: 12px;
}

.pembanding-create__card {
  padding: 24px;
}

.pembanding-create__form-body {
  padding-block: 24px;
  min-height: 300px;
}

.pembanding-create__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 20px;
}

.pembanding-create__nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pembanding-create__step-count {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

@media (max-width: 639px) {
  .pembanding-create {
    width: min(100% - 24px, 860px);
    padding-block: 20px 48px;
  }

  .pembanding-create__card {
    padding: 16px;
  }

  .pembanding-create__actions {
    flex-wrap: wrap;
  }

  .pembanding-create__nav-right {
    flex: 1 1 100%;
    justify-content: space-between;
  }
}
</style>
