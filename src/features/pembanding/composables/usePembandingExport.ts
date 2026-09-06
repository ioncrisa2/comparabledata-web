import { useMutation, useQuery } from '@tanstack/vue-query'

import {
  downloadExportFile,
  type DownloadExportOptions,
  type ExportConfigurationData,
  fetchExportConfiguration,
} from '../api/export.api'

export const exportKeys = {
  all: ['exports'] as const,
  configuration: () => [...exportKeys.all, 'configuration'] as const,
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
