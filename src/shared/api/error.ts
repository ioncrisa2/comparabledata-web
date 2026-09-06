type ErrorPayload = {
  code?: unknown
  message?: unknown
  errors?: unknown
  request_id?: unknown
  duplicate?: unknown
}

export type ApiErrorInit = {
  status: number | null
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
  retryAfterSeconds?: number
  duplicate?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number | null
  readonly code: string
  readonly fieldErrors: Record<string, string[]>
  readonly requestId?: string
  readonly retryAfterSeconds?: number
  readonly duplicate?: Record<string, unknown>

  constructor(init: ApiErrorInit) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.fieldErrors = init.fieldErrors ?? {}
    this.requestId = init.requestId
    this.retryAfterSeconds = init.retryAfterSeconds
    this.duplicate = init.duplicate
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function normalizeFieldErrors(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([field, messages]) => {
      if (!Array.isArray(messages)) return []

      const normalizedMessages = messages.filter(
        (message): message is string => typeof message === 'string',
      )

      return normalizedMessages.length > 0 ? [[field, normalizedMessages]] : []
    }),
  )
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  const seconds = Number.parseInt(value, 10)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined
}

async function readErrorPayload(response: Response): Promise<ErrorPayload> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return {}

  try {
    const payload: unknown = await response.clone().json()
    return payload && typeof payload === 'object' ? payload : {}
  } catch {
    return {}
  }
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  const payload = await readErrorPayload(response)
  const requestIdHeader = response.headers.get('x-request-id')

  return new ApiError({
    status: response.status,
    code: typeof payload.code === 'string' ? payload.code : `HTTP_${response.status}`,
    message:
      typeof payload.message === 'string' && payload.message.trim().length > 0
        ? payload.message
        : 'Permintaan ke server tidak dapat diselesaikan.',
    fieldErrors: normalizeFieldErrors(payload.errors),
    requestId:
      typeof payload.request_id === 'string' ? payload.request_id : (requestIdHeader ?? undefined),
    retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')),
    duplicate:
      payload.duplicate && typeof payload.duplicate === 'object'
        ? (payload.duplicate as Record<string, unknown>)
        : undefined,
  })
}

export function apiErrorFromUnknown(error: unknown): ApiError {
  if (isApiError(error)) return error

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError({
      status: null,
      code: 'REQUEST_ABORTED',
      message: 'Permintaan dibatalkan.',
    })
  }

  return new ApiError({
    status: null,
    code: 'NETWORK_ERROR',
    message: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
  })
}
