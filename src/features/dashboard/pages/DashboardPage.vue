<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/features/auth'
import { isApiError } from '@/shared/api/error'
import AsyncPanel from '@/shared/components/patterns/AsyncPanel.vue'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatCurrency, formatDate, formatNumber } from '@/shared/formatters'

import { useDashboardQuery } from '../composables/useDashboardQuery'

const auth = useAuthStore()
const { data: dashboard, error, isError, isPending, refetch } = useDashboardQuery()

const panelState = computed(() => {
  if (isPending.value) return 'loading'
  if (isError.value) return 'error'
  return 'success'
})
const errorMessage = computed(() =>
  isApiError(error.value) ? error.value.message : 'Dashboard belum dapat dimuat.',
)
const extendedDashboard = computed(() => {
  const current = dashboard.value
  return current && 'recent_data' in current ? current : undefined
})
const statCards = computed(() => {
  const stats = dashboard.value?.stats
  if (!stats) return []

  return [
    { label: 'Total pembanding', value: formatNumber(stats.total), icon: 'pi pi-database' },
    { label: 'Data bulan ini', value: formatNumber(stats.this_month), icon: 'pi pi-calendar' },
    { label: 'Dengan koordinat', value: formatNumber(stats.with_coords), icon: 'pi pi-map-marker' },
    { label: 'Cakupan provinsi', value: formatNumber(stats.province_count), icon: 'pi pi-map' },
  ]
})
</script>

<template>
  <main id="main-content" class="dashboard-page" tabindex="-1">
    <header class="dashboard-page__heading">
      <div>
        <p class="dashboard-page__context">Ruang kerja</p>
        <h1>Selamat datang, {{ auth.user?.name }}</h1>
        <p>Ringkasan aktivitas data pembanding sesuai akses akun Anda.</p>
      </div>
      <UiStatusBadge v-if="dashboard" tone="success" icon="pi pi-check-circle">
        {{
          dashboard.dashboard_variant === 'data_contributor'
            ? 'Kontributor data'
            : 'Dashboard aktif'
        }}
      </UiStatusBadge>
    </header>

    <AsyncPanel
      :state="panelState"
      error-title="Dashboard gagal dimuat"
      :error-message="errorMessage"
      @retry="refetch()"
    >
      <template #loading>
        <div class="dashboard-page__loading" aria-label="Memuat dashboard" role="status">
          <span class="sr-only">Memuat dashboard</span>
          <UiSurface v-for="index in 4" :key="index" class="dashboard-page__loading-card" />
        </div>
      </template>

      <template v-if="dashboard">
        <UiInlineAlert
          v-if="dashboard.delete_request_alert"
          class="dashboard-page__alert"
          title="Permintaan penghapusan menunggu"
          tone="warning"
        >
          <p>{{ dashboard.delete_request_alert.message }}</p>
        </UiInlineAlert>

        <section class="dashboard-page__stats" aria-label="Statistik pembanding">
          <UiSurface v-for="stat in statCards" :key="stat.label" class="dashboard-page__stat">
            <span class="dashboard-page__stat-icon" aria-hidden="true"
              ><i :class="stat.icon"
            /></span>
            <div>
              <p>{{ stat.label }}</p>
              <strong>{{ stat.value }}</strong>
            </div>
          </UiSurface>
        </section>

        <UiSurface v-if="extendedDashboard" class="dashboard-page__recent">
          <div class="dashboard-page__section-heading">
            <div>
              <h2>Data pembanding terbaru</h2>
              <p>Rekaman yang paling baru ditambahkan ke sistem.</p>
            </div>
            <span>{{ formatNumber(extendedDashboard.recent_data.length) }} rekaman</span>
          </div>

          <DataTableShell
            title="Data pembanding terbaru"
            :state="extendedDashboard.recent_data.length ? 'success' : 'empty'"
            empty-title="Belum ada data terbaru"
            empty-description="Rekaman terbaru akan tampil setelah data pembanding ditambahkan."
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Alamat</th>
                  <th scope="col">Jenis</th>
                  <th scope="col">Tanggal data</th>
                  <th scope="col" class="dashboard-page__number">Harga</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in extendedDashboard.recent_data" :key="item.id">
                  <td>
                    <strong>{{ item.alamat }}</strong>
                    <small>#{{ item.id }}</small>
                  </td>
                  <td>{{ item.jenis_objek }} · {{ item.jenis_listing }}</td>
                  <td>{{ formatDate(item.tanggal) }}</td>
                  <td class="dashboard-page__number">{{ formatCurrency(item.harga) }}</td>
                </tr>
              </tbody>
            </table>
          </DataTableShell>
        </UiSurface>

        <UiSurface v-else class="dashboard-page__session">
          <div>
            <h2>Ringkasan akun kontributor</h2>
            <p>Statistik hanya menampilkan data yang tersedia untuk akun Anda.</p>
          </div>
          <dl>
            <div>
              <dt>Nama</dt>
              <dd>{{ auth.user?.name }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ auth.user?.email }}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{{ auth.roles.join(', ') || 'Tidak ada role' }}</dd>
            </div>
          </dl>
        </UiSurface>
      </template>
    </AsyncPanel>
  </main>
