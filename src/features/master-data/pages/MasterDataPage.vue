<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { isApiError } from '@/shared/api/error'
import AsyncPanel from '@/shared/components/patterns/AsyncPanel.vue'
import DataTableShell from '@/shared/components/patterns/DataTableShell.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'

import type { DictionaryCategory, DictionaryItem } from '../api/master-data.api'
import MasterDataItemDialog from '../components/MasterDataItemDialog.vue'
import {
  useCreateDictionaryItemMutation,
  useDeleteDictionaryItemMutation,
  useDictionaryCategoriesQuery,
  useDictionaryItemsQuery,
  useReorderDictionaryItemsMutation,
  useUpdateDictionaryItemMutation,
  useUpdateDictionaryStatusMutation,
} from '../composables/useMasterData'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Can view inactive data only if permission granted
const canViewInactive = computed(() => auth.can('view_master_data'))
const canCreate = computed(() => auth.can('create_master_data'))
const canUpdate = computed(() => auth.can('update_master_data'))
const canUpdateStatus = computed(
  () => auth.can('update_master_data_status') || auth.can('update_master_data'),
)
const canDelete = computed(() => auth.can('delete_master_data'))

// Categories query
const {
  data: categories,
  isLoading: isLoadingCategories,
  isError: isCategoriesError,
} = useDictionaryCategoriesQuery()

// Active category type from route query or default to 'jenis-listing'
const currentType = ref<string>('jenis-listing')

watch(
  () => route.query.type,
  (newType) => {
    if (typeof newType === 'string' && newType.trim()) {
      currentType.value = newType.trim()
    }
  },
  { immediate: true },
)

function setCategory(type: string) {
  currentType.value = type
  void router.replace({ query: { ...route.query, type } })
}

const activeOnly = ref(!canViewInactive.value)
const itemSearch = ref('')

// Items query
const {
  data: rawItems,
  isLoading: isLoadingItems,
  isError: isItemsError,
} = useDictionaryItemsQuery(currentType, activeOnly)

const activeCategory = computed<DictionaryCategory | undefined>(() =>
  categories.value?.find((c) => c.type === currentType.value),
)

// Filter items by local search
const filteredItems = computed<DictionaryItem[]>(() => {
  const list = rawItems.value ?? []
  if (!itemSearch.value.trim()) return list
  const q = itemSearch.value.toLowerCase().trim()
  return list.filter((it) => it.name.toLowerCase().includes(q) || it.slug.toLowerCase().includes(q))
})

const categoriesPanelState = computed<'loading' | 'error' | 'success'>(() => {
  if (isLoadingCategories.value) return 'loading'
  if (isCategoriesError.value) return 'error'
  return 'success'
})

const itemsPanelState = computed<'loading' | 'error' | 'empty' | 'success'>(() => {
  if (isLoadingItems.value) return 'loading'
  if (isItemsError.value) return 'error'
  if (filteredItems.value.length === 0) return 'empty'
  return 'success'
})

// Mutations
const createMutation = useCreateDictionaryItemMutation(currentType)
const updateMutation = useUpdateDictionaryItemMutation(currentType)
const statusMutation = useUpdateDictionaryStatusMutation(currentType)
const deleteMutation = useDeleteDictionaryItemMutation(currentType)
const reorderMutation = useReorderDictionaryItemsMutation(currentType)

// Dialog states
const isFormDialogOpen = ref(false)
const editingItem = ref<DictionaryItem | null>(null)
const formError = ref<string | null>(null)

// Delete confirm dialog state
const isDeleteDialogOpen = ref(false)
const deletingItem = ref<DictionaryItem | null>(null)
const actionAlertMessage = ref<string | null>(null)
const actionAlertTone = ref<'success' | 'error'>('success')

function openCreateDialog() {
  editingItem.value = null
  formError.value = null
  isFormDialogOpen.value = true
}

function openEditDialog(item: DictionaryItem) {
  editingItem.value = item
  formError.value = null
  isFormDialogOpen.value = true
}

