<script setup lang="ts">
import { computed, ref } from 'vue'

import AsyncPanel from '@/shared/components/patterns/AsyncPanel.vue'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDate } from '@/shared/formatters'

import { type BackupArtifact, getDownloadBackupUrl } from '../api/backup.api'
import CreateBackupDialog from '../components/CreateBackupDialog.vue'
import DeleteBackupDialog from '../components/DeleteBackupDialog.vue'
import ImportBackupDialog from '../components/ImportBackupDialog.vue'
import RestoreUploadsDialog from '../components/RestoreUploadsDialog.vue'
import { useBackupCatalogQuery, useVerifyBackupMutation } from '../composables/useBackup'

const catalogQuery = useBackupCatalogQuery()
const verifyMutation = useVerifyBackupMutation()

// Modal states
const isCreateOpen = ref(false)
const isImportOpen = ref(false)
const isRestoreOpen = ref(false)
const isDeleteOpen = ref(false)
const selectedArtifact = ref<BackupArtifact | null>(null)

// Feedback
const feedback = ref<{
  title: string
  body: string
  tone: 'success' | 'error' | 'info' | 'warning'
} | null>(null)

const artifacts = computed(() => catalogQuery.data.value?.artifacts ?? [])
const legacyArtifacts = computed(() => catalogQuery.data.value?.legacy_artifacts ?? [])
const readiness = computed(() => catalogQuery.data.value?.readiness)
const can = computed(() => catalogQuery.data.value?.can ?? {})

const panelState = computed<'loading' | 'error' | 'success'>(() => {
  if (catalogQuery.isPending.value) return 'loading'
  if (catalogQuery.isError.value) return 'error'
  return 'success'
})

const tableState = computed<'loading' | 'error' | 'success' | 'empty'>(() => {
  if (catalogQuery.isPending.value) return 'loading'
  if (catalogQuery.isError.value) return 'error'
  if (artifacts.value.length === 0) return 'empty'
  return 'success'
})

function handleOpenRestore(item: BackupArtifact) {
  selectedArtifact.value = item
  isRestoreOpen.value = true
}

function handleOpenDelete(item: BackupArtifact) {
  selectedArtifact.value = item
  isDeleteOpen.value = true
}

async function handleVerify(item: BackupArtifact) {
  feedback.value = null
  try {
    const res = await verifyMutation.mutateAsync(item.id)
    feedback.value = {
      title: 'Verifikasi Berhasil',
      body: `${res.message} Checksum: ${res.checksum.slice(0, 12)}...`,
      tone: 'success',
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      feedback.value = {
        title: 'Verifikasi Gagal',
        body: String(err.message),
        tone: 'error',
      }
    } else {
      feedback.value = {
        title: 'Verifikasi Gagal',
        body: 'Integritas arsip atau checksum tidak cocok.',
        tone: 'error',
      }
    }
  }
}

function onActionSuccess(message: string) {
  feedback.value = {
    title: 'Operasi Berhasil',
    body: message,
    tone: 'success',
  }
}
</script>

