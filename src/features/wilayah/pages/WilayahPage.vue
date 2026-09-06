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
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatNumber } from '@/shared/formatters'

import type {
  CreateWilayahPayload,
  WilayahFilterParams,
  WilayahItem,
  WilayahResource,
} from '../api/wilayah.api'
import WilayahFormDialog from '../components/WilayahFormDialog.vue'
import {
  useCreateWilayahMutation,
  useDeleteWilayahMutation,
  useUpdateWilayahMutation,
  useWilayahListQuery,
} from '../composables/useWilayah'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const canCreate = computed(() => auth.can('create_geo_data'))
const canUpdate = computed(() => auth.can('update_geo_data'))
const canDelete = computed(() => auth.can('delete_geo_data'))

const tabs: { key: WilayahResource; label: string; icon: string }[] = [
  { key: 'provinces', label: 'Provinsi', icon: 'pi pi-flag' },
  { key: 'regencies', label: 'Kabupaten / Kota', icon: 'pi pi-building' },
  { key: 'districts', label: 'Kecamatan', icon: 'pi pi-map-marker' },
  { key: 'villages', label: 'Desa / Kelurahan', icon: 'pi pi-home' },
]

const currentResource = ref<WilayahResource>('provinces')
const search = ref('')
const selectedProvinceId = ref('')
const selectedRegencyId = ref('')
const selectedDistrictId = ref('')
const currentPage = ref(1)

// Synchronize with URL query
watch(
  () => route.query,
  (q) => {
    if (q.tab && ['provinces', 'regencies', 'districts', 'villages'].includes(String(q.tab))) {
      currentResource.value = String(q.tab) as WilayahResource
    }
    if (typeof q.search === 'string') search.value = q.search
    if (typeof q.province_id === 'string') selectedProvinceId.value = q.province_id
    if (typeof q.regency_id === 'string') selectedRegencyId.value = q.regency_id
    if (typeof q.district_id === 'string') selectedDistrictId.value = q.district_id
    if (q.page && Number(q.page) > 0) currentPage.value = Number(q.page)
  },
  { immediate: true },
)

function setTab(tab: WilayahResource) {
  currentResource.value = tab
  currentPage.value = 1
  search.value = ''
  selectedProvinceId.value = ''
  selectedRegencyId.value = ''
  selectedDistrictId.value = ''
  void router.replace({ query: { tab } })
}

const queryParams = computed<WilayahFilterParams>(() => ({
  search: search.value.trim() || undefined,
  province_id: selectedProvinceId.value || undefined,
  regency_id: selectedRegencyId.value || undefined,
  district_id: selectedDistrictId.value || undefined,
  page: currentPage.value,
  per_page: 20,
}))

// Query
const { data: response, isLoading, isError } = useWilayahListQuery(
  currentResource,
  queryParams,
)

