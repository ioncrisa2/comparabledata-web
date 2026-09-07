<script setup lang="ts">
import { watch } from 'vue'

import UiField from '@/shared/components/ui/UiField.vue'

import {
  useDistrictsQuery,
  useProvincesQuery,
  useRegenciesQuery,
  useVillagesQuery,
} from '../composables/useLocationQueries'
import type { FormErrors, PembandingFormData } from '../types/form'

const props = defineProps<{
  modelValue: PembandingFormData
  errors: FormErrors
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PembandingFormData]
}>()

function update<K extends keyof PembandingFormData>(key: K, value: PembandingFormData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const provincesQuery = useProvincesQuery()
const regenciesQuery = useRegenciesQuery(() => props.modelValue.province_id)
const districtsQuery = useDistrictsQuery(() => props.modelValue.regency_id)
const villagesQuery = useVillagesQuery(() => props.modelValue.district_id)

// Reset child saat parent berubah
watch(
  () => props.modelValue.province_id,
  () =>
    emit('update:modelValue', {
      ...props.modelValue,
      regency_id: '',
      district_id: '',
      village_id: '',
    }),
)
watch(
  () => props.modelValue.regency_id,
  () => emit('update:modelValue', { ...props.modelValue, district_id: '', village_id: '' }),
)
watch(
  () => props.modelValue.district_id,
  () => emit('update:modelValue', { ...props.modelValue, village_id: '' }),
)
</script>

<template>
  <div class="form-step">
    <p class="form-step__intro">
      Pilih wilayah administratif dari provinsi hingga desa/kelurahan, lalu isi alamat dan koordinat
      GPS.
    </p>

    <div class="form-step__grid">
      <UiField label="Provinsi" required :error="errors.province_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.province_id"
            :disabled="disabled || provincesQuery.isPending.value"
            @change="update('province_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>
              {{ provincesQuery.isPending.value ? 'Memuat…' : 'Pilih provinsi' }}
            </option>
            <option v-for="prov in provincesQuery.data.value" :key="prov.id" :value="prov.id">
              {{ prov.name }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Kabupaten/Kota" required :error="errors.regency_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.regency_id"
            :disabled="disabled || !modelValue.province_id || regenciesQuery.isPending.value"
            @change="update('regency_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>
              <template v-if="!modelValue.province_id">Pilih provinsi dulu</template>
              <template v-else-if="regenciesQuery.isPending.value">Memuat…</template>
              <template v-else>Pilih kabupaten/kota</template>
            </option>
            <option v-for="reg in regenciesQuery.data.value" :key="reg.id" :value="reg.id">
              {{ reg.name }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Kecamatan" required :error="errors.district_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.district_id"
            :disabled="disabled || !modelValue.regency_id || districtsQuery.isPending.value"
            @change="update('district_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>
              <template v-if="!modelValue.regency_id">Pilih kabupaten dulu</template>
              <template v-else-if="districtsQuery.isPending.value">Memuat…</template>
              <template v-else>Pilih kecamatan</template>
            </option>
            <option v-for="dist in districtsQuery.data.value" :key="dist.id" :value="dist.id">
              {{ dist.name }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Desa/Kelurahan" required :error="errors.village_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.village_id"
            :disabled="disabled || !modelValue.district_id || villagesQuery.isPending.value"
            @change="update('village_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>
              <template v-if="!modelValue.district_id">Pilih kecamatan dulu</template>
              <template v-else-if="villagesQuery.isPending.value">Memuat…</template>
              <template v-else>Pilih desa/kelurahan</template>
            </option>
            <option v-for="vill in villagesQuery.data.value" :key="vill.id" :value="vill.id">
              {{ vill.name }}
            </option>
          </select>
        </template>
      </UiField>
    </div>

    <h3 class="form-step__section-title">Alamat dan koordinat</h3>
    <div class="form-step__grid">
      <UiField label="Alamat lengkap" required :error="errors.alamat_data" class="form-step__full">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="text"
            placeholder="Jl. Contoh No. 1, RT/RW..."
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.alamat_data"
            :disabled="disabled"
            @input="update('alamat_data', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField label="Latitude" required :error="errors.latitude" help="Contoh: -6.917464">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="number"
            step="any"
            placeholder="-6.917464"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.latitude"
            :disabled="disabled"
            @input="update('latitude', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField label="Longitude" required :error="errors.longitude" help="Contoh: 107.619123">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="number"
            step="any"
            placeholder="107.619123"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.longitude"
            :disabled="disabled"
            @input="update('longitude', ($event.target as HTMLInputElement).value)"
          />
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

.form-step__full {
  grid-column: 1 / -1;
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

  .form-step__full {
    grid-column: 1;
  }
}
</style>
