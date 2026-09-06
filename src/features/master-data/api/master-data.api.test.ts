import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  createDictionaryItem,
  deleteDictionaryItem,
  fetchDictionaryCategories,
  fetchDictionaryItems,
  reorderDictionaryItems,
  updateDictionaryItem,
  updateDictionaryStatus,
} from './master-data.api'

describe('Master Data API', () => {
  it('fetches dictionary categories', async () => {
    mockServer.use(
      http.get('*/api/v1/dictionaries', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar kategori dictionary berhasil diambil.',
          data: [
            {
              type: 'jenis-objek',
              label: 'Jenis Objek',
              icon: 'pi-building',
              description: 'Kategori properti.',
              stats: { total: 10, active: 8, inactive: 2 },
            },
          ],
        }),
      ),
    )

    const categories = await fetchDictionaryCategories()
    expect(categories).toHaveLength(1)
    expect(categories[0]!.type).toBe('jenis-objek')
    expect(categories[0]!.stats.total).toBe(10)
  })

  it('fetches dictionary items for a specific type', async () => {
    mockServer.use(
      http.get('*/api/v1/dictionaries/jenis-objek', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data dictionary jenis-objek',
          data: [
            {
              id: 1,
              name: 'Tanah dan Bangunan',
              slug: 'tanah-dan-bangunan',
              sort_order: 1,
              is_active: true,
              pembandings_count: 24,
            },
          ],
        }),
      ),
    )

    const items = await fetchDictionaryItems('jenis-objek')
    expect(items).toHaveLength(1)
    expect(items[0]!.name).toBe('Tanah dan Bangunan')
    expect(items[0]!.pembandings_count).toBe(24)
  })

  it('creates, updates, updates status, and deletes an item', async () => {
    mockServer.use(
      http.post('*/api/v1/dictionaries/jenis-objek', async ({ request }) => {
        const body = (await request.json()) as { name: string }
        return HttpResponse.json(
          {
            status: 'success',
            message: 'Data dictionary berhasil ditambahkan.',
            data: {
              id: 99,
              name: body.name,
              slug: 'ruko',
              sort_order: 2,
              is_active: true,
            },
          },
          { status: 201 },
        )
      }),
      http.put('*/api/v1/dictionaries/jenis-objek/99', async ({ request }) => {
        const body = (await request.json()) as { name: string }
        return HttpResponse.json({
          status: 'success',
          message: 'Data dictionary berhasil diperbarui.',
          data: {
            id: 99,
            name: body.name,
            slug: 'ruko-modern',
            sort_order: 2,
            is_active: true,
          },
        })
      }),
      http.patch('*/api/v1/dictionaries/jenis-objek/99/status', async ({ request }) => {
        const body = (await request.json()) as { is_active: boolean }
        return HttpResponse.json({
          status: 'success',
          message: 'Status dictionary berhasil diubah.',
          data: {
            id: 99,
            name: 'Ruko Modern',
            slug: 'ruko-modern',
            sort_order: 2,
            is_active: body.is_active,
          },
        })
      }),
      http.delete('*/api/v1/dictionaries/jenis-objek/99', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data dictionary berhasil dihapus.',
          data: null,
        }),
      ),
      http.post('*/api/v1/dictionaries/jenis-objek/reorder', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Urutan dictionary berhasil diperbarui.',
          data: null,
        }),
      ),
    )

    const created = await createDictionaryItem('jenis-objek', { name: 'Ruko' })
    expect(created.id).toBe(99)

    const updated = await updateDictionaryItem('jenis-objek', 99, { name: 'Ruko Modern' })
    expect(updated.name).toBe('Ruko Modern')

    const statusChanged = await updateDictionaryStatus('jenis-objek', 99, false)
    expect(statusChanged.is_active).toBe(false)

    await expect(reorderDictionaryItems('jenis-objek', [99, 1])).resolves.not.toThrow()
    await expect(deleteDictionaryItem('jenis-objek', 99)).resolves.not.toThrow()
  })
})
