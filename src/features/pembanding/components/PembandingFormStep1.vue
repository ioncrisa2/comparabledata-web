<script setup lang="ts">
import UiField from '@/shared/components/ui/UiField.vue'

import type { PembandingFormOptions } from '../api/pembanding.api'
import type { FormErrors, PembandingFormData } from '../types/form'

const props = defineProps<{
  modelValue: PembandingFormData
  options: PembandingFormOptions | undefined
  errors: FormErrors
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PembandingFormData]
}>()

function update<K extends keyof PembandingFormData>(key: K, value: PembandingFormData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

/** Saat jenis listing berubah, reset sewa fields jika bukan sewa */
function onJenisListingChange(id: string) {
  const isSewa = props.options?.jenisListings
    .find((o) => String(o.value) === id)
    ?.label.toLowerCase()
    .includes('sewa')
  const patch: Partial<PembandingFormData> = { jenis_listing_id: id }
  if (!isSewa) {
    patch.jangka_waktu_sewa = ''
    patch.satuan_waktu_sewa = ''
  }
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

/** Apakah jenis listing yang dipilih adalah sewa? */
const isSewa = () => {
  const label = props.options?.jenisListings
    .find((o) => String(o.value) === props.modelValue.jenis_listing_id)
    ?.label.toLowerCase()
  return label?.includes('sewa') ?? false
}
</script>

<template>
  <div class="form-step">
    <p class="form-step__intro">
      Isi informasi dasar properti: jenis transaksi, jenis objek, tanggal data, dan harga.
    </p>

    <div class="form-step__grid">
      <UiField label="Jenis listing" required :error="errors.jenis_listing_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.jenis_listing_id"
            :disabled="disabled || !options"
            @change="onJenisListingChange(($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Pilih jenis listing</option>
            <option v-for="opt in options?.jenisListings" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Jenis objek" required :error="errors.jenis_objek_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.jenis_objek_id"
            :disabled="disabled || !options"
            @change="update('jenis_objek_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Pilih jenis objek</option>
            <option v-for="opt in options?.jenisObjeks" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Tanggal data" required :error="errors.tanggal_data">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="date"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.tanggal_data"
            :disabled="disabled"
            @input="update('tanggal_data', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField
        label="Harga"
        required
        :error="errors.harga"
        help="Masukkan angka tanpa titik atau koma"
      >
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="number"
            min="0"
            step="1"
            placeholder="contoh: 500000000"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.harga"
            :disabled="disabled"
            @input="update('harga', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>
    </div>

    <template v-if="isSewa()">
      <h3 class="form-step__section-title">Detail sewa</h3>
      <div class="form-step__grid">
        <UiField label="Jangka waktu sewa" :error="errors.jangka_waktu_sewa">
          <template #default="{ inputId, describedBy, invalid }">
            <input
              :id="inputId"
              type="number"
              min="1"
              step="1"
              placeholder="contoh: 12"
              :aria-describedby="describedBy"
              :aria-invalid="invalid"
              :value="modelValue.jangka_waktu_sewa"
              :disabled="disabled"
              @input="update('jangka_waktu_sewa', ($event.target as HTMLInputElement).value)"
            />
          </template>
        </UiField>

        <UiField label="Satuan waktu" :error="errors.satuan_waktu_sewa">
          <template #default="{ inputId, describedBy, invalid }">
            <select
              :id="inputId"
              :aria-describedby="describedBy"
              :aria-invalid="invalid"
              :value="modelValue.satuan_waktu_sewa"
              :disabled="disabled"
              @change="
                update(
                  'satuan_waktu_sewa',
                  ($event.target as HTMLSelectElement).value as 'Bulan' | 'Tahun' | '',
                )
              "
            >
              <option value="">Pilih satuan</option>
              <option value="Bulan">Bulan</option>
              <option value="Tahun">Tahun</option>
            </select>
          </template>
        </UiField>
      </div>
    </template>
  </div>
</template>

<style scoped>
.form-step__intro {
  margin: 0 0 20px;
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.form-step__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.form-step__section-title {
  margin: 20px 0 16px;
  font-size: 0.875rem;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 16px;
}

@media (max-width: 639px) {
  .form-step__grid {
    grid-template-columns: 1fr;
  }
}
</style>