async function handleSaveItem(payload: {
  name: string
  is_active: boolean
  badge_color?: string | null
  marker_icon_url?: string | null
}) {
  formError.value = null
  try {
    if (editingItem.value) {
      await updateMutation.mutateAsync({
        id: editingItem.value.id,
        payload,
      })
      actionAlertMessage.value = `Data "${payload.name}" berhasil diperbarui.`
    } else {
      await createMutation.mutateAsync(payload)
      actionAlertMessage.value = `Data "${payload.name}" berhasil ditambahkan.`
    }
    actionAlertTone.value = 'success'
    isFormDialogOpen.value = false
  } catch (err) {
    if (isApiError(err)) {
      formError.value = err.message
    } else {
      formError.value = 'Gagal menyimpan data master. Silakan coba lagi.'
    }
  }
}

async function handleToggleStatus(item: DictionaryItem) {
  if (!canUpdateStatus.value) return
  const newStatus = !item.is_active
  try {
    await statusMutation.mutateAsync({
      id: item.id,
      isActive: newStatus,
    })
    actionAlertMessage.value = `Status "${item.name}" diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}.`
    actionAlertTone.value = 'success'
  } catch (err) {
    actionAlertMessage.value = isApiError(err) ? err.message : 'Gagal mengubah status data.'
    actionAlertTone.value = 'error'
  }
}

function confirmDelete(item: DictionaryItem) {
  deletingItem.value = item
  isDeleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deletingItem.value) return
  const target = deletingItem.value
  try {
    await deleteMutation.mutateAsync(target.id)
    actionAlertMessage.value = `Data "${target.name}" berhasil dihapus.`
    actionAlertTone.value = 'success'
    isDeleteDialogOpen.value = false
    deletingItem.value = null
  } catch (err) {
    actionAlertMessage.value = isApiError(err)
      ? err.message
      : 'Gagal menghapus data master. Data ini mungkin masih digunakan.'
    actionAlertTone.value = 'error'
    isDeleteDialogOpen.value = false
  }
}

async function moveItem(index: number, direction: 'up' | 'down') {
  const list = [...(rawItems.value ?? [])]
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= list.length) return

  // Swap
  const tempA = list[index]
  const tempB = list[targetIndex]
  if (!tempA || !tempB) return

  list[index] = tempB
  list[targetIndex] = tempA

  const newIds = list.map((it) => it.id)
  try {
    await reorderMutation.mutateAsync(newIds)
    actionAlertMessage.value = 'Urutan data berhasil diperbarui.'
    actionAlertTone.value = 'success'
  } catch (err) {
    actionAlertMessage.value = isApiError(err) ? err.message : 'Gagal memperbarui urutan.'
    actionAlertTone.value = 'error'
  }
}
</script>

