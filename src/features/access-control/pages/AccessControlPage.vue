<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { isApiError } from '@/shared/api/error'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'

import type {
  CreatePermissionPayload,
  CreateRolePayload,
  PermissionItem,
  RoleItem,
  UpdateRolePayload,
} from '../api/access-control.api'
import PermissionCreateDialog from '../components/PermissionCreateDialog.vue'
import RoleFormDialog from '../components/RoleFormDialog.vue'
import {
  useCreatePermissionMutation,
  useCreateRoleMutation,
  useDeletePermissionMutation,
  useDeleteRoleMutation,
  usePermissionsQuery,
  useRolesQuery,
  useUpdateRoleMutation,
} from '../composables/useAccessControl'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const canCreateRole = computed(() => auth.can('create_role'))
const canUpdateRole = computed(() => auth.can('update_role'))
const canDeleteRole = computed(() => auth.can('delete_role'))
const canCreatePermission = computed(() => auth.can('create_permission'))
const canDeletePermission = computed(() => auth.can('delete_permission'))

type ActiveTab = 'roles' | 'permissions'
const activeTab = ref<ActiveTab>('roles')

watch(
  () => route.query.tab,
  (tab) => {
    if (tab === 'roles' || tab === 'permissions') {
      activeTab.value = tab
    }
  },
  { immediate: true },
)

function setTab(tab: ActiveTab) {
  activeTab.value = tab
  void router.replace({ query: { tab } })
}

// Queries
const {
  data: rawRoles,
  isLoading: isLoadingRoles,
  isError: isErrorRoles,
  error: rolesError,
  refetch: refetchRoles,
} = useRolesQuery()

const {
  data: rawPermissions,
  isLoading: isLoadingPermissions,
  isError: isErrorPermissions,
  error: permissionsError,
  refetch: refetchPermissions,
} = usePermissionsQuery()

