<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { isApiError } from '@/shared/api/error'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDateTime } from '@/shared/formatters'

import type { CreatedInvitationData, RegistrationRequestItem } from '../api/invitations.api'
import {
  useAcceptRegistrationMutation,
  useCreateInvitationMutation,
  useInvitationsQuery,
  useRegistrationRequestsQuery,
  useRejectRegistrationMutation,
  useRevokeInvitationMutation,
} from '../composables/useContributorInvitations'

const route = useRoute()
const router = useRouter()

// Tab state synchronized with URL query
const activeTab = computed<'invitations' | 'requests'>({
  get: () => (route.query.tab === 'requests' ? 'requests' : 'invitations'),
  set: (tab) => {
    void router.replace({
      query: {
        ...route.query,
        tab: tab === 'invitations' ? undefined : tab,
      },
    })
  },
})

// Queries
const {
  data: invitationsResponse,
  isLoading: isInvitationsLoading,
  isError: isInvitationsError,
  error: invitationsError,
  refetch: refetchInvitations,
} = useInvitationsQuery()

const {
  data: requestsResponse,
  isLoading: isRequestsLoading,
  isError: isRequestsError,
  error: requestsError,
  refetch: refetchRequests,
} = useRegistrationRequestsQuery()

// Mutations
const createInvitationMutation = useCreateInvitationMutation()
const revokeInvitationMutation = useRevokeInvitationMutation()
const acceptRegistrationMutation = useAcceptRegistrationMutation()
const rejectRegistrationMutation = useRejectRegistrationMutation()

// Create Invitation Dialog state
const isCreateResultOpen = ref(false)
const createdInvitation = ref<CreatedInvitationData | null>(null)
const copyFeedback = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function handleCreateInvitation() {
  try {
    const data = await createInvitationMutation.mutateAsync()
    createdInvitation.value = data
    isCreateResultOpen.value = true
  } catch {
    // Error is handled via createInvitationMutation.error
  }
}

async function copyInvitationUrl() {
  if (!createdInvitation.value?.registration_url) return

  const url = createdInvitation.value.registration_url
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    copyFeedback.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copyFeedback.value = false
    }, 3000)
  } catch {
    // Fallback if clipboard permission blocked
  }
}

// Revoke Dialog state
const inviteToRevoke = ref<number | null>(null)
const isRevokeConfirmOpen = ref(false)

function openRevokeConfirm(id: number) {
  inviteToRevoke.value = id
  isRevokeConfirmOpen.value = true
}

async function handleRevokeConfirm() {
  if (inviteToRevoke.value === null) return
  await revokeInvitationMutation.mutateAsync(inviteToRevoke.value)
  isRevokeConfirmOpen.value = false
  inviteToRevoke.value = null
}

// Accept Request Dialog state
const requestToAccept = ref<RegistrationRequestItem | null>(null)
const isAcceptConfirmOpen = ref(false)

function openAcceptConfirm(request: RegistrationRequestItem) {
  requestToAccept.value = request
  isAcceptConfirmOpen.value = true
}

async function handleAcceptConfirm() {
  if (!requestToAccept.value) return
  await acceptRegistrationMutation.mutateAsync(requestToAccept.value.id)
  isAcceptConfirmOpen.value = false
  requestToAccept.value = null
}

// Reject Request Dialog state
const requestToReject = ref<RegistrationRequestItem | null>(null)
const isRejectDialogOpen = ref(false)
const rejectReason = ref('')
const rejectError = ref('')

function openRejectDialog(request: RegistrationRequestItem) {
  requestToReject.value = request
  rejectReason.value = ''
  rejectError.value = ''
  isRejectDialogOpen.value = true
}

async function handleRejectSubmit() {
  if (!requestToReject.value) return
  if (!rejectReason.value.trim()) {
    rejectError.value = 'Alasan penolakan wajib diisi.'
    return
  }

  try {
    await rejectRegistrationMutation.mutateAsync({
      id: requestToReject.value.id,
      reason: rejectReason.value.trim(),
    })
    isRejectDialogOpen.value = false
    requestToReject.value = null
  } catch (error) {
    rejectError.value = isApiError(error) ? error.message : 'Gagal menolak permohonan registrasi.'
  }
}

// Request Filter Status
const selectedStatusFilter = ref<string>('all')
const filteredRequests = computed(() => {
  const list = requestsResponse.value?.data ?? []
  if (selectedStatusFilter.value === 'all') return list
  return list.filter((item) => item.status === selectedStatusFilter.value)
})

