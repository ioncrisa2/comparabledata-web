<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import type { GlobalSearchResultItem } from '../api/search.api'
import {
  resolveSearchResultRoute,
  useGlobalSearchQuery,
  useGlobalSearchState,
} from '../composables/useGlobalSearch'

const router = useRouter()
const { isSearchOpen, closeSearch } = useGlobalSearchState()

const searchInput = ref<HTMLInputElement | null>(null)
const rawKeyword = ref('')
const selectedGroup = ref<string>('')
const selectedIndex = ref<number>(-1)

// Debounced keyword for query
const debouncedKeyword = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(rawKeyword, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedKeyword.value = val.trim()
    selectedIndex.value = -1
  }, 250)
})

const queryParams = computed(() => ({
  q: debouncedKeyword.value,
  menu_group: selectedGroup.value || undefined,
  per_page: 25,
}))

const { data: searchResponse, isLoading, isError, error } = useGlobalSearchQuery(queryParams)

const results = computed<GlobalSearchResultItem[]>(() => searchResponse.value?.data ?? [])
const menuGroups = computed(() => searchResponse.value?.options?.menu_groups ?? [])

// Reset search state when opened
watch(isSearchOpen, (isOpen) => {
  if (isOpen) {
    rawKeyword.value = ''
    debouncedKeyword.value = ''
    selectedGroup.value = ''
    selectedIndex.value = -1
    void nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

function clearSearch() {
  rawKeyword.value = ''
  searchInput.value?.focus()
}

function selectResult(item: GlobalSearchResultItem) {
  const route = resolveSearchResultRoute(item)
  if (route) {
    closeSearch()
    void router.push(route)
  }
}

function goToFullSearch() {
  const q = rawKeyword.value.trim()
  closeSearch()
  void router.push({
    name: 'search',
    query: {
      ...(q ? { q } : {}),
      ...(selectedGroup.value ? { menu_group: selectedGroup.value } : {}),
    },
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (!isSearchOpen.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (results.value.length === 0) return
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length
    scrollToItem(selectedIndex.value)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (results.value.length === 0) return
    selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length
    scrollToItem(selectedIndex.value)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedIndex.value >= 0 && selectedIndex.value < results.value.length) {
      const selected = results.value[selectedIndex.value]
      if (selected) {
        selectResult(selected)
      }
    }
  }
}

function scrollToItem(index: number) {
  void nextTick(() => {
    const el = document.getElementById(`search-item-${index}`)
    if (el) {
      el.scrollIntoView({ block: 'nearest' })
    }
  })
}

// Global shortcut handler for Ctrl+K / Cmd+K
function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (isSearchOpen.value) {
      closeSearch()
    } else {
      isSearchOpen.value = true
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <UiDialog
    :open="isSearchOpen"
    title="Pencarian Global"
    description="Cari data pembanding, permohonan moderasi, master data, dan wilayah."
    width="md"
    @update:open="closeSearch"
  >
    <div class="global-search" @keydown="handleKeydown">
      <!-- Search Input -->
      <div class="global-search__input-wrapper">
        <i class="pi pi-search global-search__input-icon" aria-hidden="true" />
        <input
          ref="searchInput"
          v-model="rawKeyword"
          type="text"
          class="global-search__input"
          placeholder="Ketik kata kunci pencarian... (misal: alamat, ID, jenis properti)"
          autocomplete="off"
          data-testid="global-search-input"
        />
        <button
          v-if="rawKeyword"
          type="button"
          class="global-search__clear-btn"
          aria-label="Hapus kata kunci"
          @click="clearSearch"
        >
          <i class="pi pi-times" aria-hidden="true" />
        </button>
      </div>

      <!-- Filter Group Pills -->
      <div v-if="debouncedKeyword && menuGroups.length > 0" class="global-search__groups">
        <button
          type="button"
          class="global-search__group-pill"
          :class="{ 'global-search__group-pill--active': selectedGroup === '' }"
          @click="selectedGroup = ''"
        >
          Semua
        </button>
        <button
          v-for="grp in menuGroups"
          :key="grp.value"
          type="button"
          class="global-search__group-pill"
          :class="{ 'global-search__group-pill--active': selectedGroup === grp.value }"
          @click="selectedGroup = grp.value"
        >
          {{ grp.label }}
        </button>
      </div>

      <!-- Error alert -->
      <UiInlineAlert v-if="isError" tone="error" title="Gagal mengambil hasil pencarian">
        <p>{{ error instanceof Error ? error.message : 'Terjadi kesalahan sistem.' }}</p>
      </UiInlineAlert>

      <!-- Search results container -->
      <div class="global-search__body">
        <!-- Initial prompt -->
        <div v-if="!debouncedKeyword" class="global-search__placeholder">
          <i class="pi pi-compass" aria-hidden="true" />
          <p>Ketik kata kunci untuk mencari di seluruh sistem.</p>
          <small
            >Mendukung pencarian alamat, kode wilayah, ID properti, dan referensi master
            data.</small
          >
        </div>

        <!-- Loading indicator -->
        <div v-else-if="isLoading" class="global-search__loading">
          <i class="pi pi-spin pi-spinner" aria-hidden="true" />
          <span>Mencari data...</span>
        </div>

        <!-- Empty results -->
        <div v-else-if="results.length === 0" class="global-search__empty">
          <i class="pi pi-search-minus" aria-hidden="true" />
          <p>
            Tidak ada data yang cocok dengan <strong>"{{ debouncedKeyword }}"</strong>.
          </p>
          <small>Coba gunakan kata kunci yang lebih umum atau periksa ejaan.</small>
        </div>

        <!-- Results list -->
        <ul v-else class="global-search__list" role="listbox">
          <li
            v-for="(item, idx) in results"
            :id="`search-item-${idx}`"
            :key="`${item.target_type}-${item.target_id}-${idx}`"
            role="option"
            :aria-selected="selectedIndex === idx"
            class="global-search__item"
            :class="{ 'global-search__item--selected': selectedIndex === idx }"
            @mouseenter="selectedIndex = idx"
            @click="selectResult(item)"
          >
            <div class="global-search__item-icon">
              <i :class="item.icon || 'pi pi-file'" aria-hidden="true" />
            </div>

            <div class="global-search__item-content">
              <div class="global-search__item-header">
                <span class="global-search__item-title">{{ item.title }}</span>
                <span class="global-search__tag">{{ item.resource_name }}</span>
              </div>

              <!-- Details snippet -->
              <div
                v-if="item.details && Object.keys(item.details).length > 0"
                class="global-search__item-details"
              >
                <span
                  v-for="(val, key) in item.details"
                  :key="key"
                  class="global-search__item-detail-badge"
                >
                  <strong v-if="typeof key === 'string' && !['ID', '0', '1'].includes(key)"
                    >{{ key }}:
                  </strong>
                  {{ val }}
                </span>
              </div>
            </div>

            <i class="pi pi-arrow-right global-search__item-arrow" aria-hidden="true" />
          </li>
        </ul>
      </div>

      <!-- Footer navigation hints and full search link -->
      <div class="global-search__footer">
        <div class="global-search__footer-hints">
          <span class="global-search__hint"> <kbd>↑</kbd><kbd>↓</kbd> Navigasi </span>
          <span class="global-search__hint"> <kbd>↵</kbd> Pilih </span>
          <span class="global-search__hint"> <kbd>Esc</kbd> Tutup </span>
        </div>
        <button
          type="button"
          class="global-search__full-search-btn"
          data-testid="global-search-full-page-btn"
          @click="goToFullSearch"
        >
          <span>Halaman Pencarian Lengkap</span>
          <i class="pi pi-external-link" aria-hidden="true" />
        </button>
      </div>
    </div>
  </UiDialog>
</template>

<style scoped>
.global-search {
  display: grid;
  gap: 12px;
}

.global-search__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.global-search__input-wrapper:focus-within {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.global-search__input-icon {
  margin-left: 14px;
  color: var(--color-ink-muted);
  font-size: 1rem;
}

.global-search__input {
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: var(--color-ink-strong);
  font-size: 0.9375rem;
  outline: none;
  font-family: inherit;
}

.global-search__clear-btn {
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
}

.global-search__clear-btn:hover {
  color: var(--color-ink-strong);
}

.global-search__groups {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-bottom: 4px;
}

.global-search__group-pill {
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.global-search__group-pill:hover {
  border-color: var(--color-ink-muted);
}

.global-search__group-pill--active {
  background: var(--color-action-primary);
  border-color: var(--color-action-primary);
  color: #fff;
}

.global-search__body {
  max-height: 380px;
  overflow-y: auto;
  min-height: 180px;
  border-radius: var(--radius-control);
  background: var(--color-surface-inset);
  border: 1px solid var(--color-border-soft);
}

.global-search__placeholder,
.global-search__empty,
.global-search__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--color-ink-muted);
  gap: 8px;
}

.global-search__placeholder i,
.global-search__empty i,
.global-search__loading i {
  font-size: 2rem;
  color: var(--color-ink-muted);
}

.global-search__loading i {
  color: var(--color-action-primary);
}

.global-search__placeholder p,
.global-search__empty p {
  margin: 0;
  font-weight: 600;
  color: var(--color-ink-body);
}

.global-search__placeholder small,
.global-search__empty small {
  font-size: 0.8125rem;
}

.global-search__list {
  list-style: none;
  padding: 6px;
  margin: 0;
  display: grid;
  gap: 4px;
}

.global-search__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-control);
  cursor: pointer;
  background: var(--color-surface);
  border: 1px solid transparent;
  transition: all 0.12s ease;
}

.global-search__item:hover,
.global-search__item--selected {
  background: var(--color-brand-amber-soft);
  border-color: var(--color-action-primary);
}

.global-search__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--color-surface-inset);
  color: var(--color-action-primary);
  flex-shrink: 0;
}

.global-search__item-content {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.global-search__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.global-search__item-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-ink-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.global-search__tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 9999px;
  background: var(--color-surface-inset);
  border: 1px solid var(--color-border-soft);
  color: var(--color-ink-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.global-search__item-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.global-search__item-detail-badge {
  font-size: 0.75rem;
  color: var(--color-ink-muted);
}

.global-search__item-arrow {
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.global-search__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 6px;
  border-top: 1px solid var(--color-border-subtle);
}

.global-search__footer-hints {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--color-ink-muted);
}

.global-search__full-search-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--color-brand);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: var(--radius-control);
  transition: background-color 0.15s ease;
}

.global-search__full-search-btn:hover {
  background: var(--color-brand-subtle);
}

.global-search__hint kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.6875rem;
  font-family: inherit;
  font-weight: 600;
  color: var(--color-ink-strong);
  background: var(--color-surface-inset);
  border: 1px solid var(--color-border-soft);
  border-radius: 4px;
  margin-right: 4px;
}
</style>
