import createClient from 'openapi-fetch'

import { env } from '@/shared/config/env'

import { csrfHeaders, initializeCsrf, readXsrfToken } from './csrf'
import { apiErrorFromResponse, apiErrorFromUnknown } from './error'
import type { paths } from './generated/schema'

let unauthorizedHandler: (() => void) | undefined

export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  unauthorizedHandler = handler
}

const authenticatedFetch: typeof fetch = async (input, init) => {
  let request: Request | undefined

  try {
    request = new Request(input, {
      ...init,
      credentials: 'include',
      headers: csrfHeaders(input, init),
    })
    let response = await fetch(request.clone())

    if (response.status === 419 && request.method !== 'GET' && request.method !== 'HEAD') {
      await initializeCsrf({ signal: request.signal })

      const retryHeaders = new Headers(request.headers)
      const refreshedToken = readXsrfToken()
      retryHeaders.delete('X-XSRF-TOKEN')
      if (refreshedToken) retryHeaders.set('X-XSRF-TOKEN', refreshedToken)

      response = await fetch(new Request(request, { headers: retryHeaders }))
    }

    if (!response.ok) {
      const error = await apiErrorFromResponse(response)
      if (error.status === 401) unauthorizedHandler?.()
      throw error
    }
    return response
  } catch (error) {
    if (request?.signal.aborted) {
      throw apiErrorFromUnknown(new DOMException('Permintaan dibatalkan.', 'AbortError'))
    }
    throw apiErrorFromUnknown(error)
  }
}

export const apiClient = createClient<paths>({
  baseUrl: `${env.VITE_API_BASE_URL}/api`,
  fetch: authenticatedFetch,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})
