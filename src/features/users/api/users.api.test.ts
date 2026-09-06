import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  bulkDeleteUsers,
  createUser,
  deleteUser,
  fetchRoleOptions,
  fetchUsers,
  toggleUserStatus,
  updateUser,
} from './users.api'

describe('users API', () => {
  it('fetches users list with query parameters', async () => {
    let capturedSearch: string | null = null
    let capturedRole: string | null = null

    mockServer.use(
      http.get('*/api/v1/users', ({ request }) => {
        const url = new URL(request.url)
        capturedSearch = url.searchParams.get('search')
        capturedRole = url.searchParams.get('role')

        return HttpResponse.json({
          status: 'success',
          message: 'Daftar pengguna berhasil diambil.',
          data: [
            {
              id: 1,
              name: 'Super Admin',
              email: 'superadmin@sysinfo.id',
              is_active: true,
              deactivated_at: null,
              roles: ['super_admin'],
              permissions: ['view_any_user'],
              created_at: '2026-01-01 00:00:00',
              updated_at: '2026-01-01 00:00:00',
            },
          ],
          meta: {
            current_page: 1,
            per_page: 10,
            from: 1,
            to: 1,
            total: 1,
            last_page: 1,
          },
          can: {
            create: true,
            update: true,
            delete: false,
            deleteAny: true,
          },
        })
      }),
    )

    const res = await fetchUsers({ search: 'admin', role: 'super_admin' })
    expect(capturedSearch).toBe('admin')
    expect(capturedRole).toBe('super_admin')
    expect(res.data).toHaveLength(1)
    expect(res.data[0]!.name).toBe('Super Admin')
    expect(res.can?.create).toBe(true)
  })

  it('fetches role options', async () => {
    mockServer.use(
      http.get('*/api/v1/roles/options', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar opsi role berhasil diambil.',
          data: [
            { value: 'super_admin', label: 'Super Admin' },
            { value: 'pimpinan', label: 'Pimpinan' },
          ],
        }),
      ),
    )

    const options = await fetchRoleOptions()
    expect(options).toHaveLength(2)
    expect(options[0]!.value).toBe('super_admin')
  })

  it('creates, updates, toggles status, and deletes user', async () => {
    mockServer.use(
      http.post('*/api/v1/users', async ({ request }) => {
        const body = (await request.json()) as { name: string; email: string }
        return HttpResponse.json(
          {
            status: 'success',
            message: 'Pengguna berhasil dibuat.',
            data: {
              id: 2,
              name: body.name,
              email: body.email,
              is_active: true,
              roles: ['data_contributor'],
            },
          },
          { status: 201 },
        )
      }),
      http.put('*/api/v1/users/2', async ({ request }) => {
        const body = (await request.json()) as { name: string }
        return HttpResponse.json({
          status: 'success',
          message: 'Pengguna berhasil diperbarui.',
          data: {
            id: 2,
            name: body.name,
            email: 'user@sysinfo.id',
            is_active: true,
            roles: ['data_contributor'],
          },
        })
      }),
      http.patch('*/api/v1/users/2/status', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Pengguna berhasil dinonaktifkan.',
          data: {
            id: 2,
            is_active: false,
            deactivated_at: '2026-09-06T00:00:00Z',
          },
        }),
      ),
      http.delete('*/api/v1/users/2', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Pengguna berhasil dihapus.',
        }),
      ),
      http.post('*/api/v1/users/bulk-delete', async ({ request }) => {
        const body = (await request.json()) as { ids: number[] }
        return HttpResponse.json({
          status: 'success',
          message: 'Pengguna berhasil dihapus.',
          data: { deleted_count: body.ids.length },
        })
      }),
    )

    const created = await createUser({
      name: 'Budi Appraiser',
      email: 'budi@sysinfo.id',
      password: 'password123',
      roles: ['data_contributor'],
      is_active: true,
    })
    expect(created.id).toBe(2)
    expect(created.name).toBe('Budi Appraiser')

    const updated = await updateUser(2, {
      name: 'Budi Hartono',
      email: 'budi@sysinfo.id',
      roles: ['data_contributor'],
      is_active: true,
    })
    expect(updated.name).toBe('Budi Hartono')

    const statusRes = await toggleUserStatus(2)
    expect(statusRes.is_active).toBe(false)

    await expect(deleteUser(2)).resolves.toBeUndefined()

    const bulkRes = await bulkDeleteUsers([3, 4])
    expect(bulkRes.deleted_count).toBe(2)
  })
})
