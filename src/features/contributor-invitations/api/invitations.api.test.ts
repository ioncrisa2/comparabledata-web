import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  acceptRegistrationRequest,
  createInvitation,
  fetchInvitations,
  fetchRegistrationRequests,
  rejectRegistrationRequest,
  revokeInvitation,
  submitRegistration,
  verifyRegistrationToken,
} from './invitations.api'

describe('invitations.api', () => {
  it('fetches invitations list', async () => {
    mockServer.use(
      http.get('*/api/v1/data-contributor-invitations', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar token undangan berhasil diambil.',
          data: [
            {
              id: 1,
              token_fingerprint: 'abcd1234efgh5678',
              status: 'active',
              expires_at: '2026-09-14T00:00:00Z',
              used_at: null,
              created_at: '2026-09-07T00:00:00Z',
              created_by: 'Budi Santoso',
              request: null,
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

    const result = await fetchInvitations()
    expect(result.data).toHaveLength(1)
    expect(result.data[0]?.token_fingerprint).toBe('abcd1234efgh5678')
    expect(result.data[0]?.status).toBe('active')
  })

  it('creates new invitation', async () => {
    mockServer.use(
      http.post('*/api/v1/data-contributor-invitations', () =>
        HttpResponse.json(
          {
            status: 'success',
            message: 'Invitation link berhasil dibuat.',
            data: {
              id: 10,
              raw_token: 'tok_secret_123',
              registration_url: 'https://example.com/register/tok_secret_123',
              expires_at: '2026-09-14T00:00:00Z',
            },
          },
          { status: 201 },
        ),
      ),
    )

    const result = await createInvitation()
    expect(result.id).toBe(10)
    expect(result.raw_token).toBe('tok_secret_123')
  })

  it('revokes an active invitation', async () => {
    mockServer.use(
      http.delete('*/api/v1/data-contributor-invitations/10', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Invitation yang belum digunakan berhasil dihapus.',
          data: null,
        }),
      ),
    )

    await expect(revokeInvitation(10)).resolves.not.toThrow()
  })

  it('fetches registration requests list', async () => {
    mockServer.use(
      http.get('*/api/v1/data-contributor-registration-requests', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar pengajuan registrasi kontributor berhasil diambil.',
          data: [
            {
              id: 5,
              display_name: 'Calon Kontributor',
              generated_email: 'kontributor.calon@hjar.id',
              phone: '081234567890',
              status: 'pending',
              submitted_at: '2026-09-07T01:00:00Z',
              generated_by: 'Budi Santoso',
              accepted_at: null,
              accepted_by: '',
              rejected_at: null,
              rejected_by: '',
              reject_reason: null,
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

    const result = await fetchRegistrationRequests()
    expect(result.data).toHaveLength(1)
    expect(result.data[0]?.display_name).toBe('Calon Kontributor')
    expect(result.data[0]?.status).toBe('pending')
  })

  it('accepts and rejects registration requests', async () => {
    mockServer.use(
      http.post('*/api/v1/data-contributor-registration-requests/5/accept', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data contributor berhasil dibuat.',
          data: null,
        }),
      ),
      http.post('*/api/v1/data-contributor-registration-requests/5/reject', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Request data contributor berhasil ditolak.',
          data: null,
        }),
      ),
    )

    await expect(acceptRegistrationRequest(5)).resolves.not.toThrow()
    await expect(
      rejectRegistrationRequest(5, { reject_reason: 'Data tidak lengkap' }),
    ).resolves.not.toThrow()
  })

  it('verifies public registration token and submits registration', async () => {
    mockServer.use(
      http.get('*/api/v1/public/data-contributor-registration/valid_token', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Token undangan valid.',
          data: {
            is_valid: true,
            valid: true,
            expires_at: '2026-09-14T00:00:00Z',
          },
        }),
      ),
      http.post('*/api/v1/public/data-contributor-registration/valid_token', () =>
        HttpResponse.json(
          {
            status: 'success',
            message: 'Pendaftaran kontributor berhasil dikirim.',
            data: {
              generated_email: 'kontributor.baru@hjar.id',
              message: 'Pendaftaran berhasil dikirim.',
            },
          },
          { status: 201 },
        ),
      ),
    )

    const tokenData = await verifyRegistrationToken('valid_token')
    expect(tokenData.is_valid).toBe(true)

    const submitResult = await submitRegistration('valid_token', {
      display_name: 'Budi Baru',
      phone: '08123456789',
      password: 'password123',
      password_confirmation: 'password123',
    })
    expect(submitResult.generated_email).toBe('kontributor.baru@hjar.id')
  })
})
