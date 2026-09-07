import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { useAuthStore } from '@/features/auth'
import { mockServer } from '@/test/mocks/server'

import { useUpdateRoleMutation } from './useAccessControl'

const user = {
  id: 1,
  name: 'Admin Test',
  email: 'admin@example.test',
  roles: ['access_editor'],
  permissions: ['view_access_control', 'update_role', 'create_role'],
  created_at: null,
  updated_at: null,
}

function setup() {
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.user = user
  auth.initialized = true
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let mutation!: ReturnType<typeof useUpdateRoleMutation>
  const wrapper = mount(
    defineComponent({
      setup() {
        mutation = useUpdateRoleMutation()
        return () => null
      },
    }),
    {
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
    },
  )
  return { auth, mutation, queryClient, wrapper }
}

describe('useUpdateRoleMutation', () => {
  it.each(['access_editor', 'renamed_editor'])(
    'reloads effective access after saving role %s',
    async (name) => {
      const refreshedUser = {
        ...user,
        roles: [name],
        permissions: ['view_access_control', 'update_role', 'view_dashboard'],
      }
      const requests: string[] = []
      mockServer.use(
        http.put('*/api/v1/roles/3', () => {
          requests.push('save')
          return HttpResponse.json({
            data: { id: 3, name, permissions: refreshedUser.permissions },
          })
        }),
        http.get('*/api/v1/auth/me', () => {
          requests.push('refresh')
          return HttpResponse.json({ data: refreshedUser })
        }),
      )
      const { auth, mutation, queryClient, wrapper } = setup()
      const keys = ['roles', 'role-options', 'permissions', 'users', 'dashboard']
      for (const key of keys) queryClient.setQueryData([key], [])

      try {
        await mutation.mutateAsync({
          id: 3,
          payload: { name, permissions: refreshedUser.permissions },
        })

        expect(requests).toEqual(['save', 'refresh'])
        expect(auth.roles).toEqual([name])
        expect(auth.can('create_role')).toBe(false)
        expect(auth.can('view_dashboard')).toBe(true)
        for (const key of keys) expect(queryClient.getQueryState([key])?.isInvalidated).toBe(true)
      } finally {
        wrapper.unmount()
        queryClient.clear()
      }
    },
  )

  it('keeps current access when saving the role fails', async () => {
    mockServer.use(
      http.put('*/api/v1/roles/3', () =>
        HttpResponse.json({ message: 'Nama role sudah dipakai.' }, { status: 422 }),
      ),
    )
    const { auth, mutation, queryClient, wrapper } = setup()
    try {
      await expect(
        mutation.mutateAsync({ id: 3, payload: { name: 'duplicate' } }),
      ).rejects.toMatchObject({ status: 422 })
      expect(auth.user).toEqual(user)
    } finally {
      wrapper.unmount()
      queryClient.clear()
    }
  })
})
