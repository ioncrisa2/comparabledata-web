import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import {
  createExportRun,
  downloadExportFile,
  type DownloadExportOptions,
  downloadExportRunFile,
  type ExportConfigurationData,
  type ExportFormat,
  type ExportPreviewData,
  type ExportRunItem,
  type ExportRunsQueryParams,
  type ExportRunsResponse,
  fetchExportConfiguration,
  fetchExportRuns,
  fetchExportRunStatus,
  previewExport,
  retryExportRun,
} from '../api/export.api'

export const exportKeys = {
  all: ['exports'] as const,
  configuration: () => [...exportKeys.all, 'configuration'] as const,
  runs: (params?: ExportRunsQueryParams) => [...exportKeys.all, 'runs', params] as const,
  runDetail: (runId: number | string) => [...exportKeys.all, 'run', String(runId)] as const,
}

export function useExportConfigurationQuery() {
  return useQuery<ExportConfigurationData>({
    queryKey: exportKeys.configuration(),
    queryFn: ({ signal }) => fetchExportConfiguration(signal),
    staleTime: 1000 * 60 * 60, // 1 hour cache
  })
}

export function useDownloadExportMutation() {
  return useMutation<{ filename: string; blob: Blob }, Error, DownloadExportOptions>({
    mutationFn: (options: DownloadExportOptions) => downloadExportFile(options),
  })
}

export function usePreviewExportMutation() {
  return useMutation<ExportPreviewData, Error, DownloadExportOptions>({
    mutationFn: (options: DownloadExportOptions) => previewExport(options),
  })
}

export function useExportRunsQuery(params?: MaybeRefOrGetter<ExportRunsQueryParams | undefined>) {
  const resolved = computed(() => toValue(params))
  return useQuery<ExportRunsResponse>({
    queryKey: computed(() => exportKeys.runs(resolved.value)),
    queryFn: ({ signal }) => fetchExportRuns(resolved.value, signal),
    refetchInterval: (query) => {
      const runs = query.state.data?.data
      if (!runs) return false
      const hasActive = runs.some((r) => r.status === 'queued' || r.status === 'processing')
      return hasActive ? 3000 : false
    },
  })
}

export function useExportRunStatusQuery(
  runId: MaybeRefOrGetter<number | null | undefined>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const resolvedId = computed(() => toValue(runId))
  const isEnabled = computed(
    () => Boolean(resolvedId.value) && (options?.enabled ? toValue(options.enabled) : true),
  )

  return useQuery<ExportRunItem>({
    queryKey: computed(() =>
      resolvedId.value ? exportKeys.runDetail(resolvedId.value) : ['exports', 'run', 'none'],
    ),
    queryFn: ({ signal }) => {
      if (!resolvedId.value) throw new Error('ID Export Run tidak valid.')
      return fetchExportRunStatus(resolvedId.value, signal)
    },
    enabled: isEnabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'queued' || status === 'processing') return 2500
      return false
    },
  })
}

export function useCreateExportRunMutation() {
  const queryClient = useQueryClient()
  return useMutation<ExportRunItem, Error, DownloadExportOptions>({
    mutationFn: (options: DownloadExportOptions) => createExportRun(options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...exportKeys.all, 'runs'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useRetryExportRunMutation() {
  const queryClient = useQueryClient()
  return useMutation<ExportRunItem, Error, { runId: number; options?: DownloadExportOptions }>({
    mutationFn: ({ runId, options }) => retryExportRun(runId, options),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: exportKeys.runDetail(data.id) })
      void queryClient.invalidateQueries({ queryKey: [...exportKeys.all, 'runs'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useDownloadExportRunMutation() {
  return useMutation<
    { filename: string; blob: Blob },
    Error,
    { runId: number; fallbackFormat?: ExportFormat }
  >({
    mutationFn: ({ runId, fallbackFormat }) => downloadExportRunFile(runId, fallbackFormat),
  })
}
