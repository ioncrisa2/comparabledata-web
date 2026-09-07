import { useQuery } from '@tanstack/vue-query'
import type { Ref } from 'vue'

import {
  type ActivityLogFilterParams,
  fetchActivityLogDetail,
  fetchActivityLogs,
} from '../api/activity-logs.api'

export const ACTIVITY_LOGS_QUERY_KEY = ['activity-logs'] as const

export function useActivityLogsQuery(filters: Ref<ActivityLogFilterParams>) {
  return useQuery({
    queryKey: [ACTIVITY_LOGS_QUERY_KEY, filters],
    queryFn: ({ signal }) => fetchActivityLogs(filters.value, signal),
  })
}

export function useActivityLogDetailQuery(id: Ref<number | string | null>) {
  return useQuery({
    queryKey: [ACTIVITY_LOGS_QUERY_KEY, 'detail', id],
    queryFn: ({ signal }) => {
      if (!id.value) throw new Error('ID log tidak valid')
      return fetchActivityLogDetail(id.value, signal)
    },
    enabled: () => Boolean(id.value),
  })
}

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /remember/i,
  /api_key/i,
  /credential/i,
]

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

export function sanitizeLogProperties(value: unknown): unknown {
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      return sanitizeLogProperties(parsed)
    } catch {
      return value
    }
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeLogProperties)
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        result[k] = '[DIRAHSIAKAN]'
      } else {
        result[k] = sanitizeLogProperties(v)
      }
    }
    return result
  }

  return value
}
