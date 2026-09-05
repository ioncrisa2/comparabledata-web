<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatCurrency, formatDate, formatNumber, formatPhone } from '@/shared/formatters'

import PembandingImage from '../components/PembandingImage.vue'
import { usePembandingDetailQuery } from '../composables/usePembandingQueries'

const route = useRoute()
const id = computed(() => String(route.params.id ?? ''))
const validId = computed(() => /^\d+$/.test(id.value))
const detailQuery = usePembandingDetailQuery(id)
const record = computed(() => detailQuery.data.value)
const errorStatus = computed(() =>
  isApiError(detailQuery.error.value) ? detailQuery.error.value.status : null,
)
const locationPath = computed(() => {
  const item = record.value
  return item
    ? [item.village.name, item.district.name, item.regency.name, item.province.name].join(', ')
    : ''
})
const mapUrl = computed(() => {
  const item = record.value
  if (!item) return '#'
  const coordinates = `${item.latitude},${item.longitude}`
  return `https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=17/${coordinates}`
})

function valueOrDash(value: string | null | undefined): string {
  return value?.trim() || '—'
}

function measurement(value: string | number | null | undefined, unit: string): string {
  if (value === null || value === undefined || String(value).trim() === '') return '—'
  return `${typeof value === 'number' ? formatNumber(value) : value} ${unit}`
}
</script>

