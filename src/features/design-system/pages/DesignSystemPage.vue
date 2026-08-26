<script setup lang="ts">
import { ref } from 'vue'

import AsyncPanel from '@/shared/components/patterns/AsyncPanel.vue'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import FilterBar, { type ActiveFilter } from '@/shared/components/patterns/FilterBar.vue'
import FormActions from '@/shared/components/patterns/FormActions.vue'
import PermissionGate from '@/shared/components/patterns/PermissionGate.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiIconButton from '@/shared/components/ui/UiIconButton.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiPagination from '@/shared/components/ui/UiPagination.vue'
import UiSectionHeader from '@/shared/components/ui/UiSectionHeader.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { useRoutePagination } from '@/shared/composables/useRoutePagination'
import { formatCurrency, formatDate, formatPercent, formatPhone } from '@/shared/formatters'

const showDialog = ref(false)
const saving = ref(false)
const dirty = ref(true)
const filters = ref<ActiveFilter[]>([
  { key: 'city', label: 'Kota', value: 'Bandung' },
  { key: 'status', label: 'Status', value: 'Aktif' },
])
const { page, perPage, setPage, setPerPage } = useRoutePagination(10)

const rows = [
  { name: 'Ruko Braga', city: 'Bandung', price: 4200000000, status: 'Terverifikasi' },
  { name: 'Gudang Soekarno Hatta', city: 'Bandung', price: 8900000000, status: 'Ditinjau' },
  { name: 'Lahan Ciumbuleuit', city: 'Bandung', price: 12750000000, status: 'Baru' },
]

function removeFilter(key: string) {
  filters.value = filters.value.filter((filter) => filter.key !== key)
}

function simulateSave() {
  saving.value = true
  window.setTimeout(() => {
    saving.value = false
    dirty.value = false
  }, 500)
}
</script>

