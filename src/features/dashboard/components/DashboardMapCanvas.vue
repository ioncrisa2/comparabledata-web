<script setup lang="ts">
import type { CircleMarker, LayerGroup, Map as LeafletMap, TileLayer } from 'leaflet'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'

import type { DashboardPoint } from '../presentation/widgets'

const props = defineProps<{ points: DashboardPoint[]; selectedId: number | null }>()
const emit = defineEmits<{ select: [id: number] }>()
const element = ref<HTMLElement>()
const failed = ref(false)
const loading = ref(true)
const tilesFailed = ref(false)
let leaflet: typeof import('leaflet') | undefined
let map: LeafletMap | undefined
let layer: LayerGroup | undefined
let tiles: TileLayer | undefined
let observer: ResizeObserver | undefined
let disposed = false
const markers = new Map<number, CircleMarker>()

function fitPoints() {
  if (!map || !leaflet || !props.points.length) return
  map.fitBounds(
    leaflet.latLngBounds(props.points.map((point) => [point.latitude, point.longitude])),
    { padding: [32, 32], maxZoom: 14, animate: false },
  )
}

function updateSelection() {
  for (const [id, marker] of markers) {
    const selected = id === props.selectedId
    marker.setStyle({
      color: selected ? '#0F172A' : '#FFFFFF',
      weight: selected ? 3 : 2,
      fillColor: '#B45309',
      fillOpacity: 0.9,
    })
    marker.setRadius(selected ? 10 : 6)
    if (selected) {
      marker.bringToFront().openTooltip()
      map?.panTo(marker.getLatLng(), { animate: false })
    } else marker.closeTooltip()
  }
}

function drawPoints() {
  if (!map || !leaflet) return
  layer?.clearLayers()
  markers.clear()
  layer ??= leaflet.layerGroup().addTo(map)
  for (const point of props.points) {
    // DOM text prevents API-provided addresses from becoming popup HTML.
    const label = document.createElement('span')
    label.textContent = `#${point.id} · ${point.alamat}`
    const marker = leaflet
      .circleMarker([point.latitude, point.longitude], { radius: 6 })
      .bindTooltip(label)
      .on('click', () => emit('select', point.id))
      .addTo(layer)
    markers.set(point.id, marker)
  }
  fitPoints()
  updateSelection()
}

async function initialize() {
  failed.value = false
  loading.value = true
  try {
    const [library] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
    if (disposed || !element.value) return
    leaflet = library
    map?.remove()
    layer = undefined
    map = library.map(element.value, {
      center: [-2.5, 118],
      zoom: 4,
      zoomControl: false,
      preferCanvas: true,
      scrollWheelZoom: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    })
    library.control.zoom({ zoomInTitle: 'Perbesar peta', zoomOutTitle: 'Perkecil peta' }).addTo(map)
    tiles = library
      .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTo(map)
    tiles.on('tileerror', () => {
      tilesFailed.value = true
    })
    observer?.disconnect()
    observer = new ResizeObserver(() => map?.invalidateSize({ animate: false }))
    observer.observe(element.value)
    drawPoints()
  } catch {
    if (!disposed) failed.value = true
  } finally {
    if (!disposed) loading.value = false
  }
}

function retryTiles() {
  tilesFailed.value = false
  tiles?.redraw()
}

onMounted(initialize)
watch(() => props.points, drawPoints)
watch(() => props.selectedId, updateSelection)
onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  map?.remove()
  markers.clear()
})
</script>

<template>
  <div class="dashboard-map-canvas" :aria-busy="loading">
    <div
      ref="element"
      class="dashboard-map-canvas__map"
      role="region"
      aria-label="Peta sebaran data pembanding. Gunakan tombol panah untuk menggeser, plus dan minus untuk zoom. Pilih rekaman melalui daftar lokasi di bawah peta."
    />
    <div v-if="loading || failed" class="dashboard-map-canvas__overlay" role="status">
      <p>
        {{
          failed
            ? 'Peta belum dapat ditampilkan. Data tetap tersedia pada daftar lokasi.'
            : 'Memuat peta sebaran data…'
        }}
      </p>
      <UiButton v-if="failed" size="sm" @click="initialize">Muat ulang peta</UiButton>
    </div>
    <div v-if="tilesFailed && !failed" class="dashboard-map-canvas__notice" role="status">
      <p>Peta dasar gagal dimuat. Titik dan daftar lokasi tetap tersedia.</p>
      <UiButton size="sm" @click="retryTiles">Muat ulang peta dasar</UiButton>
    </div>
    <UiButton
      v-if="!loading && !failed"
      class="dashboard-map-canvas__fit"
      size="sm"
      @click="fitPoints"
      >Lihat semua titik</UiButton
    >
  </div>
</template>

<style scoped>
.dashboard-map-canvas {
  position: relative;
  isolation: isolate;
}
.dashboard-map-canvas__map {
  height: 380px;
  z-index: 0;
  background: var(--color-surface-inset);
  font-family: inherit;
}
.dashboard-map-canvas__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  padding: 24px;
  background: var(--color-surface-inset);
}
.dashboard-map-canvas__notice {
  padding: 12px 16px;
  background: var(--color-brand-amber-soft);
  color: var(--color-warning-text);
}
.dashboard-map-canvas__notice p {
  margin-bottom: 8px;
}
.dashboard-map-canvas__fit {
  position: absolute;
  top: 12px;
  right: 12px;
}
:deep(.leaflet-control-zoom a) {
  width: 36px;
  height: 36px;
  line-height: 36px;
}
@media (pointer: coarse) {
  :deep(.leaflet-control-zoom a) {
    width: 44px;
    height: 44px;
    line-height: 44px;
  }
}
@media (max-width: 479px) {
  .dashboard-map-canvas__map {
    height: 320px;
  }
}
</style>
