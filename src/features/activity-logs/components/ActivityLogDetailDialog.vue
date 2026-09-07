<script setup lang="ts">
import { computed, ref, toRef } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'
import UiStatusBadge, { type StatusTone } from '@/shared/components/ui/UiStatusBadge.vue'
import { formatDate } from '@/shared/formatters'

import { sanitizeLogProperties, useActivityLogDetailQuery } from '../composables/useActivityLogs'

const props = defineProps<{
  open: boolean
  logId: number | string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const detailQuery = useActivityLogDetailQuery(toRef(() => props.logId))
const showRawJson = ref(false)

const log = computed(() => detailQuery.data.value)

const parsedProperties = computed(() => {
  if (!log.value?.properties) return null
  return sanitizeLogProperties(log.value.properties) as Record<string, unknown> | null
})

const attributes = computed(() => {
  if (!parsedProperties.value) return null
  return (parsedProperties.value.attributes as Record<string, unknown>) || null
})

const oldValues = computed(() => {
  if (!parsedProperties.value) return null
  return (parsedProperties.value.old as Record<string, unknown>) || null
})

interface DiffRow {
  key: string
  oldVal: unknown
  newVal: unknown
  status: 'changed' | 'added' | 'removed' | 'same'
}

const diffRows = computed<DiffRow[]>(() => {
  const oldData = oldValues.value || {}
  const newData = attributes.value || {}

  const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]))
  if (allKeys.length === 0) return []

  return allKeys.map((key) => {
    const hasOld = key in oldData
    const hasNew = key in newData
    const oldVal = oldData[key]
    const newVal = newData[key]

    let status: 'changed' | 'added' | 'removed' | 'same' = 'same'
    if (hasOld && !hasNew) {
      status = 'removed'
    } else if (!hasOld && hasNew) {
      status = 'added'
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      status = 'changed'
    }

    return { key, oldVal, newVal, status }
  })
})

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  return JSON.stringify(val)
}

function getEventTone(event?: string | null): StatusTone {
  switch (event) {
    case 'created':
      return 'success'
    case 'updated':
      return 'warning'
    case 'deleted':
      return 'danger'
    case 'restored':
      return 'info'
    default:
      return 'neutral'
  }
}

function getEventLabel(event?: string | null): string {
  switch (event) {
    case 'created':
      return 'Dibuat (Created)'
    case 'updated':
      return 'Diperbarui (Updated)'
    case 'deleted':
      return 'Dihapus (Deleted)'
    case 'restored':
      return 'Dipulihkan (Restored)'
    default:
      return event || 'Aktivitas'
  }
}

