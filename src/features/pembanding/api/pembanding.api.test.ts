import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { createPembanding } from '../test/fixtures'
import { fetchPembanding, fetchPembandings } from './pembanding.api'

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
        per_page: '50',
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
})