<template>
  <div class="master-data-page">
    <div class="master-data-page__container">
      <!-- Heading -->
      <div class="master-data-page__header">
        <div>
          <h1 class="master-data-page__title">Manajemen Master Data</h1>
          <p class="master-data-page__desc">
            Kelola data referensi dan opsi atribut properti untuk standarisasi penilaian.
          </p>
        </div>
        <div v-if="canCreate">
          <UiButton variant="primary" data-testid="master-data-add-btn" @click="openCreateDialog">
            <template #icon><i class="pi pi-plus" aria-hidden="true" /></template>
            Tambah {{ activeCategory?.label || 'Data' }}
          </UiButton>
        </div>
      </div>

      <!-- Action Feedback Alert -->
      <UiInlineAlert
        v-if="actionAlertMessage"
        class="master-data-page__alert"
        :title="actionAlertTone === 'success' ? 'Berhasil' : 'Pemberitahuan'"
        :tone="actionAlertTone"
        dismissible
        @dismiss="actionAlertMessage = null"
      >
        <p>{{ actionAlertMessage }}</p>
      </UiInlineAlert>

      <!-- Category Navigation Pills / Cards -->
      <AsyncPanel :state="categoriesPanelState" loading-title="Memuat kategori...">
        <div class="master-data-page__categories" role="tablist" aria-label="Kategori master data">
          <button
            v-for="cat in categories"
            :key="cat.type"
            type="button"
            role="tab"
            :aria-selected="currentType === cat.type"
            class="master-data-page__cat-btn"
            :class="{ 'master-data-page__cat-btn--active': currentType === cat.type }"
            @click="setCategory(cat.type)"
          >
            <i :class="cat.icon || 'pi pi-folder'" aria-hidden="true" />
            <span class="master-data-page__cat-label">{{ cat.label }}</span>
            <span class="master-data-page__cat-counter">
              {{ cat.stats.active }}/{{ cat.stats.total }}
            </span>
          </button>
        </div>
      </AsyncPanel>

      <!-- Main Category Content Surface -->
      <UiSurface class="master-data-page__content">
        <!-- Surface Header -->
        <div class="master-data-page__content-header">
          <div>
            <h2 class="master-data-page__content-title">
              {{ activeCategory?.label || 'Data Referensi' }}
            </h2>
            <p class="master-data-page__content-desc">
              {{
                activeCategory?.description ||
                'Daftar pilihan referensi yang dapat digunakan dalam sistem.'
              }}
            </p>
          </div>

          <!-- Controls: search & active toggle -->
          <div class="master-data-page__content-controls">
            <div class="master-data-page__search-box">
              <i class="pi pi-search" aria-hidden="true" />
              <input
                v-model="itemSearch"
                type="text"
                placeholder="Cari dalam kategori ini..."
                class="master-data-page__search-input"
              />
            </div>

            <label v-if="canViewInactive" class="master-data-page__filter-active">
              <input v-model="activeOnly" type="checkbox" />
              <span>Hanya aktif</span>
            </label>
          </div>
        </div>

        <!-- Items Table -->
        <DataTableShell
          :state="itemsPanelState"
          :title="activeCategory?.label || 'Data Referensi'"
          empty-title="Belum ada data referensi"
          empty-description="Belum ada item yang terdaftar pada kategori ini."
          class="master-data-page__table-shell"
        >
          <table>
            <thead>
              <tr>
                <th style="width: 60px">No</th>
                <th style="width: 100px">Urutan</th>
                <th>Nama Referensi</th>
                <th>Slug</th>
                <th>Penggunaan</th>
                <th style="width: 120px">Status</th>
                <th style="width: 140px" class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in filteredItems" :key="item.id">
                <td>{{ idx + 1 }}</td>
                <td>
                  <div class="master-data-page__reorder-btns">
                    <button
                      type="button"
                      class="master-data-page__arrow-btn"
                      :disabled="idx === 0 || reorderMutation.isPending.value"
                      title="Geser ke atas"
                      @click="moveItem(idx, 'up')"
                    >
                      <i class="pi pi-chevron-up" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      class="master-data-page__arrow-btn"
                      :disabled="
                        idx === filteredItems.length - 1 || reorderMutation.isPending.value
                      "
                      title="Geser ke bawah"
                      @click="moveItem(idx, 'down')"
                    >
                      <i class="pi pi-chevron-down" aria-hidden="true" />
                    </button>
                  </div>
                </td>
                <td>
                  <div class="master-data-page__item-name">
                    <span
                      v-if="item.badge_color"
                      class="master-data-page__color-dot"
                      :style="{ backgroundColor: item.badge_color }"
                    />
                    <strong>{{ item.name }}</strong>
                  </div>
                </td>
                <td>
                  <code class="master-data-page__slug">{{ item.slug }}</code>
                </td>
                <td>
                  <span class="master-data-page__usage">
                    <i class="pi pi-database" aria-hidden="true" />
                    {{ item.pembandings_count ?? 0 }} listing
                  </span>
                </td>
                <td>
                  <button
                    v-if="canUpdateStatus"
                    type="button"
                    class="master-data-page__status-btn"
                    :title="item.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'"
                    @click="handleToggleStatus(item)"
                  >
                    <UiStatusBadge :status="item.is_active ? 'active' : 'inactive'">
                      {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                    </UiStatusBadge>
                  </button>
                  <UiStatusBadge v-else :status="item.is_active ? 'active' : 'inactive'">
                    {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                  </UiStatusBadge>
                </td>
                <td class="text-right">
                  <div class="master-data-page__row-actions">
                    <button
                      v-if="canUpdate"
                      type="button"
                      class="master-data-page__action-btn master-data-page__action-btn--edit"
                      title="Ubah data"
                      @click="openEditDialog(item)"
                    >
                      <i class="pi pi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      v-if="canDelete"
                      type="button"
                      class="master-data-page__action-btn master-data-page__action-btn--delete"
                      title="Hapus data"
                      @click="confirmDelete(item)"
                    >
                      <i class="pi pi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </DataTableShell>
      </UiSurface>
    </div>

    <!-- Create / Edit Dialog -->
    <MasterDataItemDialog
      v-model:open="isFormDialogOpen"
      :category-type="currentType"
      :category-label="activeCategory?.label || 'Data'"
      :category-extra="activeCategory?.extra"
      :item="editingItem"
      :busy="createMutation.isPending.value || updateMutation.isPending.value"
      :error="formError"
      @save="handleSaveItem"
    />

    <!-- Delete Confirmation Dialog -->
    <UiConfirmDialog
      v-model:open="isDeleteDialogOpen"
      title="Hapus data master"
      :description="`Apakah Anda yakin ingin menghapus '${deletingItem?.name}'? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus Sekarang"
      confirm-variant="danger"
      :busy="deleteMutation.isPending.value"
      @confirm="handleDelete"
    />
  </div>
</template>

<style scoped>
.master-data-page {
  padding: 32px 16px 64px;
}

.master-data-page__container {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

.master-data-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.master-data-page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink-strong);
}

.master-data-page__desc {
  margin: 4px 0 0;
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.master-data-page__alert {
  margin-bottom: 4px;
}

.master-data-page__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 4px;
}

.master-data-page__cat-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius-control);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  color: var(--color-ink-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.master-data-page__cat-btn:hover {
  border-color: var(--color-action-primary);
  background: var(--color-surface-inset);
}

.master-data-page__cat-btn--active {
  background: var(--color-action-primary);
  border-color: var(--color-action-primary);
  color: #fff;
}

.master-data-page__cat-btn--active .master-data-page__cat-counter {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.master-data-page__cat-counter {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 9999px;
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
}

.master-data-page__content {
  padding: 24px;
  display: grid;
  gap: 20px;
}

.master-data-page__content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.master-data-page__content-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-ink-strong);
}

