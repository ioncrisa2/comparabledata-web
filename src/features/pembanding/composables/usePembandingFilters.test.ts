import { describe, expect, it } from 'vitest'
import type { LocationQuery } from 'vue-router'

import { parsePembandingFilters, serializePembandingFilters } from './usePembandingFilters'

describe('pembanding list filters', () => {
  it('normalizes supported URL query values and rejects invalid ranges', () => {
    const filters = parsePembandingFilters({
      page: '3',
      per_page: '50',
      q: '  dago  ',
      province_id: '32',
      jenis_objek_id: '2',
      min_harga: '0',
      max_harga: '-1',
      dari_tanggal: '2026-08-01',
      sampai_tanggal: 'not-a-date',
      sort: 'harga',
      direction: 'ASC',
    } as LocationQuery)

    expect(filters).toMatchObject({
      page: 3,
      per_page: 50,
      q: 'dago',
      province_id: '32',
      jenis_objek_id: 2,
      min_harga: 0,
      max_harga: undefined,
      dari_tanggal: '2026-08-01',
      sampai_tanggal: undefined,
      sort: 'harga',
      direction: 'asc',
    })
  })

  it('uses safe defaults and omits defaults from the canonical URL', () => {
    const filters = parsePembandingFilters({
      page: '0',
      per_page: '500',
      sort: 'unknown',
      direction: 'sideways',
    } as LocationQuery)

    expect(filters).toMatchObject({
      page: 1,
      per_page: 25,
      sort: 'tanggal_data',
      direction: 'desc',
    })
    expect(serializePembandingFilters(filters)).toEqual({})
  })

  it('serializes active filters for reload and browser navigation', () => {
    const filters = parsePembandingFilters({} as LocationQuery)

    expect(
      serializePembandingFilters({
        ...filters,
        page: 2,
        q: 'rumah',
        created_by: 7,
        max_harga: 3_000_000_000,
      }),
    ).toEqual({
      page: '2',
      q: 'rumah',
      created_by: '7',
      max_harga: '3000000000',
    })
  })
})
