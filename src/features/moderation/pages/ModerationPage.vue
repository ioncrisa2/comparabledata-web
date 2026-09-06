<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { isApiError } from '@/shared/api/error'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatCurrency, formatDate, formatNumber } from '@/shared/formatters'

import {
  type NormalizedModerationItem,
  normalizeModerationItem,
} from '../api/moderation.api'
import RejectDeleteRequestDialog from '../components/RejectDeleteRequestDialog.vue'
import {
  useApproveDeleteRequestMutation,
  useForceDeletePembandingMutation,
  useModerationQuery,
  useRestorePembandingMutation,
} from '../composables/useModeration'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Permissions
const canApprove = computed(() => auth.can('approve_delete_request'))
const canReject = computed(() => auth.can('reject_delete_request'))
const canRestore = computed(() => auth.can('restore_data::pembanding'))
const canForceDelete = computed(() => auth.can('force_delete_data::pembanding'))

// Active tab & search synced with query params
const activeTab = computed(() =>
  route.query.tab === 'trash' ? 'trash' : 'requests',
)
const searchQuery = ref(String(route.query.search ?? ''))

function setTab(tab: 'requests' | 'trash') {
  void router.push({
    query: {
      ...route.query,
      tab: tab === 'requests' ? undefined : tab,
    },
  })
}

function handleSearch(val: string) {
  void router.push({
    query: {
      ...route.query,
      search: val.trim() || undefined,
    },
  })
}

// Queries & Mutations
const filters = computed(() => ({
  tab: activeTab.value,
  search: String(route.query.search ?? '').trim() || undefined,
}))

const moderationQuery = useModerationQuery(filters)
const approveMutation = useApproveDeleteRequestMutation()
const restoreMutation = useRestorePembandingMutation()
const forceDeleteMutation = useForceDeletePembandingMutation()

// Table state
const rawItems = computed(() => moderationQuery.data.value?.data ?? [])
const items = computed(() =>
  rawItems.value.map((item) => normalizeModerationItem(item as Record<string, unknown>)),
)
const tableState = computed(() => {
  if (moderationQuery.isPending.value) return 'loading'
  if (moderationQuery.isError.value) return 'error'
  if (items.value.length === 0) return 'empty'
  return 'success'
})

// Action dialog targets
const approveTarget = ref<NormalizedModerationItem | null>(null)
const rejectTarget = ref<NormalizedModerationItem | null>(null)
const restoreTarget = ref<NormalizedModerationItem | null>(null)
const forceDeleteTarget = ref<NormalizedModerationItem | null>(null)

// Feedback messages
const actionMessage = ref<{ title: string; body: string; tone: 'success' | 'error' } | null>(null)

watch(
  () => route.query,
  () => {
    searchQuery.value = String(route.query.search ?? '')
  },
)

async function confirmApprove() {
  if (!approveTarget.value) return
  const id = approveTarget.value.id
  try {
    await approveMutation.mutateAsync(id)
    actionMessage.value = {
      title: 'Permohonan disetujui',
      body: `Permohonan #${id} berhasil disetujui untuk dihapus dan dipindahkan ke tempat sampah.`,
      tone: 'success',
    }
  } catch (err) {
    actionMessage.value = {
      title: 'Gagal menyetujui permohonan',
      body: isApiError(err) ? err.message : 'Terjadi gangguan sistem.',
      tone: 'error',
    }
  } finally {
    approveTarget.value = null
  }
}

function onRejectSuccess() {
  actionMessage.value = {
    title: 'Permohonan ditolak',
    body: 'Permohonan penghapusan telah berhasil ditolak dengan catatan yang diberikan.',
    tone: 'success',
  }
}

async function confirmRestore() {
  if (!restoreTarget.value) return
  const id = restoreTarget.value.pembandingId || restoreTarget.value.id
  try {
    await restoreMutation.mutateAsync(id)
    actionMessage.value = {
      title: 'Data dipulihkan',
      body: `Data #${id} berhasil dipulihkan kembali ke daftar aktif pembanding.`,
      tone: 'success',
    }
  } catch (err) {
    actionMessage.value = {
      title: 'Gagal memulihkan data',
      body: isApiError(err) ? err.message : 'Terjadi gangguan sistem.',
      tone: 'error',
    }
  } finally {
    restoreTarget.value = null
  }
}