function formatQueryError(error: unknown, fallbackMessage: string): string {
  if (!error) return fallbackMessage
  if (isApiError(error)) {
    if (error.status === 403) {
      return `Akses ditolak (HTTP 403 - FORBIDDEN): Akun Anda belum memiliki izin hak akses (${error.message || 'view_access_control'}) pada server.`
    }
    const statusPart = error.status ? ` (HTTP ${error.status})` : ''
    const codePart = error.code && error.code !== `HTTP_${error.status}` ? `[${error.code}] ` : ''
    return `${codePart}${error.message}${statusPart}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallbackMessage
}

const rolesErrorMessage = computed(() =>
  formatQueryError(rolesError.value, 'Terjadi gangguan saat mengambil data role.'),
)

const permissionsErrorMessage = computed(() =>
  formatQueryError(permissionsError.value, 'Terjadi gangguan saat mengambil data permission.'),
)

const roles = computed<RoleItem[]>(() => rawRoles.value ?? [])
const permissions = computed<PermissionItem[]>(() => rawPermissions.value ?? [])

// Search filters
const roleSearch = ref('')
const permSearch = ref('')
const selectedGroupFilter = ref('')

const filteredRoles = computed<RoleItem[]>(() => {
  const q = roleSearch.value.trim().toLowerCase()
  if (!q) return roles.value
  return roles.value.filter((r) => r.name.toLowerCase().includes(q))
})

const permissionGroups = computed(() => {
  const groups = new Set<string>()
  for (const p of permissions.value) {
    if (p.group) groups.add(p.group)
  }
  return Array.from(groups).sort()
})

const filteredPermissions = computed<PermissionItem[]>(() => {
  const q = permSearch.value.trim().toLowerCase()
  const g = selectedGroupFilter.value
  return permissions.value.filter((p) => {
    const matchQuery = !q || p.name.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)
    const matchGroup = !g || p.group === g
    return matchQuery && matchGroup
  })
})

const rolesTableState = computed<'loading' | 'error' | 'empty' | 'success'>(() => {
  if (isLoadingRoles.value) return 'loading'
  if (isErrorRoles.value) return 'error'
  if (filteredRoles.value.length === 0) return 'empty'
  return 'success'
})

const permsTableState = computed<'loading' | 'error' | 'empty' | 'success'>(() => {
  if (isLoadingPermissions.value) return 'loading'
  if (isErrorPermissions.value) return 'error'
  if (filteredPermissions.value.length === 0) return 'empty'
  return 'success'
})

// Mutations
const createRoleMutation = useCreateRoleMutation()
const updateRoleMutation = useUpdateRoleMutation()
const deleteRoleMutation = useDeleteRoleMutation()
const createPermissionMutation = useCreatePermissionMutation()
const deletePermissionMutation = useDeletePermissionMutation()

// Role Dialog
const isRoleDialogOpen = ref(false)
const editingRole = ref<RoleItem | null>(null)
const roleFormError = ref<string | null>(null)

function openCreateRoleDialog() {
  editingRole.value = null
  roleFormError.value = null
  isRoleDialogOpen.value = true
}

function openEditRoleDialog(role: RoleItem) {
  editingRole.value = role
  roleFormError.value = null
  isRoleDialogOpen.value = true
}

async function handleSaveRole(payload: CreateRolePayload | UpdateRolePayload) {
  roleFormError.value = null
  try {
    if (editingRole.value) {
      await updateRoleMutation.mutateAsync({
        id: editingRole.value.id,
        payload,
      })
      actionAlert.value = {
        message: `Role "${payload.name}" berhasil diperbarui.`,
        tone: 'success',
      }
    } else {
      await createRoleMutation.mutateAsync(payload)
      actionAlert.value = {
        message: `Role "${payload.name}" berhasil dibuat.`,
        tone: 'success',
      }
    }
    isRoleDialogOpen.value = false
  } catch (err) {
    roleFormError.value = isApiError(err) ? err.message : 'Gagal menyimpan data role.'
  }
}

// Delete Role
const isDeleteRoleDialogOpen = ref(false)
const deletingRole = ref<RoleItem | null>(null)

function confirmDeleteRole(role: RoleItem) {
  if (role.is_locked || role.users_count > 0) return
  deletingRole.value = role
  isDeleteRoleDialogOpen.value = true
}

async function handleDeleteRole() {
  if (!deletingRole.value) return
  const target = deletingRole.value
  try {
    await deleteRoleMutation.mutateAsync(target.id)
    actionAlert.value = {
      message: `Role "${target.name}" berhasil dihapus.`,
      tone: 'success',
    }
    isDeleteRoleDialogOpen.value = false
    deletingRole.value = null
  } catch (err) {
    actionAlert.value = {
      message: isApiError(err) ? err.message : 'Gagal menghapus role.',
      tone: 'error',
    }
    isDeleteRoleDialogOpen.value = false
  }
}

// Permission Dialog
const isPermDialogOpen = ref(false)
const permFormError = ref<string | null>(null)

function openCreatePermDialog() {
  permFormError.value = null
  isPermDialogOpen.value = true
}

async function handleSavePermission(payload: CreatePermissionPayload) {
  permFormError.value = null
  try {
    await createPermissionMutation.mutateAsync(payload)
    actionAlert.value = {
      message: `Permission "${payload.name}" berhasil dibuat.`,
      tone: 'success',
    }
    isPermDialogOpen.value = false
  } catch (err) {
    permFormError.value = isApiError(err) ? err.message : 'Gagal menambahkan permission.'
  }
}

// Delete Permission
const isDeletePermDialogOpen = ref(false)
const deletingPerm = ref<PermissionItem | null>(null)

function confirmDeletePerm(perm: PermissionItem) {
  if (perm.is_locked || perm.roles_count > 0 || perm.users_count > 0) return
  deletingPerm.value = perm
  isDeletePermDialogOpen.value = true
}

async function handleDeletePermission() {
  if (!deletingPerm.value) return
  const target = deletingPerm.value
  try {
    await deletePermissionMutation.mutateAsync(target.id)
    actionAlert.value = {
      message: `Permission "${target.name}" berhasil dihapus.`,
      tone: 'success',
    }
    isDeletePermDialogOpen.value = false
    deletingPerm.value = null
  } catch (err) {
    actionAlert.value = {
      message: isApiError(err) ? err.message : 'Gagal menghapus permission.',
      tone: 'error',
    }
    isDeletePermDialogOpen.value = false
  }
}

const actionAlert = ref<{ message: string; tone: 'success' | 'error' } | null>(null)
</script>

<template>
  <div class="access-control-page">
    <div class="access-control-page__container">
      <!-- Header -->
      <div class="access-control-page__header">
        <div>
          <h1 class="access-control-page__title">Manajemen Hak Akses</h1>
          <p class="access-control-page__desc">
            Kelola peran (roles) dan pembagian kewenangan izin akses (permissions) dalam sistem.
          </p>
        </div>

        <div class="access-control-page__header-actions">
          <UiButton
            v-if="activeTab === 'roles' && canCreateRole"
            variant="primary"
            data-testid="role-add-btn"
            @click="openCreateRoleDialog"
          >
            <template #icon><i class="pi pi-plus" aria-hidden="true" /></template>
            Tambah Role
          </UiButton>
          <UiButton
            v-if="activeTab === 'permissions' && canCreatePermission"
            variant="primary"
            data-testid="permission-add-btn"
            @click="openCreatePermDialog"
          >
            <template #icon><i class="pi pi-plus" aria-hidden="true" /></template>
            Tambah Permission
          </UiButton>
        </div>
      </div>

      <!-- Action Feedback Alert -->
      <UiInlineAlert
        v-if="actionAlert"
        class="access-control-page__alert"
        :title="actionAlert.tone === 'success' ? 'Berhasil' : 'Pemberitahuan'"
        :tone="actionAlert.tone"
        dismissible
        @dismiss="actionAlert = null"
      >
        <p>{{ actionAlert.message }}</p>
      </UiInlineAlert>

      <!-- Tabs Navigation -->
      <div class="access-control-page__tabs" role="tablist" aria-label="Navigasi manajemen akses">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'roles'"
          class="access-control-page__tab-btn"
          :class="{ 'access-control-page__tab-btn--active': activeTab === 'roles' }"
          @click="setTab('roles')"
        >
          <i class="pi pi-shield" aria-hidden="true" />
          <span>Peran (Roles)</span>
          <span class="access-control-page__tab-badge">{{ roles.length }}</span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'permissions'"
          class="access-control-page__tab-btn"
          :class="{ 'access-control-page__tab-btn--active': activeTab === 'permissions' }"
          @click="setTab('permissions')"
        >
          <i class="pi pi-key" aria-hidden="true" />
          <span>Izin Akses (Permissions)</span>
          <span class="access-control-page__tab-badge">{{ permissions.length }}</span>
        </button>
      </div>

      <!-- Main Content Surface -->
      <UiSurface class="access-control-page__content">
        <!-- =================== TAB 1: ROLES =================== -->
        <div v-if="activeTab === 'roles'" class="access-control-page__tab-content">
          <!-- Toolbar -->
          <div class="access-control-page__toolbar">
            <div class="access-control-page__search-box">
              <i class="pi pi-search" aria-hidden="true" />
              <input
                v-model="roleSearch"
                type="text"
                placeholder="Cari nama role..."
                class="access-control-page__search-input"
                data-testid="role-search-input"
              />
            </div>
          </div>

          <!-- Roles Table -->
          <DataTableShell
            :state="rolesTableState"
            title="Daftar Peran (Roles)"
            empty-title="Tidak ada role ditemukan"
            empty-description="Tidak ditemukan role yang sesuai dengan kata kunci pencarian Anda."
            :error-message="rolesErrorMessage"
            class="access-control-page__table-shell"
            @retry="refetchRoles()"
          >
            <template v-if="canCreateRole" #empty-actions>
              <UiButton variant="primary" @click="openCreateRoleDialog">
                <template #icon><i class="pi pi-plus" aria-hidden="true" /></template>
                Tambah Role Baru
              </UiButton>
            </template>

            <table>
              <thead>
                <tr>
                  <th style="width: 200px">Nama Peran</th>
                  <th style="width: 140px">Pengguna</th>
                  <th style="width: 150px">Total Izin</th>
                  <th>Cakupan Hak Akses</th>
                  <th style="width: 110px" class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="role in filteredRoles" :key="role.id">
                  <td>
                    <div class="access-control-page__role-cell">
                      <strong class="access-control-page__role-name">{{ role.name }}</strong>
                      <span
                        v-if="role.is_locked"
                        class="access-control-page__lock-badge"
                        title="Role sistem bawaan tidak dapat dihapus"
                      >
                        <i class="pi pi-lock" aria-hidden="true" /> Sistem
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="access-control-page__count-badge">
                      <i class="pi pi-users" aria-hidden="true" />
                      {{ role.users_count }} pengguna
                    </span>
                  </td>
                  <td>
                    <span class="access-control-page__count-badge">
                      <i class="pi pi-check-circle" aria-hidden="true" />
                      {{ role.permissions_count }} izin
                    </span>
                  </td>
                  <td>
                    <div class="access-control-page__perm-preview">
                      <code
                        v-for="p in role.permissions.slice(0, 3)"
                        :key="p"
                        class="access-control-page__perm-tag"
                      >
                        {{ p }}
                      </code>
                      <span
                        v-if="role.permissions.length > 3"
                        class="access-control-page__more-tag"
                      >
                        +{{ role.permissions.length - 3 }} lainnya
                      </span>
                      <span
                        v-else-if="role.permissions.length === 0"
                        class="access-control-page__empty-perms"
                      >
                        Belum ada izin
                      </span>
                    </div>
                  </td>
                  <td class="text-right">
                    <div class="access-control-page__actions">
                      <button
                        v-if="canUpdateRole"
                        type="button"
                        class="access-control-page__action-btn"
                        title="Edit hak akses role"
                        data-testid="role-edit-btn"
                        @click="openEditRoleDialog(role)"
                      >
                        <i class="pi pi-pencil" aria-hidden="true" />
                      </button>
                      <button
                        v-if="canDeleteRole"
                        type="button"
                        class="access-control-page__action-btn access-control-page__action-btn--danger"
                        :disabled="role.is_locked || role.users_count > 0"
                        :title="
                          role.is_locked
                            ? 'Role sistem bawaan tidak dapat dihapus'
                            : role.users_count > 0
                              ? 'Role masih digunakan oleh pengguna'
                              : 'Hapus role'
                        "
                        data-testid="role-delete-btn"
                        @click="confirmDeleteRole(role)"
                      >
                        <i class="pi pi-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </DataTableShell>
        </div>

        <!-- =================== TAB 2: PERMISSIONS =================== -->
        <div v-else class="access-control-page__tab-content">
          <!-- Toolbar -->
          <div class="access-control-page__toolbar">
            <div class="access-control-page__search-box">
              <i class="pi pi-search" aria-hidden="true" />
              <input
                v-model="permSearch"
                type="text"
                placeholder="Cari nama izin akses..."
                class="access-control-page__search-input"
                data-testid="permission-search-input"
              />
            </div>

            <div class="access-control-page__group-select-wrapper">
              <select
                v-model="selectedGroupFilter"
                class="access-control-page__select"
                aria-label="Filter berdasarkan modul / grup domain"
              >
                <option value="">Semua Modul / Grup</option>
                <option v-for="g in permissionGroups" :key="g" :value="g">
                  {{ g }}
                </option>
              </select>
            </div>
          </div>

          <!-- Permissions Table -->
          <DataTableShell
            :state="permsTableState"
            title="Daftar Izin Akses (Permissions)"
            empty-title="Tidak ada permission ditemukan"
            empty-description="Tidak ditemukan izin akses yang sesuai dengan filter pencarian."
            :error-message="permissionsErrorMessage"
            class="access-control-page__table-shell"
            @retry="refetchPermissions()"
          >
            <template v-if="canCreatePermission" #empty-actions>
              <UiButton variant="primary" @click="openCreatePermDialog">
                <template #icon><i class="pi pi-plus" aria-hidden="true" /></template>
                Tambah Permission Baru
              </UiButton>
            </template>

            <table>
              <thead>
                <tr>
                  <th>Nama Permission</th>
                  <th style="width: 200px">Grup / Modul</th>
                  <th style="width: 140px">Dipakai Role</th>
                  <th style="width: 140px">Pengguna Terkait</th>
                  <th style="width: 90px" class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="perm in filteredPermissions" :key="perm.id">
                  <td>
                    <code class="access-control-page__perm-name-code">{{ perm.name }}</code>
                  </td>
                  <td>
                    <span class="access-control-page__group-badge">
                      {{ perm.group || 'Umum' }}
                    </span>
                  </td>
                  <td>
                    <span class="access-control-page__stat-num"> {{ perm.roles_count }} role </span>
                  </td>
                  <td>
                    <span class="access-control-page__stat-num">
                      {{ perm.users_count }} pengguna
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="access-control-page__actions">
                      <button
                        v-if="canDeletePermission"
                        type="button"
                        class="access-control-page__action-btn access-control-page__action-btn--danger"
                        :disabled="perm.is_locked || perm.roles_count > 0 || perm.users_count > 0"
                        :title="
                          perm.is_locked
                            ? 'Permission sistem tidak dapat dihapus'
                            : perm.roles_count > 0 || perm.users_count > 0
                              ? 'Permission masih terpasang pada role atau pengguna'
                              : 'Hapus permission'
                        "
                        data-testid="permission-delete-btn"
                        @click="confirmDeletePerm(perm)"
                      >
                        <i class="pi pi-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </DataTableShell>
        </div>
      </UiSurface>
    </div>

    <!-- Role Create/Edit Dialog -->
    <RoleFormDialog
      v-model:open="isRoleDialogOpen"
      :role="editingRole"
      :permissions="permissions"
      :loading="createRoleMutation.isPending.value || updateRoleMutation.isPending.value"
      :error="roleFormError"
      @save="handleSaveRole"
    />

    <!-- Role Delete Confirm Dialog -->
    <UiConfirmDialog
      :open="isDeleteRoleDialogOpen"
      title="Hapus Role"
      description="Tindakan ini tidak dapat dibatalkan. Pastikan role ini tidak lagi digunakan oleh akun pengguna mana pun."
      confirm-variant="danger"
      confirm-label="Ya, Hapus Role"
      cancel-label="Batal"
      :busy="deleteRoleMutation.isPending.value"
      @cancel="isDeleteRoleDialogOpen = false"
      @confirm="handleDeleteRole"
    >
      <p>
        Apakah Anda yakin ingin menghapus role <strong>{{ deletingRole?.name }}</strong
        >?
      </p>
    </UiConfirmDialog>

    <!-- Permission Create Dialog -->
    <PermissionCreateDialog
      v-model:open="isPermDialogOpen"
      :loading="createPermissionMutation.isPending.value"
      :error="permFormError"
      @save="handleSavePermission"
    />

    <!-- Permission Delete Confirm Dialog -->
    <UiConfirmDialog
      :open="isDeletePermDialogOpen"
      title="Hapus Permission"
      description="Tindakan ini permanen. Pastikan permission ini tidak sedang digunakan pada role atau pengguna."
      confirm-variant="danger"
      confirm-label="Ya, Hapus Permission"
      cancel-label="Batal"
      :busy="deletePermissionMutation.isPending.value"
      @cancel="isDeletePermDialogOpen = false"
      @confirm="handleDeletePermission"
    >
      <p>
        Apakah Anda yakin ingin menghapus permission <code>{{ deletingPerm?.name }}</code
        >?
      </p>
    </UiConfirmDialog>
  </div>
</template>

<style scoped>
.access-control-page {
  padding: 32px 16px;
}

.access-control-page__container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.access-control-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.access-control-page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink-strong);
}

.access-control-page__desc {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--color-ink-muted);
}

.access-control-page__alert {
  margin-bottom: 4px;
}

.access-control-page__tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--color-border-soft);
  padding-bottom: 12px;
}

.access-control-page__tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  color: var(--color-ink-body);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.access-control-page__tab-btn:hover {
  border-color: var(--color-brand-amber);
  color: var(--color-ink-strong);
}

.access-control-page__tab-btn--active {
  background: var(--color-ink-strong);
  color: #ffffff;
  border-color: var(--color-ink-strong);
}

.access-control-page__tab-badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 9999px;
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.access-control-page__tab-btn--active .access-control-page__tab-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.access-control-page__content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.access-control-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.access-control-page__search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
  max-width: 400px;
}

.access-control-page__search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-ink-muted);
  font-size: 0.875rem;
  pointer-events: none;
}

.access-control-page__search-input {
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

.access-control-page__search-input:focus {
  outline: none;
  background: var(--color-surface);
  border-color: var(--color-brand-amber);
  box-shadow: 0 0 0 3px var(--color-brand-amber-soft);
}

.access-control-page__select {
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

.access-control-page__select:focus {
  outline: none;
  border-color: var(--color-brand-amber);
}

.access-control-page__role-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.access-control-page__role-name {
  font-size: 0.875rem;
  color: var(--color-ink-strong);
}

.access-control-page__lock-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-brand-amber-soft);
  color: var(--color-warning-text);
  font-size: 0.6875rem;
  font-weight: 700;
}

.access-control-page__count-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: var(--color-ink-body);
}

.access-control-page__perm-preview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.access-control-page__perm-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-surface-inset);
  color: var(--color-ink-strong);
  font-size: 0.75rem;
  border: 1px solid var(--color-border-soft);
}

.access-control-page__more-tag {
  font-size: 0.75rem;
  color: var(--color-ink-muted);
  font-weight: 600;
}

.access-control-page__empty-perms {
  font-size: 0.75rem;
  color: var(--color-ink-muted);
  font-style: italic;
}

.access-control-page__perm-name-code {
  font-size: 0.8125rem;
  color: var(--color-ink-strong);
  font-weight: 600;
}

.access-control-page__group-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--color-surface-inset);
  border: 1px solid var(--color-border-soft);
  color: var(--color-ink-body);
  font-size: 0.75rem;
  font-weight: 600;
}

.access-control-page__stat-num {
  font-size: 0.8125rem;
  color: var(--color-ink-body);
}

.access-control-page__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.access-control-page__action-btn {
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

.access-control-page__action-btn:hover:not(:disabled) {
  border-color: var(--color-brand-amber);
  background: var(--color-surface-hover);
  color: var(--color-ink-strong);
}

.access-control-page__action-btn--danger:hover:not(:disabled) {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
  color: var(--color-danger-text);
}

.access-control-page__action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.access-control-page__delete-warn {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--color-danger-text);
}
</style>