<template>
  <main id="main-content" class="design-system" tabindex="-1">
    <header class="design-system__hero">
      <div>
        <p class="design-system__eyebrow">HJAR interface foundation / internal</p>
        <h1>Design system yang tenang untuk kerja operasional.</h1>
        <p>
          Referensi hidup untuk state, responsivitas, aksesibilitas, dan pola interaksi yang dipakai
          seluruh feature.
        </p>
      </div>
      <UiStatusBadge tone="success" icon="pi pi-check-circle">Siap dipakai</UiStatusBadge>
    </header>

    <section class="design-system__section" aria-label="Actions dan status">
      <UiSectionHeader
        title="Actions & status"
        description="Kontras, label, dan state tetap eksplisit—warna hanya sinyal tambahan."
      >
        <template #actions>
          <UiIconButton label="Buka bantuan" icon="pi pi-question-circle" />
        </template>
      </UiSectionHeader>
      <div class="design-system__row">
        <UiButton variant="primary">Simpan data</UiButton>
        <UiButton>Bandingkan</UiButton>
        <UiButton variant="ghost">Batalkan</UiButton>
        <UiButton variant="danger" @click="showDialog = true">Hapus data</UiButton>
        <UiButton loading variant="primary">Menyimpan</UiButton>
        <UiButton disabled>Nonaktif</UiButton>
      </div>
      <div class="design-system__row">
        <UiStatusBadge>Belum diproses</UiStatusBadge>
        <UiStatusBadge tone="info" icon="pi pi-eye">Ditinjau</UiStatusBadge>
        <UiStatusBadge tone="success" icon="pi pi-check-circle">Terverifikasi</UiStatusBadge>
        <UiStatusBadge tone="warning" icon="pi pi-clock">Menunggu</UiStatusBadge>
        <UiStatusBadge tone="danger" icon="pi pi-times-circle">Ditolak</UiStatusBadge>
      </div>
    </section>

    <section class="design-system__section" aria-label="Field dan pesan">
      <UiSectionHeader
        title="Fields & feedback"
        description="Bantuan, validasi, dan nama kontrol terhubung bagi pembaca layar."
      />
      <div class="design-system__fields">
        <UiField label="Nama properti" help="Gunakan nama yang mudah dikenali oleh tim." required>
          <template #default="{ inputId, describedBy, invalid }">
            <input
              :id="inputId"
              placeholder="Contoh: Ruko Braga"
              :aria-describedby="describedBy"
              :aria-invalid="invalid"
            />
          </template>
        </UiField>
        <UiField label="Harga penawaran" error="Harga wajib lebih besar dari nol." required>
          <template #default="{ inputId, describedBy, invalid }">
            <input
              :id="inputId"
              value="0"
              inputmode="numeric"
              :aria-describedby="describedBy"
              :aria-invalid="invalid"
            />
          </template>
        </UiField>
      </div>
      <div class="design-system__alerts">
        <UiInlineAlert title="Informasi diperbarui" tone="info"
          >Sinkronisasi terakhir 2 menit lalu.</UiInlineAlert
        >
        <UiInlineAlert title="Data berhasil disimpan" tone="success"
          >Perubahan sudah tersedia untuk tim.</UiInlineAlert
        >
        <UiInlineAlert title="Perlu pemeriksaan" tone="warning"
          >Dua field belum diverifikasi.</UiInlineAlert
        >
        <UiInlineAlert title="Gagal mengambil data" tone="error"
          >Koneksi terputus. Coba kembali.</UiInlineAlert
        >
      </div>
    </section>

    <section class="design-system__section" aria-label="Async dan empty states">
      <UiSectionHeader
        title="Async & empty states"
        description="Setiap jalur data memiliki state yang lengkap."
      />
      <div class="design-system__async-grid">
        <UiSurface inset>
          <h3>Loading</h3>
          <AsyncPanel state="loading" />
        </UiSurface>
        <UiSurface inset>
          <h3>Error & retry</h3>
          <AsyncPanel state="error" />
        </UiSurface>
        <UiSurface inset>
          <UiEmptyState
            title="Tidak ada hasil"
            description="Ubah atau hapus filter untuk memperluas hasil."
            filtered
          >
            <template #actions><UiButton size="sm">Hapus filter</UiButton></template>
          </UiEmptyState>
        </UiSurface>
      </div>
    </section>

    <section class="design-system__section" aria-label="Filter dan data table">
      <UiSectionHeader
        title="Data workspace"
        description="Filter aktif, tabel responsif, dan pagination berbagi pola yang sama."
      />
      <UiSurface>
        <DataTableShell state="success" title="Daftar pembanding">
          <template #toolbar>
            <FilterBar :filters="filters" @remove="removeFilter" @reset="filters = []">
              <UiButton size="sm"
                ><template #icon><i class="pi pi-filter" aria-hidden="true" /></template
                >Filter</UiButton
              >
            </FilterBar>
          </template>
          <table>
            <thead>
              <tr>
                <th>Properti</th>
                <th>Wilayah</th>
                <th>Harga</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.name">
                <td>
                  <strong>{{ row.name }}</strong>
                </td>
                <td>{{ row.city }}</td>
                <td>{{ formatCurrency(row.price) }}</td>
                <td>
                  <UiStatusBadge tone="success" icon="pi pi-check-circle">{{
                    row.status
                  }}</UiStatusBadge>
                </td>
              </tr>
            </tbody>
          </table>
          <template #pagination>
            <UiPagination
              :page="page"
              :per-page="perPage"
              :total="38"
              @update:page="setPage"
              @update:per-page="setPerPage"
            />
          </template>
        </DataTableShell>
      </UiSurface>
    </section>

    <section class="design-system__section" aria-label="Form dan formatter">
      <UiSectionHeader
        title="Form behavior & domain format"
        description="Perubahan belum tersimpan terlihat jelas dan submit tidak dapat terpicu ganda."
      />
      <UiSurface class="design-system__form">
        <dl class="design-system__formats">
          <div>
            <dt>Nilai aset</dt>
            <dd>{{ formatCurrency(4250000000) }}</dd>
          </div>
          <div>
            <dt>Yield</dt>
            <dd>{{ formatPercent(0.0875) }}</dd>
          </div>
          <div>
            <dt>Tanggal survei</dt>
            <dd>{{ formatDate('2026-08-26') }}</dd>
          </div>
          <div>
            <dt>Kontak</dt>
            <dd>{{ formatPhone('081234567890') }}</dd>
          </div>
        </dl>
        <FormActions
          :dirty="dirty"
          :loading="saving"
          @submit="simulateSave"
          @cancel="dirty = false"
        />
      </UiSurface>
    </section>

    <section class="design-system__section" aria-label="Permission dan skeleton">
      <UiSectionHeader title="Permission & loading primitives" />
      <div class="design-system__row">
        <PermissionGate :allowed="false" :hide-when-denied="false" />
        <PermissionGate allowed><UiButton size="sm">Aksi berizin</UiButton></PermissionGate>
        <UiSkeleton width="160px" height="12px" />
        <UiSkeleton width="40px" height="40px" rounded />
      </div>
    </section>

    <UiConfirmDialog
      v-model:open="showDialog"
      title="Hapus data pembanding?"
      description="Tindakan ini tidak dapat dibatalkan. Data akan hilang dari workspace tim."
      confirm-label="Ya, hapus"
      confirm-variant="danger"
      @confirm="showDialog = false"
    />
  </main>
</template>

<style scoped>
.design-system {
  width: min(100% - 32px, 1120px);
  margin-inline: auto;
  padding-block: 32px 80px;
}
.design-system__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  border-bottom: 1px solid var(--color-border);
  padding-block: 28px 48px;
}
.design-system__eyebrow {
  margin-bottom: 8px;
  color: var(--color-warning-text);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.design-system__hero h1 {
  max-width: 19ch;
  margin-bottom: 12px;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  line-height: 1.1;
  letter-spacing: -0.035em;
}
.design-system__hero p:last-child {
  max-width: 65ch;
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 1rem;
}
.design-system__section {
  display: grid;
  gap: 18px;
  border-bottom: 1px solid var(--color-border-soft);
  padding-block: 32px;
}
.design-system__row,
.design-system__alerts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.design-system__fields,
.design-system__async-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.design-system__alerts > * {
  flex: 1 1 260px;
}
.design-system__async-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.design-system__async-grid h3 {
  margin-bottom: 14px;
  font-size: 0.875rem;
}
.design-system__form {
  display: grid;
  gap: 24px;
}
.design-system__formats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}
.design-system__formats dt {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}
.design-system__formats dd {
  margin: 3px 0 0;
  color: var(--color-ink-strong);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 767px) {
  .design-system__async-grid,
  .design-system__formats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 639px) {
  .design-system {
    width: min(100% - 24px, 1120px);
    padding-block: 12px 56px;
  }
  .design-system__hero {
    flex-direction: column;
    padding-block: 24px 36px;
  }
  .design-system__fields,
  .design-system__async-grid,
  .design-system__formats {
    grid-template-columns: 1fr;
  }
}
</style>
