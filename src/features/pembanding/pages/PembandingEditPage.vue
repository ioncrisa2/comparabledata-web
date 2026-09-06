<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { useUnsavedChangesGuard } from '@/shared/composables/useUnsavedChangesGuard'

import type { Pembanding } from '../api/pembanding.api'
import PembandingFormStep1 from '../components/PembandingFormStep1.vue'
import PembandingFormStep2 from '../components/PembandingFormStep2.vue'
import PembandingFormStep3 from '../components/PembandingFormStep3.vue'
import PembandingFormStep4 from '../components/PembandingFormStep4.vue'
import PembandingFormStepper from '../components/PembandingFormStepper.vue'
import {
  extractFieldErrors,
  useUpdatePembandingMutation,
} from '../composables/usePembandingMutations'
import {
  usePembandingDetailQuery,
  usePembandingFormOptionsQuery,
} from '../composables/usePembandingQueries'
import {
  emptyFormData,
  FORM_STEPS,
  type FormErrors,
  type PembandingFormData,
  toFormData,
} from '../types/form'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const validId = computed(() => /^\d+$/.test(id.value))

const detailQuery = usePembandingDetailQuery(id)
const optionsQuery = usePembandingFormOptionsQuery()
const updateMutation = useUpdatePembandingMutation()

const currentStep = ref(0)
const form = ref<PembandingFormData>(emptyFormData())
const fieldErrors = ref<FormErrors>({})
const initialized = ref(false)
const initialSnapshot = ref<string>('')
const isSubmitted = ref(false)

function isFormDirty(): boolean {
  if (isSubmitted.value) return false
  if (!initialized.value) return false
  if (form.value.image !== null) return true
  return JSON.stringify(form.value) !== initialSnapshot.value
}

const { showPrompt, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
  isDirty: isFormDirty,
})

function onLeaveDialogClose(open: boolean) {
  if (!open) cancelLeave()
}

const isLoading = computed(
  () => detailQuery.isPending.value || optionsQuery.isPending.value,
)
const isSubmitting = computed(() => updateMutation.isPending.value)
const isLastStep = computed(() => currentStep.value === FORM_STEPS.length - 1)

// Pre-populate form saat data detail tersedia
watch(
  () => detailQuery.data.value,
  (record) => {
    if (!record || initialized.value) return
    form.value = recordToFormData(record)
    initialSnapshot.value = JSON.stringify(form.value)
    initialized.value = true
  },
  { immediate: true },
)

function recordToFormData(r: Pembanding): PembandingFormData {
  return {
    jenis_listing_id: String(r.jenis_listing.id),
    jenis_objek_id: String(r.jenis_objek.id),
    tanggal_data: r.tanggal_data ?? '',
    harga: r.harga !== null ? String(r.harga) : '',
    jangka_waktu_sewa: r.jangka_waktu_sewa !== null ? String(r.jangka_waktu_sewa) : '',
    satuan_waktu_sewa: (r.satuan_waktu_sewa as 'Bulan' | 'Tahun' | '') ?? '',

    province_id: r.province.id,
    regency_id: r.regency.id,
    district_id: r.district.id,
    village_id: r.village.id,
    alamat_data: r.alamat_data,
    latitude: String(r.latitude),
    longitude: String(r.longitude),

    luas_tanah: r.luas_tanah !== null ? String(r.luas_tanah) : '',
    luas_bangunan: r.luas_bangunan !== null ? String(r.luas_bangunan) : '',
    lebar_depan: r.lebar_depan ?? '',
    lebar_jalan: r.lebar_jalan ?? '',
    tahun_bangun: r.tahun_bangun ?? '',
    rasio_tapak: r.rasio_tapak ?? '',
    bentuk_tanah_id: String(r.bentuk_tanah.id),
    posisi_tanah_id: String(r.posisi_tanah.id),
    kondisi_tanah_id: String(r.kondisi_tanah.id),
    topografi_id: String(r.topografi.id),
    dokumen_tanah_id: String(r.dokumen_tanah.id),
    peruntukan_id: String(r.peruntukan.id),

    nama_pemberi_informasi: r.nama_pemberi_informasi,
    nomer_telepon_pemberi_informasi: r.nomer_telepon_pemberi_informasi ?? '',
    status_pemberi_informasi_id: String(r.status_pemberi_informasi.id),
    image: null, // Foto existing tidak bisa dimuat kembali ke File
    catatan: r.catatan ?? '',
  }
}

