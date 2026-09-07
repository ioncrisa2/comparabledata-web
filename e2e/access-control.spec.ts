import { expect, test } from '@playwright/test'

test('editing and renaming the current role refreshes menu and action permissions', async ({
  page,
}) => {
  let saved = false
  let authRequests = 0
  const initialPermissions = ['view_access_control', 'update_role', 'create_role', 'view_any_user']
  const updatedPermissions = ['view_access_control', 'update_role']
  const role = () => ({
    id: 3,
    name: saved ? 'renamed_editor' : 'access_editor',
    guard_name: 'web',
    permissions: saved ? updatedPermissions : initialPermissions,
    permissions_count: saved ? 2 : 4,
    users_count: 1,
    is_locked: false,
  })
  await page.route('**/api/v1/auth/me', (route) => {
    authRequests++
    return route.fulfill({
      json: {
        data: {
          id: 1,
          name: 'Admin Test',
          email: 'admin@example.test',
          roles: [role().name],
          permissions: role().permissions,
        },
      },
    })
  })
  await page.route('**/api/v1/roles', (route) => route.fulfill({ json: { data: [role()] } }))
  await page.route('**/api/v1/permissions', (route) =>
    route.fulfill({
      json: {
        data: initialPermissions.map((name, index) => ({
          id: index + 1,
          name,
          guard_name: 'web',
          group: 'Hak Akses',
          roles_count: 1,
          users_count: 0,
          is_locked: false,
        })),
      },
    }),
  )
  await page.route('**/api/v1/roles/3', async (route) => {
    expect(route.request().method()).toBe('PUT')
    expect(route.request().postDataJSON()).toEqual({
      name: 'renamed_editor',
      permissions: updatedPermissions,
    })
    saved = true
    await route.fulfill({ json: { data: role() } })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/access-control?tab=roles')
  await expect(page.getByRole('link', { name: 'Pengguna', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tambah Role', exact: true })).toBeVisible()
  await page.getByTestId('role-edit-btn').click()
  const dialog = page.getByRole('dialog')
  await dialog.getByTestId('role-form-name').fill('renamed_editor')
  await dialog.getByRole('checkbox', { name: 'create_role', exact: true }).uncheck()
  await dialog.getByRole('checkbox', { name: 'view_any_user', exact: true }).uncheck()
  await dialog.getByTestId('role-form-submit').click()

  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Pengguna', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Tambah Role', exact: true })).toHaveCount(0)
  await expect(page.getByTestId('role-edit-btn')).toBeVisible()
  await expect(page.locator('.access-control-page__role-name')).toHaveText('renamed_editor')
  expect(authRequests).toBe(2)
})

const permissions = Array.from({ length: 270 }, (_, index) => ({
  id: index + 1,
  name: `view_permission_${String(index).padStart(3, '0')}`,
  guard_name: 'web',
  group: `Grup ${String(Math.floor(index / 9)).padStart(2, '0')}`,
  roles_count: 0,
  users_count: 0,
  is_locked: false,
}))

for (const width of [1440, 360]) {
  test(`role permission groups remain readable and scrollable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            name: 'Admin Test',
            email: 'admin@example.test',
            roles: ['super_admin'],
            permissions: ['view_access_control', 'create_role'],
          },
        },
      }),
    )
    await page.route('**/api/v1/roles', (route) => route.fulfill({ json: { data: [] } }))
    await page.route('**/api/v1/permissions', (route) =>
      route.fulfill({ json: { data: permissions } }),
    )
    await page.goto('/access-control?tab=roles')
    await page.getByRole('button', { name: 'Tambah Role', exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Tambah Role Baru' })).toBeVisible()
    const groups = dialog.locator('.role-dialog__group-card')
    const list = dialog.locator('.role-dialog__groups-container')
    await expect(groups).toHaveCount(30)
    // Visibility alone misses the original bug: overflow:hidden clipped flex-shrunk cards.
    expect(
      await groups.evaluateAll((cards) =>
        cards.every((card) => card.clientHeight >= card.scrollHeight - 1),
      ),
    ).toBe(true)
    expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
    expect(
      await dialog.evaluate((element) =>
        [element, ...element.querySelectorAll('.role-dialog__perms-grid')].every(
          (node) => node.scrollWidth <= node.clientWidth + 1,
        ),
      ),
    ).toBe(true)

    const lastPermission = dialog.getByRole('checkbox', { name: 'view_permission_269' })
    await lastPermission.check()
    await expect(lastPermission).toBeChecked()
    expect(await list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)

    await dialog.getByPlaceholder('Saring nama izin akses atau grup...').fill('Grup 29')
    await expect(groups).toHaveCount(1)
    await expect(lastPermission).toBeChecked()
    await groups.getByRole('button', { name: 'Pilih Semua', exact: true }).click()
    await expect(dialog.getByRole('checkbox', { checked: true })).toHaveCount(9)

    await dialog.getByPlaceholder('Saring nama izin akses atau grup...').clear()
    await expect(groups).toHaveCount(30)
    await list.evaluate((element) => {
      element.scrollTop = 0
    })
    await page.screenshot({ path: testInfo.outputPath(`role-dialog-${width}.png`) })
  })
}
