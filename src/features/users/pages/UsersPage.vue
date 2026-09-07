<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { isApiError } from '@/shared/api/error'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiPagination from '@/shared/components/ui/UiPagination.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDate } from '@/shared/formatters'

import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserFilterParams,
  UserItem,
} from '../api/users.api'
import UserFormDialog from '../components/UserFormDialog.vue'
import {
  useBulkDeleteUsersMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useRoleOptionsQuery,
  useToggleUserStatusMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from '../composables/useUsers'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const canCreate = computed(() => auth.can('create_user'))
const canUpdate = computed(() => auth.can('update_user'))
const canDelete = computed(() => auth.can('delete_user'))
const canDeleteAny = computed(() => auth.can('delete_any_user'))

const search = ref('')
const selectedRole = ref('')
const selectedStatus = ref<'active' | 'inactive' | ''>('')
const currentPage = ref(1)

// Synchronize filters with URL query parameters
watch(
  () => route.query,
  (q) => {
    if (typeof q.search === 'string') search.value = q.search
    if (typeof q.role === 'string') selectedRole.value = q.role
    if (q.status === 'active' || q.status === 'inactive') {
      selectedStatus.value = q.status
    } else {
      selectedStatus.value = ''
    }
    if (q.page && Number(q.page) > 0) currentPage.value = Number(q.page)
  },
  { immediate: true },
)

function updateFilters() {
  currentPage.value = 1
  void router.replace({
    query: {
      search: search.value.trim() || undefined,
      role: selectedRole.value || undefined,
      status: selectedStatus.value || undefined,
      page: undefined,
    },
  })
}

const queryParams = computed<UserFilterParams>(() => ({
  search: search.value.trim() || undefined,
  role: selectedRole.value || undefined,
  status: selectedStatus.value || undefined,
  page: currentPage.value,
  per_page: 15,
}))

const { data: usersResponse, isLoading, isError } = useUsersQuery(queryParams)
const { data: rawRoleOptions } = useRoleOptionsQuery()
const roleOptions = computed(() => rawRoleOptions.value ?? [])

const users = computed<UserItem[]>(() => usersResponse.value?.data ?? [])
const meta = computed(() => usersResponse.value?.meta)

const tableState = computed<'loading' | 'error' | 'empty' | 'success'>(() => {
  if (isLoading.value) return 'loading'
  if (isError.value) return 'error'
  if (users.value.length === 0) return 'empty'
  return 'success'
})

// Mutations
const createMutation = useCreateUserMutation()
const updateMutation = useUpdateUserMutation()
const toggleStatusMutation = useToggleUserStatusMutation()
const deleteMutation = useDeleteUserMutation()
const bulkDeleteMutation = useBulkDeleteUsersMutation()

// Selection state for bulk actions
const selectedIds = ref<number[]>([])

const selectableUsers = computed(() =>
  users.value.filter((u) => Number(u.id) !== Number(auth.user?.id)),
)

const isAllSelected = computed(
  () =>
    selectableUsers.value.length > 0 &&
    selectableUsers.value.every((u) => selectedIds.value.includes(u.id)),
)

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = selectableUsers.value.map((u) => u.id)
  }
}