const pendingRequestsCount = computed(() => {
  const list = requestsResponse.value?.data ?? []
  return list.filter((r) => r.status === 'pending').length
})

// Table states for DataTableShell
const invitationsTableState = computed<'loading' | 'error' | 'empty' | 'success'>(() => {
  if (isInvitationsLoading.value) return 'loading'
  if (isInvitationsError.value) return 'error'
  if (!invitationsResponse.value?.data?.length) return 'empty'
  return 'success'
})

const requestsTableState = computed<'loading' | 'error' | 'empty' | 'success'>(() => {
  if (isRequestsLoading.value) return 'loading'
  if (isRequestsError.value) return 'error'
  if (!filteredRequests.value.length) return 'empty'
  return 'success'
})

function getInvitationStatusTone(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'active') return 'success'
  if (status === 'expired') return 'warning'
  return 'neutral'
}

function getInvitationStatusLabel(status: string): string {
  if (status === 'active') return 'Aktif'
  if (status === 'expired') return 'Kedaluwarsa'
  if (status === 'used') return 'Digunakan'
  return status
}

function getRequestStatusTone(status: string): 'warning' | 'success' | 'danger' | 'neutral' {
  if (status === 'pending') return 'warning'
  if (status === 'accepted') return 'success'
  if (status === 'rejected') return 'danger'
  return 'neutral'
}

function getRequestStatusLabel(status: string): string {
  if (status === 'pending') return 'Menunggu Evaluasi'
  if (status === 'accepted') return 'Disetujui'
  if (status === 'rejected') return 'Ditolak'
  return status
}
</script>

