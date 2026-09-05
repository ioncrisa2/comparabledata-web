import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { components, operations } from '@/shared/api/generated/schema'

export type AuthUser = components['schemas']['UserResource']
export type LoginCredentials =
  operations['auth.sessionLogin']['requestBody']['content']['application/json']

function requireUser(data: AuthUser | undefined): AuthUser {
  if (data) return data

  throw new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: 'Server tidak mengembalikan data pengguna yang valid.',
  })
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.GET('/v1/auth/me')
  return requireUser(data?.data)
}

export async function loginSession(credentials: LoginCredentials): Promise<AuthUser> {
  const { data } = await apiClient.POST('/v1/auth/session', { body: credentials })
  return requireUser(data?.data)
}

export async function logoutSession(): Promise<void> {
  await apiClient.DELETE('/v1/auth/session')
}