function toggleSelectUser(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// Dialogs state
const isFormDialogOpen = ref(false)
const editingUser = ref<UserItem | null>(null)
const formError = ref<string | null>(null)

const isDeleteDialogOpen = ref(false)
const deletingUser = ref<UserItem | null>(null)

const isBulkDeleteDialogOpen = ref(false)

const actionAlert = ref<{ message: string; tone: 'success' | 'error' } | null>(null)

function openCreateDialog() {
  editingUser.value = null
  formError.value = null
  isFormDialogOpen.value = true
}

function openEditDialog(user: UserItem) {
  editingUser.value = user
  formError.value = null
  isFormDialogOpen.value = true
}

async function handleSaveUser(payload: CreateUserPayload | UpdateUserPayload) {
  formError.value = null
  try {
    if (editingUser.value) {
      await updateMutation.mutateAsync({
        id: editingUser.value.id,
        payload,
      })
      actionAlert.value = {
        message: `Pengguna "${payload.name}" berhasil diperbarui.`,
        tone: 'success',
      }
    } else {
      await createMutation.mutateAsync(payload as CreateUserPayload)
      actionAlert.value = {
        message: `Pengguna "${payload.name}" berhasil ditambahkan.`,
        tone: 'success',
      }
    }
    isFormDialogOpen.value = false
  } catch (err) {
    if (isApiError(err)) {
      formError.value = err.message
    } else {
      formError.value = 'Gagal menyimpan pengguna. Silakan periksa kembali data Anda.'
    }
  }
}

async function handleToggleStatus(user: UserItem) {
  if (Number(user.id) === Number(auth.user?.id)) return
  try {
    const res = await toggleStatusMutation.mutateAsync(user.id)
    const statusText = res.is_active ? 'diaktifkan' : 'dinonaktifkan'
    actionAlert.value = {
      message: `Akun "${user.name}" berhasil ${statusText}.`,
      tone: 'success',
    }
  } catch (err) {
    actionAlert.value = {
      message: isApiError(err) ? err.message : 'Gagal mengubah status pengguna.',
      tone: 'error',
    }
  }
}

function confirmDelete(user: UserItem) {
  if (Number(user.id) === Number(auth.user?.id)) return
  deletingUser.value = user
  isDeleteDialogOpen.value = true
}

async function handleDeleteUser() {
  if (!deletingUser.value) return
  const target = deletingUser.value
  try {
    await deleteMutation.mutateAsync(target.id)
    actionAlert.value = {
      message: `Pengguna "${target.name}" berhasil dihapus.`,
      tone: 'success',
    }
    isDeleteDialogOpen.value = false
    deletingUser.value = null
    selectedIds.value = selectedIds.value.filter((id) => id !== target.id)
  } catch (err) {
    actionAlert.value = {
      message: isApiError(err) ? err.message : 'Gagal menghapus pengguna.',
      tone: 'error',
    }
    isDeleteDialogOpen.value = false
  }
}

function confirmBulkDelete() {
  if (selectedIds.value.length === 0) return
  isBulkDeleteDialogOpen.value = true
}

async function handleBulkDelete() {
  try {
    const res = await bulkDeleteMutation.mutateAsync(selectedIds.value)
    actionAlert.value = {
      message: `${res.deleted_count} pengguna berhasil dihapus.`,
      tone: 'success',
    }
    isBulkDeleteDialogOpen.value = false
    selectedIds.value = []
  } catch (err) {
    actionAlert.value = {
      message: isApiError(err) ? err.message : 'Gagal menghapus pengguna terpilih.',
      tone: 'error',
    }
    isBulkDeleteDialogOpen.value = false
  }
}

function handlePageChange(newPage: number) {
  currentPage.value = newPage
  void router.replace({ query: { ...route.query, page: String(newPage) } })
}
</script>

<template>
  <div class="users-page">
    <div class="users-page__container">
      <!-- Header -->
      <div class="users-page__header">
        <div>
          <h1 class="users-page__title">Manajemen Pengguna</h1>
          <p class="users-page__desc">
            Kelola akun pengguna, penetapan peran (role), dan status aktifasi dalam sistem.
          </p>
        </div>
        <div v-if="canCreate">
          <UiButton variant="primary" data-testid="user-add-btn" @click="openCreateDialog">
            <template #icon><i class="pi pi-user-plus" aria-hidden="true" /></template>
            Tambah Pengguna
          </UiButton>
        </div>
      </div>

      <!-- Action Feedback Alert -->
      <UiInlineAlert
        v-if="actionAlert"
        class="users-page__alert"
        :title="actionAlert.tone === 'success' ? 'Berhasil' : 'Pemberitahuan'"
        :tone="actionAlert.tone"
        dismissible
        @dismiss="actionAlert = null"
      >
        <p>{{ actionAlert.message }}</p>
      </UiInlineAlert>

      <!-- Main Content Surface -->
      <UiSurface class="users-page__content">
        <!-- Filters Toolbar -->
        <div class="users-page__toolbar">
          <div class="users-page__search-box">
            <i class="pi pi-search" aria-hidden="true" />
            <input
              v-model="search"
              type="text"
              placeholder="Cari nama atau email pengguna..."
              class="users-page__search-input"
              data-testid="users-search-input"
              @keydown.enter="updateFilters"
            />
          </div>

          <div class="users-page__filters">
            <select
              v-model="selectedRole"
              class="users-page__select"
              aria-label="Filter berdasarkan role"
              @change="updateFilters"
            >
              <option value="">Semua Role</option>
              <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>

            <select
              v-model="selectedStatus"
              class="users-page__select"
              aria-label="Filter berdasarkan status"
              @change="updateFilters"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>

            <UiButton variant="secondary" size="sm" @click="updateFilters"> Terapkan </UiButton>
          </div>
        </div>

        <!-- Bulk Action Bar -->
        <div v-if="selectedIds.length > 0" class="users-page__bulk-bar">
          <div class="users-page__bulk-info">
            <i class="pi pi-check-square" aria-hidden="true" />
            <span
              ><strong>{{ selectedIds.length }}</strong> pengguna terpilih</span
            >
          </div>
          <div class="users-page__bulk-actions">
            <UiButton v-if="canDeleteAny" variant="danger" size="sm" @click="confirmBulkDelete">
              <template #icon><i class="pi pi-trash" aria-hidden="true" /></template>
              Hapus Terpilih
            </UiButton>
            <UiButton variant="ghost" size="sm" @click="selectedIds = []">
              Batalkan Pilihan
            </UiButton>
          </div>
        </div>

        <!-- Table Shell -->
        <DataTableShell
          :state="tableState"
          title="Daftar Pengguna"
          empty-title="Tidak ada pengguna ditemukan"
          empty-description="Coba ubah kata kunci pencarian atau filter status untuk menemukan pengguna."
          class="users-page__table-shell"
        >
          <template v-if="canCreate" #empty-actions>
            <UiButton variant="primary" @click="openCreateDialog">
              <template #icon><i class="pi pi-user-plus" aria-hidden="true" /></template>
              Tambah Pengguna Baru
            </UiButton>
          </template>

          <table>
            <thead>
              <tr>
                <th style="width: 44px" class="text-center">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :disabled="selectableUsers.length === 0"
                    aria-label="Pilih semua pengguna di halaman ini"
                    class="users-page__checkbox"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>Pengguna</th>
                <th>Role & Hak Akses</th>
                <th style="width: 140px">Status</th>
                <th style="width: 160px">Terdaftar</th>
                <th style="width: 110px" class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td class="text-center">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(user.id)"
                    :disabled="Number(user.id) === Number(auth.user?.id)"
                    :aria-label="`Pilih pengguna ${user.name}`"
                    class="users-page__checkbox"
                    @change="toggleSelectUser(user.id)"
                  />
                </td>
                <td>
                  <div class="users-page__user-cell">
                    <div class="users-page__avatar">
                      {{ user.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="users-page__user-info">
                      <div class="users-page__name-row">
                        <strong class="users-page__user-name">{{ user.name }}</strong>
                        <span
                          v-if="Number(user.id) === Number(auth.user?.id)"
                          class="users-page__self-badge"
                        >
                          Anda
                        </span>
                      </div>
                      <span class="users-page__user-email">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="users-page__roles-list">
                    <span
                      v-for="role in user.roles"
                      :key="role"
                      class="users-page__role-tag"
                      :class="`users-page__role-tag--${role}`"
                    >
                      {{
                        role === 'super_admin'
                          ? 'Super Admin'
                          : role === 'pimpinan'
                            ? 'Pimpinan'
                            : role === 'data_contributor'
                              ? 'Kontributor Data'
                              : role
                      }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="users-page__status-cell">
                    <UiStatusBadge
                      :tone="user.is_active ? 'success' : 'neutral'"
                      :label="user.is_active ? 'Aktif' : 'Nonaktif'"
                    />
                    <button
                      v-if="canUpdate && Number(user.id) !== Number(auth.user?.id)"
                      type="button"
                      class="users-page__status-btn"
                      :title="user.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'"
                      @click="handleToggleStatus(user)"
                    >
                      <i :class="user.is_active ? 'pi pi-ban' : 'pi pi-check'" aria-hidden="true" />
                    </button>
                  </div>
                </td>
                <td>
                  <span class="users-page__date">
                    {{ user.created_at ? formatDate(user.created_at) : '—' }}
                  </span>
                </td>
                <td class="text-right">
                  <div class="users-page__actions">
                    <button
                      v-if="canUpdate"
                      type="button"
                      class="users-page__action-btn"
                      title="Edit pengguna"
                      data-testid="user-edit-btn"
                      @click="openEditDialog(user)"
                    >
                      <i class="pi pi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      v-if="canDelete"
                      type="button"
                      class="users-page__action-btn users-page__action-btn--danger"
                      :disabled="Number(user.id) === Number(auth.user?.id)"
                      :title="
                        Number(user.id) === Number(auth.user?.id)
                          ? 'Anda tidak dapat menghapus akun Anda sendiri'
                          : 'Hapus pengguna'
                      "
                      data-testid="user-delete-btn"
                      @click="confirmDelete(user)"
                    >
                      <i class="pi pi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </DataTableShell>

        <!-- Pagination -->
        <div v-if="meta && meta.last_page > 1" class="users-page__pagination">
          <UiPagination
            :page="meta.current_page"
            :per-page="meta.per_page"
            :total="meta.total"
            @update:page="handlePageChange"
          />
        </div>
      </UiSurface>
    </div>

    <!-- Create / Edit Dialog -->
    <UserFormDialog
      v-model:open="isFormDialogOpen"
      :user="editingUser"
      :role-options="roleOptions"
      :loading="createMutation.isPending.value || updateMutation.isPending.value"
      :error="formError"
      @save="handleSaveUser"
    />

    <!-- Single Delete Confirm Dialog -->
    <UiConfirmDialog
      :open="isDeleteDialogOpen"
      title="Hapus Pengguna"
      description="Tindakan ini tidak dapat dibatalkan. Pengguna ini tidak akan dapat masuk kembali ke dalam sistem."
      confirm-variant="danger"
      confirm-label="Ya, Hapus Pengguna"
      cancel-label="Batal"
      :busy="deleteMutation.isPending.value"
      @cancel="isDeleteDialogOpen = false"
      @confirm="handleDeleteUser"
    >
      <p>
        Apakah Anda yakin ingin menghapus akun pengguna
        <strong>{{ deletingUser?.name }}</strong> ({{ deletingUser?.email }})?
      </p>
    </UiConfirmDialog>

    <!-- Bulk Delete Confirm Dialog -->
    <UiConfirmDialog
      :open="isBulkDeleteDialogOpen"
      title="Hapus Pengguna Terpilih"
      description="Tindakan ini permanen dan tidak dapat dipulihkan. Akun Anda sendiri tidak akan ikut terhapus."
      confirm-variant="danger"
      :confirm-label="`Ya, Hapus ${selectedIds.length} Pengguna`"
      cancel-label="Batal"
      :busy="bulkDeleteMutation.isPending.value"
      @cancel="isBulkDeleteDialogOpen = false"
      @confirm="handleBulkDelete"
    >
      <p>
        Apakah Anda yakin ingin menghapus <strong>{{ selectedIds.length }}</strong> akun pengguna
        terpilih sekaligus?
      </p>
    </UiConfirmDialog>
  </div>
</template>

<style scoped>
.users-page {
  padding: 32px 16px;
}

.users-page__container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.users-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.users-page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink-strong);
}

.users-page__desc {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--color-ink-muted);
}

.users-page__alert {
  margin-bottom: 4px;
}

.users-page__content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.users-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.users-page__search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
  max-width: 400px;
}