</template>

<style scoped>
.dashboard-page {
  width: min(100% - 32px, 1120px);
  margin-inline: auto;
  padding-block: 40px 64px;
}

.dashboard-page__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.dashboard-page__context {
  margin-bottom: 6px;
  color: var(--color-warning-text);
  font-size: 0.75rem;
  font-weight: 650;
}

.dashboard-page h1 {
  margin-bottom: 10px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.dashboard-page__heading p:last-child,
.dashboard-page__session p,
.dashboard-page__section-heading p {
  margin-bottom: 0;
  color: var(--color-ink-muted);
}

.dashboard-page__loading,
.dashboard-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.dashboard-page__loading-card {
  min-height: 112px;
  background: var(--color-surface-inset);
}

.dashboard-page__alert {
  margin-bottom: 16px;
}

.dashboard-page__stats {
  margin-bottom: 24px;
}

.dashboard-page__stat {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 18px;
}

.dashboard-page__stat-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border-radius: var(--radius-control);
  background: var(--color-brand-amber-soft);
  color: var(--color-warning-text);
}

.dashboard-page__stat p {
  margin-bottom: 2px;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.dashboard-page__stat strong {
  color: var(--color-ink-strong);
  font-size: 1.25rem;
  font-variant-numeric: tabular-nums;
}

.dashboard-page__recent {
  margin-bottom: 24px;
  padding: 24px;
}

.dashboard-page__section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.dashboard-page__section-heading h2 {
  margin-bottom: 4px;
  font-size: 1rem;
}

.dashboard-page__section-heading > span {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.dashboard-page__recent td strong,
.dashboard-page__recent td small {
  display: block;
}

.dashboard-page__recent td strong {
  color: var(--color-ink-strong);
  font-size: 0.8125rem;
}

.dashboard-page__recent td small {
  margin-top: 2px;
  color: var(--color-ink-muted);
}

.dashboard-page__number {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dashboard-page__session {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 1fr);
  gap: 32px;
  padding: 24px;
}

.dashboard-page__session h2 {
  margin-bottom: 8px;
  font-size: 1rem;
}

.dashboard-page dl {
  margin: 0;
  border-top: 1px solid var(--color-border);
}

.dashboard-page dl div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
  border-bottom: 1px solid var(--color-border-soft);
  padding-block: 10px;
}

.dashboard-page dt {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.dashboard-page dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 719px) {
  .dashboard-page__heading,
  .dashboard-page__session {
    display: grid;
    grid-template-columns: 1fr;
  }
}

@media (max-width: 959px) {
  .dashboard-page__loading,
  .dashboard-page__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 479px) {
  .dashboard-page__loading,
  .dashboard-page__stats {
    grid-template-columns: 1fr;
  }
}
</style>
