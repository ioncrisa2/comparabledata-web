import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  fetchDistricts,
  fetchProvinces,
  fetchRegencies,
  fetchVillages,
} from './location.api'

describe('pembanding location API', () => {
  it('fetches provinces', async () => {
    mockServer.use(
      http.get('*/api/v1/locations/provinces', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data Provinsi',
          data: [{ id: '32', name: 'Jawa Barat' }],
        }),
      ),
    )

    const result = await fetchProvinces()
    expect(result).toEqual([{ id: '32', name: 'Jawa Barat' }])
  })

  it('fetches regencies with province_id', async () => {
    let capturedProvinceId: string | null = null
    mockServer.use(
      http.get('*/api/v1/locations/regencies', ({ request }) => {
        const url = new URL(request.url)
        capturedProvinceId = url.searchParams.get('province_id')
        return HttpResponse.json({
          status: 'success',
          message: 'Data Kabupaten/Kota',
          data: [{ id: '3273', province_id: '32', name: 'Kota Bandung' }],
        })
      }),
    )

    const result = await fetchRegencies('32')
    expect(capturedProvinceId).toBe('32')
    expect(result[0]?.name).toBe('Kota Bandung')
  })

  it('fetches districts with regency_id', async () => {
    let capturedRegencyId: string | null = null
    mockServer.use(
      http.get('*/api/v1/locations/districts', ({ request }) => {
        const url = new URL(request.url)
        capturedRegencyId = url.searchParams.get('regency_id')
        return HttpResponse.json({
          status: 'success',
          message: 'Data Kecamatan',
          data: [{ id: '327301', regency_id: '3273', name: 'Coblong' }],
        })
      }),
    )

    const result = await fetchDistricts('3273')
    expect(capturedRegencyId).toBe('3273')
    expect(result[0]?.name).toBe('Coblong')
  })

  it('fetches villages with district_id', async () => {
    let capturedDistrictId: string | null = null
    mockServer.use(
      http.get('*/api/v1/locations/villages', ({ request }) => {
        const url = new URL(request.url)
        capturedDistrictId = url.searchParams.get('district_id')
        return HttpResponse.json({
          status: 'success',
          message: 'Data Desa/Kelurahan',
          data: [{ id: '32730101', district_id: '327301', name: 'Dago' }],
        })
      }),
    )

    const result = await fetchVillages('327301')
    expect(capturedDistrictId).toBe('327301')
    expect(result[0]?.name).toBe('Dago')
  })
})
