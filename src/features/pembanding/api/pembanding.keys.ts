import type { PembandingListFilters } from '../types/filters'

export const pembandingKeys = {
  all: ['pembandings'] as const,
  lists: () => [...pembandingKeys.all, 'list'] as const,
  list: (filters: PembandingListFilters) => [...pembandingKeys.lists(), filters] as const,
  details: () => [...pembandingKeys.all, 'detail'] as const,
  detail: (id: string) => [...pembandingKeys.details(), id] as const,
  options: () => [...pembandingKeys.all, 'form-options'] as const,
  creators: () => [...pembandingKeys.all, 'creators'] as const,
}