async function confirmForceDelete() {
  if (!forceDeleteTarget.value) return
  const id = forceDeleteTarget.value.pembandingId || forceDeleteTarget.value.id
  try {
    await forceDeleteMutation.mutateAsync(id)
    actionMessage.value = {
      title: 'Data dihapus permanen',
      body: `Data #${id} telah dihapus secara permanen dari sistem.`,
      tone: 'success',
    }
  } catch (err) {
    actionMessage.value = {
      title: 'Gagal menghapus data',
      body: isApiError(err) ? err.message : 'Terjadi gangguan sistem.',
      tone: 'error',
    }
  } finally {
    forceDeleteTarget.value = null
  }
}

function onApproveDialogClose(open: boolean) {
  if (!open) approveTarget.value = null
}

function onRejectDialogClose(open: boolean) {
  if (!open) rejectTarget.value = null
}

function onRestoreDialogClose(open: boolean) {
  if (!open) restoreTarget.value = null
}

function onForceDeleteDialogClose(open: boolean) {
  if (!open) forceDeleteTarget.value = null
}
</script>


<template>
  <main id="main-content" class="moderation-page" tabindex="-1">
    <header class="moderation-page__heading">
      <div>
        <h1>Moderasi data</h1>
        <p>Evaluasi permohonan penghapusan listing pembanding dan kelola data di tempat sampah.</p>
      </div>
      <div class="moderation-page__summary" aria-live="polite">
        <span>Jumlah data</span>
        <strong>{{ formatNumber(moderationQuery.data.value?.meta?.total ?? items.length) }}</strong>
      </div>
    </header>

    <!-- Feedback notification -->
    <UiInlineAlert
      v-if="actionMessage"
      class="moderation-page__alert"
      :tone="actionMessage.tone"
      :title="actionMessage.title"
    >
      <p>{{ actionMessage.body }}</p>
    </UiInlineAlert>

    <UiSurface class="moderation-page__content">
      <!-- Tab & Filter Toolbar -->
      <div class="moderation-page__toolbar">
        <div class="moderation-page__tabs" role="tablist" aria-label="Kategori moderasi">
          <button
            type="button"
            role="tab"
            class="moderation-page__tab"
            :class="{ 'moderation-page__tab--active': activeTab === 'requests' }"
            :aria-selected="activeTab === 'requests'"
            @click="setTab('requests')"
          >
            <i class="pi pi-inbox" aria-hidden="true" />
            Permintaan Hapus
          </button>
          <button
            type="button"
            role="tab"
            class="moderation-page__tab"
            :class="{ 'moderation-page__tab--active': activeTab === 'trash' }"
            :aria-selected="activeTab === 'trash'"
            @click="setTab('trash')"
          >
            <i class="pi pi-trash" aria-hidden="true" />
            Tempat Sampah
          </button>
        </div>

        <div class="moderation-page__search">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari alamat atau kata kunci..."
            aria-label="Cari data moderasi"
            @keydown.enter="handleSearch(searchQuery)"
          />
          <UiButton size="sm" @click="handleSearch(searchQuery)">
            Cari
          </UiButton>
        </div>
      </div>

      <!-- Table Section -->
      <DataTableShell
        :title="activeTab === 'requests' ? 'Daftar permohonan hapus' : 'Daftar tempat sampah'"
        :state="tableState"
        :filtered="Boolean(route.query.search)"
        :empty-title="
          activeTab === 'requests'
            ? 'Tidak ada permohonan hapus'
            : 'Tempat sampah kosong'
        "
        :empty-description="
          activeTab === 'requests'
            ? 'Saat ini belum ada listing data pembanding yang diajukan untuk dihapus.'
            : 'Belum ada data pembanding yang dipindahkan ke tempat sampah.'
        "
        @retry="moderationQuery.refetch()"
      >
        <table class="moderation-page__table">
          <thead>
            <tr>
              <th scope="col" class="moderation-page__col-id">ID</th>
              <th scope="col">Properti & Alamat</th>
              <th scope="col">Jenis Listing</th>
              <th scope="col" class="moderation-page__numeric">Harga</th>
              <th v-if="activeTab === 'requests'" scope="col">Alasan & Pemohon</th>
              <th v-else scope="col">Waktu Hapus & Oleh</th>
              <th scope="col" class="moderation-page__col-actions">
                <span class="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td class="moderation-page__col-id">#{{ item.id }}</td>
              <td>
                <RouterLink
                  v-if="item.pembandingId"
                  class="moderation-page__property-link"
                  :to="{ name: 'pembanding.detail', params: { id: item.pembandingId } }"
                >
                  <strong>{{ item.alamat || ('Pembanding #' + item.pembandingId) }}</strong>
                </RouterLink>
                <span v-else class="moderation-page__property-link">
                  <strong>{{ item.alamat || ('#' + item.id) }}</strong>
                </span>
              </td>
              <td>
                <UiStatusBadge
                  v-if="item.jenisListing"
                  :tone="item.jenisListing.toLowerCase().includes('sewa') ? 'info' : 'warning'"
                >
                  {{ item.jenisListing }}
                </UiStatusBadge>
                <span v-else class="moderation-page__empty-value">—</span>
              </td>

              <td
                class="moderation-page__numeric"
                :title="item.harga !== null ? formatCurrency(item.harga, { compact: false }) : undefined"
              >
                {{ item.harga !== null ? formatCurrency(item.harga) : '—' }}
              </td>
              <!-- Requests tab specific -->
              <td v-if="activeTab === 'requests'">
                <div class="moderation-page__reason-box">
                  <p class="moderation-page__reason-text">
                    {{ item.reason || 'Tidak ada alasan dicantumkan.' }}
                  </p>
                  <small v-if="item.requesterName" class="moderation-page__requester">
                    Oleh: {{ item.requesterName }}
                  </small>
                </div>
              </td>
              <!-- Trash tab specific -->
              <td v-else>
                <div class="moderation-page__reason-box">
                  <span class="moderation-page__reason-text">
                    {{ item.deletedAt ? formatDate(item.deletedAt) : '—' }}
                  </span>
                  <small v-if="item.requesterName" class="moderation-page__requester">
                    Oleh: {{ item.requesterName }}
                  </small>
                </div>
              </td>
              <!-- Actions -->
              <td class="moderation-page__col-actions">
                <div v-if="activeTab === 'requests'" class="moderation-page__action-buttons">
                  <UiButton
                    v-if="canApprove"
                    variant="primary"
                    size="sm"
                    :disabled="approveMutation.isPending.value"
                    @click="approveTarget = item"
                  >
                    <template #icon><i class="pi pi-check" aria-hidden="true" /></template>
                    Setujui
                  </UiButton>
                  <UiButton
                    v-if="canReject"
                    variant="danger"
                    size="sm"
                    :disabled="approveMutation.isPending.value"
                    @click="rejectTarget = item"
                  >
                    <template #icon><i class="pi pi-times" aria-hidden="true" /></template>
                    Tolak
                  </UiButton>
                </div>
                <div v-else class="moderation-page__action-buttons">
                  <UiButton
                    v-if="canRestore"
                    variant="secondary"
                    size="sm"
                    :disabled="restoreMutation.isPending.value"
                    @click="restoreTarget = item"
                  >
                    <template #icon><i class="pi pi-refresh" aria-hidden="true" /></template>
                    Pulihkan
                  </UiButton>
                  <UiButton
                    v-if="canForceDelete"
                    variant="danger"
                    size="sm"
                    :disabled="forceDeleteMutation.isPending.value"
                    @click="forceDeleteTarget = item"
                  >
                    <template #icon><i class="pi pi-trash" aria-hidden="true" /></template>
                    Hapus Permanen
                  </UiButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </DataTableShell>
    </UiSurface>

    <!-- Dialog Konfirmasi Setujui Permohonan -->
    <UiConfirmDialog
      :open="Boolean(approveTarget)"
      title="Setujui permohonan hapus?"
      :description="`Data &quot;${approveTarget?.alamat || ('#' + (approveTarget?.pembandingId || approveTarget?.id || ''))}&quot; akan disetujui untuk dihapus dan dipindahkan ke tempat sampah.`"
      confirm-label="Ya, setujui hapus"
      confirm-variant="primary"
      :busy="approveMutation.isPending.value"
      @update:open="onApproveDialogClose"
      @confirm="confirmApprove"
    />

    <!-- Dialog Tolak Permohonan Hapus -->
    <RejectDeleteRequestDialog
      :open="Boolean(rejectTarget)"
      :request-id="rejectTarget?.id ?? null"
      :target-label="rejectTarget?.alamat || ('#' + (rejectTarget?.pembandingId || rejectTarget?.id || ''))"
      @update:open="onRejectDialogClose"
      @success="onRejectSuccess"
    />

    <!-- Dialog Konfirmasi Pulihkan -->
    <UiConfirmDialog
      :open="Boolean(restoreTarget)"
      title="Pulihkan data pembanding?"
      :description="`Data &quot;${restoreTarget?.alamat || ('#' + (restoreTarget?.pembandingId || restoreTarget?.id || ''))}&quot; akan dikembalikan ke daftar aktif pembanding.`"
      confirm-label="Ya, pulihkan"
      confirm-variant="primary"
      :busy="restoreMutation.isPending.value"
      @update:open="onRestoreDialogClose"
      @confirm="confirmRestore"
    />

    <!-- Dialog Konfirmasi Hapus Permanen -->
    <UiConfirmDialog
      :open="Boolean(forceDeleteTarget)"
      title="Hapus permanen data pembanding?"
      :description="`Data &quot;${forceDeleteTarget?.alamat || ('#' + (forceDeleteTarget?.pembandingId || forceDeleteTarget?.id || ''))}&quot; akan dihapus secara permanen dari basis data dan tidak dapat dikembalikan lagi.`"
      confirm-label="Ya, hapus permanen"
      confirm-variant="danger"
      :busy="forceDeleteMutation.isPending.value"
      @update:open="onForceDeleteDialogClose"
      @confirm="confirmForceDelete"
    />


  </main>
