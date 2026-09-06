<script setup lang="ts">
import { computed } from 'vue'

import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatNumber, formatPercent } from '@/shared/formatters'

import type { DashboardWidget, ExtendedDashboard } from '../presentation/widgets'
import { widgetAllowed } from '../presentation/widgets'

const props = defineProps<{ dashboard: ExtendedDashboard }>()
type SummaryTable = {
  widget: DashboardWidget
  title: string
  description: string
  column: string
  percentages?: boolean
  rows: { key: string; label: string; count: number; percentage?: number }[]
}
const tables = computed<SummaryTable[]>(() => {
  const data = props.dashboard
  const freshness = data.data_freshness
  return [
    {
      widget: 'topContributorTable',
      title: 'Kontributor teratas',
      description: 'Hingga 10 kontributor dengan jumlah input terbanyak sepanjang waktu.',
      column: 'Kontributor',
      rows: (data.top_contributors ?? []).map((item, index) => ({
        key: String(index),
        label: item.name,
        count: item.total_input,
      })),
    },
    {
      widget: 'dataFreshnessWidget',
      title: 'Keterkinian data',
      description: 'Usia data berdasarkan tanggal data properti, bukan tanggal input.',
      column: 'Usia data',
      percentages: true,
      rows:
        freshness && freshness.total > 0
          ? [
              ...(freshness.buckets ?? []).map((bucket) => ({
                key: bucket.key,
                label: bucket.label,
                count: bucket.count,
                percentage: bucket.percentage,
              })),
              {
                key: 'missing',
                label: 'Tanpa tanggal data',
                count: freshness.missing_date,
                percentage: (freshness.missing_date / freshness.total) * 100,
              },
            ]
          : [],
    },
    {
      widget: 'topAreaActivityTable',
      title: 'Wilayah paling aktif',
      description: `Input per kecamatan · ${data.top_area_activity?.period_label ?? '30 hari terakhir'}.`,
      column: 'Kecamatan',
      percentages: true,
      rows: (data.top_area_activity?.rows ?? []).map((item) => ({
        key: item.district_id,
        label: item.district_name,
        count: item.total_input,
        percentage: item.percentage,
      })),
    },
    {
      widget: 'objectTypeCountTable',
      title: 'Jenis objek pembanding',
      description: 'Distribusi rekaman untuk jenis objek properti yang aktif.',
      column: 'Jenis objek',
      percentages: true,
      rows: (data.object_type_counts?.rows ?? []).map((item) => ({
        key: String(item.id),
        label: item.name,
        count: item.total_input,
        percentage: item.percentage,
      })),
    },
  ] satisfies SummaryTable[]
})
const visibleTables = computed(() =>
  tables.value.filter((table) => widgetAllowed(props.dashboard, table.widget)),
)
</script>

<template>
  <div v-if="visibleTables.length" class="dashboard-breakdowns">
    <UiSurface
      v-for="table in visibleTables"
      :key="table.widget"
      class="dashboard-breakdowns__panel"
    >
      <header>
        <h2>{{ table.title }}</h2>
        <p>{{ table.description }}</p>
      </header>
      <DataTableShell
        :title="table.title"
        :state="table.rows.length ? 'success' : 'empty'"
        empty-title="Belum ada data ringkasan"
        empty-description="Ringkasan akan tampil setelah data yang sesuai tersedia."
      >
        <table>
          <caption class="sr-only">
            {{
              table.title
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ table.column }}</th>
              <th scope="col">Jumlah</th>
              <th v-if="table.percentages" scope="col">Proporsi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in table.rows" :key="row.key">
              <th scope="row">{{ row.label }}</th>
              <td>{{ formatNumber(row.count) }}</td>
              <td v-if="table.percentages">{{ formatPercent((row.percentage ?? 0) / 100) }}</td>
            </tr>
          </tbody>
        </table>
      </DataTableShell>
    </UiSurface>
  </div>
</template>

<style scoped>
.dashboard-breakdowns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  gap: 24px;
  margin-bottom: 24px;
}
.dashboard-breakdowns__panel {
  min-width: 0;
  padding: 24px;
}
h2 {
  margin-bottom: 6px;
  font-size: 1rem;
}
header p {
  color: var(--color-ink-muted);
  margin-bottom: 20px;
}
th:not(:first-child),
td {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
tbody th {
  font-weight: 500;
}
.dashboard-breakdowns__panel :deep(table) {
  min-width: 0;
}
.dashboard-breakdowns__panel :deep(tbody th) {
  background: transparent;
  color: var(--color-ink-body);
  font-weight: 500;
  overflow-wrap: anywhere;
}
.dashboard-breakdowns__panel :deep(th),
.dashboard-breakdowns__panel :deep(td) {
  padding: 10px 8px;
}
@media (max-width: 479px) {
  .dashboard-breakdowns__panel {
    padding: 16px;
  }
}
</style>
