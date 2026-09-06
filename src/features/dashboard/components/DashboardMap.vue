<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatCurrency, formatDate, formatNumber } from '@/shared/formatters'

import type { DashboardData } from '../api/dashboard.api'
import { capabilityGranted, validMapPoints } from '../presentation/widgets'
import DashboardMapCanvas from './DashboardMapCanvas.vue'

const props = defineProps<{ dashboard: DashboardData }>()
const route = useRoute()
const router = useRouter()
const listingId = computed({
  get: () =>
    typeof route.query.map_listing === 'string' && /^\d+$/.test(route.query.map_listing)
      ? route.query.map_listing
      : '',
  set: (value: string) => {
    void router.push({ query: { ...route.query, map_listing: value || undefined } })
  },
})
const selectedId = ref<number | null>(null)
const page = ref(1)
const pageSize = 10
const validPoints = computed(() => validMapPoints(props.dashboard.map_points ?? []))
const points = computed(() =>
  validPoints.value.filter(
    (point) => !listingId.value || String(point.jenis_listing_id) === listingId.value,
  ),
)
const selected = computed(() => points.value.find((point) => point.id === selectedId.value))
const pageCount = computed(() => Math.max(1, Math.ceil(points.value.length / pageSize)))
const visiblePoints = computed(() =>
  points.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)
const invalidCount = computed(
  () => (props.dashboard.map_points?.length ?? 0) - validPoints.value.length,
)
const listingOptions = computed(() => {
  const options = new Map(
    (props.dashboard.jenis_listing_options ?? []).map((option) => [
      String(option.value),
      option.label,
    ]),
  )
  for (const point of validPoints.value) {
    if (point.jenis_listing_id !== null && !options.has(String(point.jenis_listing_id)))
      options.set(
        String(point.jenis_listing_id),
        point.jenis_listing || `Listing ${point.jenis_listing_id}`,
      )
  }
  return [...options].map(([value, label]) => ({ value, label }))
})

function selectPoint(id: number) {
  selectedId.value = id
  const index = points.value.findIndex((point) => point.id === id)
  if (index >= 0) page.value = Math.floor(index / pageSize) + 1
}

watch(points, () => {
  page.value = Math.min(page.value, pageCount.value)
  if (!selected.value) selectedId.value = null
})
watch(listingId, () => {
  page.value = 1
  selectedId.value = null
})
</script>

