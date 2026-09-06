import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { createPembanding } from '../test/fixtures'
import {
  createPembanding as sendCreatePembanding,
  deletePembanding,
  fetchPembanding,
  fetchPembandings,
  requestDeletePembanding,
  updatePembanding,
} from './pembanding.api'

describe('pembanding API', () => {
  it('sends list pagination, search, sorting, and filter parameters', async () => {
    const item = createPembanding()

    mockServer.use(
      http.get('*/api/v1/pembandings', ({ request }) => {
        const query = new URL(request.url).searchParams
        expect(query.get('page')).toBe('2')
        expect(query.get('per_page')).toBe('50')
        expect(query.get('q')).toBe('Dago')
        expect(query.get('province_id')).toBe('32')
        expect(query.get('jenis_objek_id')).toBe('2')
        expect(query.get('sort')).toBe('harga')
        expect(query.get('direction')).toBe('asc')

        return HttpResponse.json({
          status: 'success',
          message: 'Data pembanding berhasil diambil.',
          data: [item],
          meta: {
            current_page: 2,
            per_page: 50,
            from: 51,
            to: 51,
            total: 51,
            last_page: 2,
          },
          links: { first: null, last: null, prev: null, next: null },
        })
      }),
    )

    await expect(
      fetchPembandings({
        page: 2,
        per_page: 50,
        q: 'Dago',
        province_id: '32',
        jenis_objek_id: 2,
        sort: 'harga',
        direction: 'asc',
      }),
    ).resolves.toMatchObject({
      data: [expect.objectContaining({ id: 42 })],
      meta: { current_page: 2, total: 51 },
    })
  })

  it('preserves nullable fields in a detail response', async () => {
    const item = createPembanding({
      luas_bangunan: null,
      harga: null,
      nomer_telepon_pemberi_informasi: null,
      image_url: null,
    })

    mockServer.use(
      http.get('*/api/v1/pembandings/42', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail data pembanding berhasil diambil.',
          data: item,
        }),
      ),
    )

    await expect(fetchPembanding('42')).resolves.toMatchObject({
      id: 42,
      luas_bangunan: null,
      harga: null,
      image_url: null,
    })
  })

  it('creates a new pembanding successfully', async () => {
    const item = createPembanding({ id: 99 })
    mockServer.use(
      http.post('*/api/v1/pembandings', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data pembanding berhasil ditambahkan.',
          data: item,
        }),
      ),
    )

    const fd = new FormData()
    fd.append('alamat_data', 'Jl. Baru')
    const result = await sendCreatePembanding(fd)
    expect(result.id).toBe(99)
  })

  it('handles 409 duplicate review error when creating pembanding', async () => {
    mockServer.use(
      http.post('*/api/v1/pembandings', () =>
        HttpResponse.json(
          {
            status: 'error',
            code: 'DUPLICATE_REVIEW_REQUIRED',
            message: 'Data terindikasi duplikat dengan data pembanding yang sudah ada.',
            duplicate: {
              submission_id: 'sub-123',
              submission_url: 'https://example.com',
              expires_at: '2026-12-31T23:59:59Z',
              candidate_ids: [42],
            },
          },
          { status: 409 },
        ),
      ),
    )

    const fd = new FormData()
    fd.append('alamat_data', 'Jl. Duplikat')
    await expect(sendCreatePembanding(fd)).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_REVIEW_REQUIRED',
      duplicate: {
        submission_id: 'sub-123',
      },
    })
  })

  it('updates a pembanding with _method=PUT', async () => {
    const item = createPembanding({ id: 42, alamat_data: 'Jl. Diubah' })
    let receivedMethod: string | null = null

    mockServer.use(
      http.post('*/api/v1/pembandings/42', async ({ request }) => {
        const formData = await request.formData()
        receivedMethod = formData.get('_method') as string
        return HttpResponse.json({
          status: 'success',
          message: 'Data berhasil diperbarui.',
          data: item,
        })
      }),
    )

    const fd = new FormData()
    fd.append('alamat_data', 'Jl. Diubah')
    const result = await updatePembanding('42', fd)
    expect(result.alamat_data).toBe('Jl. Diubah')
    expect(receivedMethod).toBe('PUT')
  })

  it('deletes a pembanding', async () => {
    let deletedId: string | null = null
    mockServer.use(
      http.delete('*/api/v1/pembandings/:id', ({ params }) => {
        deletedId = String(params.id)
        return HttpResponse.json({ status: 'success', message: 'Dihapus' })
      }),
    )

    await deletePembanding('42')
    expect(deletedId).toBe('42')
  })

  it('sends delete request with reason', async () => {
    let requestBody: Record<string, unknown> | null = null
    mockServer.use(
      http.post('*/api/v1/pembandings/42/delete-request', async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: 'success',
          message: 'Permintaan berhasil diajukan.',
          data: {
            id: 1,
            pembanding_id: 42,
            reason: 'Data duplikat tidak relevan lagi dengan kondisi lapangan',
            status: 'pending',
          },
        })
      }),
    )

    const result = await requestDeletePembanding(
      '42',
      'Data duplikat tidak relevan lagi dengan kondisi lapangan',
    )
    expect(result.id).toBe(1)
    expect(requestBody).toEqual({
      reason: 'Data duplikat tidak relevan lagi dengan kondisi lapangan',
    })
  })
})
