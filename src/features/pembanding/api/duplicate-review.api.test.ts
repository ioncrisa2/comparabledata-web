import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  fetchDuplicateReview,
  resolveDuplicateReview,
} from './duplicate-review.api'

describe('duplicate review API', () => {
  it('fetches duplicate review submission details', async () => {
    mockServer.use(
      http.get('*/api/v1/pembanding-submissions/sub-1', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data review duplikat berhasil diambil.',
          data: {
            submission: {
              id: 'sub-1',
              expires_at: '2026-12-31T23:59:59Z',
              image_url: 'https://example.com/new.jpg',
              rows: [{ key: 'alamat', label: 'Alamat', value: 'Jl. Baru' }],
            },
            candidates: [
              {
                id: 42,
                created_by: 'Admin',
                updated_at: null,
                deleted: false,
                can_update: 'yes',
                image_url: 'https://example.com/old.jpg',
                rows: [{ key: 'alamat', label: 'Alamat', value: 'Jl. Lama' }],
              },
            ],
          },
        }),
      ),
    )

    const result = await fetchDuplicateReview('sub-1')
    expect(result.submission.id).toBe('sub-1')
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.id).toBe(42)
  })

  it('resolves duplicate review with chosen strategy', async () => {
    let resolutionBody: Record<string, unknown> | null = null
    mockServer.use(
      http.post(
        '*/api/v1/pembanding-submissions/sub-1/resolution',
        async ({ request }) => {
          resolutionBody = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({
            status: 'success',
            message: 'Record lama berhasil diperbarui.',
            data: {} as never,
          })
        },
      ),
    )

    await resolveDuplicateReview('sub-1', 'replace_existing', 42)
    expect(resolutionBody).toEqual({
      strategy: 'replace_existing',
      candidate_id: 42,
    })
  })
})
