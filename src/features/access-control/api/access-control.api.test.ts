import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  createPermission,
  createRole,
  deletePermission,
  deleteRole,
  fetchPermissions,
  fetchRoles,
  updateRole,
} from './access-control.api'

describe('access-control API', () => {
  it('fetches roles and permissions', async () => {
    mockServer.use(
      http.get('*/api/v1/roles', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar role berhasil diambil.',
          data: [
            {
              id: 1,
              name: 'super_admin',
              guard_name: 'web',
              permissions_count: 50,
              users_count: 2,
              permissions: ['view_any_user', 'view_access_control'],
              is_locked: true,
            },
            {
              id: 2,
              name: 'pimpinan',
              guard_name: 'web',
              permissions_count: 10,
              users_count: 3,
              permissions: ['view_dashboard'],
              is_locked: false,
            },
          ],
        }),
      ),
      http.get('*/api/v1/permissions', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Daftar permission berhasil diambil.',
          data: [
            {
              id: 1,
              name: 'view_any_user',
              guard_name: 'web',
              group: 'User',
              roles_count: 1,
              users_count: 2,
              is_locked: false,
            },
          ],
        }),
      ),
    )

    const roles = await fetchRoles()
    expect(roles).toHaveLength(2)
    expect(roles[0]!.name).toBe('super_admin')
    expect(roles[0]!.is_locked).toBe(true)

    const permissions = await fetchPermissions()
    expect(permissions).toHaveLength(1)
    expect(permissions[0]!.name).toBe('view_any_user')
    expect(permissions[0]!.group).toBe('User')
  })

  it('creates, updates, and deletes role', async () => {
    mockServer.use(
      http.post('*/api/v1/roles', async ({ request }) => {
        const body = (await request.json()) as { name: string; permissions: string[] }
        return HttpResponse.json(
          {
            status: 'success',
            message: 'Role berhasil dibuat.',
            data: {
              id: 3,
              name: body.name,
              permissions: body.permissions,
            },
          },
          { status: 201 },
        )
      }),
      http.put('*/api/v1/roles/3', async ({ request }) => {
        const body = (await request.json()) as { name: string; permissions: string[] }
        return HttpResponse.json({
          status: 'success',
          message: 'Role berhasil diperbarui.',
          data: {
            id: 3,
            name: body.name,
            permissions: body.permissions,
          },
        })
      }),
      http.delete('*/api/v1/roles/3', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Role berhasil dihapus.',
        }),
      ),
    )

    const created = await createRole({
      name: 'operator_wilayah',
      permissions: ['view_geo_data', 'update_geo_data'],
    })
    expect(created.id).toBe(3)
    expect(created.name).toBe('operator_wilayah')

    const updated = await updateRole(3, {
      name: 'operator_wilayah',
      permissions: ['view_geo_data'],
    })
    expect(updated.permissions).toHaveLength(1)

    await expect(deleteRole(3)).resolves.toBeUndefined()
  })

  it('creates and deletes custom permission', async () => {
    mockServer.use(
      http.post('*/api/v1/permissions', async ({ request }) => {
        const body = (await request.json()) as { name: string }
        return HttpResponse.json(
          {
            status: 'success',
            message: 'Permission berhasil dibuat.',
            data: {
              id: 99,
              name: body.name,
              group: 'Custom',
            },
          },
          { status: 201 },
        )
      }),
      http.delete('*/api/v1/permissions/99', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Permission berhasil dihapus.',
        }),
      ),
    )

    const created = await createPermission({ name: 'custom_audit_view' })
    expect(created.id).toBe(99)
    expect(created.name).toBe('custom_audit_view')

    await expect(deletePermission(99)).resolves.toBeUndefined()
  })
})
