<script setup lang="ts">
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiField from '@/shared/components/ui/UiField.vue'

import { type LocationSelection, useCascadingLocation } from '../composables/useCascadingLocation'

withDefaults(
  defineProps<{
    required?: boolean
    disabled?: boolean
  }>(),
  {
    required: false,
    disabled: false,
  },
)

const selection = defineModel<LocationSelection>({ required: true })
const location = useCascadingLocation(selection)

function selectedValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function queryErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : 'Data lokasi belum dapat dimuat.'
}
</script>

<template>
  <div class="location-fields">
    <UiField
      v-slot="field"
      label="Provinsi"
      :required="required"
      :error="
        location.provinces.isError.value
          ? queryErrorMessage(location.provinces.error.value)
          : undefined
      "
    >
      <select
        :id="field.inputId"
        :value="selection.provinceId"
        :aria-describedby="field.describedBy"
        :aria-invalid="field.invalid || undefined"
        :disabled="disabled || location.provinces.isPending.value"
        :required="required"
        @change="location.setProvince(selectedValue($event))"
      >
        <option value="">
          {{ location.provinces.isPending.value ? 'Memuat provinsi…' : 'Pilih provinsi' }}
        </option>
        <option
          v-for="province in location.provinces.data.value"
          :key="province.id"
          :value="province.id"
        >
          {{ province.name }}
        </option>
      </select>
      <UiButton
        v-if="location.provinces.isError.value"
        class="location-fields__retry"
        size="sm"
        @click="location.provinces.refetch()"
      >
        Muat ulang provinsi
      </UiButton>
    </UiField>

    <UiField
      v-slot="field"
      label="Kabupaten/kota"
      :required="required"
      :help="!selection.provinceId ? 'Pilih provinsi terlebih dahulu.' : undefined"
      :error="
        location.regencies.isError.value
          ? queryErrorMessage(location.regencies.error.value)
          : undefined
      "
    >
      <select
        :id="field.inputId"
        :value="selection.regencyId"
        :aria-describedby="field.describedBy"
        :aria-invalid="field.invalid || undefined"
        :disabled="disabled || !selection.provinceId || location.regencies.isPending.value"
        :required="required"
        @change="location.setRegency(selectedValue($event))"
      >
        <option value="">
          {{
            location.regencies.isFetching.value ? 'Memuat kabupaten/kota…' : 'Pilih kabupaten/kota'
          }}
        </option>
        <option
          v-for="regency in location.regencies.data.value"
          :key="regency.id"
          :value="regency.id"
        >
          {{ regency.name }}
        </option>
      </select>
      <UiButton
        v-if="location.regencies.isError.value"
        class="location-fields__retry"
        size="sm"
        @click="location.regencies.refetch()"
      >
        Muat ulang kabupaten/kota
      </UiButton>
    </UiField>

    <UiField
      v-slot="field"
      label="Kecamatan"
      :required="required"
      :help="!selection.regencyId ? 'Pilih kabupaten/kota terlebih dahulu.' : undefined"
      :error="
        location.districts.isError.value
          ? queryErrorMessage(location.districts.error.value)
          : undefined
      "
    >
      <select
        :id="field.inputId"
        :value="selection.districtId"
        :aria-describedby="field.describedBy"
        :aria-invalid="field.invalid || undefined"
        :disabled="disabled || !selection.regencyId || location.districts.isPending.value"
        :required="required"
        @change="location.setDistrict(selectedValue($event))"
      >
        <option value="">
          {{ location.districts.isFetching.value ? 'Memuat kecamatan…' : 'Pilih kecamatan' }}
        </option>
        <option
          v-for="district in location.districts.data.value"
          :key="district.id"
          :value="district.id"
        >
          {{ district.name }}
        </option>
      </select>
      <UiButton
        v-if="location.districts.isError.value"
        class="location-fields__retry"
        size="sm"
        @click="location.districts.refetch()"
      >
        Muat ulang kecamatan
      </UiButton>
    </UiField>

    <UiField
      v-slot="field"
      label="Desa/kelurahan"
      :required="required"
      :help="!selection.districtId ? 'Pilih kecamatan terlebih dahulu.' : undefined"
      :error="
        location.villages.isError.value
          ? queryErrorMessage(location.villages.error.value)
          : undefined
      "
    >
      <select
        :id="field.inputId"
        :value="selection.villageId"
        :aria-describedby="field.describedBy"
        :aria-invalid="field.invalid || undefined"
        :disabled="disabled || !selection.districtId || location.villages.isPending.value"
        :required="required"
        @change="location.setVillage(selectedValue($event))"
      >
        <option value="">
          {{
            location.villages.isFetching.value ? 'Memuat desa/kelurahan…' : 'Pilih desa/kelurahan'
          }}
        </option>
        <option
          v-for="village in location.villages.data.value"
          :key="village.id"
          :value="village.id"
        >
          {{ village.name }}
        </option>
      </select>
      <UiButton
        v-if="location.villages.isError.value"
        class="location-fields__retry"
        size="sm"
        @click="location.villages.refetch()"
      >
        Muat ulang desa/kelurahan
      </UiButton>
    </UiField>
  </div>
</template>

<style scoped>
.location-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.location-fields__retry {
  width: fit-content;
  margin-top: 8px;
}

@media (max-width: 639px) {
  .location-fields {
    grid-template-columns: 1fr;
  }
}
</style>
