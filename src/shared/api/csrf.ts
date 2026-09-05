import { env } from '@/shared/config/env'

import { apiErrorFromResponse, apiErrorFromUnknown } from './error'

const STATE_CHANGING_METHODS = new Set(['DELETE', 'PATCH', 'POST', 'PUT'])

export function readXsrfToken(cookie = typeof document === 'undefined' ? '' : document.cookie) {
  const encodedToken = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('XSRF-TOKEN='))
    ?.slice('XSRF-TOKEN='.length)

  if (!encodedToken) return undefined

  try {
    return decodeURIComponent(encodedToken)
  } catch {
    return encodedToken
  }
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method.toUpperCase()
  return input instanceof Request ? input.method.toUpperCase() : 'GET'
}

export function csrfHeaders(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined)

  new Headers(init?.headers).forEach((value, key) => headers.set(key, value))

  if (STATE_CHANGING_METHODS.has(requestMethod(input, init)) && !headers.has('X-XSRF-TOKEN')) {
    const token = readXsrfToken()
    if (token) headers.set('X-XSRF-TOKEN', token)
  }

  return headers
}

export async function initializeCsrf(
  options: { baseUrl?: string; signal?: AbortSignal } = {},
): Promise<void> {
  try {
    const response = await fetch(
      `${(options.baseUrl ?? env.VITE_API_BASE_URL).replace(/\/$/, '')}/sanctum/csrf-cookie`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: options.signal,
      },
    )

    if (!response.ok) throw await apiErrorFromResponse(response)
  } catch (error) {
    throw apiErrorFromUnknown(error)
  }
}
