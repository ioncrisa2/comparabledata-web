import { z } from 'zod'

// The published OpenAPI currently describes history.data as a string.
// Validate the actual API contract until the backend specification is regenerated.
export const pembandingHistorySchema = z.array(
  z.object({
    id: z.number(),
    event: z.string(),
    causer: z.string(),
    causer_email: z.string().nullable(),
    created_at: z.string().nullable(),
    changes: z.array(
      z.object({
        field: z.string(),
        old: z.json(),
        new: z.json(),
      }),
    ),
  }),
)

export type PembandingHistory = z.infer<typeof pembandingHistorySchema>