<template>
  <main id="main-content" class="pembanding-detail" tabindex="-1">
    <RouterLink
      class="pembanding-detail__back"
      :to="{ name: 'pembanding.list', query: route.query }"
    >
      <i class="pi pi-arrow-left" aria-hidden="true" /> Kembali ke daftar
    </RouterLink>

    <UiEmptyState
      v-if="!validId"
      title="ID data tidak valid"
      description="Alamat detail ini tidak memiliki ID pembanding yang dapat diproses."
      icon="pi pi-exclamation-circle"
    >
      <template #actions>
        <RouterLink class="ui-button ui-button--primary" :to="{ name: 'pembanding.list' }">
          Buka daftar pembanding
        </RouterLink>
      </template>
    </UiEmptyState>

    <div v-else-if="detailQuery.isPending.value" class="pembanding-detail__loading" role="status">
      <span class="sr-only">Memuat detail data pembanding</span>
      <UiSkeleton width="45%" height="2rem" />
      <UiSkeleton height="18rem" />
      <UiSkeleton v-for="index in 4" :key="index" height="4rem" />
    </div>

    <UiSurface v-else-if="detailQuery.isError.value" class="pembanding-detail__error">
      <UiEmptyState
        v-if="errorStatus === 404"
        title="Data pembanding tidak ditemukan"
        description="Rekaman mungkin sudah dihapus atau alamat yang dibuka tidak lagi berlaku."
        icon="pi pi-search"
      />
      <UiInlineAlert
        v-else-if="errorStatus === 403"
        title="Anda tidak dapat membuka data ini"
        tone="warning"
      >
        <p>Sesi tetap aktif, tetapi kebijakan akses tidak mengizinkan detail rekaman ini.</p>
      </UiInlineAlert>
      <UiInlineAlert v-else title="Detail gagal dimuat" tone="error">
        <p>
          {{
            isApiError(detailQuery.error.value)
              ? detailQuery.error.value.message
              : 'Terjadi gangguan saat mengambil detail data.'
          }}
        </p>
        <UiButton size="sm" @click="detailQuery.refetch()">Coba lagi</UiButton>
      </UiInlineAlert>
    </UiSurface>

    <template v-else-if="record">
      <header class="pembanding-detail__heading">
        <div>
          <div class="pembanding-detail__badges">
            <UiStatusBadge :tone="record.is_sewa ? 'info' : 'warning'">
              {{ record.jenis_listing.name }}
            </UiStatusBadge>
            <UiStatusBadge tone="neutral">{{ record.jenis_objek.name }}</UiStatusBadge>
          </div>
          <h1>{{ record.alamat_data }}</h1>
          <p>{{ locationPath }}</p>
        </div>
        <div class="pembanding-detail__price">
          <span>{{ record.is_sewa ? 'Nilai sewa' : 'Harga' }}</span>
          <strong>{{ formatCurrency(record.harga) }}</strong>
          <small v-if="record.sewa_periode_label">{{ record.sewa_periode_label }}</small>
        </div>
      </header>

      <div class="pembanding-detail__layout">
        <div class="pembanding-detail__main">
          <UiSurface class="pembanding-detail__metrics">
            <dl>
              <div>
                <dt>Luas tanah</dt>
                <dd>{{ measurement(record.luas_tanah, 'm²') }}</dd>
              </div>
              <div>
                <dt>Luas bangunan</dt>
                <dd>{{ measurement(record.luas_bangunan, 'm²') }}</dd>
              </div>
              <div>
                <dt>Lebar depan</dt>
                <dd>{{ measurement(record.lebar_depan, 'm') }}</dd>
              </div>
              <div>
                <dt>Lebar jalan</dt>
                <dd>{{ measurement(record.lebar_jalan, 'm') }}</dd>
              </div>
              <div>
                <dt>Tanggal data</dt>
                <dd>{{ formatDate(record.tanggal_data) }}</dd>
              </div>
            </dl>
          </UiSurface>

          <UiSurface class="pembanding-detail__section">
            <div class="pembanding-detail__section-heading">
              <h2>Karakteristik properti</h2>
              <span>Data fisik dan legal</span>
            </div>
            <dl class="pembanding-detail__definition-grid">
              <div>
                <dt>Peruntukan</dt>
                <dd>{{ record.peruntukan.name }}</dd>
              </div>
              <div>
                <dt>Bentuk tanah</dt>
                <dd>{{ record.bentuk_tanah.name }}</dd>
              </div>
              <div>
                <dt>Kondisi tanah</dt>
                <dd>{{ record.kondisi_tanah.name }}</dd>
              </div>
              <div>
                <dt>Posisi tanah</dt>
                <dd>{{ record.posisi_tanah.name }}</dd>
              </div>
              <div>
                <dt>Topografi</dt>
                <dd>{{ record.topografi.name }}</dd>
              </div>
              <div>
                <dt>Dokumen tanah</dt>
                <dd>{{ record.dokumen_tanah.name }}</dd>
              </div>
              <div>
                <dt>Tahun bangun</dt>
                <dd>{{ valueOrDash(record.tahun_bangun) }}</dd>
              </div>
              <div>
                <dt>Rasio tapak</dt>
                <dd>{{ valueOrDash(record.rasio_tapak) }}</dd>
              </div>
            </dl>
          </UiSurface>

          <UiSurface class="pembanding-detail__section">
            <div class="pembanding-detail__section-heading">
              <h2>Sumber informasi</h2>
              <span>Kontak saat pendataan</span>
            </div>
            <dl class="pembanding-detail__definition-grid">
              <div>
                <dt>Nama</dt>
                <dd>{{ record.nama_pemberi_informasi }}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{{ record.status_pemberi_informasi.name }}</dd>
              </div>
              <div>
                <dt>Telepon</dt>
                <dd>{{ formatPhone(record.nomer_telepon_pemberi_informasi) }}</dd>
              </div>
              <div>
                <dt>Dibuat oleh</dt>
                <dd>{{ record.created_by.name }}</dd>
              </div>
            </dl>
          </UiSurface>

          <UiSurface v-if="record.catatan" class="pembanding-detail__section">
            <div class="pembanding-detail__section-heading">
              <h2>Catatan</h2>
            </div>
            <p class="pembanding-detail__notes">{{ record.catatan }}</p>
          </UiSurface>
        </div>

        <aside class="pembanding-detail__aside" aria-label="Media dan lokasi">
          <PembandingImage
            mode="detail"
            :src="record.image_url"
            :alt="`Foto ${record.alamat_data}`"
          />

          <UiSurface class="pembanding-detail__location">
            <div class="pembanding-detail__section-heading">
              <h2>Lokasi</h2>
              <i class="pi pi-map-marker" aria-hidden="true" />
            </div>
            <address>
              <strong>{{ record.alamat_data }}</strong>
              <span>{{ locationPath }}</span>
            </address>
            <dl>
              <div>
                <dt>Latitude</dt>
                <dd>{{ formatNumber(record.latitude, { maximumFractionDigits: 6 }) }}</dd>
              </div>
              <div>
                <dt>Longitude</dt>
                <dd>{{ formatNumber(record.longitude, { maximumFractionDigits: 6 }) }}</dd>
              </div>
            </dl>
            <a :href="mapUrl" target="_blank" rel="noopener noreferrer">
              Buka di peta <i class="pi pi-external-link" aria-hidden="true" />
            </a>
          </UiSurface>

          <p class="pembanding-detail__record-id">ID rekaman #{{ record.id }}</p>
        </aside>
      </div>
    </template>
  </main>
