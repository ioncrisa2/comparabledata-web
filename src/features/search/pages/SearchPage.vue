<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AsyncPanel from '@/shared/components/patterns/AsyncPanel.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiPagination from '@/shared/components/ui/UiPagination.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatNumber } from '@/shared/formatters'

import type { GlobalSearchResultItem } from '../api/search.api'
import { resolveSearchResultRoute, useGlobalSearchQuery } from '../composables/useGlobalSearch'

const route = useRoute()
const router = useRouter()

const searchInput = ref<HTMLInputElement | null>(null)
const rawKeyword = ref('')
const selectedGroup = ref('')
const currentPage = ref(1)

// Synchronize state with route query
watch(
  () => route.query,
  (q) => {
    if (typeof q.q === 'string') {
      rawKeyword.value = q.q
    } else {
      rawKeyword.value = ''
    }

    if (typeof q.menu_group === 'string') {
      selectedGroup.value = q.menu_group
    } else {
      selectedGroup.value = ''
    }

    if (q.page && Number(q.page) > 0) {
      currentPage.value = Number(q.page)
    } else {
      currentPage.value = 1
    }
  },
  { immediate: true },
)

const queryParams = computed(() => ({
  q: rawKeyword.value.trim(),
  menu_group: selectedGroup.value || undefined,
  page: currentPage.value,
  per_page: 20,
}))

const {
  data: searchResponse,
  isLoading,
  isError,
  error,
  refetch,
} = useGlobalSearchQuery(queryParams)

const results = computed<GlobalSearchResultItem[]>(() => searchResponse.value?.data ?? [])
const menuGroups = computed(() => searchResponse.value?.options?.menu_groups ?? [])
const meta = computed(() => searchResponse.value?.meta)
const summary = computed(() => searchResponse.value?.summary)

function handleSearchSubmit() {
  currentPage.value = 1
  void router.push({
    query: {
      ...route.query,
      q: rawKeyword.value.trim() || undefined,
      menu_group: selectedGroup.value || undefined,
      page: undefined,
    },
  })
}

function handleClearSearch() {
  rawKeyword.value = ''
  currentPage.value = 1
  void router.push({
    query: {
      ...route.query,
      q: undefined,
      page: undefined,
    },
  })
  searchInput.value?.focus()
}

function handleSelectGroup(group: string) {
  selectedGroup.value = group
  currentPage.value = 1
  void router.push({
    query: {
      ...route.query,
      menu_group: group || undefined,
      page: undefined,
    },
  })
}

function handlePageChange(newPage: number) {
  currentPage.value = newPage
  void router.push({
    query: {
      ...route.query,
      page: newPage > 1 ? String(newPage) : undefined,
    },
  })
}

function handleSelectResult(item: GlobalSearchResultItem) {
  const targetRoute = resolveSearchResultRoute(item)
  if (targetRoute) {
    void router.push(targetRoute)
  }
}

const panelState = computed<'initial' | 'loading' | 'error' | 'success'>(() => {
  if (!rawKeyword.value.trim()) return 'initial'
  if (isLoading.value) return 'loading'
  if (isError.value) return 'error'
  return 'success'
})
</script>

