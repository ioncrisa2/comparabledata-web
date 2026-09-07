<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'

import type { ImportRow } from '../api/bulk-import.api'
import { useImportRowDetailQuery, useUpdateImportRowMutation } from '../composables/useBulkImport'

const props = defineProps<{
  open: boolean
  batchId: number | string
  rowId: number | string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [row: Partial<ImportRow>]
}>()

const rowQuery = useImportRowDetailQuery(
  () => props.batchId,
  () => props.rowId ?? 0,
  { enabled: computed(() => props.open && Boolean(props.rowId)) },
)

interface ImportRowFormData {
  alamat_data: string
  province_id: string | number
  regency_id: string | number
  district_id: string | number
  village_id: string | number
  latitude: string | number
  longitude: string | number
  harga: string | number
  luas_tanah: string | number
  luas_bangunan: string | number
  lebar_depan: string | number
  lebar_jalan: string | number
  tahun_bangun: string | number
  jenis_listing_id: string | number
  jenis_objek_id: string | number
  status_pemberi_informasi_id: string | number
  nama_pemberi_informasi: string
  nomer_telepon_pemberi_informasi: string
  bentuk_tanah_id: string | number
  posisi_tanah_id: string | number
  kondisi_tanah_id: string | number
  topografi_id: string | number
  dokumen_tanah_id: string | number
  peruntukan_id: string | number
  catatan: string
  [key: string]: string | number
}

const defaultFormData: ImportRowFormData = {
  alamat_data: '',
  province_id: '',
  regency_id: '',
  district_id: '',
  village_id: '',
  latitude: '',
  longitude: '',
  harga: '',
  luas_tanah: '',
  luas_bangunan: '',
  lebar_depan: '',
  lebar_jalan: '',
  tahun_bangun: '',
  jenis_listing_id: '',
  jenis_objek_id: '',
  status_pemberi_informasi_id: '',
  nama_pemberi_informasi: '',
  nomer_telepon_pemberi_informasi: '',
  bentuk_tanah_id: '',
  posisi_tanah_id: '',
  kondisi_tanah_id: '',
  topografi_id: '',
  dokumen_tanah_id: '',
  peruntukan_id: '',
  catatan: '',
}

const updateMutation = useUpdateImportRowMutation()

const formData = ref<ImportRowFormData>({ ...defaultFormData })
const newImageFile = ref<File | null>(null)
const removeImage = ref(false)
const errorMessage = ref('')

watch(
  () => rowQuery.data.value,
  (detail) => {
    if (detail?.row) {
      const d = (detail.row.data as Record<string, string | number>) ?? {}
      formData.value = {
        ...defaultFormData,
        alamat_data: String(d.alamat_data ?? ''),
        province_id: d.province_id ?? '',
        regency_id: d.regency_id ?? '',
        district_id: d.district_id ?? '',
        village_id: d.village_id ?? '',
        latitude: d.latitude ?? '',
        longitude: d.longitude ?? '',
        harga: d.harga ?? '',
        luas_tanah: d.luas_tanah ?? '',
        luas_bangunan: d.luas_bangunan ?? '',
        lebar_depan: d.lebar_depan ?? '',
        lebar_jalan: d.lebar_jalan ?? '',
        tahun_bangun: d.tahun_bangun ?? '',
        jenis_listing_id: d.jenis_listing_id ?? '',
        jenis_objek_id: d.jenis_objek_id ?? '',
        status_pemberi_informasi_id: d.status_pemberi_informasi_id ?? '',
        nama_pemberi_informasi: String(d.nama_pemberi_informasi ?? ''),
        nomer_telepon_pemberi_informasi: String(d.nomer_telepon_pemberi_informasi ?? ''),
        bentuk_tanah_id: d.bentuk_tanah_id ?? '',
        posisi_tanah_id: d.posisi_tanah_id ?? '',
        kondisi_tanah_id: d.kondisi_tanah_id ?? '',
        topografi_id: d.topografi_id ?? '',
        dokumen_tanah_id: d.dokumen_tanah_id ?? '',
        peruntukan_id: d.peruntukan_id ?? '',
        catatan: String(d.catatan ?? ''),
      }
      newImageFile.value = null
      removeImage.value = false
    }
  },
  { immediate: true },
)