<template>
  <UiSurface class="dashboard-map">
    <header class="dashboard-map__heading">
      <div>
        <h2>Peta sebaran data</h2>
        <p>Jelajahi lokasi pembanding dan pilih titik untuk melihat ringkasannya.</p>
      </div>
      <UiField for="dashboard-map-listing" label="Jenis listing pada peta">
        <select id="dashboard-map-listing" v-model="listingId">
          <option value="">Semua jenis listing</option>
          <option v-for="option in listingOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </UiField>
    </header>
    <p class="dashboard-map__count" role="status">
      {{ formatNumber(points.length) }} titik ditampilkan<span v-if="invalidCount">
        · {{ formatNumber(invalidCount) }} koordinat tidak valid tidak ditampilkan</span
      >
    </p>
    <DashboardMapCanvas
      v-if="points.length"
      :points="points"
      :selected-id="selectedId"
      @select="selectPoint"
    />
    <UiEmptyState
      v-else
      class="dashboard-map__empty"
      :title="
        listingId ? 'Tidak ada titik untuk jenis listing ini' : 'Belum ada lokasi untuk ditampilkan'
      "
      description="Peta hanya menampilkan rekaman dengan koordinat valid yang dikirim oleh dashboard."
      :filtered="Boolean(listingId)"
      icon="pi pi-map-marker"
    >
      <template v-if="listingId" #actions
        ><UiButton @click="listingId = ''">Tampilkan semua listing</UiButton></template
      >
    </UiEmptyState>

    <section
      v-if="selected"
      class="dashboard-map__selection"
      aria-label="Lokasi terpilih"
      aria-live="polite"
    >
      <div>
        <h3>{{ selected.alamat }}</h3>
        <p>
          #{{ selected.id }} · {{ selected.jenis_listing || 'Jenis listing belum diisi' }} ·
          {{ formatDate(selected.tanggal) }}
        </p>
        <strong>{{ formatCurrency(selected.harga) }}</strong>
      </div>
      <RouterLink
        v-if="capabilityGranted(dashboard.can?.viewData)"
        :to="{ name: 'pembanding.detail', params: { id: selected.id } }"
        >Lihat detail pembanding <i class="pi pi-arrow-right" aria-hidden="true"
      /></RouterLink>
    </section>

    <details v-if="points.length" class="dashboard-map__locations">
      <summary>Lihat daftar lokasi ({{ formatNumber(points.length) }})</summary>
      <p>Pilih lokasi melalui daftar untuk menyorot titik pada peta.</p>
      <ul>
        <li v-for="point in visiblePoints" :key="point.id">
          <button
            type="button"
            :aria-pressed="selectedId === point.id"
            @click="selectPoint(point.id)"
          >
            <strong>{{ point.alamat }}</strong
            ><span
              >#{{ point.id }} · {{ point.jenis_listing || 'Tanpa jenis listing' }} ·
              {{ point.latitude }}, {{ point.longitude }}</span
            >
          </button>
        </li>
      </ul>
      <nav
        v-if="pageCount > 1"
        class="dashboard-map__pagination"
        aria-label="Halaman daftar lokasi"
      >
        <UiButton size="sm" :disabled="page === 1" @click="page--">Sebelumnya</UiButton
        ><span role="status">{{ page }} / {{ pageCount }}</span
        ><UiButton size="sm" :disabled="page === pageCount" @click="page++">Berikutnya</UiButton>
      </nav>
    </details>
  </UiSurface>
</template>

<style scoped>
.dashboard-map {
  min-width: 0;
  margin-bottom: 24px;
  overflow: hidden;
  padding: 0;
}
.dashboard-map__heading {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 24px;
  padding: 24px 24px 0;
}
h2 {
  margin-bottom: 6px;
  font-size: 1rem;
}
.dashboard-map__heading p,
.dashboard-map__count,
.dashboard-map__locations > p {
  color: var(--color-ink-muted);
}
.dashboard-map__heading :deep(.ui-field) {
  min-width: 210px;
}
select {
  width: 100%;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink-body);
}
.dashboard-map__count {
  margin: 0;
  padding: 0 24px 16px;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.dashboard-map__empty {
  margin-inline: 24px;
}
.dashboard-map__selection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: var(--color-brand-amber-soft);
}
.dashboard-map__selection h3 {
  margin-bottom: 4px;
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}
.dashboard-map__selection p {
  margin-bottom: 6px;
  font-size: 0.8125rem;
}
.dashboard-map__selection a {
  flex-shrink: 0;
  font-weight: 650;
}
.dashboard-map__locations {
  padding: 0 24px;
  border-top: 1px solid var(--color-border-soft);
}
summary {
  padding-block: 16px;
  font-weight: 650;
  cursor: pointer;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
li {
  border-top: 1px solid var(--color-border-soft);
}
li button {
  display: grid;
  gap: 4px;
  width: 100%;
  min-height: 44px;
  padding: 12px 8px;
  border: 0;
  background: transparent;
  color: var(--color-ink-body);
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}
li button:hover {
  background: var(--color-canvas);
}
li button[aria-pressed='true'] {
  background: var(--color-brand-amber-soft);
}
li span {
  font-size: 0.75rem;
  color: var(--color-ink-muted);
}
.dashboard-map__pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-block: 16px;
}
@media (max-width: 639px) {
  .dashboard-map__heading,
  .dashboard-map__selection {
    flex-direction: column;
    padding-inline: 16px;
  }
  .dashboard-map__heading :deep(.ui-field) {
    width: 100%;
  }
  .dashboard-map__count,
  .dashboard-map__locations {
    padding-inline: 16px;
  }
}
</style>