<template>
  <div class="invitations-page">
    <!-- Header -->
    <UiSurface class="invitations-page__header">
      <div class="invitations-page__title-area">
        <div class="invitations-page__breadcrumbs">
          <span>Akses & Pengguna</span>
          <i class="pi pi-angle-right" aria-hidden="true" />
          <span>Undangan Kontributor</span>
        </div>
        <h1 class="invitations-page__heading">Undangan & Registrasi Kontributor</h1>
        <p class="invitations-page__subheading">
          Kelola token pendaftaran calon penilai/kontributor independen dan evaluasi permohonan
          registrasi.
        </p>
      </div>

      <div class="invitations-page__header-actions">
        <UiButton
          variant="primary"
          :loading="createInvitationMutation.isPending.value"
          @click="handleCreateInvitation"
        >
          <i class="pi pi-plus" aria-hidden="true" />
          Buat Tautan Undangan
        </UiButton>
      </div>
    </UiSurface>

    <!-- Navigation Tabs -->
    <div class="invitations-page__tabs" role="tablist">
      <button
        type="button"
        role="tab"
        class="invitations-page__tab"
        :class="{ 'invitations-page__tab--active': activeTab === 'invitations' }"
        :aria-selected="activeTab === 'invitations'"
        @click="activeTab = 'invitations'"
      >
        <i class="pi pi-send" aria-hidden="true" />
        <span>Token Undangan</span>
        <span v-if="invitationsResponse?.data?.length" class="invitations-page__tab-badge">
          {{ invitationsResponse.data.length }}
        </span>
      </button>

      <button
        type="button"
        role="tab"
        class="invitations-page__tab"
        :class="{ 'invitations-page__tab--active': activeTab === 'requests' }"
        :aria-selected="activeTab === 'requests'"
        @click="activeTab = 'requests'"
      >
        <i class="pi pi-user-plus" aria-hidden="true" />
        <span>Pengajuan Registrasi</span>
        <span
          v-if="pendingRequestsCount > 0"
          class="invitations-page__tab-badge invitations-page__tab-badge--highlight"
        >
          {{ pendingRequestsCount }}
        </span>
      </button>
    </div>

    <!-- TAB 1: Daftar Undangan -->
    <div v-show="activeTab === 'invitations'" class="invitations-page__tab-content">
      <DataTableShell
        :state="invitationsTableState"
        title="Daftar Token Undangan"
        empty-title="Belum ada token undangan"
        empty-description="Buat tautan undangan baru untuk membagikannya kepada calon kontributor data."
        :error-message="isApiError(invitationsError) ? invitationsError.message : undefined"
        @retry="() => refetchInvitations()"
      >
        <template #emptyActions>
          <UiButton size="sm" variant="primary" @click="handleCreateInvitation">
            <i class="pi pi-plus" aria-hidden="true" />
            Buat Tautan Undangan
          </UiButton>
        </template>

        <table class="invitations-table">
          <thead>
            <tr>
              <th>Kode Token</th>
              <th>Status</th>
              <th>Dibuat Oleh</th>
              <th>Dibuat Pada</th>
              <th>Kedaluwarsa</th>
              <th>Pemohon Terkait</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in invitationsResponse?.data" :key="item.id">
              <td class="font-mono text-sm">
                {{ item.token_fingerprint }}
              </td>
              <td>
                <UiStatusBadge
                  :tone="getInvitationStatusTone(item.status)"
                  :label="getInvitationStatusLabel(item.status)"
                />
              </td>
              <td>
                <div class="text-xs text-slate-600">{{ item.created_by || '-' }}</div>
              </td>
              <td class="text-xs text-slate-600">
                {{ formatDateTime(item.created_at) }}
              </td>
              <td class="text-xs text-slate-600">
                {{ formatDateTime(item.expires_at) }}
              </td>
              <td>
                <div v-if="item.request" class="invitations-table__request-info">
                  <strong class="text-xs">{{ item.request.display_name }}</strong>
                  <span class="text-xs text-slate-500">{{ item.request.generated_email }}</span>
                </div>
                <span v-else class="text-xs text-slate-400">-</span>
              </td>
              <td class="text-right">
                <UiButton
                  v-if="item.status === 'active'"
                  size="sm"
                  variant="danger"
                  :disabled="revokeInvitationMutation.isPending.value"
                  title="Cabut tautan undangan ini"
                  @click="openRevokeConfirm(item.id)"
                >
                  <i class="pi pi-trash" aria-hidden="true" />
                  Cabut
                </UiButton>
                <span v-else class="text-xs text-slate-400">Tidak ada aksi</span>
              </td>
            </tr>
          </tbody>
        </table>
      </DataTableShell>
    </div>

    <!-- TAB 2: Pengajuan Registrasi -->
    <div v-show="activeTab === 'requests'" class="invitations-page__tab-content">
      <!-- Sub-filter Status -->
      <div class="invitations-page__status-filters">
        <button
          type="button"
          class="invitations-page__filter-chip"
          :class="{ 'invitations-page__filter-chip--active': selectedStatusFilter === 'all' }"
          @click="selectedStatusFilter = 'all'"
        >
          Semua ({{ requestsResponse?.data?.length ?? 0 }})
        </button>
        <button
          type="button"
          class="invitations-page__filter-chip"
          :class="{ 'invitations-page__filter-chip--active': selectedStatusFilter === 'pending' }"
          @click="selectedStatusFilter = 'pending'"
        >
          Menunggu Evaluasi ({{ pendingRequestsCount }})
        </button>
        <button
          type="button"
          class="invitations-page__filter-chip"
          :class="{ 'invitations-page__filter-chip--active': selectedStatusFilter === 'accepted' }"
          @click="selectedStatusFilter = 'accepted'"
        >
          Disetujui
        </button>
        <button
          type="button"
          class="invitations-page__filter-chip"
          :class="{ 'invitations-page__filter-chip--active': selectedStatusFilter === 'rejected' }"
          @click="selectedStatusFilter = 'rejected'"
        >
          Ditolak
        </button>
      </div>

      <DataTableShell
        :state="requestsTableState"
        title="Daftar Pengajuan Registrasi"
        empty-title="Tidak ada pengajuan registrasi"
        empty-description="Belum ada calon kontributor yang mengajukan permohonan registrasi pada filter ini."
        :filtered="selectedStatusFilter !== 'all'"
        :error-message="isApiError(requestsError) ? requestsError.message : undefined"
        @retry="() => refetchRequests()"
      >
        <table class="invitations-table">
          <thead>
            <tr>
              <th>Calon Kontributor</th>
              <th>Email Dihasilkan</th>
              <th>No. Telepon</th>
              <th>Status</th>
              <th>Tanggal Pengajuan</th>
              <th>Catatan / Evaluasi</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in filteredRequests" :key="req.id">
              <td>
                <strong class="text-sm text-slate-800">{{ req.display_name }}</strong>
              </td>
              <td class="font-mono text-xs text-slate-600">
                {{ req.generated_email }}
              </td>
              <td class="text-xs text-slate-600">
                {{ req.phone || '-' }}
              </td>
              <td>
                <UiStatusBadge
                  :tone="getRequestStatusTone(req.status)"
                  :label="getRequestStatusLabel(req.status)"
                />
              </td>
              <td class="text-xs text-slate-600">
                {{ formatDateTime(req.submitted_at) }}
              </td>
              <td>
                <div v-if="req.status === 'rejected'" class="text-xs text-red-600">
                  <span class="font-semibold">Alasan:</span> {{ req.reject_reason || '-' }}
                </div>
                <div v-else-if="req.status === 'accepted'" class="text-xs text-emerald-700">
                  Disetujui oleh {{ req.accepted_by || 'Admin' }}
                </div>
                <span v-else class="text-xs text-slate-400">-</span>
              </td>
              <td class="text-right">
                <div v-if="req.status === 'pending'" class="invitations-table__row-actions">
                  <UiButton
                    size="sm"
                    variant="primary"
                    :disabled="
                      acceptRegistrationMutation.isPending.value ||
                      rejectRegistrationMutation.isPending.value
                    "
                    @click="openAcceptConfirm(req)"
                  >
                    <i class="pi pi-check" aria-hidden="true" />
                    Setujui
                  </UiButton>
                  <UiButton
                    size="sm"
                    variant="danger"
                    :disabled="
                      acceptRegistrationMutation.isPending.value ||
                      rejectRegistrationMutation.isPending.value
                    "
                    @click="openRejectDialog(req)"
                  >
                    <i class="pi pi-times" aria-hidden="true" />
                    Tolak
                  </UiButton>
                </div>
                <span v-else class="text-xs text-slate-400">Selesai</span>
              </td>
            </tr>
          </tbody>
        </table>
      </DataTableShell>
    </div>

    <!-- DIALOG: Hasil Pembuatan Token Undangan Baru -->
    <UiDialog
      :open="isCreateResultOpen"
      title="Tautan Undangan Berhasil Dibuat"
      description="Bagikan tautan berikut kepada calon kontributor data yang ingin Anda undang."
      @close="isCreateResultOpen = false"
    >
      <div v-if="createdInvitation" class="invitation-dialog-content">
        <UiInlineAlert title="Perhatian" tone="info" class="mb-4">
          <p>
            Tautan undangan ini <strong>hanya ditampilkan satu kali</strong> demi keamanan sistem.
            Tautan ini berlaku selama 7 hari (hingga
            {{ formatDateTime(createdInvitation.expires_at) }}).
          </p>
        </UiInlineAlert>

        <UiField label="Tautan Pendaftaran Kontributor">
          <div class="invitation-dialog-input-group">
            <input
              type="text"
              readonly
              class="invitation-dialog-input"
              :value="createdInvitation.registration_url"
              @focus="($event.target as HTMLInputElement).select()"
            />
            <UiButton type="button" variant="primary" @click="copyInvitationUrl">
              <i :class="copyFeedback ? 'pi pi-check' : 'pi pi-copy'" aria-hidden="true" />
              {{ copyFeedback ? 'Tersalin!' : 'Salin Tautan' }}
            </UiButton>
          </div>
        </UiField>

        <div class="invitation-dialog-meta">
          <span class="text-xs text-slate-500"
            >Token Raw: <code>{{ createdInvitation.raw_token }}</code></span
          >
        </div>
      </div>

      <template #footer>
        <UiButton variant="secondary" @click="isCreateResultOpen = false"> Tutup </UiButton>
      </template>
    </UiDialog>

    <!-- DIALOG: Konfirmasi Cabut Undangan -->
    <UiConfirmDialog
      :open="isRevokeConfirmOpen"
      title="Cabut Tautan Undangan?"
      description="Token undangan yang dicabut tidak akan dapat digunakan lagi oleh siapa pun untuk mendaftar."
      confirm-label="Ya, Cabut Undangan"
      cancel-label="Batal"
      confirm-variant="danger"
      :busy="revokeInvitationMutation.isPending.value"
      @confirm="handleRevokeConfirm"
      @cancel="isRevokeConfirmOpen = false"
    />

    <!-- DIALOG: Konfirmasi Persetujuan Registrasi -->
    <UiConfirmDialog
      :open="isAcceptConfirmOpen"
      title="Setujui Permohonan Kontributor?"
      :description="`Menerima permohonan ${requestToAccept?.display_name || ''} (${requestToAccept?.generated_email || ''}) akan otomatis membuat akun pengguna baru dengan role data_contributor.`"
      confirm-label="Setujui dan Buat Akun"
      cancel-label="Batal"
      confirm-variant="primary"
      :busy="acceptRegistrationMutation.isPending.value"
      @confirm="handleAcceptConfirm"
      @cancel="isAcceptConfirmOpen = false"
    />

    <!-- DIALOG: Penolakan Permohonan Registrasi -->
    <UiDialog
      :open="isRejectDialogOpen"
      title="Tolak Permohonan Registrasi"
      description="Tentukan alasan penolakan permohonan registrasi calon kontributor ini."
      @close="isRejectDialogOpen = false"
    >
      <div v-if="requestToReject" class="space-y-4">
        <UiInlineAlert v-if="rejectError" title="Gagal menolak permohonan" tone="error">
          <p>{{ rejectError }}</p>
        </UiInlineAlert>

        <p class="text-sm text-slate-600">
          Anda akan menolak pengajuan dari: <strong>{{ requestToReject.display_name }}</strong> ({{
            requestToReject.generated_email
          }}).
        </p>

        <UiField
          label="Alasan Penolakan"
          required
          help="Berikan penjelasan mengapa permohonan ini ditolak."
        >
          <textarea
            v-model="rejectReason"
            rows="3"
            class="reject-reason-textarea"
            placeholder="Contoh: Dokumen tidak lengkap, nomor telepon tidak aktif, atau di luar cakupan wilayah."
          />
        </UiField>
      </div>

      <template #footer>
        <UiButton
          variant="secondary"
          :disabled="rejectRegistrationMutation.isPending.value"
          @click="isRejectDialogOpen = false"
        >
          Batal
        </UiButton>
        <UiButton
          variant="danger"
          :loading="rejectRegistrationMutation.isPending.value"
          @click="handleRejectSubmit"
        >
          <i class="pi pi-times" aria-hidden="true" />
          Tolak Permohonan
        </UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<style scoped>
