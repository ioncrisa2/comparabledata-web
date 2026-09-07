<script setup lang="ts">
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatCurrency } from '@/shared/formatters'

import { usePembandingHistoryQuery } from '../composables/usePembandingQueries'
import type { PembandingHistory } from '../types/history'

const props = defineProps<{ pembandingId: string }>()
const history = usePembandingHistoryQuery(() => props.pembandingId)
const events: Record<string, string> = {
  created: 'Data ditambahkan',
  updated: 'Data diubah',
  deleted: 'Data dihapus',
  restored: 'Data dipulihkan',
}

const fields: Record<string, string> = {
  alamat_data: 'Alamat',
  harga: 'Harga',
  catatan: 'Catatan',
  image: 'Foto',
  luas_tanah: 'Luas tanah',
  luas_bangunan: 'Luas bangunan',
  tahun_bangun: 'Tahun bangun',
  lebar_depan: 'Lebar depan',
  lebar_jalan: 'Lebar jalan',
  rasio_tapak: 'Rasio tapak',
  latitude: 'Latitude',
  longitude: 'Longitude',
  tanggal_data: 'Tanggal data',
  nama_pemberi_informasi: 'Nama pemberi informasi',
  nomer_telepon_pemberi_informasi: 'Nomor telepon pemberi informasi',
  jangka_waktu_sewa: 'Jangka waktu sewa',
  satuan_waktu_sewa: 'Satuan waktu sewa',
  province_id: 'Provinsi (ID)',
  regency_id: 'Kabupaten/kota (ID)',
  district_id: 'Kecamatan (ID)',
  village_id: 'Desa/kelurahan (ID)',
  jenis_listing_id: 'Jenis listing (ID)',
  jenis_objek_id: 'Jenis objek (ID)',
  bentuk_tanah_id: 'Bentuk tanah (ID)',
  posisi_tanah_id: 'Posisi tanah (ID)',
  kondisi_tanah_id: 'Kondisi tanah (ID)',
  topografi_id: 'Topografi (ID)',
  dokumen_tanah_id: 'Dokumen tanah (ID)',
  peruntukan_id: 'Peruntukan (ID)',
  status_pemberi_informasi_id: 'Status pemberi informasi (ID)',
  created_by: 'Pembuat (ID)',
  updated_by: 'Pengubah (ID)',
  deleted_by_id: 'Penghapus (ID)',
  created_at: 'Waktu dibuat',
  updated_at: 'Waktu diubah',
  deleted_at: 'Waktu dihapus',
  deleted_reason: 'Alasan penghapusan',
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})