const items = computed<WilayahItem[]>(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const stats = computed(() => response.value?.stats)
const resourceMeta = computed(() => response.value?.resource_meta)
const options = computed(() => response.value?.options)

const tableState = computed<'loading' | 'error' | 'empty' | 'success'>(() => {
  if (isLoading.value) return 'loading'
  if (isError.value) return 'error'
  if (items.value.length === 0) return 'empty'
  return 'success'
})

// Mutations
const createMutation = useCreateWilayahMutation(currentResource)
const updateMutation = useUpdateWilayahMutation(currentResource)
const deleteMutation = useDeleteWilayahMutation(currentResource)

// Form Dialog state
const isFormDialogOpen = ref(false)
const editingItem = ref<WilayahItem | null>(null)
const formError = ref<string | null>(null)

// Delete Dialog state
const isDeleteDialogOpen = ref(false)
const deletingItem = ref<WilayahItem | null>(null)
const actionAlert = ref<{ message: string; tone: 'success' | 'error' } | null>(null)

function openCreateDialog() {
  editingItem.value = null
  formError.value = null
  isFormDialogOpen.value = true
}

function openEditDialog(item: WilayahItem) {
  editingItem.value = item
  formError.value = null
  isFormDialogOpen.value = true
}

async function handleSaveWilayah(payload: CreateWilayahPayload) {
  formError.value = null
  try {
    if (editingItem.value) {
      await updateMutation.mutateAsync({
        id: editingItem.value.id,
        payload: { name: payload.name },
      })
      actionAlert.value = {
        message: `Wilayah "${payload.name}" berhasil diperbarui.`,
        tone: 'success',
      }
    } else {
      await createMutation.mutateAsync(payload)
      actionAlert.value = {
        message: `Wilayah "${payload.name}" berhasil ditambahkan.`,
        tone: 'success',
      }
    }
    isFormDialogOpen.value = false
  } catch (err) {
    if (isApiError(err)) {
      formError.value = err.message
    } else {
      formError.value = 'Gagal menyimpan wilayah. Silakan coba lagi.'
    }
  }
}

function confirmDelete(item: WilayahItem) {
  deletingItem.value = item
  isDeleteDialogOpen.value = true
}

async function handleDeleteWilayah() {
  if (!deletingItem.value) return
  const target = deletingItem.value
  try {
    await deleteMutation.mutateAsync(target.id)
    actionAlert.value = {
      message: `Wilayah "${target.name}" berhasil dihapus.`,
      tone: 'success',
    }
    isDeleteDialogOpen.value = false
    deletingItem.value = null
  } catch (err) {
    actionAlert.value = {
      message: isApiError(err)
        ? err.message
        : 'Gagal menghapus wilayah. Wilayah ini mungkin masih memiliki sub-wilayah atau digunakan pada data pembanding.',
      tone: 'error',
    }
    isDeleteDialogOpen.value = false
  }
}

// Drill-down from parent level to child level
function drillDown(item: WilayahItem) {
  if (currentResource.value === 'provinces') {
    currentResource.value = 'regencies'
    selectedProvinceId.value = item.id
    currentPage.value = 1
    void router.replace({ query: { tab: 'regencies', province_id: item.id } })
  } else if (currentResource.value === 'regencies') {
    currentResource.value = 'districts'
    selectedRegencyId.value = item.id
    currentPage.value = 1
    void router.replace({ query: { tab: 'districts', regency_id: item.id } })
  } else if (currentResource.value === 'districts') {
    currentResource.value = 'villages'
    selectedDistrictId.value = item.id
    currentPage.value = 1
    void router.replace({ query: { tab: 'villages', district_id: item.id } })
  }
}

function handlePageChange(newPage: number) {
  currentPage.value = newPage
  void router.replace({ query: { ...route.query, page: String(newPage) } })
}
</script>

<template>
  <div class="wilayah-page">
    <div class="wilayah-page__container">
      <!-- Heading -->
      <div class="wilayah-page__header">
        <div>
          <h1 class="wilayah-page__title">Manajemen Wilayah</h1>
          <p class="wilayah-page__desc">
            Kelola data wilayah administratif 4 tingkat: Provinsi, Kabupaten/Kota, Kecamatan, dan Desa/Kelurahan.
          </p>
        </div>
        <div v-if="canCreate">
          <UiButton
            variant="primary"
            data-testid="wilayah-add-btn"
            @click="openCreateDialog"
          >
            <template #icon><i class="pi pi-plus" aria-hidden="true" /></template>
            Tambah {{ resourceMeta?.singular || 'Wilayah' }}
          </UiButton>
        </div>
      </div>

      <!-- Action Feedback Alert -->
      <UiInlineAlert
        v-if="actionAlert"
        class="wilayah-page__alert"
        :title="actionAlert.tone === 'success' ? 'Berhasil' : 'Pemberitahuan'"
        :tone="actionAlert.tone"
        dismissible
        @dismiss="actionAlert = null"
      >
        <p>{{ actionAlert.message }}</p>
      </UiInlineAlert>

      <!-- Stats Summary Cards -->
      <div v-if="stats" class="wilayah-page__stats">
        <div class="wilayah-page__stat-card">
          <div class="wilayah-page__stat-icon"><i class="pi pi-flag" aria-hidden="true" /></div>
          <div>
            <span class="wilayah-page__stat-value">{{ formatNumber(stats.provinces) }}</span>
            <span class="wilayah-page__stat-label">Provinsi</span>
          </div>
        </div>
        <div class="wilayah-page__stat-card">
          <div class="wilayah-page__stat-icon"><i class="pi pi-building" aria-hidden="true" /></div>
          <div>
            <span class="wilayah-page__stat-value">{{ formatNumber(stats.regencies) }}</span>
            <span class="wilayah-page__stat-label">Kabupaten / Kota</span>
          </div>
        </div>
        <div class="wilayah-page__stat-card">
          <div class="wilayah-page__stat-icon"><i class="pi pi-map-marker" aria-hidden="true" /></div>
          <div>
            <span class="wilayah-page__stat-value">{{ formatNumber(stats.districts) }}</span>
            <span class="wilayah-page__stat-label">Kecamatan</span>
          </div>
        </div>
        <div class="wilayah-page__stat-card">
          <div class="wilayah-page__stat-icon"><i class="pi pi-home" aria-hidden="true" /></div>
          <div>
            <span class="wilayah-page__stat-value">{{ formatNumber(stats.villages) }}</span>
            <span class="wilayah-page__stat-label">Desa / Kelurahan</span>
          </div>
        </div>
      </div>

      <!-- Level Tabs -->
      <div class="wilayah-page__tabs" role="tablist" aria-label="Tingkat wilayah administratif">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          role="tab"
          :aria-selected="currentResource === t.key"
          class="wilayah-page__tab-btn"
          :class="{ 'wilayah-page__tab-btn--active': currentResource === t.key }"
          @click="setTab(t.key)"
        >
          <i :class="t.icon" aria-hidden="true" />
          <span>{{ t.label }}</span>
        </button>
      </div>

      <!-- Main Content Surface -->
      <UiSurface class="wilayah-page__content">
        <!-- Filters toolbar -->
        <div class="wilayah-page__filters">
          <!-- Keyword search -->
          <div class="wilayah-page__search-box">
            <i class="pi pi-search" aria-hidden="true" />
            <input
              v-model="search"
              type="text"
              :placeholder="`Cari nama atau kode ${resourceMeta?.singular || 'wilayah'}...`"
              class="wilayah-page__search-input"
              data-testid="wilayah-search-input"
            />
          </div>

          <!-- Parent Filters based on active level -->
          <!-- Province filter for Regencies, Districts, Villages -->
          <div v-if="currentResource !== 'provinces' && options?.provinces" class="wilayah-page__select-wrapper">
            <select
              v-model="selectedProvinceId"
              class="wilayah-page__filter-select"
              aria-label="Filter berdasarkan provinsi"
            >
              <option value="">Semua Provinsi</option>
              <option v-for="p in options.provinces" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>

          <!-- Regency filter for Districts, Villages -->
          <div v-if="['districts', 'villages'].includes(currentResource) && options?.regencies" class="wilayah-page__select-wrapper">
            <select
              v-model="selectedRegencyId"
              class="wilayah-page__filter-select"
              aria-label="Filter berdasarkan kabupaten/kota"
            >
              <option value="">Semua Kab/Kota</option>
              <option v-for="r in options.regencies" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>

          <!-- District filter for Villages -->
          <div v-if="currentResource === 'villages' && options?.districts" class="wilayah-page__select-wrapper">
            <select
              v-model="selectedDistrictId"
              class="wilayah-page__filter-select"
              aria-label="Filter berdasarkan kecamatan"
            >
              <option value="">Semua Kecamatan</option>
              <option v-for="d in options.districts" :key="d.id" :value="d.id">
                {{ d.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <DataTableShell
          :state="tableState"
          :title="resourceMeta?.label || 'Daftar Wilayah'"
          empty-title="Tidak ada data wilayah"
          empty-description="Tidak ada data wilayah yang sesuai dengan filter pencarian."
          class="wilayah-page__table-shell"
        >
          <template v-if="canCreate" #empty-actions>
            <UiButton variant="primary" @click="openCreateDialog">
              <template #icon><i class="pi pi-plus" aria-hidden="true" /></template>
              Tambah Wilayah Baru
            </UiButton>
          </template>

          <table>
            <thead>
              <tr>
                <th style="width: 140px;">Kode Wilayah</th>
                <th>Nama Wilayah</th>
                <th v-if="resourceMeta?.parent_label">{{ resourceMeta.parent_label }}</th>
                <th v-if="resourceMeta?.children_label">{{ resourceMeta.children_label }}</th>
                <th style="width: 120px;" class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>
                  <code class="wilayah-page__code">{{ item.id }}</code>
                </td>
                <td>
                  <strong class="wilayah-page__item-name">{{ item.name }}</strong>
                </td>
                <td v-if="resourceMeta?.parent_label">
                  <span class="wilayah-page__parent-info">
                    {{ item.district?.name || item.regency?.name || item.province?.name || '—' }}
                  </span>
                </td>
                <td v-if="resourceMeta?.children_label">
                  <button
                    type="button"
                    class="wilayah-page__drilldown-btn"
                    title="Telusuri sub-wilayah"
                    @click="drillDown(item)"
                  >
                    <span>{{ item.children_count ?? 0 }} {{ resourceMeta.children_label }}</span>
                    <i class="pi pi-arrow-right" aria-hidden="true" />
                  </button>
                </td>
                <td class="text-right">
                  <div class="wilayah-page__row-actions">
                    <button
                      v-if="canUpdate"
                      type="button"
                      class="wilayah-page__action-btn wilayah-page__action-btn--edit"
                      title="Ubah nama wilayah"
                      @click="openEditDialog(item)"
                    >
                      <i class="pi pi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      v-if="canDelete"
                      type="button"
                      class="wilayah-page__action-btn wilayah-page__action-btn--delete"
                      title="Hapus wilayah"
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

        <!-- Pagination -->
        <div v-if="meta && meta.last_page > 1" class="wilayah-page__pagination">
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
    <WilayahFormDialog
      v-model:open="isFormDialogOpen"
      :resource="currentResource"
      :resource-meta="resourceMeta"
      :options="options"
      :item="editingItem"
      :parent-preset-id="selectedDistrictId || selectedRegencyId || selectedProvinceId"
      :busy="createMutation.isPending.value || updateMutation.isPending.value"
      :error="formError"
      @save="handleSaveWilayah"
    />

    <!-- Delete Confirmation Dialog -->
    <UiConfirmDialog
      v-model:open="isDeleteDialogOpen"
      title="Hapus wilayah administratif"
      :description="`Apakah Anda yakin ingin menghapus '${deletingItem?.name}' (${deletingItem?.id})? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus Sekarang"
      confirm-variant="danger"
      :busy="deleteMutation.isPending.value"
      @confirm="handleDeleteWilayah"
    />
  </div>
</template>

<style scoped>
.wilayah-page {
  padding: 32px 16px 64px;
}

.wilayah-page__container {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

.wilayah-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.wilayah-page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink-strong);
}

.wilayah-page__desc {
  margin: 4px 0 0;
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.wilayah-page__alert {
  margin-bottom: 4px;
}

.wilayah-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.wilayah-page__stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-overlay);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
}

.wilayah-page__stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-brand-amber-soft);
  color: var(--color-action-primary);
  font-size: 1.25rem;
}