const options = computed(() => rowQuery.data.value?.options)
const missingFields = computed(() => (rowQuery.data.value?.row?.missing_fields as string[]) ?? [])
const warnings = computed(() => (rowQuery.data.value?.row?.warnings as string[]) ?? [])

function onImageSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    newImageFile.value = input.files[0]
    removeImage.value = false
  }
}

async function submitUpdate() {
  if (!props.rowId) return
  errorMessage.value = ''

  const fd = new FormData()
  Object.entries(formData.value).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') {
      fd.append(k, String(v))
    }
  })

  if (newImageFile.value) {
    fd.append('image', newImageFile.value)
  }
  if (removeImage.value) {
    fd.append('remove_image', '1')
  }

  try {
    const res = await updateMutation.mutateAsync({
      batchId: props.batchId,
      rowId: props.rowId,
      formData: fd,
    })
    emit('success', res.row)
    emit('update:open', false)
  } catch (err) {
    if (isApiError(err)) {
      errorMessage.value = err.message
    } else {
      errorMessage.value = 'Gagal menyimpan perubahan baris. Coba lagi.'
    }
  }
}

function close() {
  if (updateMutation.isPending.value) return
  errorMessage.value = ''
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    :title="`Perbaiki Baris #${rowQuery.data.value?.row?.source_row_number ?? rowId}`"
    description="Lengkapi informasi yang kurang atau perbaiki data agar memenuhi syarat validasi."
    width="lg"
    :dismissable="!updateMutation.isPending.value"
    @update:open="close"
  >
    <div v-if="rowQuery.isPending.value" class="row-edit-loading">
      <UiSkeleton height="36px" />
      <UiSkeleton height="120px" />
      <UiSkeleton height="200px" />
    </div>

    <div v-else-if="rowQuery.isError.value" class="row-edit-error">
      <UiInlineAlert tone="error" title="Gagal Memuat Baris">
        <p>Terjadi gangguan saat mengambil data baris ini. Silakan coba kembali.</p>
        <UiButton size="sm" @click="rowQuery.refetch()">Coba lagi</UiButton>
      </UiInlineAlert>
    </div>

    <form v-else class="row-edit-form" @submit.prevent="submitUpdate">
      <!-- Missing Fields & Warnings Alerts -->
      <UiInlineAlert
        v-if="missingFields.length > 0"
        tone="warning"
        title="Field Wajib Belum Lengkap"
      >
        <p>
          Bagian berikut perlu diisi atau diperbaiki:
          <strong>{{ missingFields.join(', ') }}</strong>
        </p>
      </UiInlineAlert>

      <UiInlineAlert v-if="warnings.length > 0" tone="info" title="Peringatan Validasi Data">
        <ul>
          <li v-for="(warn, idx) in warnings" :key="idx">{{ warn }}</li>
        </ul>
      </UiInlineAlert>

      <div class="row-edit-grid">
        <!-- Alamat Properti -->
        <UiField label="Alamat Properti" class="col-span-full" required>
          <template #default="{ inputId }">
            <textarea
              :id="inputId"
              v-model="formData.alamat_data"
              rows="2"
              placeholder="Contoh: Jl. Diponegoro No. 45"
              required
            />
          </template>
        </UiField>

        <!-- Koordinat -->
        <UiField label="Latitude">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="formData.latitude"
              type="number"
              step="any"
              placeholder="-6.917464"
            />
          </template>
        </UiField>

        <UiField label="Longitude">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="formData.longitude"
              type="number"
              step="any"
              placeholder="107.619123"
            />
          </template>
        </UiField>

        <!-- Harga -->
        <UiField label="Harga (Rp)" required>
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="formData.harga"
              type="number"
              min="0"
              placeholder="500000000"
              required
            />
          </template>
        </UiField>

        <!-- Jenis Listing -->
        <UiField label="Jenis Listing" required>
          <template #default="{ inputId }">
            <select :id="inputId" v-model="formData.jenis_listing_id" required>
              <option value="" disabled>-- Pilih jenis --</option>
              <option
                v-for="opt in options?.jenisListings ?? []"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </template>
        </UiField>

        <!-- Luas Tanah & Bangunan -->
        <UiField label="Luas Tanah (m²)">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="formData.luas_tanah"
              type="number"
              min="0"
              step="any"
              placeholder="120"
            />
          </template>
        </UiField>

        <UiField label="Luas Bangunan (m²)">
          <template #default="{ inputId }">
            <input
              :id="inputId"
              v-model="formData.luas_bangunan"
              type="number"
              min="0"
              step="any"
              placeholder="90"
            />
          </template>
        </UiField>

        <!-- Peruntukan & Dokumen Tanah -->
        <UiField label="Peruntukan">
          <template #default="{ inputId }">
            <select :id="inputId" v-model="formData.peruntukan_id">
              <option value="">-- Pilih peruntukan --</option>
              <option v-for="opt in options?.peruntukans ?? []" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </template>
        </UiField>

        <UiField label="Dokumen / Legalitas">
          <template #default="{ inputId }">
            <select :id="inputId" v-model="formData.dokumen_tanah_id">
              <option value="">-- Pilih dokumen --</option>
              <option
                v-for="opt in options?.dokumenTanahs ?? []"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </template>
        </UiField>

        <!-- Status Pemberi Info -->
        <UiField label="Status Pemberi Info">
          <template #default="{ inputId }">
            <select :id="inputId" v-model="formData.status_pemberi_informasi_id">
              <option value="">-- Pilih status --</option>
              <option
                v-for="opt in options?.statusPemberiInfos ?? []"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </template>
        </UiField>

        <UiField label="Bentuk Tanah">
          <template #default="{ inputId }">
            <select :id="inputId" v-model="formData.bentuk_tanah_id">
              <option value="">-- Pilih bentuk --</option>
              <option
                v-for="opt in options?.bentukTanahs ?? []"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </template>
        </UiField>

        <!-- Foto Section -->
        <div class="row-edit-image col-span-full">
          <span class="row-edit-image__title">Foto Properti</span>
          <div class="row-edit-image__box">
            <div
              v-if="rowQuery.data.value?.row?.image_url && !removeImage"
              class="row-edit-image__preview"
            >
              <img
                :src="rowQuery.data.value?.row?.image_url"
                alt="Foto Properti"
                class="row-edit-image__thumb"
              />
              <UiButton size="sm" variant="danger" type="button" @click="removeImage = true">
                Hapus Foto
              </UiButton>
            </div>
            <div v-else class="row-edit-image__upload">
              <input type="file" accept="image/*" @change="onImageSelect" />
              <span v-if="removeImage" class="text-sm text-red-600"> Foto lama akan dihapus. </span>
            </div>
          </div>
        </div>
      </div>

      <UiInlineAlert v-if="errorMessage" tone="error" title="Gagal Menyimpan">
        <p>{{ errorMessage }}</p>
      </UiInlineAlert>
    </form>

    <template #footer>
      <UiButton variant="secondary" :disabled="updateMutation.isPending.value" @click="close">
        Batal
      </UiButton>
      <UiButton
        variant="primary"
        :disabled="updateMutation.isPending.value"
        :loading="updateMutation.isPending.value"
        @click="submitUpdate"
      >
        Simpan Perbaikan
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.row-edit-loading,
.row-edit-error {
  display: grid;
  gap: 16px;
  padding: 16px 0;
}

.row-edit-form {
  display: grid;
  gap: 16px;
  max-height: calc(80vh - 160px);
  overflow-y: auto;
  padding-right: 4px;
}

.row-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.col-span-full {
  grid-column: 1 / -1;
}

textarea,
input,
select {
  width: 100%;
}

.row-edit-image {
  border-top: 1px solid var(--color-border-soft);
  padding-top: 12px;
  display: grid;
  gap: 8px;
}

.row-edit-image__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-ink-strong);
}

.row-edit-image__preview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.row-edit-image__thumb {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
}

@media (max-width: 639px) {
  .row-edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
