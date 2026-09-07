import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export type SystemMode = 'live' | 'maintenance' | 'off'

export interface SystemSettings {
  system_mode: SystemMode
  app_version: string
  primary_color: string
  company_name: string
  support_email: string
  app_logo?: string | null
  app_logo_url?: string | null
  [key: string]: unknown
}

export interface SettingsData {
  settings: SystemSettings
  can: Record<string, string | boolean>
}

export interface PublicSettings {
  app_name?: string
  company_name?: string
  support_email?: string
  app_version?: string
  app_logo?: string | null
  primary_color?: string
  [key: string]: unknown
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function asNullableString(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

function invalidResponse(action: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_RESPONSE',
    message: `Format data ${action} dari server tidak sesuai.`,
  })
}

export async function fetchSettings(signal?: AbortSignal): Promise<SettingsData> {
  const { data } = await apiClient.GET('/v1/settings', { signal })

  if (data && data.data && data.data.settings) {
    const raw = data.data.settings as Record<string, unknown>
    return {
      settings: {
        system_mode: (raw.system_mode as SystemMode) || 'live',
        app_version: asString(raw.app_version, '1.0.0'),
        primary_color: asString(raw.primary_color, '#2563eb'),
        company_name: asString(raw.company_name, 'HJAR Valuasi'),
        support_email: asString(raw.support_email, 'support@hjar.id'),
        app_logo: asNullableString(raw.app_logo),
        app_logo_url: asNullableString(raw.app_logo_url) ?? asNullableString(raw.app_logo),
        ...raw,
      },
      can: data.data.can || {},
    }
  }

  throw invalidResponse('pengaturan sistem')
}

export async function updateSettings(
  payload: FormData | Record<string, unknown>,
): Promise<{ message: string; settings: SystemSettings }> {
  let body: FormData

  if (payload instanceof FormData) {
    body = payload
  } else {
    body = new FormData()
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        if (val instanceof File) {
          body.append(key, val)
        } else if (typeof val === 'string') {
          body.append(key, val)
        } else if (typeof val === 'number' || typeof val === 'boolean') {
          body.append(key, String(val))
        } else {
          body.append(key, JSON.stringify(val))
        }
      }
    })
  }

  const { data } = await apiClient.POST('/v1/settings', {
    body: body as never,
    bodySerializer: (b) => b,
    headers: { 'Content-Type': undefined },
  })

  if (data && data.status === 'success') {
    return {
      message: data.message || 'Pengaturan berhasil diperbarui.',
      settings: (data.data as unknown as SystemSettings) || {},
    }
  }

  throw invalidResponse('pembaruan pengaturan')
}

export async function clearAppCache(): Promise<{ message: string }> {
  const { data } = await apiClient.POST('/v1/settings/clear-cache')

  if (data && data.status === 'success') {
    return {
      message: data.message || 'Semua cache berhasil dibersihkan.',
    }
  }

  throw invalidResponse('pembersihan cache')
}

export async function fetchPublicSettings(signal?: AbortSignal): Promise<PublicSettings> {
  const { data } = await apiClient.GET('/v1/settings/public', { signal })

  if (data && data.data) {
    return data.data as PublicSettings
  }

  throw invalidResponse('pengaturan publik')
}