function handleClose() {
  showRawJson.value = false
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Rincian Log Aktivitas"
    description="Detail rekaman jejak audit sistem dan perbandingan perubahan nilai data."
    width="lg"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div v-if="detailQuery.isPending.value" class="dialog-loading">
      <UiSkeleton width="60%" />
      <UiSkeleton />
      <UiSkeleton width="80%" />
    </div>

    <div v-else-if="detailQuery.isError.value" class="dialog-error">
      <i class="pi pi-exclamation-triangle text-danger" aria-hidden="true" />
      <p>Gagal memuat rincian aktivitas. Silakan coba lagi.</p>
    </div>

    <div v-else-if="log" class="activity-detail-body">
      <!-- Meta Overview Grid -->
      <div class="meta-card">
        <div class="meta-item">
          <span class="meta-label">Waktu Kejadian</span>
          <strong class="meta-val">{{ formatDate(log.created_at) }}</strong>
        </div>

        <div class="meta-item">
          <span class="meta-label">Jenis Aksi</span>
          <UiStatusBadge :tone="getEventTone(log.event)">
            {{ getEventLabel(log.event) }}
          </UiStatusBadge>
        </div>

        <div class="meta-item">
          <span class="meta-label">Pelaksana (Aktor)</span>
          <div class="actor-wrap">
            <strong class="text-sm">{{ log.causer?.name || 'Sistem Otomatis' }}</strong>
            <span v-if="log.causer?.email" class="text-xs text-muted">{{ log.causer.email }}</span>
          </div>
        </div>

        <div class="meta-item">
          <span class="meta-label">Target Entitas</span>
          <strong class="meta-val font-mono text-sm">
            {{ log.subject_type || '—' }} #{{ log.subject_id || '—' }}
          </strong>
        </div>

        <div class="meta-item col-span-full">
          <span class="meta-label">Keterangan Aktivitas</span>
          <p class="description-text">{{ log.description || 'Tidak ada deskripsi rinci.' }}</p>
        </div>
      </div>

      <!-- Diff Table (Before vs After) -->
      <div v-if="diffRows.length > 0" class="diff-section">
        <div class="diff-header">
          <h3>Perbandingan Perubahan Data</h3>
          <span class="text-xs text-muted">Field sensitif disamarkan otomatis ([DIRAHSIAKAN])</span>
        </div>

        <div class="diff-table-container">
          <table class="diff-table">
            <thead>
              <tr>
                <th scope="col" class="w-1/3">Field / Atribut</th>
                <th scope="col" class="w-1/3">Nilai Sebelum (Lama)</th>
                <th scope="col" class="w-1/3">Nilai Sesudah (Baru)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in diffRows"
                :key="row.key"
                :class="{
                  'row-diff--changed': row.status === 'changed',
                  'row-diff--added': row.status === 'added',
                  'row-diff--removed': row.status === 'removed',
                }"
              >
                <td class="font-mono text-xs font-semibold">
                  {{ row.key }}
                  <span v-if="row.status === 'added'" class="diff-tag diff-tag--add">+ baru</span>
                  <span v-else-if="row.status === 'removed'" class="diff-tag diff-tag--del"
                    >- hapus</span
                  >
                </td>
                <td class="font-mono text-xs text-muted">
                  {{ formatValue(row.oldVal) }}
                </td>
                <td class="font-mono text-xs font-semibold">
                  {{ formatValue(row.newVal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Raw Properties Fallback or Toggle -->
      <div class="raw-json-wrap">
        <button type="button" class="raw-json-toggle" @click="showRawJson = !showRawJson">
          <i
            :class="showRawJson ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
            aria-hidden="true"
          />
          <span>{{
            showRawJson ? 'Sembunyikan Payload Mentah (JSON)' : 'Tampilkan Payload Mentah (JSON)'
          }}</span>
        </button>

        <pre v-if="showRawJson" class="raw-json-pre">{{
          JSON.stringify(parsedProperties, null, 2)
        }}</pre>
      </div>
    </div>

    <template #footer>
      <UiButton variant="secondary" @click="handleClose"> Tutup </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.dialog-loading,
.dialog-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
}

.activity-detail-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.meta-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-subtle, #f8fafc);
  border: 1px solid var(--color-border);
}

@media (max-width: 640px) {
  .meta-card {
    grid-template-columns: 1fr;
  }
}

.col-span-full {
  grid-column: 1 / -1;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  color: var(--color-muted);
}

.meta-val {
  font-size: 0.875rem;
  color: var(--color-text);
}

.actor-wrap {
  display: flex;
  flex-direction: column;
}

.description-text {
  font-size: 0.875rem;
  margin: 0;
  color: var(--color-text);
  line-height: 1.4;
}

/* Diff Section */
.diff-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.diff-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.diff-header h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}

.diff-table-container {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
}

.diff-table th,
.diff-table td {
  padding: 0.625rem 0.875rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.diff-table th {
  background-color: var(--color-surface-subtle, #f8fafc);
  font-size: 0.75rem;
  color: var(--color-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.row-diff--changed td {
  background-color: #fffbeb;
}

.row-diff--added td {
  background-color: #f0fdf4;
}

.row-diff--removed td {
  background-color: #fef2f2;
}

.diff-tag {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 600;
  margin-left: 0.375rem;
}

.diff-tag--add {
  background-color: #dcfce7;
  color: #15803d;
}

.diff-tag--del {
  background-color: #fee2e2;
  color: #b91c1c;
}

/* Raw JSON */
.raw-json-wrap {
  border-top: 1px dashed var(--color-border);
  padding-top: 0.75rem;
}

.raw-json-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.raw-json-pre {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #0f172a;
  color: #e2e8f0;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 250px;
}
</style>
