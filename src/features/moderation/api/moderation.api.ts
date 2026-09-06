import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { operations } from '@/shared/api/generated/schema'

export type ModerationResponse =
  operations['moderation.index']['responses'][200]['content']['application/json']
export type ModerationItem = ModerationResponse['data'][number]
export type ModerationFilters = NonNullable<
  operations['moderation.index']['parameters']['query']
>

function invalidResponse(resource: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan ${resource} yang valid.`,
  })
}

function toPrimitiveString(val: unknown): string {
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  return ''
}

export interface NormalizedModerationItem {
  id: number
  pembandingId: number
  alamat: string
  harga: number | null
  jenisListing: string
  reason: string
  requesterName: string
  deletedAt: string | null
  imageUrl: string | null
  raw: unknown
}

export function normalizeModerationItem(item: Record<string, unknown> | null | undefined): NormalizedModerationItem {
  if (!item) {
    return {
      id: 0,
      pembandingId: 0,
      alamat: '',
      harga: null,
      jenisListing: '',
      reason: '',
      requesterName: '',
      deletedAt: null,
      imageUrl: null,
      raw: item,
    }
  }

  const p = (item.pembanding || item.data_pembanding || item.data || {}) as Record<string, unknown>

  // ID dari permohonan / baris moderasi
  const id = Number(item.id ?? 0)

  // ID pembanding terkait
  const pembandingId = Number(
    p.id ??
    item.pembanding_id ??
    item.data_pembanding_id ??
    item.id ??
    0,
  )

  // Alamat data
  const rawAlamat =
    p.alamat_data ??
    p.alamat ??
    item.alamat_data ??
    item.alamat ??
    ''
  const alamat = toPrimitiveString(rawAlamat).trim()

  // Harga
  const rawHarga = p.harga ?? p.harga_penawaran ?? item.harga ?? item.harga_penawaran
  const harga =
    rawHarga !== null && rawHarga !== undefined && rawHarga !== '' && !Number.isNaN(Number(rawHarga))
      ? Number(rawHarga)
      : null

  // Jenis listing
  const rawJl =
    p.jenis_listing ??
    item.jenis_listing ??
    p.jenis_listing_name ??
    item.jenis_listing_name
  let jenisListing = ''
  if (rawJl) {
    if (typeof rawJl === 'string') {
      jenisListing = rawJl
    } else if (typeof rawJl === 'object' && 'name' in rawJl && rawJl.name) {
      jenisListing = toPrimitiveString(rawJl.name)
    }
  }

  // Alasan permohonan hapus
  const rawReason =
    item.reason ??
    item.deleted_reason ??
    item.alasan ??
    item.note ??
    item.review_note ??
    p.deleted_reason ??
    p.reason ??
    ''
  const reason = toPrimitiveString(rawReason).trim()

  // Pemohon / penghapus
  const rawUser =
    item.requested_by ??
    item.deleted_by ??
    item.user ??
    item.created_by ??
    item.requester ??
    p.deleted_by ??
    p.created_by
  let requesterName = ''
  if (rawUser) {
    if (typeof rawUser === 'string') {
      requesterName = rawUser
    } else if (typeof rawUser === 'object' && 'name' in rawUser && rawUser.name) {
      requesterName = toPrimitiveString(rawUser.name)
    }
  }
  if (!requesterName) {
    if (item.requested_by_id) {
      requesterName = `User #${toPrimitiveString(item.requested_by_id)}`
    } else if (item.user_id) {
      requesterName = `User #${toPrimitiveString(item.user_id)}`
    } else if (p.created_by_id) {
      requesterName = `User #${toPrimitiveString(p.created_by_id)}`
    }
  }

  // Waktu hapus
  const rawDeletedAt = item.deleted_at ?? p.deleted_at ?? item.created_at ?? null
  const deletedAt = rawDeletedAt ? toPrimitiveString(rawDeletedAt) : null

  // Thumbnail gambar jika tersedia
  const rawImage = p.image_url ?? item.image_url ?? p.image ?? item.image ?? null
  const imageUrl = rawImage ? toPrimitiveString(rawImage) : null

  return {
    id,
    pembandingId,
    alamat,
    harga,
    jenisListing,
    reason,
    requesterName,
    deletedAt,
    imageUrl,
    raw: item,
  }
}

export async function fetchModeration(
  filters?: ModerationFilters,
  signal?: AbortSignal,
): Promise<ModerationResponse> {
  const { data } = await apiClient.GET('/v1/moderation', {
    params: { query: filters },
    signal,
  })

  if (import.meta.env.DEV && data) {
    console.log('[Moderation API Response]:', data)
  }

  if (data && Array.isArray(data.data)) return data
  throw invalidResponse('data antrean moderasi')
}


export async function approveDeleteRequest(id: string | number): Promise<void> {
  await apiClient.POST('/v1/moderation/delete-requests/{id}/approve', {
    params: { path: { id: String(id) } },
  })
}

export async function rejectDeleteRequest(
  id: string | number,
  reviewNote: string,
): Promise<void> {
  await apiClient.POST('/v1/moderation/delete-requests/{id}/reject', {
    params: { path: { id: String(id) } },
    body: { review_note: reviewNote },
  })
}

export async function restorePembanding(id: string | number): Promise<void> {
  await apiClient.POST('/v1/moderation/pembandings/{id}/restore', {
    params: { path: { id: String(id) } },
  })
}

export async function forceDeletePembanding(id: string | number): Promise<void> {
  await apiClient.DELETE('/v1/moderation/pembandings/{id}', {
    params: { path: { id: String(id) } },
  })
}
