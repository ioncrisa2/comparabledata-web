import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export interface ImportBatch {
  id: number
  filename: string
  owner: string
  status: string
  status_label:
    | 'Sedang dimasukkan'
    | 'Selesai'
    | 'Sebagian perlu diperbaiki'
    | 'Perlu diperbaiki'
    | 'Draf'
    | (string & {})
  total_rows: number
  selected_rows: number
  ready_rows: number
  imported_rows: number
  failed_rows: number
  processing_rows: number
  can_edit: boolean
  can_finalize: boolean | string
  finalize_block_reason: string | null
  finalization_date: string | null
  finalized_at: string | null
  updated_at: string
}

export interface ImportRow {
  id: number
  source_row_number: number
  status: string
  status_label: string
  is_selected: boolean
  jenis_pembanding?: string | null
  alamat?: string | null
  location: string
  missing_fields: string[]
  warnings: string[]
  has_image: boolean
  image_url: string | null
  last_error: string | null
  failure_code: string | null
  result_url: string | null
}

export interface ImportBatchDetailData {
  batch: ImportBatch
  data: ImportRow[]
  meta: {
    current_page: number
    per_page: number
    from: number | null
    to: number | null
    total: number
    last_page: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  options: {
    statusPemberiInfos: { label: string; value: string | number }[]
    bentukTanahs: { label: string; value: string | number }[]
    posisiTanahs: { label: string; value: string | number }[]
    kondisiTanahs: { label: string; value: string | number }[]
    topografis: { label: string; value: string | number }[]
    dokumenTanahs: { label: string; value: string | number }[]
    peruntukans: { label: string; value: string | number }[]
  }
}

export interface ImportRowDetailData {
  row: {
    id: number
    source_row_number: number
    status: string
    status_label: string
    data: Record<string, unknown>
    raw_payload: Record<string, unknown>
    missing_fields: string[]
    warnings: string[]
    image_url: string | null
  }
  options: {
    provinces: { label: string; value: string }[]
    regencies: { label: string; value: string }[]
    districts: { label: string; value: string }[]
    villages: { label: string; value: string }[]
    jenisListings: { label: string; value: string | number }[]
    jenisObjeks: { label: string; value: string | number }[]
    statusPemberiInfos: { label: string; value: string | number }[]
    bentukTanahs: { label: string; value: string | number }[]
    posisiTanahs: { label: string; value: string | number }[]
    kondisiTanahs: { label: string; value: string | number }[]
    topografis: { label: string; value: string | number }[]
    dokumenTanahs: { label: string; value: string | number }[]
    peruntukans: { label: string; value: string | number }[]
    tanahId?: unknown
    sawahId?: unknown
    tanahKebunId?: unknown
  }
}

export interface ImportBatchFilters {
  status?: string | null
  selected?: '0' | '1' | null
  page?: number
}

function invalidResponse(resource: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan data ${resource} yang valid.`,
  })
}

export async function fetchImportBatches(
  params?: { page?: number; per_page?: number },
  signal?: AbortSignal,
): Promise<{
  data: ImportBatch[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}> {
  const { data } = await apiClient.GET('/v1/pembanding-imports', {
    params: {
      query: params as never,
    },
    signal,
  })

  if (data && data.data) {
    return {
      data: data.data,
      meta: data.meta,
    }
  }

  throw invalidResponse('daftar batch impor')
}

export async function uploadImportBatch(
  file: File,
  signal?: AbortSignal,
): Promise<{ batch: ImportBatch; is_existing: boolean; message: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await apiClient.POST('/v1/pembanding-imports', {
    body: formData as never,
    bodySerializer: (b) => b,
    headers: { 'Content-Type': undefined },
    signal,
  })

  if (data && data.data && data.data.batch) {
    return {
      batch: data.data.batch,
      is_existing: Boolean(data.data.is_existing),
      message: data.message,
    }
  }

  throw invalidResponse('hasil unggah batch impor')
}

export async function fetchImportBatchDetail(
  batchId: number | string,
  params?: ImportBatchFilters,
  signal?: AbortSignal,
): Promise<ImportBatchDetailData> {
  const { data } = await apiClient.GET('/v1/pembanding-imports/{batch}', {
    params: {
      path: { batch: Number(batchId) },
      query: {
        status: (params?.status as never) || undefined,
        selected: params?.selected || undefined,
      },
    },
    signal,
  })

  if (data && data.batch) {
    return {
      batch: data.batch,
      data: (data.data ?? []) as ImportRow[],
      meta: data.meta,
      links: data.links,
      options: data.options,
    }
  }

  throw invalidResponse('detail batch impor')
}

export async function updateRowSelection(
  batchId: number | string,
  payload: {
    action: 'set_rows' | 'select_all' | 'clear_all' | 'select_ready'
    row_ids?: number[]
    is_selected?: boolean
  },
): Promise<ImportBatch> {
  const { data } = await apiClient.PATCH('/v1/pembanding-imports/{batch}/selection', {
    params: {
      path: { batch: Number(batchId) },
    },
    body: payload,
  })

  if (data && data.data) {
    return data.data
  }

  throw invalidResponse('pembaruan pilihan baris')
}

export async function bulkApplyValues(
  batchId: number | string,
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
  },
): Promise<{ updated_rows: number; batch: ImportBatch; message: string }> {
  const { data } = await apiClient.PATCH('/v1/pembanding-imports/{batch}/bulk-apply', {
    params: {
      path: { batch: Number(batchId) },
    },
    body: payload,
  })

  if (data && data.data) {
    return {
      updated_rows: data.data.updated_rows,
      batch: data.data.batch,
      message: data.message,
    }
  }

  throw invalidResponse('penerapan nilai massal')
}

export async function finalizeImportBatch(
  batchId: number | string,
  confirmed: boolean = true,
): Promise<{ batch: ImportBatch; message: string }> {
  const { data } = await apiClient.POST('/v1/pembanding-imports/{batch}/finalize', {
    params: {
      path: { batch: Number(batchId) },
    },
    body: { confirmed: (confirmed ? true : 1) as true },
  })

  if (data && data.data && data.data.batch) {
    return {
      batch: data.data.batch,
      message: data.message,
    }
  }

  throw invalidResponse('finalisasi batch impor')
}

export async function fetchImportRowDetail(
  batchId: number | string,
  rowId: number | string,
  signal?: AbortSignal,
): Promise<ImportRowDetailData> {
  const { data } = await apiClient.GET('/v1/pembanding-imports/{batch}/rows/{row}', {
    params: {
      path: { batch: Number(batchId), row: Number(rowId) },
    },
    signal,
  })

  if (data && data.data) {
    return data.data as unknown as ImportRowDetailData
  }

  throw invalidResponse('detail baris impor')
}

export async function updateImportRow(
  batchId: number | string,
  rowId: number | string,
  formData: FormData,
): Promise<{ row: Partial<ImportRow>; batch: ImportBatch; message: string }> {
  formData.append('_method', 'PUT')
  const { data } = await apiClient.PUT('/v1/pembanding-imports/{batch}/rows/{row}', {
    params: {
      path: { batch: Number(batchId), row: Number(rowId) },
    },
    body: formData as never,
    bodySerializer: (b) => b,
    headers: { 'Content-Type': undefined },
  })

  if (data && data.data) {
    return {
      row: data.data.row as unknown as Partial<ImportRow>,
      batch: data.data.batch as unknown as ImportBatch,
      message: data.message,
    }
  }

  throw invalidResponse('pembaruan baris impor')
}

export async function retryImportRow(
  batchId: number | string,
  rowId: number | string,
): Promise<{ message: string }> {
  const { data } = await apiClient.POST('/v1/pembanding-imports/{batch}/rows/{row}/retry', {
    params: {
      path: { batch: Number(batchId), row: Number(rowId) },
    },
  })

  if (data) {
    return { message: data.message }
  }

  throw invalidResponse('coba ulang baris impor')
}
