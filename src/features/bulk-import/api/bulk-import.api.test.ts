import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  bulkApplyValues,
  fetchImportBatchDetail,
  fetchImportBatches,
  fetchImportRowDetail,
  finalizeImportBatch,
  retryImportRow,
  updateImportRow,
  updateRowSelection,
  uploadImportBatch,
} from './bulk-import.api'

describe('bulk-import.api', () => {
  it('fetches import batches list with pagination', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar batch impor Excel berhasil diambil.',
          data: [
            {
              id: 1,
              filename: 'pembanding_agustus.xlsx',
              owner: 'Budi Appraiser',
              status: 'ready',
              status_label: 'Draf',
              total_rows: 50,
              selected_rows: 50,
              ready_rows: 45,
              imported_rows: 0,
              failed_rows: 5,
              processing_rows: 0,
              can_edit: true,
              can_finalize: true,
              finalize_block_reason: null,
              finalization_date: '2026-09-01',
              finalized_at: null,
              updated_at: '2026-09-01 10:00:00',
            },
          ],
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 1,
            total: 1,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
        }),
      ),
    )

    const res = await fetchImportBatches({ page: 1 })
    expect(res.data).toHaveLength(1)
    expect(res.data[0]?.filename).toBe('pembanding_agustus.xlsx')
    expect(res.meta.total).toBe(1)
  })

  it('uploads a new import batch spreadsheet file', async () => {
    mockServer.use(
      http.post('*/api/v1/pembanding-imports', () => {
        return HttpResponse.json(
          {
            status: 'success',
            message: 'File berhasil dibaca dan disimpan sebagai draf.',
            data: {
              batch: {
                id: 10,
                filename: 'data_baru.xlsx',
                owner: 'Admin',
                status: 'draft',
                status_label: 'Draf',
                total_rows: 20,
                selected_rows: 20,
                ready_rows: 20,
                imported_rows: 0,
                failed_rows: 0,
                processing_rows: 0,
                can_edit: true,
                can_finalize: true,
                finalize_block_reason: null,
                finalization_date: '2026-09-07',
                finalized_at: null,
                updated_at: '2026-09-07 12:00:00',
              },
              is_existing: false,
            },
          },
          { status: 201 },
        )
      }),
    )

    const fakeFile = new File(['fake content'], 'data_baru.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const res = await uploadImportBatch(fakeFile)
    expect(res.batch.id).toBe(10)
    expect(res.is_existing).toBe(false)
  })

  it('fetches batch detail with rows and options', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports/10', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail batch impor berhasil diambil.',
          batch: {
            id: 10,
            filename: 'data_baru.xlsx',
            owner: 'Admin',
            status: 'draft',
            status_label: 'Draf',
            total_rows: 1,
            selected_rows: 1,
            ready_rows: 1,
            imported_rows: 0,
            failed_rows: 0,
            processing_rows: 0,
            can_edit: true,
            can_finalize: true,
            finalize_block_reason: null,
            finalization_date: '2026-09-07',
            finalized_at: null,
            updated_at: '2026-09-07 12:00:00',
          },
          data: [
            {
              id: 101,
              source_row_number: 2,
              status: 'ready',
              status_label: 'Siap dimasukkan',
              is_selected: true,
              jenis_pembanding: 'Properti Residensial',
              alamat: 'Jl. Melati No. 88',
              location: 'Coblong, Kota Bandung',
              missing_fields: [],
              warnings: [],
              has_image: true,
              image_url: '/api/v1/pembanding-imports/10/rows/101/image',
              last_error: null,
              failure_code: null,
              result_url: null,
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
          links: { first: '', last: '', prev: null, next: null },
          options: {
            statusPemberiInfos: [{ label: 'Pemilik', value: '1' }],
            bentukTanahs: [],
            posisiTanahs: [],
            kondisiTanahs: [],
            topografis: [],
            dokumenTanahs: [],
            peruntukans: [],
          },
        }),
      ),
    )

    const res = await fetchImportBatchDetail(10)
    expect(res.batch.id).toBe(10)
    expect(res.data).toHaveLength(1)
    expect(res.data[0]?.alamat).toBe('Jl. Melati No. 88')
    expect(res.options.statusPemberiInfos).toHaveLength(1)
  })

  it('updates row selection in a batch', async () => {
    let capturedBody: Record<string, unknown> | null = null

    mockServer.use(
      http.patch('*/api/v1/pembanding-imports/10/selection', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: 'success',
          message: 'Pilihan data berhasil disimpan.',
          data: {
            id: 10,
            filename: 'data_baru.xlsx',
            owner: 'Admin',
            status: 'draft',
            status_label: 'Draf',
            total_rows: 10,
            selected_rows: 8,
            ready_rows: 8,
            imported_rows: 0,
            failed_rows: 0,
            processing_rows: 0,
            can_edit: true,
            can_finalize: true,
            finalize_block_reason: null,
            finalization_date: '2026-09-07',
            finalized_at: null,
            updated_at: '2026-09-07 12:00:00',
          },
        })
      }),
    )

    const res = await updateRowSelection(10, { action: 'select_ready' })
    expect(capturedBody).toEqual({ action: 'select_ready' })
    expect(res.selected_rows).toBe(8)
  })

  it('bulk applies values to selected rows', async () => {
    let capturedBody: Record<string, unknown> | null = null

    mockServer.use(
      http.patch('*/api/v1/pembanding-imports/10/bulk-apply', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          status: 'success',
          message: '8 baris berhasil diperbarui.',
          data: {
            updated_rows: 8,
            batch: {
              id: 10,
              filename: 'data_baru.xlsx',
              owner: 'Admin',
              status: 'draft',
              status_label: 'Draf',
              total_rows: 10,
              selected_rows: 8,
              ready_rows: 8,
              imported_rows: 0,
              failed_rows: 0,
              processing_rows: 0,
              can_edit: true,
              can_finalize: true,
              finalize_block_reason: null,
              finalization_date: '2026-09-07',
              finalized_at: null,
              updated_at: '2026-09-07 12:00:00',
            },
          },
        })
      }),
    )

    const res = await bulkApplyValues(10, { field: 'peruntukan_id', value: 3 })
    expect(capturedBody).toEqual({ field: 'peruntukan_id', value: 3 })
    expect(res.updated_rows).toBe(8)
  })

  it('finalizes an import batch', async () => {
    mockServer.use(
      http.post('*/api/v1/pembanding-imports/10/finalize', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data mulai dimasukkan. Silakan pantau status pemrosesan.',
          data: {
            batch: {
              id: 10,
              filename: 'data_baru.xlsx',
              owner: 'Admin',
              status: 'processing',
              status_label: 'Sedang dimasukkan',
              total_rows: 10,
              selected_rows: 8,
              ready_rows: 8,
              imported_rows: 0,
              failed_rows: 0,
              processing_rows: 8,
              can_edit: false,
              can_finalize: false,
              finalize_block_reason: 'Batch sedang diproses',
              finalization_date: '2026-09-07',
              finalized_at: null,
              updated_at: '2026-09-07 12:05:00',
            },
          },
        }),
      ),
    )

    const res = await finalizeImportBatch(10, true)
    expect(res.batch.status).toBe('processing')
    expect(res.message).toContain('mulai dimasukkan')
  })

  it('fetches single row detail for editing', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-imports/10/rows/101', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail baris impor berhasil diambil.',
          data: {
            row: {
              id: 101,
              source_row_number: 2,
              status: 'incomplete',
              status_label: 'Belum lengkap',
              data: { alamat_data: 'Jl. Riau No. 10' },
              raw_payload: {},
              missing_fields: ['harga'],
              warnings: [],
              image_url: null,
            },
            options: {
              provinces: [{ label: 'Jawa Barat', value: '32' }],
              regencies: [],
              districts: [],
              villages: [],
              jenisListings: [{ label: 'Jual', value: '1' }],
              jenisObjeks: [],
              statusPemberiInfos: [],
              bentukTanahs: [],
              posisiTanahs: [],
              kondisiTanahs: [],
              topografis: [],
              dokumenTanahs: [],
              peruntukans: [],
            },
          },
        }),
      ),
    )

    const res = await fetchImportRowDetail(10, 101)
    expect(res.row.id).toBe(101)
    expect(res.options.provinces).toHaveLength(1)
  })

  it('updates an import row', async () => {
    mockServer.use(
      http.put('*/api/v1/pembanding-imports/10/rows/101', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Draf tersimpan dan data ini sudah lengkap.',
          data: {
            row: {
              id: 101,
              status: 'ready',
              status_label: 'Siap dimasukkan',
              missing_fields: [],
              warnings: [],
            },
            batch: {
              id: 10,
              filename: 'data_baru.xlsx',
              owner: 'Admin',
              status: 'draft',
              status_label: 'Draf',
              total_rows: 10,
              selected_rows: 8,
              ready_rows: 9,
              imported_rows: 0,
              failed_rows: 0,
              processing_rows: 0,
              can_edit: true,
              can_finalize: true,
              finalize_block_reason: null,
              finalization_date: '2026-09-07',
              finalized_at: null,
              updated_at: '2026-09-07 12:10:00',
            },
          },
        }),
      ),
    )

    const fd = new FormData()
    fd.append('harga', '750000000')
    const res = await updateImportRow(10, 101, fd)
    expect(res.row.status).toBe('ready')
    expect(res.batch.ready_rows).toBe(9)
  })

  it('retries a failed import row', async () => {
    mockServer.use(
      http.post('*/api/v1/pembanding-imports/10/rows/101/retry', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Baris sedang diulang.',
        }),
      ),
    )

    const res = await retryImportRow(10, 101)
    expect(res.message).toBe('Baris sedang diulang.')
  })
})
