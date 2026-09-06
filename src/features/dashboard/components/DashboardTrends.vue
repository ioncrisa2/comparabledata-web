<script setup lang="ts">
import type { ChartData } from 'chart.js'
import { computed } from 'vue'

import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatNumber } from '@/shared/formatters'

import type { ExtendedDashboard } from '../presentation/widgets'
import { widgetAllowed } from '../presentation/widgets'
import DashboardChart from './DashboardChart.vue'

const props = defineProps<{ dashboard: ExtendedDashboard }>()
const monthly = computed(() => props.dashboard.monthly_data ?? [])
const composition = computed(() => props.dashboard.listing_ratio_monthly)
const total = computed(() => monthly.value.reduce((sum, item) => sum + item.count, 0))
const trend = computed<ChartData<'line'>>(() => ({
  labels: monthly.value.map((item) => item.month),
  datasets: [
    {
      label: 'Input pembanding',
      data: monthly.value.map((item) => item.count),
      borderColor: '#B45309',
      backgroundColor: '#B45309',
      pointRadius: 3,
      borderWidth: 2,
      tension: 0.2,
    },
  ],
}))
const colors = ['#B45309', '#334155', '#7C3AED', '#0E7490', '#9F1239']
const ratios = computed<ChartData<'line'>>(() => ({
  labels: composition.value?.labels ?? [],
  datasets: (composition.value?.series ?? []).map((series, index) => ({
    label: series.name,
    data: series.ratios,
    borderColor: colors[index % colors.length],
    backgroundColor: colors[index % colors.length],
    borderDash: index ? [index * 3, 3] : [],
    pointStyle: (['circle', 'rect', 'triangle', 'cross', 'star'] as const)[index % 5],
    pointRadius: 3,
    borderWidth: 2,
    tension: 0.2,
  })),
}))
</script>

<template>
  <div class="dashboard-trends">
    <UiSurface
      v-if="widgetAllowed(dashboard, 'dataEntryTrendChart')"
      class="dashboard-trends__panel"
    >
      <header>
        <h2>Tren input data pembanding</h2>
        <p>Jumlah rekaman yang ditambahkan setiap bulan, berdasarkan tanggal input.</p>
      </header>
      <template v-if="monthly.length">
        <p class="dashboard-trends__summary">
          <strong>{{ formatNumber(total) }} data</strong> selama {{ monthly.length }} bulan yang
          ditampilkan.
        </p>
        <DashboardChart
          :data="trend"
          :label="`Tren input pembanding, total ${formatNumber(total)} data. Rincian tersedia pada tabel tren bulanan.`"
        />
        <details>
          <summary>Lihat tabel tren bulanan</summary>
          <div
            class="dashboard-trends__table"
            tabindex="0"
            role="region"
            aria-label="Tabel tren bulanan"
          >
            <table>
              <caption class="sr-only">
                Jumlah input pembanding per bulan
              </caption>
              <thead>
                <tr>
                  <th scope="col">Bulan</th>
                  <th scope="col">Jumlah input</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in monthly" :key="item.month">
                  <th scope="row">{{ item.month }}</th>
                  <td>{{ formatNumber(item.count) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </template>
      <UiEmptyState
        v-else
        title="Belum ada tren input"
        description="Tren akan tersedia setelah data bulanan diterima."
        icon="pi pi-chart-line"
      />
    </UiSurface>

    <UiSurface
      v-if="widgetAllowed(dashboard, 'listingCompositionChart')"
      class="dashboard-trends__panel"
    >
      <header>
        <h2>Komposisi jenis listing</h2>
        <p>Proporsi bulanan hingga lima jenis listing dengan input terbanyak.</p>
      </header>
      <template v-if="composition?.labels.length && composition.series.length">
        <p class="dashboard-trends__summary">
          Persentase dihitung dari seluruh data yang memiliki jenis listing. Total persentase yang
          ditampilkan per bulan dapat kurang dari 100%.
        </p>
        <DashboardChart
          :data="ratios"
          percentage
          label="Persentase jenis listing per bulan. Rincian jumlah dan persentase tersedia pada tabel komposisi listing."
        />
        <details>
          <summary>Lihat tabel komposisi listing</summary>
          <div
            class="dashboard-trends__table"
            tabindex="0"
            role="region"
            aria-label="Tabel komposisi listing"
          >
            <table>
              <caption class="sr-only">
                Komposisi jenis listing per bulan
              </caption>
              <thead>
                <tr>
                  <th scope="col">Bulan</th>
                  <th v-for="series in composition.series" :key="series.id" scope="col">
                    {{ series.name }}
                  </th>
                  <th scope="col">Total semua listing</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(month, index) in composition.labels" :key="month">
                  <th scope="row">{{ month }}</th>
                  <td v-for="series in composition.series" :key="series.id">
                    {{ formatNumber(series.counts[index]) }} ({{
                      formatNumber(series.ratios[index])
                    }}%)
                  </td>
                  <td>{{ formatNumber(composition.month_totals[index]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </template>
      <UiEmptyState
        v-else
        title="Belum ada komposisi listing"
        description="Grafik akan tersedia setelah data dengan jenis listing diterima."
        icon="pi pi-chart-line"
      />
    </UiSurface>
  </div>
</template>

<style scoped>
.dashboard-trends {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  gap: 24px;
  margin-bottom: 24px;
}
.dashboard-trends__panel {
  min-width: 0;
  padding: 24px;
}
h2 {
  margin-bottom: 6px;
  font-size: 1rem;
}
header p,
.dashboard-trends__summary {
  color: var(--color-ink-muted);
}
.dashboard-trends__summary {
  margin-block: 18px;
  font-size: 0.8125rem;
}
.dashboard-trends__summary strong {
  color: var(--color-ink-strong);
}
details {
  margin-top: 20px;
  border-top: 1px solid var(--color-border-soft);
}
summary {
  padding-block: 14px;
  cursor: pointer;
  font-weight: 650;
}
.dashboard-trends__table {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
th:first-child {
  text-align: left;
}
thead {
  background: var(--color-canvas);
}
@media (max-width: 479px) {
  .dashboard-trends__panel {
    padding: 16px;
  }
}
</style>
