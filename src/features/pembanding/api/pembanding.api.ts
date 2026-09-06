import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { components, operations } from '@/shared/api/generated/schema'

export type Pembanding = components['schemas']['PembandingResource']
export type PembandingDeleteRequest = components['schemas']['PembandingDeleteRequest']
export type PembandingListResponse =
  operations['dataPembanding.index']['responses'][200]['content']['application/json']
export type PembandingFormOptions =
  operations['dataPembanding.formOptions']['responses'][200]['content']['application/json']['data']
export type PembandingCreator =
  operations['dataPembanding.creators']['responses'][200]['content']['application/json']['data'][number]
export type PembandingApiFilters = NonNullable<
  operations['dataPembanding.index']['parameters']['query']
> & { page?: number }

export interface DuplicateReviewError {
  code: 'DUPLICATE_REVIEW_REQUIRED'
  message: string
  duplicate: {
    submission_id: string
    submission_url: string
    candidate_ids: unknown[]
    expires_at: string | null
  }
}

function invalidResponse(resource: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan ${resource} yang valid.`,
  })
}

export async function fetchPembandings(
  filters: PembandingApiFilters,
  signal?: AbortSignal,
): Promise<PembandingListResponse> {
  const { data } = await apiClient.GET('/v1/pembandings', {
    params: { query: filters },
    signal,
  })

  if (data && Array.isArray(data.data)) return data
  throw invalidResponse('daftar data pembanding')
}

export async function fetchPembanding(id: string, signal?: AbortSignal): Promise<Pembanding> {
  const { data } = await apiClient.GET('/v1/pembandings/{id}', {
    params: { path: { id } },
    signal,
  })

  if (data?.data) return data.data
  throw invalidResponse('detail data pembanding')
}

export async function fetchPembandingFormOptions(
  signal?: AbortSignal,
): Promise<PembandingFormOptions> {
  const { data } = await apiClient.GET('/v1/pembandings/form-options', { signal })

  if (data?.data) return data.data
  throw invalidResponse('opsi filter pembanding')
}

export async function fetchPembandingCreators(signal?: AbortSignal): Promise<PembandingCreator[]> {
  const { data } = await apiClient.GET('/v1/pembandings/creators', { signal })

  if (Array.isArray(data?.data)) return data.data
  throw invalidResponse('daftar pembuat data')
}

export async function createPembanding(formData: FormData): Promise<Pembanding> {
  const { data } = await apiClient.POST('/v1/pembandings', {
    body: formData as never,
    bodySerializer: (b) => b,
    headers: { 'Content-Type': undefined },
  })

  if (data?.data) return data.data
  throw invalidResponse('data pembanding yang baru dibuat')
}

export async function updatePembanding(id: string, formData: FormData): Promise<Pembanding> {
  formData.append('_method', 'PUT')
  const { data } = await apiClient.POST('/v1/pembandings/{id}', {
    params: { path: { id } },
    body: formData as never,
    bodySerializer: (b) => b,
    headers: { 'Content-Type': undefined },
  })

  if (data?.data) return data.data
  throw invalidResponse('data pembanding yang diperbarui')
}

export async function deletePembanding(id: string): Promise<void> {
  await apiClient.DELETE('/v1/pembandings/{id}', {
    params: { path: { id } },
  })
}

export async function requestDeletePembanding(
  id: string,
  reason: string,
): Promise<PembandingDeleteRequest> {
  const { data } = await apiClient.POST('/v1/pembandings/{id}/delete-request', {
    params: { path: { id } },
    body: { reason },
  })

  if (data?.data) return data.data
  throw invalidResponse('permintaan hapus')
}
