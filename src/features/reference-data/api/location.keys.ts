export type LocationQueryParams = Record<string, string | number | null | undefined>

export const locationKeys = {
  all: ['locations'] as const,
  provinces: (params: LocationQueryParams) => [...locationKeys.all, 'provinces', params] as const,
  regencies: (params: LocationQueryParams) => [...locationKeys.all, 'regencies', params] as const,
  districts: (params: LocationQueryParams) => [...locationKeys.all, 'districts', params] as const,
  villages: (params: LocationQueryParams) => [...locationKeys.all, 'villages', params] as const,
}
