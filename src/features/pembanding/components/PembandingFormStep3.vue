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
</script>

<template>
  <div class="form-step">
    <p class="form-step__intro">Isi dimensi properti, karakteristik tanah, dan dokumen hukum.</p>

    <h3 class="form-step__section-title">Ukuran</h3>
    <div class="form-step__grid">
      <UiField label="Luas tanah (m²)" required :error="errors.luas_tanah">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.luas_tanah"
            :disabled="disabled"
            @input="update('luas_tanah', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField label="Luas bangunan (m²)" :error="errors.luas_bangunan">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.luas_bangunan"
            :disabled="disabled"
            @input="update('luas_bangunan', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField label="Lebar depan (m)" required :error="errors.lebar_depan">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.lebar_depan"
            :disabled="disabled"
            @input="update('lebar_depan', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField label="Lebar jalan (m)" required :error="errors.lebar_jalan">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.lebar_jalan"
            :disabled="disabled"
            @input="update('lebar_jalan', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField label="Tahun bangun" :error="errors.tahun_bangun">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="number"
            min="1900"
            :max="new Date().getFullYear()"
            step="1"
            placeholder="contoh: 2010"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.tahun_bangun"
            :disabled="disabled"
            @input="update('tahun_bangun', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField label="Rasio tapak" :error="errors.rasio_tapak" help="Contoh: 0.6">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="text"
            placeholder="0.6"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.rasio_tapak"
            :disabled="disabled"
            @input="update('rasio_tapak', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>
    </div>

    <h3 class="form-step__section-title">Karakteristik tanah</h3>
    <div class="form-step__grid">
      <UiField label="Bentuk tanah" required :error="errors.bentuk_tanah_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.bentuk_tanah_id"
            :disabled="disabled || !options"
            @change="update('bentuk_tanah_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Pilih bentuk tanah</option>
            <option v-for="opt in options?.bentukTanahs" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Posisi tanah" required :error="errors.posisi_tanah_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.posisi_tanah_id"
            :disabled="disabled || !options"
            @change="update('posisi_tanah_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Pilih posisi tanah</option>
            <option v-for="opt in options?.posisiTanahs" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Kondisi tanah" required :error="errors.kondisi_tanah_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.kondisi_tanah_id"
            :disabled="disabled || !options"
            @change="update('kondisi_tanah_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Pilih kondisi tanah</option>
            <option v-for="opt in options?.kondisiTanahs" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Topografi" required :error="errors.topografi_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.topografi_id"
            :disabled="disabled || !options"
            @change="update('topografi_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Pilih topografi</option>
            <option v-for="opt in options?.topografis" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Dokumen tanah" required :error="errors.dokumen_tanah_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.dokumen_tanah_id"
            :disabled="disabled || !options"
            @change="update('dokumen_tanah_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Pilih dokumen tanah</option>
            <option v-for="opt in options?.dokumenTanahs" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Peruntukan" required :error="errors.peruntukan_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.peruntukan_id"
            :disabled="disabled || !options"
            @change="update('peruntukan_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>Pilih peruntukan</option>
            <option v-for="opt in options?.peruntukans" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>
    </div>
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
