import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { updatePassword, updateProfile } from './profile.api'

describe('profile.api', () => {
  it('updates profile successfully', async () => {
    mockServer.use(
      http.put('*/api/v1/auth/profile', async ({ request }) => {
        const body = (await request.json()) as { name: string; email: string }
        return HttpResponse.json({
          status: 'success',
          message: 'Profile updated successfully',
          data: {
            id: 1,
            name: body.name,
            email: body.email,
            roles: ['super_admin'],
            permissions: [],
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
          },
        })
      }),
    )

    const updated = await updateProfile({
      name: 'John Doe Updated',
      email: 'john.updated@example.com',
    })

    expect(updated.name).toBe('John Doe Updated')
    expect(updated.email).toBe('john.updated@example.com')
  })

  it('updates password successfully', async () => {
    mockServer.use(
      http.put('*/api/v1/auth/profile/password', () => {
        return HttpResponse.json({
          status: 'success',
          message: 'Password updated successfully',
        })
      }),
    )

    const res = await updatePassword({
      current_password: 'old-password',
      password: 'new-password-123',
      password_confirmation: 'new-password-123',
    })

    expect(res.status).toBe('success')
  })
})