<template>
  <div class="search-page">
    <div class="search-page__container">
      <!-- Header -->
      <div class="search-page__header">
        <h1 class="search-page__title">Pencarian Global</h1>
        <p class="search-page__desc">
          Cari data pembanding, permohonan moderasi, master data, wilayah, dan pengguna.
        </p>
      </div>

      <!-- Search Input Toolbar -->
      <UiSurface class="search-page__toolbar" tone="default" elevation="raised">
        <form class="search-page__search-form" @submit.prevent="handleSearchSubmit">
          <div class="search-page__input-box">
            <i class="pi pi-search search-page__input-icon" aria-hidden="true" />
            <input
              ref="searchInput"
              v-model="rawKeyword"
              type="text"
              class="search-page__input"
              placeholder="Ketik kata kunci pencarian (alamat, ID, kategori, nama)..."
              autocomplete="off"
              data-testid="search-page-input"
            />
            <button
              v-if="rawKeyword"
              type="button"
              class="search-page__clear-btn"
              aria-label="Hapus kata kunci"
              @click="handleClearSearch"
            >
              <i class="pi pi-times" aria-hidden="true" />
            </button>
          </div>
          <UiButton
            type="submit"
            variant="primary"
            class="search-page__submit-btn"
            data-testid="search-page-submit"
          >
            <template #icon><i class="pi pi-search" aria-hidden="true" /></template>
            Cari
          </UiButton>
        </form>

        <!-- Category/Group Pills -->
        <div v-if="rawKeyword.trim() && menuGroups.length > 0" class="search-page__group-tabs">
          <button
            type="button"
            class="search-page__group-pill"
            :class="{ 'search-page__group-pill--active': selectedGroup === '' }"
            @click="handleSelectGroup('')"
          >
            Semua Kategori
            <span v-if="summary?.filtered_total !== undefined" class="search-page__group-count">
              {{ formatNumber(summary.filtered_total) }}
            </span>
          </button>
          <button
            v-for="grp in menuGroups"
            :key="grp.value"
            type="button"
            class="search-page__group-pill"
            :class="{ 'search-page__group-pill--active': selectedGroup === grp.value }"
            @click="handleSelectGroup(grp.value)"
          >
            {{ grp.label }}
          </button>
        </div>
      </UiSurface>

      <!-- Search Results Area with AsyncPanel -->
      <AsyncPanel
        :state="panelState"
        title="Hasil Pencarian"
        error-title="Gagal Memuat Hasil Pencarian"
        :error-message="
          error instanceof Error ? error.message : 'Terjadi gangguan saat mengambil data pencarian.'
        "
        @retry="() => void refetch()"
      >
        <template #initial>
          <UiSurface class="search-page__empty-card" tone="subtle">
            <UiEmptyState
              title="Mulai Pencarian"
              description="Ketik kata kunci di atas untuk mencari data di seluruh sistem HJAR Sysinfo."
              icon="pi pi-compass"
            />
          </UiSurface>
        </template>

        <template #default>
          <UiSurface v-if="results.length === 0" class="search-page__empty-card" tone="subtle">
            <UiEmptyState
              :title="`Tidak ada hasil untuk '${rawKeyword}'`"
              description="Coba periksa ejaan, gunakan kata kunci yang lebih umum, atau hapus filter kategori."
              :filtered="Boolean(selectedGroup)"
              icon="pi pi-search-minus"
            >
              <template v-if="selectedGroup" #actions>
                <UiButton variant="secondary" size="sm" @click="handleSelectGroup('')">
                  Tampilkan Semua Kategori
                </UiButton>
              </template>
            </UiEmptyState>
          </UiSurface>

          <div v-else class="search-page__results-container">
            <!-- Results Count Summary -->
            <div class="search-page__meta-bar">
              <span class="search-page__meta-count">
                Menemukan <strong>{{ formatNumber(meta?.total ?? results.length) }}</strong> hasil
                pencarian untuk "<em>{{ rawKeyword }}</em
                >"
              </span>
            </div>

            <!-- List of Result Cards -->
            <div class="search-page__results-list" role="list">
              <article
                v-for="(item, idx) in results"
                :key="`${item.target_type}-${item.target_id}-${idx}`"
                class="search-page__result-card"
                role="listitem"
                tabindex="0"
                @keydown.enter="handleSelectResult(item)"
                @click="handleSelectResult(item)"
              >
                <div class="search-page__result-icon-wrapper" aria-hidden="true">
                  <i :class="item.icon || 'pi pi-file'" />
                </div>

                <div class="search-page__result-main">
                  <div class="search-page__result-header">
                    <h2 class="search-page__result-title">{{ item.title }}</h2>
                    <div class="search-page__badges">
                      <span class="search-page__resource-badge">{{ item.resource_name }}</span>
                      <span class="search-page__group-badge">{{ item.menu_group }}</span>
                    </div>
                  </div>

                  <!-- Details Badges / Snippets -->
                  <div
                    v-if="item.details && Object.keys(item.details).length > 0"
                    class="search-page__result-details"
                  >
                    <span
                      v-for="(val, key) in item.details"
                      :key="key"
                      class="search-page__detail-chip"
                    >
                      <strong v-if="typeof key === 'string' && !['ID', '0', '1'].includes(key)"
                        >{{ key }}:
                      </strong>
                      {{ val }}
                    </span>
                  </div>
                </div>

                <div class="search-page__result-action">
                  <UiButton
                    variant="secondary"
                    size="sm"
                    aria-label="Lihat detail data"
                    @click.stop="handleSelectResult(item)"
                  >
                    Buka
                    <template #iconRight
                      ><i class="pi pi-arrow-right" aria-hidden="true"
                    /></template>
                  </UiButton>
                </div>
              </article>
            </div>

            <!-- Pagination -->
            <div v-if="meta && meta.last_page > 1" class="search-page__pagination">
              <UiPagination
                :page="meta.current_page"
                :per-page="meta.per_page"
                :total="meta.total"
                @update:page="handlePageChange"
              />
            </div>
          </div>
        </template>
      </AsyncPanel>
    </div>
  </div>