<template>
  <main id="main-content" class="backup-page" tabindex="-1">
    <!-- Header -->
    <header class="backup-header">
      <div class="backup-header__titles">
        <h1>Cadangan & Pemulihan Sistem</h1>
        <p>
          Kelola arsip snapshot basis data dan berkas unggahan foto properti sistem secara terpusat.
        </p>
      </div>

      <div class="backup-header__actions">
        <UiButton
          v-if="can.import_backup !== false"
          variant="secondary"
          data-testid="open-import-backup-btn"
          @click="isImportOpen = true"
        >
          <template #icon><i class="pi pi-upload" aria-hidden="true" /></template>
          Impor Paket
        </UiButton>

        <UiButton
          v-if="can.create_backup !== false"
          variant="primary"
          data-testid="open-create-backup-btn"
          @click="isCreateOpen = true"
        >
          <template #icon><i class="pi pi-plus" aria-hidden="true" /></template>
          Buat Cadangan Baru
        </UiButton>
      </div>
    </header>

    <!-- Feedback Notification -->
    <UiInlineAlert
      v-if="feedback"
      class="backup-alert mb-6"
      :tone="feedback.tone"
      :title="feedback.title"
      dismissible
      @dismiss="feedback = null"
    >
      <p>{{ feedback.body }}</p>
    </UiInlineAlert>

    <AsyncPanel
      :state="panelState"
      error-message="Katalog berkas cadangan tidak dapat dimuat."
      @retry="catalogQuery.refetch()"
    >
      <!-- Readiness Cards -->
      <div v-if="readiness" class="readiness-grid mb-6">
        <UiSurface class="readiness-card">
          <div class="readiness-card__icon text-primary">
            <i class="pi pi-folder" aria-hidden="true" />
          </div>
          <div class="readiness-card__content">
            <span class="readiness-label">Penyimpanan Server</span>
            <strong>{{
              readiness.storage_writable ? 'Siap & Writable' : 'Terkunci / Read-only'
            }}</strong>
            <UiStatusBadge :tone="readiness.storage_writable ? 'success' : 'danger'" class="mt-1">
              {{ readiness.storage_writable ? 'Tersedia' : 'Masalah Izin' }}
            </UiStatusBadge>
          </div>
        </UiSurface>

        <UiSurface class="readiness-card">
          <div class="readiness-card__icon text-indigo-600">
            <i class="pi pi-key" aria-hidden="true" />
          </div>
          <div class="readiness-card__content">
            <span class="readiness-label">Kunci Tanda Tangan SHA</span>
            <strong>{{ readiness.signing_key ? 'Terpasang Valid' : 'Belum Dikonfigurasi' }}</strong>
            <UiStatusBadge :tone="readiness.signing_key ? 'success' : 'warning'" class="mt-1">
              {{ readiness.signing_key ? 'Aktif' : 'Nonaktif' }}
            </UiStatusBadge>
          </div>
        </UiSurface>

        <UiSurface class="readiness-card">
          <div class="readiness-card__icon text-emerald-600">
            <i class="pi pi-images" aria-hidden="true" />
          </div>
          <div class="readiness-card__content">
            <span class="readiness-label">Pemulihan Foto Uploads</span>
            <strong>{{
              readiness.uploads_restore_ready === 'ready' ? 'Siap Digunakan' : 'Perlu Penyesuaian'
            }}</strong>
            <UiStatusBadge
              :tone="readiness.uploads_restore_ready === 'ready' ? 'success' : 'warning'"
              class="mt-1"
            >
              {{ readiness.uploads_restore_ready }}
            </UiStatusBadge>
          </div>
        </UiSurface>

        <UiSurface class="readiness-card">
          <div class="readiness-card__icon text-amber-600">
            <i class="pi pi-database" aria-hidden="true" />
          </div>
          <div class="readiness-card__content">
            <span class="readiness-label">Database Restore Policy</span>
            <strong>Terkunci Resmi</strong>
            <UiStatusBadge tone="neutral" class="mt-1"> Khusus Konsol CLI </UiStatusBadge>
          </div>
        </UiSurface>
      </div>

      <!-- Notice for Database Restore (BACKUP-1228) -->
      <div v-if="readiness" class="policy-notice-box mb-6" data-testid="database-restore-notice">
        <i class="pi pi-lock text-amber-600 policy-notice-icon" aria-hidden="true" />
        <div class="policy-notice-text">
          <strong>Kebijakan Keamanan Pemulihan Basis Data:</strong>
          <p>
            {{
              readiness.database_restore_note ||
              'Restore database belum diimplementasikan dan tetap dikunci.'
            }}
            Demi mencegah kehilangan data tak terduga, proses pemulihan SQL hanya dapat dijalankan
            melalui CLI server oleh Administrator Infrastruktur.
          </p>
        </div>
      </div>

      <!-- Catalog Data Table -->
      <UiSurface class="catalog-table-surface">
        <DataTableShell
          title="Katalog Berkas Arsip Cadangan"
          :state="tableState"
          empty-title="Belum ada berkas cadangan"
          empty-description="Belum ditemukan arsip backup di server. Klik 'Buat Cadangan Baru' untuk memulai snapshot sistem."
          @retry="catalogQuery.refetch()"
        >
          <table class="catalog-table">
            <thead>
              <tr>
                <th scope="col">Tipe Cadangan</th>
                <th scope="col">Nama Berkas</th>
                <th scope="col">Ukuran</th>
                <th scope="col">Integritas Checksum</th>
                <th scope="col">Waktu Dibuat</th>
                <th scope="col" class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in artifacts" :key="item.id" data-testid="artifact-row">
                <td>
                  <UiStatusBadge
                    :tone="
                      item.type === 'database'
                        ? 'info'
                        : item.type === 'uploads'
                          ? 'success'
                          : 'neutral'
                    "
                  >
                    {{ item.type_label }}
                  </UiStatusBadge>
                </td>
                <td>
                  <div class="file-name-cell">
                    <strong class="font-mono text-sm">{{ item.filename }}</strong>
                    <span v-if="item.created_by" class="text-xs text-muted">
                      Oleh: {{ item.created_by }}
                    </span>
                  </div>
                </td>
                <td class="font-medium text-sm whitespace-nowrap">
                  {{ item.size_label }}
                </td>
                <td>
                  <div class="checksum-cell">
                    <span class="checksum-badge font-mono" :title="item.checksum">
                      SHA256: {{ item.checksum_short }}
                    </span>
                    <UiStatusBadge :tone="item.verified ? 'success' : 'warning'" class="ml-2">
                      {{ item.verified ? 'Terverifikasi' : 'Belum Diverifikasi' }}
                    </UiStatusBadge>
                  </div>
                </td>
                <td class="whitespace-nowrap text-sm text-muted">
                  {{ formatDate(item.created_at) }}
                </td>
                <td class="text-right whitespace-nowrap actions-cell">
                  <!-- Verify button -->
                  <UiButton
                    size="sm"
                    variant="secondary"
                    :loading="verifyMutation.isPending.value"
                    data-testid="verify-artifact-btn"
                    title="Cek keabsahan berkas dan tanda tangan digital"
                    @click="handleVerify(item)"
                  >
                    <template #icon><i class="pi pi-shield" aria-hidden="true" /></template>
                    Verifikasi
                  </UiButton>

                  <!-- Download link -->
                  <a
                    :href="getDownloadBackupUrl(item.id)"
                    class="ui-button ui-button--secondary ui-button--sm download-link"
                    data-testid="download-artifact-btn"
                    download
                  >
                    <i class="pi pi-download" aria-hidden="true" />
                    Unduh
                  </a>

                  <!-- Restore Uploads button (only for uploads / full) -->
                  <UiButton
                    v-if="
                      (item.type === 'uploads' || item.type === 'full') &&
                      can.restore_uploads !== false
                    "
                    size="sm"
                    variant="danger"
                    data-testid="restore-uploads-btn"
                    @click="handleOpenRestore(item)"
                  >
                    <template #icon><i class="pi pi-refresh" aria-hidden="true" /></template>
                    Pulihkan
                  </UiButton>

                  <!-- Delete button -->
                  <UiButton
                    v-if="can.delete_backup !== false"
                    size="sm"
                    variant="secondary"
                    class="btn-delete"
                    data-testid="delete-artifact-btn"
                    @click="handleOpenDelete(item)"
                  >
                    <template #icon
                      ><i class="pi pi-trash text-danger" aria-hidden="true"
                    /></template>
                    Hapus
                  </UiButton>
                </td>
              </tr>
            </tbody>
          </table>
        </DataTableShell>
      </UiSurface>

      <!-- Legacy Artifacts Accordion/Card if available -->
      <UiSurface v-if="legacyArtifacts.length > 0" class="legacy-surface mt-6">
        <div class="legacy-header">
          <i class="pi pi-history text-muted mr-2" aria-hidden="true" />
          <strong>Arsip Cadangan Legacy ({{ legacyArtifacts.length }})</strong>
        </div>
        <p class="text-xs text-muted mb-4">
          Berkas cadangan generasi terdahulu dari sistem sebelumnya yang tersimpan di storage lokal.
        </p>

        <table class="catalog-table catalog-table--legacy">
          <thead>
            <tr>
              <th scope="col">Tipe</th>
              <th scope="col">Nama Berkas</th>
              <th scope="col">Ukuran</th>
              <th scope="col">Waktu Dibuat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="leg in legacyArtifacts" :key="leg.id">
              <td>
                <UiStatusBadge tone="neutral">{{ leg.type_label }}</UiStatusBadge>
              </td>
              <td class="font-mono text-sm">{{ leg.filename }}</td>
              <td class="text-sm">{{ leg.size_label }}</td>
              <td class="text-sm text-muted">{{ formatDate(leg.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </UiSurface>
    </AsyncPanel>

    <!-- Dialogs -->
    <CreateBackupDialog v-model:open="isCreateOpen" @success="onActionSuccess" />

    <ImportBackupDialog
      v-model:open="isImportOpen"
      :max-package-mb="readiness?.max_package_mb"
      @success="onActionSuccess"
    />

    <RestoreUploadsDialog
      v-model:open="isRestoreOpen"
      :artifact="selectedArtifact"
      @success="onActionSuccess"
    />

    <DeleteBackupDialog
      v-model:open="isDeleteOpen"
      :artifact="selectedArtifact"
      @success="onActionSuccess"
    />
  </main>
</template>

<style scoped>
.backup-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.backup-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .backup-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.backup-header__titles h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 0.25rem 0;
}

.backup-header__titles p {
  color: var(--text-muted, #64748b);
  font-size: 0.875rem;
  margin: 0;
}

.backup-header__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.readiness-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 640px) {
  .readiness-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .readiness-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.readiness-card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1.125rem;
  border-radius: 0.75rem;
}

.readiness-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: var(--surface-muted, #f8fafc);
  font-size: 1.25rem;
  flex-shrink: 0;
}

.readiness-card__content {
  display: flex;
  flex-direction: column;
}

.readiness-label {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
  margin-bottom: 0.125rem;
}

.readiness-card__content strong {
  font-size: 0.9375rem;
  color: var(--text-primary, #0f172a);
}

.policy-notice-box {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  border-radius: 0.625rem;
  background: var(--surface-muted, #fffbeb);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.policy-notice-icon {
  font-size: 1.25rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.policy-notice-text strong {
  display: block;
  font-size: 0.875rem;
  color: #92400e;
  margin-bottom: 0.25rem;
}

.policy-notice-text p {
  font-size: 0.8125rem;
  color: #78350f;
  margin: 0;
  line-height: 1.45;
}

.catalog-table-surface {
  padding: 1.25rem;
  border-radius: 0.75rem;
  overflow-x: auto;
}

.catalog-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.catalog-table th {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #64748b);
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
}

.catalog-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-subtle, #f1f5f9);
  vertical-align: middle;
}

.file-name-cell {
  display: flex;
  flex-direction: column;
}

.checksum-cell {
  display: flex;
  align-items: center;
}

.checksum-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: var(--surface-muted, #f1f5f9);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #475569);
}

.actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.download-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.legacy-surface {
  padding: 1.25rem;
  border-radius: 0.75rem;
}

.legacy-header {
  display: flex;
  align-items: center;
  font-size: 0.9375rem;
  color: var(--text-primary, #0f172a);
  margin-bottom: 0.25rem;
}
</style>
