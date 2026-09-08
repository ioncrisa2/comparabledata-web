import { z } from 'zod'

import { createApiClient } from '@/shared/api/client'
import type { paths } from '@/shared/api/generated/integrations'

const apiClient = createApiClient<paths>()

export const scopeOptions = [
  { value: 'pembandings:read', label: 'Daftar dan detail pembanding' },
  { value: 'pembandings:similar', label: 'Pencarian pembanding serupa' },
  { value: 'locations:read', label: 'Referensi wilayah' },
  { value: 'dictionaries:read', label: 'Referensi kategori properti' },
] as const

export type IntegrationScope = (typeof scopeOptions)[number]['value']
const integrationSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_active: z.boolean(),
  requests_per_minute: z.number(),
})
const keySchema = z.object({
  id: z.number(),
  name: z.string(),
  prefix: z.string(),
  scopes: z.array(z.string()),
  expires_at: z.string(),
  revoked_at: z.string().nullable(),
  last_used_at: z.string().nullable(),
})
const detailSchema = integrationSchema.extend({ keys: z.array(keySchema) })
const listSchema = z.object({
  data: z.array(integrationSchema),
  meta: z.object({ current_page: z.number(), last_page: z.number(), total: z.number() }),
})
export type IntegrationItem = z.infer<typeof integrationSchema>
export type IntegrationKeyItem = z.infer<typeof keySchema>

export async function fetchIntegrations(page: number, signal?: AbortSignal) {
  const response = await apiClient.GET('/v1/integrations', {
    params: { query: { page, per_page: 25 } },
    signal,
  })
  return listSchema.parse(response.data)
}
export async function fetchIntegration(id: number, signal?: AbortSignal) {
  const response = await apiClient.GET('/v1/integrations/{integration}', {
    params: { path: { integration: id } },
    signal,
  })
  return z.object({ data: detailSchema }).parse(response.data).data
}
export async function saveIntegration(
  body: { name: string; requests_per_minute: number },
  id?: number,
) {
  const response = id
    ? await apiClient.PATCH('/v1/integrations/{integration}', {
        params: { path: { integration: id } },
        body,
      })
    : await apiClient.POST('/v1/integrations', { body })
  return z.object({ data: integrationSchema }).parse(response.data).data
}
export async function setIntegrationActive(id: number, is_active: boolean) {
  await apiClient.PATCH('/v1/integrations/{integration}', {
    params: { path: { integration: id } },
    body: { is_active },
  })
}
export async function issueIntegrationKey(
  id: number,
  body: { name: string; scopes: IntegrationScope[]; expires_at: string },
) {
  const response = await apiClient.POST('/v1/integrations/{integration}/keys', {
    params: { path: { integration: id } },
    body,
  })
  return z
    .object({ data: z.object({ plain_text_key: z.string(), key: keySchema }) })
    .parse(response.data).data
}
export async function revokeIntegrationKey(id: number, key: number) {
  await apiClient.DELETE('/v1/integrations/{integration}/keys/{key}', {
    params: { path: { integration: id, key: String(key) } },
  })
}
