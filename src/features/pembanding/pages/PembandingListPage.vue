<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { isApiError } from '@/shared/api/error'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import FilterBar from '@/shared/components/patterns/FilterBar.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiPagination from '@/shared/components/ui/UiPagination.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatCurrency, formatDate, formatNumber } from '@/shared/formatters'

import PembandingExportDialog from '../components/PembandingExportDialog.vue'
import PembandingFilters from '../components/PembandingFilters.vue'
import PembandingImage from '../components/PembandingImage.vue'
import { usePembandingFilters } from '../composables/usePembandingFilters'
import {
  usePembandingCreatorsQuery,
  usePembandingFormOptionsQuery,
  usePembandingListQuery,
} from '../composables/usePembandingQueries'
import { buildActiveFilters, clearFilterPatch } from '../presentation/filters'
import type { PembandingListFilters } from '../types/filters'

const auth = useAuthStore()
const canCreate = computed(() => auth.can('create_data::pembanding'))
const canExport = computed(
  () =>
    auth.can('export_data::pembanding') ||
    auth.can('view_export') ||
    auth.can('view_any_data::pembanding'),
)
const isExportDialogOpen = ref(false)
const { filters, reset, setPage, setPerPage, update } = usePembandingFilters()
const route = useRoute()
const rangeError = computed(() => {
  if (
    filters.value.min_harga !== undefined &&
    filters.value.max_harga !== undefined &&
    filters.value.min_harga > filters.value.max_harga
  ) {
    return 'Harga minimum tidak boleh lebih besar dari harga maksimum.'
  }

  if (
    filters.value.dari_tanggal &&
    filters.value.sampai_tanggal &&
    filters.value.dari_tanggal > filters.value.sampai_tanggal
  ) {
    return 'Tanggal mulai tidak boleh melewati tanggal akhir.'
  }

  return ''
})

const listQuery = usePembandingListQuery(filters, () => !rangeError.value)
const optionsQuery = usePembandingFormOptionsQuery()
const creatorsQuery = usePembandingCreatorsQuery()

const rows = computed(() => listQuery.data.value?.data ?? [])
const meta = computed(() => listQuery.data.value?.meta)
const activeFilters = computed(() =>
  buildActiveFilters(filters.value, optionsQuery.data.value, creatorsQuery.data.value),
)
const tableState = computed(() => {
  if (listQuery.isPending.value) return 'loading'
  if (listQuery.isError.value) return 'error'
  return rows.value.length ? 'success' : 'empty'
})
const stale = computed(() => listQuery.isFetching.value && !listQuery.isPending.value)

function removeFilter(key: string) {
  void update(clearFilterPatch(key as keyof PembandingListFilters))
}
</script>