</template>

<style scoped>
.search-page {
  padding-block: var(--space-6);
}

.search-page__container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 1040px;
  margin-inline: auto;
  padding-inline: var(--space-4);
}

.search-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.search-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink-strong);
  margin: 0;
}

.search-page__desc {
  font-size: 0.875rem;
  color: var(--color-ink-muted);
  margin: 0;
}

.search-page__toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

.search-page__search-form {
  display: flex;
  gap: var(--space-2);
}

.search-page__input-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.search-page__input-box:focus-within {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px var(--color-brand-focus);
}

.search-page__input-icon {
  position: absolute;
  left: 12px;
  color: var(--color-ink-muted);
  font-size: 1rem;
  pointer-events: none;
}

.search-page__input {
  width: 100%;
  padding: 10px 36px 10px 36px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.9375rem;
  color: var(--color-ink-strong);
}

.search-page__input::placeholder {
  color: var(--color-ink-muted);
}

.search-page__clear-btn {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
  cursor: pointer;
  font-size: 0.75rem;
}

.search-page__clear-btn:hover {
  background: var(--color-border-subtle);
  color: var(--color-ink-strong);
}

.search-page__submit-btn {
  flex-shrink: 0;
}

.search-page__group-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border-subtle);
}

.search-page__group-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
  color: var(--color-ink-body);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.search-page__group-pill:hover {
  background: var(--color-surface-inset);
  border-color: var(--color-border-strong);
}

.search-page__group-pill--active {
  background: var(--color-brand-subtle);
  border-color: var(--color-brand);
  color: var(--color-brand-text);
  font-weight: 600;
}

.search-page__group-count {
  font-size: 0.6875rem;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
}

.search-page__empty-card {
  padding: var(--space-6);
}

.search-page__results-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.search-page__meta-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-ink-muted);
}

.search-page__meta-count strong {
  color: var(--color-ink-strong);
}

.search-page__results-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-page__result-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: var(--radius-surface);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.search-page__result-card:hover {
  background: var(--color-surface-inset);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.search-page__result-card:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.search-page__result-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: var(--radius-control);
  background: var(--color-surface-inset);
  color: var(--color-brand-text);
  font-size: 1.2rem;
}

.search-page__result-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.search-page__result-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.search-page__result-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink-strong);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.search-page__badges {
  display: flex;
  gap: 6px;
  align-items: center;
}

.search-page__resource-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-brand-subtle);
  color: var(--color-brand-text);
}

.search-page__group-badge {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
}

.search-page__result-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.search-page__detail-chip {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: var(--radius-control);
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
}

.search-page__detail-chip strong {
  color: var(--color-ink-muted);
  font-weight: 600;
}

.search-page__result-action {
  flex-shrink: 0;
}

.search-page__pagination {
  display: flex;
  justify-content: center;
  padding-top: var(--space-4);
}

@media (max-width: 640px) {
  .search-page__search-form {
    flex-direction: column;
  }

  .search-page__submit-btn {
    width: 100%;
  }

  .search-page__result-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-page__result-action {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
