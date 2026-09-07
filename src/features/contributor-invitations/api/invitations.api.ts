import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export interface InvitationItem {
  id: number
  token_fingerprint: string
  status: string
  expires_at: string | null
  used_at: string | null
  created_at: string | null
  created_by: string
  request: {
    display_name: string
    generated_email: string
    status: string
    submitted_at: string | null
  } | null
}

export interface InvitationListMeta {
  current_page: number
  per_page: number
  from: number | null
  to: number | null
  total: number
  last_page: number
}

export interface InvitationListResponse {
  status: 'success'
  message: string
  data: InvitationItem[]
  meta: InvitationListMeta
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export interface CreatedInvitationData {
  id: number
  raw_token: string
  registration_url: string
  expires_at: string | null
}

export interface RegistrationRequestItem {
  id: number
  display_name: string
  generated_email: string
  phone: string
  status: string
  submitted_at: string | null
  generated_by: string
  accepted_at: string | null
  accepted_by: string
  rejected_at: string | null
  rejected_by: string
  reject_reason: string | null
}

export interface RegistrationRequestListResponse {
  status: 'success'
  message: string
  data: RegistrationRequestItem[]
  meta: InvitationListMeta
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export interface TokenVerificationData {
  is_valid: boolean
  valid?: boolean
  expires_at?: string | null
  message?: string
}

export interface SubmitRegistrationPayload {
  display_name: string
  phone: string
  password: string
  password_confirmation: string
}

export interface SubmitRegistrationData {
  generated_email: string
  message: string
}

function invalidResponse(action: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Respon server tidak valid saat ${action}.`,
  })
}

export async function fetchInvitations(
  options: { signal?: AbortSignal } = {},
): Promise<InvitationListResponse> {
  const response = await apiClient.GET('/v1/data-contributor-invitations', {
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse('mengambil daftar token undangan')
  }

  return response.data
}

export async function createInvitation(
  options: { signal?: AbortSignal } = {},
): Promise<CreatedInvitationData> {
  const response = await apiClient.POST('/v1/data-contributor-invitations', {
    signal: options.signal,
  })

  if (response.error || !response.data?.data) {
    throw invalidResponse('membuat token undangan baru')
  }

  return response.data.data
}

export async function revokeInvitation(
  inviteId: number,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.DELETE('/v1/data-contributor-invitations/{invite}', {
    params: {
      path: { invite: inviteId },
    },
    signal: options.signal,
  })

  if (response.error) {
    throw invalidResponse('mencabut token undangan')
  }
}

export async function fetchRegistrationRequests(
  options: { signal?: AbortSignal } = {},
): Promise<RegistrationRequestListResponse> {
  const response = await apiClient.GET('/v1/data-contributor-registration-requests', {
    signal: options.signal,
  })

  if (response.error || !response.data) {
    throw invalidResponse('mengambil daftar pengajuan registrasi kontributor')
  }

  return response.data
}

export async function acceptRegistrationRequest(
  requestId: number,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.POST(
    '/v1/data-contributor-registration-requests/{registrationRequest}/accept',
    {
      params: {
        path: { registrationRequest: requestId },
      },
      signal: options.signal,
    },
  )

  if (response.error) {
    throw invalidResponse('menyetujui permohonan registrasi kontributor')
  }
}

export async function rejectRegistrationRequest(
  requestId: number,
  payload: { reject_reason?: string | null },
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const response = await apiClient.POST(
    '/v1/data-contributor-registration-requests/{registrationRequest}/reject',
    {
      params: {
        path: { registrationRequest: requestId },
      },
      body: payload,
      signal: options.signal,
    },
  )

  if (response.error) {
    throw invalidResponse('menolak permohonan registrasi kontributor')
  }
}

export async function verifyRegistrationToken(
  token: string,
  options: { signal?: AbortSignal } = {},
): Promise<TokenVerificationData> {
  const response = await apiClient.GET('/v1/public/data-contributor-registration/{token}', {
    params: {
      path: { token },
    },
    signal: options.signal,
  })

  if (response.error || !response.data?.data) {
    throw invalidResponse('memverifikasi token pendaftaran')
  }

  return response.data.data
}

export async function submitRegistration(
  token: string,
  payload: SubmitRegistrationPayload,
  options: { signal?: AbortSignal } = {},
): Promise<SubmitRegistrationData> {
  const response = await apiClient.POST('/v1/public/data-contributor-registration/{token}', {
    params: {
      path: { token },
    },
    body: payload,
    signal: options.signal,
  })

  if (response.error || !response.data?.data) {
    throw invalidResponse('mengirim formulir pendaftaran')
  }

  return response.data.data
}