<template>
  <main id="main-content" class="pembanding-list" tabindex="-1">
    <header class="pembanding-list__heading">
      <div>
        <h1>Data pembanding</h1>
        <p>Telusuri, bandingkan, dan buka rekaman properti berdasarkan data yang terverifikasi.</p>
      </div>
      <div class="pembanding-list__heading-right">
        <div class="pembanding-list__summary" aria-live="polite">
          <span>Jumlah data</span>
          <strong>{{ formatNumber(meta?.total) }}</strong>
        </div>
        <UiButton v-if="canExport" variant="secondary" size="sm" @click="isExportDialogOpen = true">
          <template #icon><i class="pi pi-download" aria-hidden="true" /></template>
          Ekspor
        </UiButton>
        <RouterLink
          v-if="canCreate"
          class="ui-button ui-button--primary ui-button--sm"
          :to="{ name: 'pembanding.create' }"
        >
          <i class="pi pi-plus" aria-hidden="true" />
          Tambah data
        </RouterLink>
      </div>
    </header>

    <UiSurface class="pembanding-list__filters">
      <FilterBar :filters="activeFilters" @remove="removeFilter" @reset="reset">
        <PembandingFilters
          :filters="filters"
          :options="optionsQuery.data.value"
          :creators="creatorsQuery.data.value"
          :options-loading="optionsQuery.isPending.value"
          :disabled="listQuery.isPending.value"
          @change="update"
          @reset="reset"
        />
      </FilterBar>
    </UiSurface>

    <UiInlineAlert
      v-if="rangeError"
      class="pembanding-list__validation"
      title="Filter belum valid"
      tone="warning"
    >
      <p>{{ rangeError }} Sesuaikan rentang untuk menampilkan hasil.</p>
    </UiInlineAlert>

    <UiSurface class="pembanding-list__results">
      <div class="pembanding-list__results-heading">
        <div>
          <h2>Hasil pencarian</h2>
          <p v-if="meta">
            Menampilkan {{ formatNumber(meta.from) }}–{{ formatNumber(meta.to) }} dari
            {{ formatNumber(meta.total) }} data.
          </p>
          <p v-else>Data akan ditampilkan sesuai filter dan hak akses Anda.</p>
        </div>
        <span v-if="stale" class="pembanding-list__refreshing" role="status">
          <i class="pi pi-spinner pi-spin" aria-hidden="true" /> Memperbarui hasil
        </span>
      </div>

      <DataTableShell
        v-if="!rangeError"
        title="Daftar data pembanding"
        :state="tableState"
        :filtered="activeFilters.length > 0"
        empty-title="Tidak ada data yang sesuai"
        empty-description="Ubah atau hapus filter untuk memperluas hasil pencarian."
        @retry="listQuery.refetch()"
      >
        <table>
          <thead>
            <tr>
              <th scope="col" class="pembanding-list__photo-column">Foto</th>
              <th scope="col">Properti dan lokasi</th>
              <th scope="col">Klasifikasi</th>
              <th scope="col">Tanggal</th>
              <th scope="col" class="pembanding-list__numeric">Luas</th>
              <th scope="col" class="pembanding-list__numeric">Harga</th>
              <th scope="col"><span class="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in rows" :key="item.id">
              <td>
                <PembandingImage :src="item.image_url" :alt="`Foto ${item.alamat_data}`" />
              </td>
              <td class="pembanding-list__identity">
                <RouterLink
                  :to="{
                    name: 'pembanding.detail',
                    params: { id: item.id },
                    query: route.query,
                  }"
                >
                  {{ item.alamat_data }}
                </RouterLink>
                <small
                  >{{ item.village.name }}, {{ item.district.name }}, {{ item.regency.name }}</small
                >
                <small>Oleh {{ item.created_by.name }} · #{{ item.id }}</small>
              </td>
              <td>
                <UiStatusBadge :tone="item.is_sewa ? 'info' : 'warning'">
                  {{ item.jenis_listing.name }}
                </UiStatusBadge>
                <span class="pembanding-list__object">{{ item.jenis_objek.name }}</span>
              </td>
              <td>{{ formatDate(item.tanggal_data) }}</td>
              <td class="pembanding-list__numeric">
                <strong>{{ formatNumber(item.luas_tanah) }} m²</strong>
                <small>Bangunan {{ formatNumber(item.luas_bangunan) }} m²</small>
              </td>
              <td
                class="pembanding-list__numeric pembanding-list__price"
                :title="formatCurrency(item.harga, { compact: false })"
              >
                {{ formatCurrency(item.harga) }}
              </td>
              <td class="pembanding-list__action">
                <RouterLink
                  :to="{
                    name: 'pembanding.detail',
                    params: { id: item.id },
                    query: route.query,
                  }"
                  :aria-label="`Buka detail ${item.alamat_data}`"
                >
                  Detail <i class="pi pi-arrow-right" aria-hidden="true" />
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>

        <template v-if="meta" #pagination>
          <UiPagination
            :page="meta.current_page"
            :per-page="meta.per_page"
            :total="meta.total"
            :per-page-options="[25, 50, 100]"
            :disabled="listQuery.isFetching.value"
            @update:page="setPage"
            @update:per-page="setPerPage"
          />
        </template>
      </DataTableShell>

      <UiInlineAlert
        v-if="listQuery.isError.value"
        class="pembanding-list__request-error"
        title="Detail gangguan"
        tone="error"
      >
        <p>
          {{
            isApiError(listQuery.error.value)
              ? listQuery.error.value.message
              : 'Permintaan tidak dapat diselesaikan.'
          }}
        </p>
      </UiInlineAlert>
    </UiSurface>

    <!-- Dialog Ekspor Data Pembanding -->
    <PembandingExportDialog
      :open="isExportDialogOpen"
      :total-items="meta?.total ?? rows.length"
      :filters="filters"
      @update:open="isExportDialogOpen = $event"
    />
  </main>