</template>

<style scoped>
.pembanding-detail {
  width: min(100% - 32px, 1180px);
  margin-inline: auto;
  padding-block: 28px 64px;
}

.pembanding-detail__back {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  color: var(--color-ink-body);
  font-size: 0.8125rem;
  font-weight: 650;
  text-decoration: none;
}

.pembanding-detail__back:hover {
  color: var(--color-action-primary);
}

.pembanding-detail__loading {
  display: grid;
  gap: 16px;
}

.pembanding-detail__error {
  padding: 24px;
}

.pembanding-detail__heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 32px;
  margin-bottom: 28px;
}

.pembanding-detail__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.pembanding-detail h1 {
  max-width: 28ch;
  margin-bottom: 8px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.pembanding-detail__heading p {
  margin: 0;
  color: var(--color-ink-muted);
}

.pembanding-detail__price {
  display: grid;
  min-width: 220px;
  justify-items: end;
}

.pembanding-detail__price span,
.pembanding-detail__price small {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.pembanding-detail__price strong {
  color: var(--color-ink-strong);
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
}

.pembanding-detail__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(300px, 0.75fr);
  align-items: start;
  gap: 24px;
}

.pembanding-detail__main,
.pembanding-detail__aside {
  display: grid;
  gap: 16px;
}

.pembanding-detail__metrics,
.pembanding-detail__section,
.pembanding-detail__location {
  padding: 20px;
}

.pembanding-detail__metrics dl {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin: 0;
}

.pembanding-detail__metrics dl div {
  border-right: 1px solid var(--color-border-soft);
  padding-inline: 16px;
}

.pembanding-detail__metrics dl div:first-child {
  padding-left: 0;
}

.pembanding-detail__metrics dl div:last-child {
  border-right: 0;
  padding-right: 0;
}

.pembanding-detail dt,
.pembanding-detail__section-heading span {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.pembanding-detail dd {
  margin: 3px 0 0;
  color: var(--color-ink-strong);
  font-weight: 650;
  overflow-wrap: anywhere;
}

.pembanding-detail__metrics dd {
  font-variant-numeric: tabular-nums;
}

.pembanding-detail__section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--color-border-soft);
  margin-bottom: 16px;
  padding-bottom: 10px;
}

.pembanding-detail__section-heading h2 {
  margin: 0;
  font-size: 1rem;
}

.pembanding-detail__definition-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  margin: 0;
}

.pembanding-detail__definition-grid div {
  min-width: 0;
}

.pembanding-detail__notes {
  max-width: 75ch;
  margin: 0;
  white-space: pre-wrap;
}

.pembanding-detail__location address {
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
  color: var(--color-ink-body);
  font-style: normal;
}

.pembanding-detail__location address strong {
  color: var(--color-ink-strong);
}

.pembanding-detail__location dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  border-block: 1px solid var(--color-border-soft);
  margin: 0 0 16px;
  padding-block: 12px;
}

.pembanding-detail__location a {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  color: var(--color-action-primary);
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
}

.pembanding-detail__record-id {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  text-align: right;
}

@media (max-width: 959px) {
  .pembanding-detail__layout {
    grid-template-columns: 1fr;
  }

  .pembanding-detail__aside {
    grid-row: 1;
  }

  .pembanding-detail__metrics dl {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .pembanding-detail__metrics dl div,
  .pembanding-detail__metrics dl div:first-child,
  .pembanding-detail__metrics dl div:last-child {
    border-right: 0;
    padding: 0;
  }
}

@media (max-width: 639px) {
  .pembanding-detail {
    width: min(100% - 24px, 1180px);
    padding-block: 20px 48px;
  }

  .pembanding-detail__heading {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .pembanding-detail__price {
    justify-items: start;
  }

  .pembanding-detail__metrics dl,
  .pembanding-detail__definition-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pembanding-detail__section,
  .pembanding-detail__metrics,
  .pembanding-detail__location {
    padding: 16px;
  }
}

@media (max-width: 399px) {
  .pembanding-detail__metrics dl,
  .pembanding-detail__definition-grid {
    grid-template-columns: 1fr;
  }
}
</style>
