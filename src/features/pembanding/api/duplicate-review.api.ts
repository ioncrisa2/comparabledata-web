import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { operations } from '@/shared/api/generated/schema'

export type DuplicateReviewData =
  operations['pembandingDuplicateReview.show']['responses'][200]['content']['application/json']['data']

function invalidResponse(resource: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: `Server tidak mengembalikan ${resource} yang valid.`,
  })
}

export async function fetchDuplicateReview(
  submissionId: string,
  signal?: AbortSignal,
): Promise<DuplicateReviewData> {
  const { data } = await apiClient.GET('/v1/pembanding-submissions/{submission}', {
    params: { path: { submission: submissionId } },
    signal,
  })
  if (data?.data) return data.data
  throw invalidResponse('data review duplikat')
}

export type ResolveStrategy = 'use_existing' | 'replace_existing'

export async function resolveDuplicateReview(
  submissionId: string,
  strategy: ResolveStrategy,
  candidateId: number,
): Promise<void> {
  await apiClient.POST('/v1/pembanding-submissions/{submission}/resolution', {
    params: { path: { submission: submissionId } },
    body: { strategy, candidate_id: candidateId },
  })
}
