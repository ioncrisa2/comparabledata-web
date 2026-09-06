import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  downloadExportFile,
  extractFilenameFromContentDisposition,
  fetchExportConfiguration,
  triggerBlobDownload,
} from './export.api'

describe('export API', () => {
  it('extractFilenameFromContentDisposition parses various headers correctly', () => {
    // UTF-8 formatted
    expect(
      extractFilenameFromContentDisposition(
        "attachment; filename*=UTF-8''data-pembanding-2026.xlsx",
        'fallback.xlsx',
      ),
    ).toBe('data-pembanding-2026.xlsx')

    // Standard quoted
    expect(
      extractFilenameFromContentDisposition(
        'attachment; filename="pembanding_report.pdf"',
        'fallback.pdf',
      ),
    ).toBe('pembanding_report.pdf')

    // Standard unquoted
    expect(
      extractFilenameFromContentDisposition(
        'attachment; filename=export-data.csv',
        'fallback.csv',
      ),
    ).toBe('export-data.csv')

    // Null or empty header
    expect(extractFilenameFromContentDisposition(null, 'fallback.xlsx')).toBe(
      'fallback.xlsx',
    )
  })

  it('triggerBlobDownload creates and clicks temporary anchor element', () => {
    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/fake-uuid')
    const revokeObjectURLMock = vi.fn()
    window.URL.createObjectURL = createObjectURLMock
    window.URL.revokeObjectURL = revokeObjectURLMock

    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    const blob = new Blob(['test content'], { type: 'text/csv' })
    triggerBlobDownload(blob, 'test-download.csv')

    expect(createObjectURLMock).toHaveBeenCalledWith(blob)
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/fake-uuid')
  })

  it('fetches export configuration successfully', async () => {
    mockServer.use(
      http.get('*/api/v1/exports/configuration', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Konfigurasi ekspor berhasil diambil.',
          data: {
            configuration: {
              profiles: [
                { value: 'ringkas', label: 'Ringkas', columns: ['id', 'alamat'] },
                { value: 'lengkap', label: 'Lengkap', columns: ['id', 'alamat', 'harga'] },
              ],
              columns: [
                { value: 'id', label: 'ID', type: 'integer' },
                { value: 'alamat', label: 'Alamat', type: 'string' },
              ],
            },
            limits: {
              excel: 5000,
              csv: 5000,
              geojson: 5000,
              kml: 5000,
              pdf_summary: 1000,
              pdf_detail: 100,
            },
            async_limits: {
              excel: 100000,
              csv: 100000,
              geojson: 50000,
              kml: 50000,
              pdf_summary: 5000,
              pdf_detail: 500,
            },
          },
        }),
      ),
    )

    const data = await fetchExportConfiguration()
    expect(data.configuration.profiles).toHaveLength(2)
    expect(data.limits.excel).toBe(5000)
  })

  it('downloads export file and passes serialized filter query params', async () => {
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-export')
    window.URL.revokeObjectURL = vi.fn()

    let capturedUrl: URL | null = null

    mockServer.use(
      http.get('*/api/v1/exports/download', ({ request }) => {
        capturedUrl = new URL(request.url)
        return new HttpResponse('file-binary-content', {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="data-pembanding-jabar.xlsx"',
          },
        })
      }),
    )

    const result = await downloadExportFile({
      format: 'excel',
      profile: 'lengkap',
      filters: {
        province_id: '32',
        jenis_listing_id: 1,
        dari_tanggal: '2026-01-01',
      },
    })

    expect(capturedUrl).not.toBeNull()
    const url = capturedUrl as unknown as URL
    expect(url.searchParams.get('format')).toBe('excel')
    expect(url.searchParams.get('profile')).toBe('lengkap')
    expect(url.searchParams.get('province_id')).toBe('32')
    expect(url.searchParams.get('jenis_listing_id')).toBe('1')
    expect(url.searchParams.get('dari_tanggal')).toBe('2026-01-01')
    expect(result.filename).toBe('data-pembanding-jabar.xlsx')
  })
})