</template>

<style scoped>
.moderation-page {
  width: min(100% - 32px, 1180px);
  margin-inline: auto;
  padding-block: 28px 64px;
}

.moderation-page__heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 24px;
}

.moderation-page__heading h1 {
  margin: 0 0 8px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.moderation-page__heading p {
  margin: 0;
  color: var(--color-ink-muted);
}

.moderation-page__summary {
  display: grid;
  min-width: 112px;
  justify-items: end;
}

.moderation-page__summary span {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.moderation-page__summary strong {
  color: var(--color-ink-strong);
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
}

.moderation-page__alert {
  margin-bottom: 16px;
}

.moderation-page__content {
  padding: 20px;
}

.moderation-page__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 16px;
}

.moderation-page__tabs {
  display: flex;
  gap: 8px;
}

.moderation-page__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink-body);
  font-size: 0.875rem;
  font-weight: 650;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.moderation-page__tab:hover {
  background: var(--color-surface-inset);
  color: var(--color-ink-strong);
}

.moderation-page__tab--active {
  border-color: var(--color-action-primary);
  background: var(--color-brand-amber-soft);
  color: var(--color-action-primary);
}

.moderation-page__search {
  display: flex;
  align-items: center;
  gap: 8px;
}

.moderation-page__search input {
  min-width: 260px;
}

.moderation-page__table {
  width: 100%;
  border-collapse: collapse;
}

.moderation-page__table th,
.moderation-page__table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--color-border-soft);
  font-size: 0.875rem;
}

.moderation-page__col-id {
  width: 60px;
  color: var(--color-ink-muted);
  font-variant-numeric: tabular-nums;
}

.moderation-page__numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.moderation-page__property-link {
  color: var(--color-ink-strong);
  text-decoration: none;
}

.moderation-page__property-link:hover {
  color: var(--color-action-primary);
  text-decoration: underline;
}

.moderation-page__reason-box {
  display: grid;
  gap: 4px;
  max-width: 320px;
}

.moderation-page__reason-text {
  margin: 0;
  color: var(--color-ink-body);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.moderation-page__requester {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}

.moderation-page__col-actions {
  width: 180px;
  text-align: right;
}

.moderation-page__action-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .moderation-page {
    width: min(100% - 24px, 1180px);
  }

  .moderation-page__heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .moderation-page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .moderation-page__search input {
    min-width: 0;
    flex: 1;
  }
}
</style>
