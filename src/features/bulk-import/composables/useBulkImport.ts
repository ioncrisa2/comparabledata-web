import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import { pembandingKeys } from '@/features/pembanding/api/pembanding.keys'

import {
  bulkApplyValues,
  fetchImportBatchDetail,
  fetchImportBatches,
  fetchImportRowDetail,
  finalizeImportBatch,
  type ImportBatchFilters,
  retryImportRow,
  updateImportRow,
  updateRowSelection,
  uploadImportBatch,
} from '../api/bulk-import.api'

export const bulkImportKeys = {
  all: ['bulk-import'] as const,
  lists: () => [...bulkImportKeys.all, 'list'] as const,
  list: (params?: { page?: number; per_page?: number }) =>
    [...bulkImportKeys.lists(), params] as const,
  details: () => [...bulkImportKeys.all, 'detail'] as const,
  detail: (batchId: number | string, filters?: ImportBatchFilters) =>
    [...bulkImportKeys.details(), String(batchId), filters] as const,
  rows: () => [...bulkImportKeys.all, 'row'] as const,
  row: (batchId: number | string, rowId: number | string) =>
    [...bulkImportKeys.rows(), String(batchId), String(rowId)] as const,
}

export function useImportBatchesQuery(
  params?: MaybeRefOrGetter<{ page?: number; per_page?: number }>,
) {
  const resolved = computed(() => toValue(params))

  return useQuery({
    queryKey: computed(() => bulkImportKeys.list(resolved.value)),
    queryFn: ({ signal }) => fetchImportBatches(resolved.value, signal),
  })
}

export function useImportBatchDetailQuery(
  batchId: MaybeRefOrGetter<number | string>,
  filters?: MaybeRefOrGetter<ImportBatchFilters>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const resolvedBatchId = computed(() => toValue(batchId))
  const resolvedFilters = computed(() => toValue(filters))

  return useQuery({
    queryKey: computed(() => bulkImportKeys.detail(resolvedBatchId.value, resolvedFilters.value)),
    queryFn: ({ signal }) =>
      fetchImportBatchDetail(resolvedBatchId.value, resolvedFilters.value, signal),
    enabled: computed(() => {
      const isCustomEnabled = options?.enabled !== undefined ? toValue(options.enabled) : true
      return Boolean(resolvedBatchId.value) && isCustomEnabled
    }),
    refetchInterval: (query) => {
      const batch = query.state.data?.batch
      if (!batch) return false
      const isProcessing =
        batch.status === 'processing' ||
        batch.status === 'queued' ||
        batch.status_label === 'Sedang dimasukkan' ||
        batch.processing_rows > 0
      return isProcessing ? 2500 : false
    },
  })
}

export function useUploadImportBatchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadImportBatch(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bulkImportKeys.all })
    },
  })
}

export function useUpdateRowSelectionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      batchId,
      payload,
    }: {
      batchId: number | string
      payload: {
        action: 'set_rows' | 'select_all' | 'clear_all' | 'select_ready'
        row_ids?: number[]
        is_selected?: boolean
      }
    }) => updateRowSelection(batchId, payload),
    onSuccess: (_, { batchId }) => {
      void queryClient.invalidateQueries({
        queryKey: [...bulkImportKeys.details(), String(batchId)],
      })
    },
  })
}

export function useBulkApplyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      batchId,
      payload,
    }: {
      batchId: number | string
      payload: {
        field:
          | 'status_pemberi_informasi_id'
          | 'bentuk_tanah_id'
          | 'posisi_tanah_id'
          | 'kondisi_tanah_id'
          | 'topografi_id'
          | 'dokumen_tanah_id'
          | 'peruntukan_id'
        value: number
      }
    }) => bulkApplyValues(batchId, payload),
    onSuccess: (_, { batchId }) => {
      void queryClient.invalidateQueries({
        queryKey: [...bulkImportKeys.details(), String(batchId)],
      })
    },
  })
}

export function useFinalizeImportBatchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      batchId,
      confirmed = true,
    }: {
      batchId: number | string
      confirmed?: boolean
    }) => finalizeImportBatch(batchId, confirmed),
    onSuccess: (_, { batchId }) => {
      void queryClient.invalidateQueries({
        queryKey: [...bulkImportKeys.details(), String(batchId)],
      })
      void queryClient.invalidateQueries({ queryKey: bulkImportKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: pembandingKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useImportRowDetailQuery(
  batchId: MaybeRefOrGetter<number | string>,
  rowId: MaybeRefOrGetter<number | string>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const resolvedBatchId = computed(() => toValue(batchId))
  const resolvedRowId = computed(() => toValue(rowId))

  return useQuery({
    queryKey: computed(() => bulkImportKeys.row(resolvedBatchId.value, resolvedRowId.value)),
    queryFn: ({ signal }) =>
      fetchImportRowDetail(resolvedBatchId.value, resolvedRowId.value, signal),
    enabled: computed(() => {
      const isCustomEnabled = options?.enabled !== undefined ? toValue(options.enabled) : true
      return Boolean(resolvedBatchId.value) && Boolean(resolvedRowId.value) && isCustomEnabled
    }),
  })
}

export function useUpdateImportRowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      batchId,
      rowId,
      formData,
    }: {
      batchId: number | string
      rowId: number | string
      formData: FormData
    }) => updateImportRow(batchId, rowId, formData),
    onSuccess: (_, { batchId, rowId }) => {
      void queryClient.invalidateQueries({
        queryKey: bulkImportKeys.row(batchId, rowId),
      })
      void queryClient.invalidateQueries({
        queryKey: [...bulkImportKeys.details(), String(batchId)],
      })
    },
  })
}

export function useRetryImportRowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ batchId, rowId }: { batchId: number | string; rowId: number | string }) =>
      retryImportRow(batchId, rowId),
    onSuccess: (_, { batchId }) => {
      void queryClient.invalidateQueries({
        queryKey: [...bulkImportKeys.details(), String(batchId)],
      })
    },
  })
}