</template>

<style scoped>
.pembanding-list {
  width: min(100% - 32px, 1280px);
  margin-inline: auto;
  padding-block: 36px 64px;
}

.pembanding-list__heading,
.pembanding-list__results-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.pembanding-list__heading {
  margin-bottom: 24px;
}

.pembanding-list h1 {
  margin-bottom: 8px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.pembanding-list__heading p,
.pembanding-list__results-heading p {
  max-width: 70ch;
  margin: 0;
  color: var(--color-ink-muted);
}

.pembanding-list__heading-right {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-shrink: 0;
}

.pembanding-list__summary {
  display: grid;
  min-width: 112px;
  justify-items: end;
}

.pembanding-list__summary span {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.pembanding-list__summary strong {
  color: var(--color-ink-strong);
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
}

.pembanding-list__filters,
.pembanding-list__results {
  padding: 20px;
}

.pembanding-list__filters {
  margin-bottom: 16px;
}

.pembanding-list__validation {
  margin-bottom: 16px;
}

.pembanding-list__results-heading {
  margin-bottom: 16px;
}

.pembanding-list__results-heading h2 {
  margin-bottom: 4px;
  font-size: 1rem;
}

.pembanding-list__refreshing {
  color: var(--color-info);
  font-size: 0.75rem;
  font-weight: 650;
  white-space: nowrap;
}

.pembanding-list :deep(.data-table-shell__viewport) {
  border-radius: 8px;
}

.pembanding-list :deep(th) {
  position: sticky;
  z-index: 1;
  top: 0;
}

.pembanding-list :deep(td) {
  vertical-align: middle;
}

.pembanding-list__photo-column {
  width: 72px;
}

.pembanding-list__identity {
  min-width: 260px;
}

.pembanding-list__identity a {
  display: block;
  max-width: 42ch;
  color: var(--color-ink-strong);
  font-weight: 700;
  line-height: 1.35;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
}

.pembanding-list__identity a:hover {
  color: var(--color-action-primary);
  text-decoration-color: currentColor;
}

.pembanding-list__identity small,
.pembanding-list__numeric small {
  display: block;
  margin-top: 3px;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}

.pembanding-list__object {
  display: block;
  margin-top: 7px;
  color: var(--color-ink-body);
  font-size: 0.75rem;
}

.pembanding-list__numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.pembanding-list__numeric strong {
  color: var(--color-ink-strong);
  font-size: 0.8125rem;
}

.pembanding-list__price {
  color: var(--color-ink-strong);
  font-weight: 700;
}

.pembanding-list__action {
  text-align: right;
}

.pembanding-list__action a {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 7px;
  color: var(--color-action-primary);
  font-size: 0.75rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.pembanding-list__request-error {
  margin-top: 12px;
}

@media (max-width: 639px) {
  .pembanding-list {
    width: min(100% - 24px, 1280px);
    padding-block: 24px 48px;
  }

  .pembanding-list__heading,
  .pembanding-list__results-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .pembanding-list__summary {
    justify-items: start;
  }

  .pembanding-list__filters,
  .pembanding-list__results {
    padding: 16px;
  }
}
</style>