function nextStep() {
  if (currentStep.value < FORM_STEPS.length - 1) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function goToStep(step: number) {
  if (step <= currentStep.value) currentStep.value = step
}

async function submit() {
  fieldErrors.value = {}
  const fd = toFormData(form.value)

  await updateMutation.mutateAsync(
    { id: id.value, formData: fd },
    {
      onSuccess: (record) => {
        isSubmitted.value = true
        void router.push({ name: 'pembanding.detail', params: { id: record.id } })
      },
      onError: (error) => {
        if (isApiError(error) && error.status === 422) {
          fieldErrors.value = extractFieldErrors(error)
          const errorKeys = Object.keys(fieldErrors.value)
          const stepMapping = [
            ['jenis_listing_id', 'jenis_objek_id', 'tanggal_data', 'harga', 'jangka_waktu_sewa', 'satuan_waktu_sewa'],
            ['province_id', 'regency_id', 'district_id', 'village_id', 'alamat_data', 'latitude', 'longitude'],
            ['luas_tanah', 'luas_bangunan', 'lebar_depan', 'lebar_jalan', 'tahun_bangun', 'rasio_tapak', 'bentuk_tanah_id', 'posisi_tanah_id', 'kondisi_tanah_id', 'topografi_id', 'dokumen_tanah_id', 'peruntukan_id'],
            ['nama_pemberi_informasi', 'nomer_telepon_pemberi_informasi', 'status_pemberi_informasi_id', 'image', 'catatan'],
          ]
          for (let i = 0; i < stepMapping.length; i++) {
            const stepKeys = stepMapping[i]
            if (stepKeys && errorKeys.some((k) => stepKeys.includes(k))) {
              currentStep.value = i
              break
            }
          }
        }
      },
    },
  )
}
</script>

<template>
  <main id="main-content" class="pembanding-edit" tabindex="-1">
    <header class="pembanding-edit__heading">
      <div>
        <RouterLink
          class="pembanding-edit__back"
          :to="{ name: 'pembanding.detail', params: { id } }"
        >
          <i class="pi pi-arrow-left" aria-hidden="true" /> Kembali ke detail
        </RouterLink>
        <h1>Edit data pembanding</h1>
        <p v-if="detailQuery.data.value">{{ detailQuery.data.value.alamat_data }}</p>
      </div>
    </header>

    <!-- ID tidak valid -->
    <UiEmptyState
      v-if="!validId"
      title="ID data tidak valid"
      description="Alamat edit ini tidak memiliki ID pembanding yang dapat diproses."
      icon="pi pi-exclamation-circle"
    >
      <template #actions>
        <RouterLink class="ui-button ui-button--primary" :to="{ name: 'pembanding.list' }">
          Buka daftar pembanding
        </RouterLink>
      </template>
    </UiEmptyState>

    <!-- Loading -->
    <div v-else-if="isLoading" class="pembanding-edit__loading" role="status">
      <span class="sr-only">Memuat data pembanding untuk diedit</span>
      <UiSkeleton width="45%" height="2rem" />
      <UiSkeleton height="24rem" />
    </div>

    <!-- Error loading -->
    <UiSurface v-else-if="detailQuery.isError.value" class="pembanding-edit__error">
      <UiInlineAlert tone="error" title="Gagal memuat data">
        <p>
          {{
            isApiError(detailQuery.error.value)
              ? detailQuery.error.value.message
              : 'Terjadi gangguan saat mengambil data. Coba lagi.'
          }}
        </p>
        <UiButton size="sm" @click="detailQuery.refetch()">Coba lagi</UiButton>
      </UiInlineAlert>
    </UiSurface>

    <!-- Form -->
    <UiSurface v-else class="pembanding-edit__card">
      <PembandingFormStepper :current-step="currentStep" @go-to="goToStep" />

      <div class="pembanding-edit__form-body">
        <PembandingFormStep1
          v-if="currentStep === 0"
          v-model="form"
          :options="optionsQuery.data.value"
          :errors="fieldErrors"
          :disabled="isSubmitting"
        />
        <PembandingFormStep2
          v-else-if="currentStep === 1"
          v-model="form"
          :errors="fieldErrors"
          :disabled="isSubmitting"
        />
        <PembandingFormStep3
          v-else-if="currentStep === 2"
          v-model="form"
          :options="optionsQuery.data.value"
          :errors="fieldErrors"
          :disabled="isSubmitting"
        />
        <PembandingFormStep4
          v-else-if="currentStep === 3"
          v-model="form"
          :options="optionsQuery.data.value"
          :errors="fieldErrors"
          :disabled="isSubmitting"
          :existing-image-url="detailQuery.data.value?.image_url"
        />

        <UiInlineAlert
          v-if="updateMutation.isError.value && updateMutation.error.value"
          tone="error"
          title="Penyimpanan gagal"
        >
          <p>
            {{
              isApiError(updateMutation.error.value) && updateMutation.error.value.status !== 422
                ? updateMutation.error.value.message
                : 'Periksa kembali isian formulir dan coba lagi.'
            }}
          </p>
        </UiInlineAlert>
      </div>

      <footer class="pembanding-edit__actions">
        <UiButton v-if="currentStep > 0" :disabled="isSubmitting" @click="prevStep">
          <template #icon><i class="pi pi-arrow-left" aria-hidden="true" /></template>
          Sebelumnya
        </UiButton>
        <span v-else />

        <div class="pembanding-edit__nav-right">
          <span class="pembanding-edit__step-count">
            Langkah {{ currentStep + 1 }} dari {{ FORM_STEPS.length }}
          </span>
          <UiButton
            v-if="!isLastStep"
            variant="primary"
            :disabled="isSubmitting"
            @click="nextStep"
          >
            Selanjutnya
            <template #icon><i class="pi pi-arrow-right" aria-hidden="true" /></template>
          </UiButton>
          <UiButton
            v-else
            variant="primary"
            :loading="isSubmitting"
            loading-label="Menyimpan perubahan"
            @click="submit"
          >
            <template #icon><i class="pi pi-save" aria-hidden="true" /></template>
            Simpan perubahan
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
.pembanding-edit {
  width: min(100% - 32px, 860px);
  margin-inline: auto;
  padding-block: 28px 64px;
}

.pembanding-edit__back {
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

.pembanding-edit__back:hover {
  color: var(--color-action-primary);
}

.pembanding-edit__heading {
  margin-bottom: 24px;
}

.pembanding-edit__heading h1 {
  margin-bottom: 8px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.pembanding-edit__heading p {
  margin: 0;
  color: var(--color-ink-muted);
}

.pembanding-edit__loading {
  display: grid;
  gap: 16px;
}

.pembanding-edit__error {
  padding: 24px;
}

.pembanding-edit__card {
  padding: 24px;
}

.pembanding-edit__form-body {
  padding-block: 24px;
  min-height: 300px;
}

.pembanding-edit__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 20px;
}

.pembanding-edit__nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pembanding-edit__step-count {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

@media (max-width: 639px) {
  .pembanding-edit {
    width: min(100% - 24px, 860px);
    padding-block: 20px 48px;
  }

  .pembanding-edit__card {
    padding: 16px;
  }
}
</style>
