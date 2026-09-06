import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { fetchGlobalSearch } from './search.api'

describe('Global Search API', () => {
  it('fetches search results with query and returns mapped response', async () => {
    mockServer.use(
      http.get('*/api/v1/search', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('q')).toBe('Dago')

        return HttpResponse.json({
          status: 'success',
          message: 'Hasil pencarian berhasil diambil.',
          query: 'Dago',
          data: [
            {
              menu_group: 'Bank Data',
              menu_name: 'Appraisal Data',
              resource_name: 'Data Pembanding',
              title: 'Jl. Dago Asri No. 12',
              target_type: 'pembanding',
              target_id: '42',
              api_url: '/api/v1/pembandings/42',
              details: {
                ID: '#42',
                Lokasi: 'Bandung, Jawa Barat',
              },
              icon: 'pi pi-database',
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
          links: {
            first: '',
            last: '',
            prev: null,
            next: null,
          },
          summary: {
            raw_total: 1,
            filtered_total: 1,
          },
          options: {
            menu_groups: [{ label: 'Bank Data', value: 'Bank Data' }],
            menu_names: [{ label: 'Appraisal Data', value: 'Appraisal Data' }],
            resource_names: [{ label: 'Data Pembanding', value: 'Data Pembanding' }],
          },
        })
      }),
    )

    const result = await fetchGlobalSearch({ q: 'Dago' })
    expect(result.data).toHaveLength(1)
    expect(result.data[0]!.title).toBe('Jl. Dago Asri No. 12')
    expect(result.summary.raw_total).toBe(1)
    expect(result.options.menu_groups[0]!.value).toBe('Bank Data')
  })

  it('passes menu_group filter when provided', async () => {
    let capturedGroup: string | null = null

    mockServer.use(
      http.get('*/api/v1/search', ({ request }) => {
        const url = new URL(request.url)
        capturedGroup = url.searchParams.get('menu_group')
        return HttpResponse.json({
          status: 'success',
          message: 'Hasil pencarian berhasil diambil.',
          query: 'tanah',
          data: [],
          meta: { current_page: 1, per_page: 25, from: null, to: null, total: 0, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          summary: { raw_total: 0, filtered_total: 0 },
          options: { menu_groups: [], menu_names: [], resource_names: [] },
        })
      }),
    )

    await fetchGlobalSearch({ q: 'tanah', menu_group: 'Master Data' })
    expect(capturedGroup).toBe('Master Data')
  })
})
