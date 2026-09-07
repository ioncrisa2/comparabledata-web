import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { createWilayah, deleteWilayah, fetchWilayahList, updateWilayah } from './wilayah.api'

describe('Wilayah API', () => {
  it('fetches provinces list with metadata and stats', async () => {
    mockServer.use(
      http.get('*/api/v1/geo/provinces', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data provinces berhasil diambil.',
          data: [
            { id: '32', name: 'Jawa Barat', children_count: 27 },
            { id: '31', name: 'DKI Jakarta', children_count: 6 },
          ],
          meta: {
            current_page: 1,
            per_page: 20,
            from: 1,
            to: 2,
            total: 2,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
          resource_meta: {
            label: 'Provinsi',
            singular: 'Provinsi',
            icon: 'pi pi-flag',
            id_label: 'Kode Provinsi',
            id_help: '2 digit angka',
            children_label: 'Kabupaten / Kota',
          },
          stats: {
            provinces: 38,
            regencies: 514,
            districts: 7288,
            villages: 83971,
          },
          options: {},
        }),
      ),
    )

    const res = await fetchWilayahList('provinces')
    expect(res.data).toHaveLength(2)
    expect(res.data[0]!.id).toBe('32')
    expect(res.stats.provinces).toBe(38)
    expect(res.resource_meta.singular).toBe('Provinsi')
  })

  it('creates, updates, and deletes a wilayah record', async () => {
    mockServer.use(
      http.post('*/api/v1/geo/provinces', async ({ request }) => {
        const body = (await request.json()) as { id: string; name: string }
        return HttpResponse.json(
          {
            status: 'success',
            message: 'Provinsi berhasil ditambahkan.',
            data: { id: body.id, name: body.name },
          },
          { status: 201 },
        )
      }),
      http.put('*/api/v1/geo/provinces/99', async ({ request }) => {
        const body = (await request.json()) as { name: string }
        return HttpResponse.json({
          status: 'success',
          message: 'Provinsi berhasil diperbarui.',
          data: { id: '99', name: body.name },
        })
      }),
      http.delete('*/api/v1/geo/provinces/99', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Provinsi berhasil dihapus.',
          data: null,
        }),
      ),
    )

    const created = await createWilayah('provinces', { id: '99', name: 'Provinsi Baru' })
    expect(created.id).toBe('99')
    expect(created.name).toBe('Provinsi Baru')

    const updated = await updateWilayah('provinces', '99', { name: 'Provinsi Update' })
    expect(updated.name).toBe('Provinsi Update')

    await expect(deleteWilayah('provinces', '99')).resolves.not.toThrow()
  })
})