.users-page__search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-ink-muted);
  font-size: 0.875rem;
  pointer-events: none;
}

.users-page__search-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 36px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface-inset);
  color: var(--color-ink-strong);
  font-family: inherit;
  font-size: 0.8125rem;
  transition: all var(--transition-normal);
}

.users-page__search-input:focus {
  outline: none;
  background: var(--color-surface);
  border-color: var(--color-brand-amber);
  box-shadow: 0 0 0 3px var(--color-brand-amber-soft);
}

.users-page__filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.users-page__select {
  height: 38px;
  padding: 0 12px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  color: var(--color-ink-body);
  font-family: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: border-color var(--transition-normal);
}

.users-page__select:focus {
  outline: none;
  border-color: var(--color-brand-amber);
}

.users-page__bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  border-radius: var(--radius-card);
  background: var(--color-brand-amber-soft);
  border: 1px solid var(--color-brand-amber);
}

.users-page__bulk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-ink-strong);
}

.users-page__bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.users-page__checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-brand-amber);
  cursor: pointer;
}

.users-page__user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.users-page__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-ink-strong);
  color: var(--color-brand-amber);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.users-page__user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.users-page__name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.users-page__user-name {
  color: var(--color-ink-strong);
  font-size: 0.875rem;
}

.users-page__self-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--color-brand-amber-soft);
  color: var(--color-warning-text);
  font-size: 0.6875rem;
  font-weight: 700;
}

.users-page__user-email {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}

.users-page__roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.users-page__role-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
  border: 1px solid var(--color-border-soft);
}

.users-page__role-tag--super_admin {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.users-page__role-tag--pimpinan {
  background: #e0e7ff;
  color: #3730a3;
  border-color: #c7d2fe;
}

.users-page__role-tag--data_contributor {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.users-page__status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.users-page__status-btn {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.users-page__status-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-ink-strong);
}

.users-page__date {
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
}

.users-page__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.users-page__action-btn {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.users-page__action-btn:hover:not(:disabled) {
  border-color: var(--color-brand-amber);
  background: var(--color-surface-hover);
  color: var(--color-ink-strong);
}

.users-page__action-btn--danger:hover:not(:disabled) {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.users-page__action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.users-page__pagination {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.users-page__delete-warn {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--color-danger-text);
}
</style>