.master-data-page__content-desc {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--color-ink-muted);
}

.master-data-page__content-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.master-data-page__search-box {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  padding: 0 10px;
  min-width: 220px;
}

.master-data-page__search-box i {
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.master-data-page__search-input {
  border: none;
  background: transparent;
  padding: 8px 8px;
  font-size: 0.875rem;
  color: var(--color-ink-strong);
  outline: none;
  width: 100%;
}

.master-data-page__filter-active {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--color-ink-body);
  cursor: pointer;
  user-select: none;
}

.master-data-page__reorder-btns {
  display: flex;
  gap: 4px;
}

.master-data-page__arrow-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border-soft);
  border-radius: 4px;
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
  cursor: pointer;
  font-size: 0.625rem;
}

.master-data-page__arrow-btn:hover:not(:disabled) {
  background: var(--color-brand-amber-soft);
  color: var(--color-action-primary);
}

.master-data-page__arrow-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.master-data-page__item-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.master-data-page__color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.master-data-page__slug {
  font-size: 0.75rem;
  padding: 2px 6px;
  background: var(--color-surface-inset);
  border-radius: 4px;
  color: var(--color-ink-muted);
}

.master-data-page__usage {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
}

.master-data-page__status-btn {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.master-data-page__row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.master-data-page__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 0.8125rem;
  transition: all 0.15s ease;
}

.master-data-page__action-btn--edit {
  color: var(--color-action-primary);
}

.master-data-page__action-btn--edit:hover {
  background: var(--color-brand-amber-soft);
  border-color: var(--color-action-primary);
}

.master-data-page__action-btn--delete {
  color: var(--color-feedback-error);
}

.master-data-page__action-btn--delete:hover {
  background: #fef2f2;
  border-color: var(--color-feedback-error);
}

.text-right {
  text-align: right;
}
</style>
