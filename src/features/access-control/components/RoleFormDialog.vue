<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import type { CreateRolePayload, PermissionItem, RoleItem, UpdateRolePayload } from '../api/access-control.api'

const props = defineProps<{
  open: boolean
  role: RoleItem | null
  permissions: PermissionItem[]
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: CreateRolePayload | UpdateRolePayload]
}>()

const isEdit = computed(() => Boolean(props.role))
const isLocked = computed(() => Boolean(props.role?.is_locked))
const dialogTitle = computed(() =>
  isEdit.value ? `Edit Hak Akses Role: ${props.role?.name}` : 'Tambah Role Baru',
)

interface FormState {
  name: string
  selectedPermissions: string[]
}

const form = reactive<FormState>({
  name: '',
  selectedPermissions: [],
})

const permissionSearch = ref('')
const nameError = ref('')

// Initialize form on open
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      nameError.value = ''
      permissionSearch.value = ''
      if (props.role) {
        form.name = props.role.name
        form.selectedPermissions = [...props.role.permissions]
      } else {
        form.name = ''
        form.selectedPermissions = []
      }
    }
  },
  { immediate: true },
)

// Group permissions by group name
const groupedPermissions = computed(() => {
  const groups: Record<string, PermissionItem[]> = {}
  const q = permissionSearch.value.trim().toLowerCase()

  for (const p of props.permissions) {
    if (q && !p.name.toLowerCase().includes(q) && !p.group.toLowerCase().includes(q)) {
      continue
    }
    const groupName = p.group || 'Umum'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(p)
  }

  return groups
})

const sortedGroupKeys = computed(() => Object.keys(groupedPermissions.value).sort())

function togglePermission(permName: string) {
  const idx = form.selectedPermissions.indexOf(permName)
  if (idx >= 0) {
    form.selectedPermissions.splice(idx, 1)
  } else {
    form.selectedPermissions.push(permName)
  }
}

function isGroupAllSelected(groupPerms: PermissionItem[]): boolean {
  if (groupPerms.length === 0) return false
  return groupPerms.every((p) => form.selectedPermissions.includes(p.name))
}

function toggleGroup(groupPerms: PermissionItem[]) {
  if (isGroupAllSelected(groupPerms)) {
    const permNames = new Set(groupPerms.map((p) => p.name))
    form.selectedPermissions = form.selectedPermissions.filter((p) => !permNames.has(p))
  } else {
    const existing = new Set(form.selectedPermissions)
    for (const p of groupPerms) {
      existing.add(p.name)
    }
    form.selectedPermissions = Array.from(existing)
  }
}

function selectAllFiltered() {
  const allFiltered = Object.values(groupedPermissions.value).flat()
  const existing = new Set(form.selectedPermissions)
  for (const p of allFiltered) {
    existing.add(p.name)
  }
  form.selectedPermissions = Array.from(existing)
}

function deselectAllFiltered() {
  const allFilteredNames = new Set(Object.values(groupedPermissions.value).flat().map((p) => p.name))
  form.selectedPermissions = form.selectedPermissions.filter((p) => !allFilteredNames.has(p))
}

function validate(): boolean {
  nameError.value = ''
  const trimmed = form.name.trim()

  if (!trimmed) {
    nameError.value = 'Nama role wajib diisi.'
    return false
  }

  if (!/^[a-z0-9_:\- ]+$/.test(trimmed)) {
    nameError.value = 'Role hanya boleh memakai huruf kecil, angka, spasi, underscore, atau strip.'
    return false
  }

  return true
}

function handleSubmit() {
  if (!validate()) return

  const payload: CreateRolePayload | UpdateRolePayload = {
    name: form.name.trim(),
    permissions: [...form.selectedPermissions],
  }

  emit('save', payload)
}
</script>

