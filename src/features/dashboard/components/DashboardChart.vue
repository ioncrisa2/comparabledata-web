<script setup lang="ts">
import type { Chart, ChartData } from 'chart.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'

const props = defineProps<{
  data: ChartData<'line'>
  label: string
  percentage?: boolean
}>()
const canvas = ref<HTMLCanvasElement>()
const failed = ref(false)
const loading = ref(true)
let chart: Chart<'line'> | undefined
let disposed = false
let revision = 0

async function render() {
  const current = ++revision
  loading.value = true
  failed.value = false
  try {
    const {
      Chart,
      CategoryScale,
      LinearScale,
      LineController,
      LineElement,
      PointElement,
      Tooltip,
      Legend,
    } = await import('chart.js')
    if (disposed || current !== revision || !canvas.value) return
    Chart.register(
      CategoryScale,
      LinearScale,
      LineController,
      LineElement,
      PointElement,
      Tooltip,
      Legend,
    )
    chart?.destroy()
    const styles = getComputedStyle(canvas.value)
    const ink = styles.getPropertyValue('--color-ink-body').trim()
    const border = styles.getPropertyValue('--color-border-soft').trim()
    chart = new Chart<'line'>(canvas.value, {
      type: 'line',
      data: props.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        color: ink,
        font: { family: styles.fontFamily },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: props.data.datasets.length > 1, position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${new Intl.NumberFormat('id-ID').format(context.parsed.y ?? 0)}${props.percentage ? '%' : ' data'}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: ink, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
          },
          y: {
            beginAtZero: true,
            max: props.percentage ? 100 : undefined,
            grid: { color: border },
            ticks: {
              color: ink,
              precision: 0,
              callback: (value) => `${value}${props.percentage ? '%' : ''}`,
            },
          },
        },
      },
    })
  } catch {
    if (!disposed && current === revision) failed.value = true
  } finally {
    if (!disposed && current === revision) loading.value = false
  }
}

onMounted(render)
watch(() => props.data, render)
onBeforeUnmount(() => {
  disposed = true
  chart?.destroy()
})
</script>

<template>
  <div class="dashboard-chart" :aria-busy="loading">
    <canvas ref="canvas" role="img" :aria-label="label" :hidden="failed" />
    <div v-if="failed" class="dashboard-chart__fallback" role="status">
      <p>Grafik belum dapat ditampilkan. Angka tetap tersedia pada tabel di bawah.</p>
      <UiButton size="sm" @click="render">Muat ulang grafik</UiButton>
    </div>
    <span v-else-if="loading" class="sr-only" role="status">Memuat grafik</span>
  </div>
</template>

<style scoped>
.dashboard-chart {
  position: relative;
  min-width: 0;
  height: 280px;
}
.dashboard-chart__fallback {
  display: grid;
  justify-items: start;
  align-content: center;
  height: 100%;
  gap: 12px;
}
</style>
