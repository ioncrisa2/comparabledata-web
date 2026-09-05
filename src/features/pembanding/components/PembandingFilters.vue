<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { LocationFields, type LocationSelection } from '@/features/reference-data'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import { useDebouncedWatch } from '@/shared/composables/useDebouncedWatch'

import type { PembandingCreator, PembandingFormOptions } from '../api/pembanding.api'
import type { PembandingListFilters } from '../types/filters'

const props = withDefaults(
  defineProps<{
    filters: PembandingListFilters
    options?: PembandingFormOptions
    creators?: PembandingCreator[]
    optionsLoading?: boolean
    disabled?: boolean
  }>(),
  {
    options: undefined,
    creators: () => [],
    optionsLoading: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  change: [patch: Partial<PembandingListFilters>]
  reset: []
}>()

const advancedOpen = ref(
  Boolean(
    props.filters.province_id ||
    props.filters.jenis_listing_id ||
    props.filters.jenis_objek_id ||
    props.filters.created_by ||
    props.filters.dari_tanggal ||
    props.filters.min_harga !== undefined ||
    props.filters.max_harga !== undefined,
  ),
)
const search = ref(props.filters.q)

watch(
  () => props.filters.q,
  (value) => {
    if (value !== search.value) search.value = value
  },
)

useDebouncedWatch(
  search,
  (value) => {
    const q = value.trim()
    if (q !== props.filters.q) emit('change', { q })
  },
  350,
)

const locationSelection = computed<LocationSelection>({
  get: () => ({
    provinceId: props.filters.province_id ?? '',
    regencyId: props.filters.regency_id ?? '',
    districtId: props.filters.district_id ?? '',
    villageId: props.filters.village_id ?? '',
  }),
  set: (selection) => {
    emit('change', {
      province_id: selection.provinceId || undefined,
      regency_id: selection.regencyId || undefined,
      district_id: selection.districtId || undefined,
      village_id: selection.villageId || undefined,
    })
  },
})

const sortValue = computed(() => `${props.filters.sort}:${props.filters.direction}`)

function numericValue(event: Event): number | undefined {
  const value = Number((event.target as HTMLInputElement).value)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

function optionalId(event: Event): number | undefined {
  const value = Number((event.target as HTMLSelectElement).value)
  return Number.isInteger(value) && value > 0 ? value : undefined
}

function dateValue(event: Event): string | undefined {
  return (event.target as HTMLInputElement).value || undefined
}

function updateSort(event: Event) {
  const [sort, direction] = (event.target as HTMLSelectElement).value.split(':')
  if (!sort || (direction !== 'asc' && direction !== 'desc')) return

  emit('change', {
    sort: sort as PembandingListFilters['sort'],
    direction,
  })
}
</script>

<template>
  <div class="pembanding-filters">
    <div class="pembanding-filters__primary">
      <UiField v-slot="field" class="pembanding-filters__search" label="Cari data pembanding">
        <div class="pembanding-filters__search-control">
          <i class="pi pi-search" aria-hidden="true" />
          <input
            :id="field.inputId"
            v-model="search"
            type="search"
            name="q"
            autocomplete="off"
            placeholder="Alamat, wilayah, atau pemberi informasi"
            :aria-describedby="field.describedBy"
            :disabled="disabled"
          />
        </div>
      </UiField>

      <UiField v-slot="field" class="pembanding-filters__sort" label="Urutkan">
        <select
          :id="field.inputId"
          :value="sortValue"
          :aria-describedby="field.describedBy"
          :disabled="disabled"
          @change="updateSort"
        >
          <option value="tanggal_data:desc">Tanggal data terbaru</option>
          <option value="tanggal_data:asc">Tanggal data terlama</option>
          <option value="harga:desc">Harga tertinggi</option>
          <option value="harga:asc">Harga terendah</option>
          <option value="luas_tanah:desc">Luas tanah terbesar</option>
          <option value="luas_tanah:asc">Luas tanah terkecil</option>
          <option value="created_at:desc">Terakhir ditambahkan</option>
        </select>
      </UiField>

      <UiButton
        class="pembanding-filters__toggle"
        :variant="advancedOpen ? 'primary' : 'secondary'"
        @click="advancedOpen = !advancedOpen"
      >
        <template #icon><i class="pi pi-sliders-h" aria-hidden="true" /></template>
        {{ advancedOpen ? 'Tutup filter' : 'Filter lengkap' }}
      </UiButton>
    </div>

    <div v-if="advancedOpen" class="pembanding-filters__advanced">
      <LocationFields v-model="locationSelection" :disabled="disabled" />

      <div class="pembanding-filters__grid">
        <UiField v-slot="field" label="Jenis listing">
          <select
            :id="field.inputId"
            :value="filters.jenis_listing_id ?? ''"
            :disabled="disabled || optionsLoading"
            @change="emit('change', { jenis_listing_id: optionalId($event) })"
          >
            <option value="">Semua jenis listing</option>
            <option
              v-for="option in options?.jenisListings"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </UiField>

        <UiField v-slot="field" label="Jenis objek">
          <select
            :id="field.inputId"
            :value="filters.jenis_objek_id ?? ''"
            :disabled="disabled || optionsLoading"
            @change="emit('change', { jenis_objek_id: optionalId($event) })"
          >
            <option value="">Semua jenis objek</option>
            <option
              v-for="option in options?.jenisObjeks"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </UiField>

        <UiField v-slot="field" label="Pembuat data">
          <select
            :id="field.inputId"
            :value="filters.created_by ?? ''"
            :disabled="disabled"
            @change="emit('change', { created_by: optionalId($event) })"
          >
            <option value="">Semua pembuat</option>
            <option v-for="creator in creators" :key="creator.id" :value="creator.id">
              {{ creator.name }}
            </option>
          </select>
        </UiField>

        <UiField v-slot="field" label="Tanggal mulai">
          <input
            :id="field.inputId"
            type="date"
            :value="filters.dari_tanggal ?? ''"
            :disabled="disabled"
            @change="emit('change', { dari_tanggal: dateValue($event) })"
          />
        </UiField>

        <UiField v-slot="field" label="Tanggal akhir">
          <input
            :id="field.inputId"
            type="date"
            :value="filters.sampai_tanggal ?? ''"
            :disabled="disabled"
            @change="emit('change', { sampai_tanggal: dateValue($event) })"
          />
        </UiField>

        <UiField v-slot="field" label="Harga minimum">
          <input
            :id="field.inputId"
            type="number"
            min="0"
            step="1000000"
            inputmode="numeric"
            :value="filters.min_harga ?? ''"
            :disabled="disabled"
            placeholder="Rp 0"
            @change="emit('change', { min_harga: numericValue($event) })"
          />
        </UiField>

        <UiField v-slot="field" label="Harga maksimum">
          <input
            :id="field.inputId"
            type="number"
            min="0"
            step="1000000"
            inputmode="numeric"
            :value="filters.max_harga ?? ''"
            :disabled="disabled"
            placeholder="Tanpa batas"
            @change="emit('change', { max_harga: numericValue($event) })"
          />
        </UiField>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pembanding-filters {
  width: 100%;
}

.pembanding-filters__primary {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(200px, 240px) auto;
  align-items: end;
  gap: 12px;
}

.pembanding-filters__search-control {
  position: relative;
}

.pembanding-filters__search-control > i {
  position: absolute;
  top: 50%;
  left: 12px;
  color: var(--color-ink-muted);
  translate: 0 -50%;
}

.pembanding-filters__search-control input {
  padding-left: 36px;
}

.pembanding-filters__toggle {
  white-space: nowrap;
}

.pembanding-filters__advanced {
  display: grid;
  gap: 20px;
  border-top: 1px solid var(--color-border-soft);
  margin-top: 16px;
  padding-top: 16px;
}

.pembanding-filters__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 959px) {
  .pembanding-filters__primary {
    grid-template-columns: minmax(0, 1fr) minmax(180px, 220px);
  }

  .pembanding-filters__toggle {
    width: fit-content;
  }

  .pembanding-filters__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .pembanding-filters__primary,
  .pembanding-filters__grid {
    grid-template-columns: 1fr;
  }

  .pembanding-filters__toggle {
    width: 100%;
  }
}
</style>
