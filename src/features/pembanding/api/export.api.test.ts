import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  createExportRun,
  downloadExportFile,
  downloadExportRunFile,
  extractFilenameFromContentDisposition,
  fetchExportConfiguration,
  fetchExportRuns,
  fetchExportRunStatus,
  previewExport,
  retryExportRun,
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
      extractFilenameFromContentDisposition('attachment; filename=export-data.csv', 'fallback.csv'),
    ).toBe('export-data.csv')

    // Null or empty header
    expect(extractFilenameFromContentDisposition(null, 'fallback.xlsx')).toBe('fallback.xlsx')
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

  it('previews export dataset and returns count and queued flag', async () => {
    const capturedBody: Record<string, string | number | boolean> = {}
    mockServer.use(
      http.post('*/api/v1/exports/preview', async ({ request }) => {
        Object.assign(
          capturedBody,
          (await request.json()) as Record<string, string | number | boolean>,
        )
        return HttpResponse.json({
          status: 'success',
          message: 'Preview ekspor berhasil dihitung.',
          data: {
            count: '12500',
            sync_limit: 5000,
            queued: true,
            without_coordinates: '120',
          },
        })
      }),
    )

    const preview = await previewExport({
      format: 'excel',
      profile: 'lengkap',
      filters: { province_id: '32' },
    })

    expect(preview.count).toBe('12500')
    expect(preview.sync_limit).toBe(5000)
    expect(preview.queued).toBe(true)
    expect(capturedBody.province_id).toBe('32')
  })

  it('creates an async export run', async () => {
    const capturedBody: Record<string, string | number | boolean> = {}
    mockServer.use(
      http.post('*/api/v1/exports/runs', async ({ request }) => {
        Object.assign(
          capturedBody,
          (await request.json()) as Record<string, string | number | boolean>,
        )
        return HttpResponse.json(
          {
            status: 'success',
            message: 'Tugas ekspor berhasil didaftarkan ke antrean.',
            data: {
              id: 99,
              status: 'queued',
              format: 'excel',
              mode: null,
              profile: 'lengkap',
              scope: 'filtered',
              total_records: 12500,
              processed_records: 0,
              created_at: '2026-09-01 10:00:00',
              expires_at: null,
              error: null,
              download_url: null,
            },
          },
          { status: 202 },
        )
      }),
    )

    const run = await createExportRun({
      format: 'excel',
      profile: 'lengkap',
      filters: { province_id: '32' },
    })

    expect(run.id).toBe(99)
    expect(run.status).toBe('queued')
    expect(capturedBody.format).toBe('excel')
  })

  it('fetches export runs list', async () => {
    mockServer.use(
      http.get('*/api/v1/exports/runs', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar riwayat tugas ekspor berhasil diambil.',
          data: [
            {
              id: 99,
              status: 'completed',
              format: 'excel',
              mode: null,
              profile: 'lengkap',
              scope: 'filtered',
              total_records: 12500,
              processed_records: 12500,
              created_at: '2026-09-01 12:00:00',
              expires_at: '2026-09-08 12:00:00',
              error: null,
              download_url: '/api/v1/exports/runs/99/download',
            },
          ],
          meta: { current_page: 1, per_page: 25, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
    )

    const response = await fetchExportRuns()
    expect(response.data).toHaveLength(1)
    expect(response.data[0]!.status).toBe('completed')
  })

  it('fetches export run status', async () => {
    mockServer.use(
      http.get('*/api/v1/exports/runs/:id', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Status tugas ekspor.',
          data: {
            id: 99,
            status: 'processing',
            format: 'excel',
            mode: null,
            profile: 'lengkap',
            scope: 'filtered',
            total_records: 12500,
            processed_records: 6250,
            created_at: '2026-09-01 12:00:00',
            expires_at: null,
            error: null,
            download_url: null,
          },
        }),
      ),
    )

    const status = await fetchExportRunStatus(99)
    expect(status.id).toBe(99)
    expect(status.status).toBe('processing')
    expect(status.processed_records).toBe(6250)
  })

  it('downloads export run file', async () => {
    window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-run-download')
    window.URL.revokeObjectURL = vi.fn()

    mockServer.use(
      http.get(
        '*/api/v1/exports/runs/:id/download',
        () =>
          new HttpResponse('binary-data', {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': 'attachment; filename="pembanding_batch_99.xlsx"',
            },
          }),
      ),
    )

    const result = await downloadExportRunFile(99, 'excel')
    expect(result.filename).toBe('pembanding_batch_99.xlsx')
  })

  it('retries a failed export run', async () => {
    mockServer.use(
      http.post('*/api/v1/exports/runs/:id/retry', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Ekspor dijadwalkan ulang.',
          data: {
            id: 99,
            status: 'queued',
            format: 'excel',
            mode: null,
            profile: 'lengkap',
            scope: 'filtered',
            total_records: 12500,
            processed_records: 0,
            created_at: '2026-09-01 12:00:00',
            expires_at: null,
            error: null,
            download_url: null,
          },
        }),
      ),
    )

    const retried = await retryExportRun(99)
    expect(retried.status).toBe('queued')
  })
})