function timestamp(value: string | null) {
  if (!value) return 'Waktu tidak tercatat'
  // Older responses omit the offset and use the API's UTC timezone.
  const date = new Date(
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(' ', 'T')}Z` : value,
  )
  return Number.isNaN(date.getTime()) ? value : `${dateFormatter.format(date)} WIB`
}

function display(
  value: PembandingHistory[number]['changes'][number]['old'],
  field: string,
): string {
  if (value === null || value === '') return 'Kosong'
  if (
    field === 'harga' &&
    (typeof value === 'number' || typeof value === 'string') &&
    Number.isFinite(Number(value))
  )
    return formatCurrency(Number(value), { compact: false })
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function changeLabel(change: PembandingHistory[number]['changes'][number]) {
  if (change.new === null || change.new === '') return 'Dihapus'
  if (change.old === null || change.old === '') return 'Ditambahkan'
  return 'Diubah'
}
</script>

<template>
  <UiSurface id="pembanding-history" class="history" aria-labelledby="history-title">
    <header class="history__heading">
      <h2 id="history-title">Historis perubahan</h2>
      <p>Aktivitas terbaru ditampilkan lebih dahulu. Buka aktivitas untuk melihat rinciannya.</p>
    </header>
    <div v-if="history.isPending.value" role="status" class="history__loading">
      <span class="sr-only">Memuat riwayat perubahan</span>
      <UiSkeleton v-for="item in 3" :key="item" height="4rem" />
    </div>
    <UiInlineAlert v-else-if="history.isError.value" tone="error" title="Riwayat gagal dimuat">
      <p>Riwayat perubahan belum dapat diambil. Silakan coba lagi.</p>
      <UiButton size="sm" @click="history.refetch()">Coba lagi</UiButton>
    </UiInlineAlert>
    <UiEmptyState
      v-else-if="!history.data.value?.length"
      title="Belum ada riwayat tercatat"
      description="Aktivitas akan muncul setelah perubahan dicatat oleh sistem. Data lama mungkin belum memiliki riwayat."
      icon="pi pi-history"
    />
    <template v-else>
      <p v-if="history.data.value.length >= 100" class="history__limit">
        Menampilkan 100 aktivitas terbaru.
      </p>
      <ol class="history__list">
        <li v-for="(activity, index) in history.data.value" :key="activity.id">
          <details :open="index === 0">
            <summary>
              <i class="pi pi-plus history__expand" aria-hidden="true" />
              <i class="pi pi-minus history__collapse" aria-hidden="true" />
              <span class="history__event">
                <strong>{{ events[activity.event] ?? activity.event }}</strong>
                <span
                  >{{ activity.causer
                  }}<span v-if="activity.causer_email"> · {{ activity.causer_email }}</span></span
                >
              </span>
              <time :datetime="activity.created_at ?? undefined">{{
                timestamp(activity.created_at)
              }}</time>
            </summary>
            <p v-if="!activity.changes.length" class="history__no-details">
              Tidak ada rincian perubahan field yang tercatat untuk aktivitas ini.
            </p>
            <dl v-else class="history__changes">
              <div v-for="change in activity.changes" :key="change.field" class="history__change">
                <dt>
                  {{ fields[change.field] ?? change.field.replace(/_/g, ' ') }}
                  <small>{{ changeLabel(change) }}</small>
                </dt>
                <dd>
                  <span>Sebelum</span>
                  <p>{{ display(change.old, change.field) }}</p>
                </dd>
                <dd>
                  <span>Sesudah</span>
                  <p>{{ display(change.new, change.field) }}</p>
                </dd>
              </div>
            </dl>
          </details>
        </li>
      </ol>
    </template>
  </UiSurface>
</template>

<style scoped>
.history {
  scroll-margin-top: 80px;
  padding: 24px;
  margin-bottom: 24px;
  min-width: 0;
}
.history__heading h2 {
  margin: 0;
  font-size: 1.125rem;
}
.history__heading p,
.history__limit,
.history__no-details {
  color: var(--color-ink-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}
.history__heading {
  margin-bottom: 20px;
}
.history__loading {
  display: grid;
  gap: 12px;
}
.history__list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.history__list li {
  border-top: 1px solid var(--color-border-soft);
}
summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  cursor: pointer;
}
.history__expand,
.history__collapse {
  font-size: 0.75rem;
  flex-shrink: 0;
}
.history__collapse,
details[open] .history__expand {
  display: none;
}
details[open] .history__collapse {
  display: inline;
}
summary:focus-visible {
  outline: 2px solid var(--color-action-primary);
  outline-offset: 3px;
}
.history__event {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.history__event > span,
time {
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
}
time {
  font-variant-numeric: tabular-nums;
}
.history__changes {
  margin: 0 0 20px;
}
.history__change {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 20px;
  padding: 14px 0;
  border-top: 1px solid var(--color-border-soft);
}
dt {
  grid-column: 1 / -1;
  font-size: 0.875rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}
dt small {
  font-weight: 400;
  color: var(--color-ink-muted);
  margin-left: 8px;
}
dd {
  margin: 0;
  min-width: 0;
}
dd > span {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}
dd p {
  margin: 4px 0 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
@media (max-width: 639px) {
  .history {
    padding: 16px;
  }
  summary {
    flex-wrap: wrap;
    gap: 8px;
  }
  time {
    flex-basis: 100%;
  }
  .history__change {
    grid-template-columns: 1fr;
  }
}
</style>