<template>
  <UiDialog
    :open="open"
    :title="dialogTitle"
    width="lg"
    @update:open="emit('update:open', $event)"
  >
    <form class="role-dialog__form" @submit.prevent="handleSubmit">
      <UiInlineAlert
        v-if="error"
        tone="error"
        title="Gagal menyimpan role"
        class="role-dialog__alert"
      >
        <p>{{ error }}</p>
      </UiInlineAlert>

      <UiField
        label="Nama Role / Peran"
        required
        :error="nameError"
        :help="isLocked ? 'Role sistem bawaan (super_admin). Nama tidak dapat diubah.' : 'Gunakan huruf kecil dan pemisah underscore atau strip (contoh: staff_penilai, verifikator).'"
      >
        <input
          v-model="form.name"
          type="text"
          placeholder="contoh: surveyor_lapangan"
          class="role-dialog__input"
          :disabled="isLocked"
          data-testid="role-form-name"
        />
      </UiField>

      <!-- Permissions Selection Section -->
      <div class="role-dialog__permissions-section">
        <div class="role-dialog__permissions-header">
          <div>
            <h3 class="role-dialog__section-title">Matriks Izin Akses (Permissions)</h3>
            <p class="role-dialog__section-desc">
              Pilih izin operasional yang diberikan kepada pengguna dengan role ini.
              <strong>{{ form.selectedPermissions.length }}</strong> dari {{ permissions.length }} izin terpilih.
            </p>
          </div>

          <div class="role-dialog__quick-actions">
            <button type="button" class="role-dialog__link-btn" @click="selectAllFiltered">
              Pilih Semua
            </button>
            <span class="role-dialog__divider">•</span>
            <button type="button" class="role-dialog__link-btn" @click="deselectAllFiltered">
              Kosongkan
            </button>
          </div>
        </div>

        <!-- Search permissions -->
        <div class="role-dialog__search-box">
          <i class="pi pi-search" aria-hidden="true" />
          <input
            v-model="permissionSearch"
            type="text"
            placeholder="Saring nama izin akses atau grup..."
            class="role-dialog__search-input"
          />
        </div>

        <!-- Grouped permissions list -->
        <div class="role-dialog__groups-container">
          <div
            v-for="groupKey in sortedGroupKeys"
            :key="groupKey"
            class="role-dialog__group-card"
          >
            <div class="role-dialog__group-header">
              <div class="role-dialog__group-info">
                <span class="role-dialog__group-title">{{ groupKey }}</span>
                <span class="role-dialog__group-count">
                  {{ groupedPermissions[groupKey]!.filter(p => form.selectedPermissions.includes(p.name)).length }}/{{ groupedPermissions[groupKey]!.length }}
                </span>
              </div>
              <button
                type="button"
                class="role-dialog__group-toggle-btn"
                @click="toggleGroup(groupedPermissions[groupKey]!)"
              >
                {{ isGroupAllSelected(groupedPermissions[groupKey]!) ? 'Batalkan Semua' : 'Pilih Semua' }}
              </button>
            </div>

            <div class="role-dialog__perms-grid">
              <label
                v-for="perm in groupedPermissions[groupKey]"
                :key="perm.name"
                class="role-dialog__perm-item"
                :class="{ 'role-dialog__perm-item--checked': form.selectedPermissions.includes(perm.name) }"
              >
                <input
                  type="checkbox"
                  :checked="form.selectedPermissions.includes(perm.name)"
                  class="role-dialog__perm-checkbox"
                  @change="togglePermission(perm.name)"
                />
                <code class="role-dialog__perm-code">{{ perm.name }}</code>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="role-dialog__footer">
        <UiButton
          type="button"
          variant="secondary"
          :disabled="loading"
          @click="emit('update:open', false)"
        >
          Batal
        </UiButton>
        <UiButton
          type="button"
          variant="primary"
          :loading="loading"
          loading-label="Menyimpan..."
          data-testid="role-form-submit"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Simpan Perubahan' : 'Tambah Role' }}
        </UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.role-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.role-dialog__alert {
  margin-bottom: 4px;
}

.role-dialog__input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  color: var(--color-ink-strong);
  font-family: inherit;
  font-size: 0.875rem;
  transition: all var(--transition-normal);
}

.role-dialog__input:focus {
  outline: none;
  border-color: var(--color-brand-amber);
  box-shadow: 0 0 0 3px var(--color-brand-amber-soft);
}

.role-dialog__input:disabled {
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
  cursor: not-allowed;
}

.role-dialog__permissions-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 16px;
}

.role-dialog__permissions-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.role-dialog__section-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-ink-strong);
}

.role-dialog__section-desc {
  margin: 2px 0 0;
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
}

.role-dialog__quick-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.role-dialog__link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-brand-amber);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.role-dialog__link-btn:hover {
  color: var(--color-ink-strong);
}

.role-dialog__divider {
  color: var(--color-ink-muted);
}

.role-dialog__search-box {
  position: relative;
  width: 100%;
}

.role-dialog__search-box i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-ink-muted);
  font-size: 0.8125rem;
  pointer-events: none;
}

.role-dialog__search-input {
  width: 100%;
  height: 34px;
  padding: 0 10px 0 32px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface-inset);
  color: var(--color-ink-strong);
  font-family: inherit;
  font-size: 0.8125rem;
  transition: all var(--transition-normal);
}

.role-dialog__search-input:focus {
  outline: none;
  border-color: var(--color-brand-amber);
  background: var(--color-surface);
}

.role-dialog__groups-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.role-dialog__group-card {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  overflow: hidden;
}

.role-dialog__group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-surface-inset);
  border-bottom: 1px solid var(--color-border-soft);
}

.role-dialog__group-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-dialog__group-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-ink-strong);
}

.role-dialog__group-count {
  font-size: 0.6875rem;
  padding: 1px 6px;
  border-radius: 9999px;
  background: var(--color-surface);
  color: var(--color-ink-muted);
  border: 1px solid var(--color-border-soft);
  font-weight: 600;
}

.role-dialog__group-toggle-btn {
  background: none;
  border: none;
  padding: 2px 6px;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
}

.role-dialog__group-toggle-btn:hover {
  background: var(--color-surface);
  color: var(--color-ink-strong);
}

.role-dialog__perms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 6px;
  padding: 10px 12px;
}

.role-dialog__perm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background var(--transition-normal);
}

.role-dialog__perm-item:hover {
  background: var(--color-surface-inset);
}

.role-dialog__perm-item--checked {
  background: var(--color-brand-amber-soft);
}

.role-dialog__perm-checkbox {
  width: 14px;
  height: 14px;
  accent-color: var(--color-brand-amber);
  cursor: pointer;
}

.role-dialog__perm-code {
  font-size: 0.75rem;
  color: var(--color-ink-strong);
  word-break: break-all;
}

.role-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}
</style>