.invitations-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

.invitations-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-radius: var(--radius-surface, 14px);
  gap: 20px;
}

.invitations-page__breadcrumbs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-ink-muted, #64748b);
  margin-bottom: 6px;
}

.invitations-page__heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink-strong, #0f172a);
  letter-spacing: -0.02em;
  margin: 0 0 4px;
}

.invitations-page__subheading {
  font-size: 0.875rem;
  color: var(--color-ink-body, #334155);
  margin: 0;
}

/* Tabs */
.invitations-page__tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--color-border-soft, #e2e8f0);
  padding-bottom: 2px;
}

.invitations-page__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink-muted, #64748b);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.invitations-page__tab:hover {
  color: var(--color-ink-strong, #0f172a);
}

.invitations-page__tab--active {
  color: var(--color-brand-amber-strong, #d97706);
  border-bottom-color: var(--color-brand-amber, #f59e0b);
}

.invitations-page__tab-badge {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
}

.invitations-page__tab-badge--highlight {
  background: #fef3c7;
  color: #b45309;
}

/* Table */
.invitations-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.invitations-table th {
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-ink-muted, #64748b);
  border-bottom: 1px solid var(--color-border-soft, #e2e8f0);
}

.invitations-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-soft, #f1f5f9);
  vertical-align: middle;
}

.invitations-table tbody tr:hover {
  background: var(--color-surface-inset, #f8fafc);
}

.invitations-table__request-info {
  display: flex;
  flex-direction: column;
}

.invitations-table__row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Status filters */
.invitations-page__status-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.invitations-page__filter-chip {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-ink-body, #334155);
  cursor: pointer;
  transition: all 0.15s ease;
}

.invitations-page__filter-chip:hover {
  border-color: #cbd5e1;
}

.invitations-page__filter-chip--active {
  background: var(--color-ink-strong, #0f172a);
  color: #ffffff;
  border-color: var(--color-ink-strong, #0f172a);
}

/* Dialog content */
.invitation-dialog-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.invitation-dialog-input {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-control, 8px);
  background: var(--color-surface-inset, #f8fafc);
  font-family: monospace;
  font-size: 0.8125rem;
  color: var(--color-ink-strong, #0f172a);
}

.invitation-dialog-meta {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--color-surface-inset, #f8fafc);
  border-radius: 6px;
}

.reject-reason-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-control, 8px);
  font-size: 0.875rem;
  line-height: 1.4;
  outline: none;
  resize: vertical;
}

.reject-reason-textarea:focus {
  border-color: var(--color-brand-amber, #f59e0b);
}

@media (max-width: 768px) {
  .invitations-page {
    padding: 16px;
  }

  .invitations-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .invitation-dialog-input-group {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
