import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { components, operations } from '@/shared/api/generated/schema'

export type AuthUser = components['schemas']['UserResource']
export type UpdateProfilePayload =
  operations['auth.updateProfile_0']['requestBody']['content']['application/json']
export type UpdatePasswordPayload =
  operations['auth.updatePassword_0']['requestBody']['content']['application/json']

export interface UpdateProfileResponse {
  status: 'success'
  message: string
  data: AuthUser
}

export interface UpdatePasswordResponse {
  status: 'success'
  message: string
}

function invalidResponse(action: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Respon server tidak valid saat ${action}.`,
  })
}

export async function updateProfile(
  payload: UpdateProfilePayload,
  options: { signal?: AbortSignal } = {},
): Promise<AuthUser> {
  const response = await apiClient.PUT('/v1/auth/profile', {
    body: payload,
    signal: options.signal,
  })

  if (response.error || !response.data?.data) {
    throw invalidResponse('memperbarui data profil')
  }

  return response.data.data
}

export async function updatePassword(
  payload: UpdatePasswordPayload,
  options: { signal?: AbortSignal } = {},
): Promise<UpdatePasswordResponse> {
  const response = await apiClient.PUT('/v1/auth/profile/password', {
    body: payload,
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse('memperbarui kata sandi')
  }

  return response.data
}