.wilayah-page__stat-value {
  display: block;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-ink-strong);
  line-height: 1.2;
}

.wilayah-page__stat-label {
  display: block;
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
}

.wilayah-page__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wilayah-page__tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius-control);
  background: var(--color-surface);
  border: 1px solid var(--color-border-soft);
  color: var(--color-ink-body);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.wilayah-page__tab-btn:hover {
  border-color: var(--color-action-primary);
  background: var(--color-surface-inset);
}

.wilayah-page__tab-btn--active {
  background: var(--color-action-primary);
  border-color: var(--color-action-primary);
  color: #fff;
}

.wilayah-page__content {
  padding: 24px;
  display: grid;
  gap: 20px;
}

.wilayah-page__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.wilayah-page__search-box {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  padding: 0 12px;
  min-width: 260px;
  flex: 1;
}

.wilayah-page__search-box i {
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.wilayah-page__search-input {
  border: none;
  background: transparent;
  padding: 10px 10px;
  font-size: 0.875rem;
  color: var(--color-ink-strong);
  outline: none;
  width: 100%;
}

.wilayah-page__select-wrapper {
  min-width: 180px;
}

.wilayah-page__filter-select {
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-ink-strong);
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
}

.wilayah-page__code {
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--color-surface-inset);
  color: var(--color-ink-strong);
}

.wilayah-page__item-name {
  color: var(--color-ink-strong);
  font-size: 0.875rem;
}

.wilayah-page__parent-info {
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
}

.wilayah-page__drilldown-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: var(--color-brand-amber-soft);
  border: 1px solid transparent;
  color: var(--color-action-primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.wilayah-page__drilldown-btn:hover {
  border-color: var(--color-action-primary);
  background: var(--color-surface-inset);
}

.wilayah-page__row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.wilayah-page__action-btn {
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

.wilayah-page__action-btn--edit {
  color: var(--color-action-primary);
}

.wilayah-page__action-btn--edit:hover {
  background: var(--color-brand-amber-soft);
  border-color: var(--color-action-primary);
}

.wilayah-page__action-btn--delete {
  color: var(--color-feedback-error);
}

.wilayah-page__action-btn--delete:hover {
  background: #fef2f2;
  border-color: var(--color-feedback-error);
}

.wilayah-page__pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}

.text-right {
  text-align: right;
}
</style>
