import createClient from 'openapi-fetch'

import { env } from '@/shared/config/env'

import { apiErrorFromResponse, apiErrorFromUnknown } from './error'
import type { paths } from './generated/schema'

const authenticatedFetch: typeof fetch = async (input, init) => {
  try {
    const response = await fetch(input, {
      ...init,
      credentials: 'include',
    })

    if (!response.ok) throw await apiErrorFromResponse(response)
    return response
  } catch (error) {
    throw apiErrorFromUnknown(error)
  }
}

export const apiClient = createClient<paths>({
  baseUrl: `${env.VITE_API_BASE_URL}/api/v1`,
  fetch: authenticatedFetch,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})
