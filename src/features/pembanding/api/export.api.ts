import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { operations } from '@/shared/api/generated/schema'

import type { PembandingListFilters } from '../types/filters'

export type ExportConfigurationResponse =
  operations['export.configuration']['responses'][200]['content']['application/json']
export type ExportConfigurationData = ExportConfigurationResponse['data']
export type ExportProfile = ExportConfigurationData['configuration']['profiles'][number]
export type ExportColumn = ExportConfigurationData['configuration']['columns'][number]
export type ExportLimits = ExportConfigurationData['limits']

export type ExportFormat = 'excel' | 'pdf' | 'csv' | 'geojson' | 'kml'
export type ExportMode = 'summary' | 'detail'
export type ExportProfileName = 'ringkas' | 'lengkap' | 'kontak' | 'geospasial' | 'audit'

export interface DownloadExportOptions {
  format: ExportFormat
  mode?: ExportMode
  profile?: ExportProfileName
  scope?: 'selected' | 'filtered'
  dataset?: 'all' | 'complete' | 'issues'
  ids?: (string | number)[]
  columns?: string[]
  filters?: Partial<PembandingListFilters>
  signal?: AbortSignal
}

function invalidResponse(resource: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan ${resource} yang valid.`,
  })
}

export function extractFilenameFromContentDisposition(
  header: string | null | undefined,
  fallbackFilename: string,
): string {
  if (!header) return fallbackFilename

  const utf8Match = header.match(/filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i)
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ''))
    } catch {
      // ignore decode error and fallback
    }
  }

  const standardMatch = header.match(/filename\s*=\s*"?([^";]+)"?/i)
  if (standardMatch && standardMatch[1]) {
    return standardMatch[1].trim().replace(/^["']|["']$/g, '')
  }

  return fallbackFilename
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

export async function fetchExportConfiguration(
  signal?: AbortSignal,
): Promise<ExportConfigurationData> {
  const { data } = await apiClient.GET('/v1/exports/configuration', { signal })
  if (data && data.data) return data.data
  throw invalidResponse('konfigurasi ekspor')
}

export async function downloadExportFile(
  options: DownloadExportOptions,
): Promise<{ filename: string; blob: Blob }> {
  const format = options.format
  const mode = format === 'pdf' ? (options.mode ?? 'summary') : undefined
  const profile = options.profile ?? 'ringkas'
  const scope = options.scope ?? (options.ids?.length ? 'selected' : 'filtered')

  const queryParams: Record<string, unknown> = {
    format,
    mode,
    profile,
    scope,
    dataset: options.dataset ?? 'all',
  }

  if (options.ids && options.ids.length > 0) {
    queryParams.ids = options.ids.join(',')
  }

  if (options.columns && options.columns.length > 0) {
    queryParams['columns[]'] = options.columns
  }

  if (options.filters) {
    const f = options.filters
    if (f.province_id) queryParams.province_id = f.province_id
    if (f.regency_id) queryParams.regency_id = f.regency_id
    if (f.district_id) queryParams.district_id = f.district_id
    if (f.village_id) queryParams.village_id = f.village_id
    if (f.jenis_listing_id) queryParams.jenis_listing_id = f.jenis_listing_id
    if (f.jenis_objek_id) queryParams.jenis_objek_id = f.jenis_objek_id
    if (f.created_by) queryParams.created_by = f.created_by
    if (f.dari_tanggal) queryParams.dari_tanggal = f.dari_tanggal
    if (f.sampai_tanggal) queryParams.sampai_tanggal = f.sampai_tanggal
    if (f.q) queryParams.q = f.q
  }

  const response = await apiClient.GET('/v1/exports/download', {
    params: {
      query: queryParams,
    },
    parseAs: 'blob',
    signal: options.signal,
  })

  // Format default extension
  const extensionMap: Record<ExportFormat, string> = {
    excel: '.xlsx',
    pdf: '.pdf',
    csv: '.csv',
    geojson: '.geojson',
    kml: '.kml',
  }
  const dateStr = new Date().toISOString().split('T')[0]
  const defaultFilename = `data-pembanding-${dateStr}${extensionMap[format] || ''}`

  const contentDisposition = response.response?.headers.get('content-disposition')
  const filename = extractFilenameFromContentDisposition(
    contentDisposition,
    defaultFilename,
  )

  const blob = response.data as unknown as Blob
  if (!blob) {
    throw invalidResponse('file ekspor')
  }

  triggerBlobDownload(blob, filename)
  return { filename, blob }
}
