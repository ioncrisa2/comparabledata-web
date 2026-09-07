import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { clearAppCache, fetchPublicSettings, fetchSettings, updateSettings } from './settings.api'

describe('settings.api', () => {
  it('fetches system settings successfully', async () => {
    mockServer.use(
      http.get('*/api/v1/settings', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Pengaturan sistem berhasil diambil.',
          data: {
            settings: {
              system_mode: 'live',
              app_version: '2.1.0',
              primary_color: '#3b82f6',
              company_name: 'PT HJAR Valuasi Mandiri',
              support_email: 'bantuan@hjar.id',
              app_logo: 'https://example.test/logo.png',
            },
            can: {
              update_settings: 'true',
            },
          },
        }),
      ),
    )

    const result = await fetchSettings()
    expect(result.settings.system_mode).toBe('live')
    expect(result.settings.company_name).toBe('PT HJAR Valuasi Mandiri')
    expect(result.settings.app_version).toBe('2.1.0')
    expect(result.settings.primary_color).toBe('#3b82f6')
    expect(result.can.update_settings).toBe('true')
  })

  it('updates system settings via FormData', async () => {
    let capturedMethod = ''
    mockServer.use(
      http.post('*/api/v1/settings', ({ request }) => {
        capturedMethod = request.method
        return HttpResponse.json({
          status: 'success',
          message: 'Pengaturan berhasil diperbarui.',
          data: {
            system_mode: 'maintenance',
            company_name: 'PT HJAR Valuasi Mandiri Baru',
          },
        })
      }),
    )

    const fd = new FormData()
    fd.append('system_mode', 'maintenance')
    fd.append('company_name', 'PT HJAR Valuasi Mandiri Baru')

    const response = await updateSettings(fd)
    expect(capturedMethod).toBe('POST')
    expect(response.message).toBe('Pengaturan berhasil diperbarui.')
  })

  it('clears application cache successfully', async () => {
    mockServer.use(
      http.post('*/api/v1/settings/clear-cache', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Semua cache berhasil dibersihkan.',
          data: null,
        }),
      ),
    )

    const response = await clearAppCache()
    expect(response.message).toBe('Semua cache berhasil dibersihkan.')
  })

  it('fetches public settings', async () => {
    mockServer.use(
      http.get('*/api/v1/settings/public', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Pengaturan publik berhasil diambil.',
          data: {
            app_name: 'Comparable Data Web',
            company_name: 'HJAR Valuasi',
            app_version: '2.1.0',
          },
        }),
      ),
    )

    const result = await fetchPublicSettings()
    expect(result.app_name).toBe('Comparable Data Web')
    expect(result.company_name).toBe('HJAR Valuasi')
  })
})
