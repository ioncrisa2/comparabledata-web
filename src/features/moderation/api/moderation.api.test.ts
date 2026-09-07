import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  approveDeleteRequest,
  fetchModeration,
  forceDeletePembanding,
  rejectDeleteRequest,
  restorePembanding,
} from './moderation.api'

describe('moderation API', () => {
  it('fetches moderation requests list with query parameters', async () => {
    let capturedTab: string | null = null
    let capturedSearch: string | null = null

    mockServer.use(
      http.get('*/api/v1/moderation', ({ request }) => {
        const url = new URL(request.url)
        capturedTab = url.searchParams.get('tab')
        capturedSearch = url.searchParams.get('search')

        return HttpResponse.json({
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [
            {
              id: 10,
              alamat_data: 'Jl. Riau No. 12',
              harga: 750000000,
              deleted_at: null,
              deleted_reason: 'Aset terinput ganda oleh kontributor lain',
              jenis_listing: {
                name: 'Jual',
                badge_color: null,
              },
              deleted_by: {
                name: 'Budi Santoso',
              },
            },
          ],
          meta: {
            current_page: 1,
            per_page: 25,
            from: 1,
            to: 1,
            total: 1,
            last_page: 1,
          },
          links: { first: null, last: null, prev: null, next: null },
          can: {},
        })
      }),
    )

    const response = await fetchModeration({ tab: 'requests', search: 'Riau' })
    expect(capturedTab).toBe('requests')
    expect(capturedSearch).toBe('Riau')
    expect(response.data).toHaveLength(1)
    expect(response.data[0]?.id).toBe(10)
    expect(response.data[0]?.alamat_data).toBe('Jl. Riau No. 12')
  })

  it('approves a delete request', async () => {
    let approvedId: string | null = null

    mockServer.use(
      http.post('*/api/v1/moderation/delete-requests/:id/approve', ({ params }) => {
        approvedId = String(params.id)
        return HttpResponse.json({
          status: 'success',
          message: 'Permohonan hapus disetujui dan data dipindahkan ke tempat sampah.',
          data: null,
        })
      }),
    )

    await approveDeleteRequest(10)
    expect(approvedId).toBe('10')
  })

  it('rejects a delete request with mandatory review note', async () => {
    let rejectedId: string | null = null
    let requestBody: Record<string, unknown> | null = null

    mockServer.use(
      http.post('*/api/v1/moderation/delete-requests/:id/reject', async ({ params, request }) => {
        rejectedId = String(params.id)
        requestBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: 'success',
          message: 'Permohonan hapus berhasil ditolak.',
          data: null,
        })
      }),
    )

    await rejectDeleteRequest(10, 'Data valid dan bukan duplikat.')
    expect(rejectedId).toBe('10')
    expect(requestBody).toEqual({ review_note: 'Data valid dan bukan duplikat.' })
  })

  it('restores a deleted pembanding from trash', async () => {
    let restoredId: string | null = null

    mockServer.use(
      http.post('*/api/v1/moderation/pembandings/:id/restore', ({ params }) => {
        restoredId = String(params.id)
        return HttpResponse.json({
          status: 'success',
          message: 'Data pembanding berhasil dipulihkan.',
          data: null,
        })
      }),
    )

    await restorePembanding(10)
    expect(restoredId).toBe('10')
  })

  it('force deletes a pembanding from trash', async () => {
    let deletedId: string | null = null

    mockServer.use(
      http.delete('*/api/v1/moderation/pembandings/:id', ({ params }) => {
        deletedId = String(params.id)
        return HttpResponse.json({
          status: 'success',
          message: 'Data pembanding berhasil dihapus permanen.',
          data: null,
        })
      }),
    )

    await forceDeletePembanding(10)
    expect(deletedId).toBe('10')
  })

  describe('normalizeModerationItem', () => {
    it('normalizes flat structure correctly', async () => {
      const { normalizeModerationItem } = await import('./moderation.api')
      const item = {
        id: 7,
        alamat_data: 'Jl. Merdeka No. 1',
        harga: 800000000,
        jenis_listing: { name: 'Sewa' },
        deleted_reason: 'Disewa pihak lain',
        deleted_by: { name: 'Doni' },
        deleted_at: '2026-09-01T10:00:00Z',
      }

      const normalized = normalizeModerationItem(item)
      expect(normalized.id).toBe(7)
      expect(normalized.pembandingId).toBe(7)
      expect(normalized.alamat).toBe('Jl. Merdeka No. 1')
      expect(normalized.harga).toBe(800000000)
      expect(normalized.jenisListing).toBe('Sewa')
      expect(normalized.reason).toBe('Disewa pihak lain')
      expect(normalized.requesterName).toBe('Doni')
      expect(normalized.deletedAt).toBe('2026-09-01T10:00:00Z')
    })

    it('normalizes nested DeleteRequest structure with relations', async () => {
      const { normalizeModerationItem } = await import('./moderation.api')
      const item = {
        id: 8,
        pembanding_id: 42,
        reason: 'Duplikat dengan listing lain',
        requested_by: { name: 'Ahmad' },
        pembanding: {
          id: 42,
          alamat_data: 'Jl. Ahmad Yani No. 5',
          harga_penawaran: 1200000000,
          jenis_listing: { name: 'Jual' },
        },
      }

      const normalized = normalizeModerationItem(item)
      expect(normalized.id).toBe(8)
      expect(normalized.pembandingId).toBe(42)
      expect(normalized.alamat).toBe('Jl. Ahmad Yani No. 5')
      expect(normalized.harga).toBe(1200000000)
      expect(normalized.jenisListing).toBe('Jual')
      expect(normalized.reason).toBe('Duplikat dengan listing lain')
      expect(normalized.requesterName).toBe('Ahmad')
    })

    it('handles null or empty items safely', async () => {
      const { normalizeModerationItem } = await import('./moderation.api')
      const normalized = normalizeModerationItem(null)
      expect(normalized.id).toBe(0)
      expect(normalized.pembandingId).toBe(0)
      expect(normalized.alamat).toBe('')
      expect(normalized.harga).toBeNull()
      expect(normalized.reason).toBe('')
      expect(normalized.requesterName).toBe('')
    })
  })
})
