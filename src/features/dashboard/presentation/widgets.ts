import type { DashboardData } from '../api/dashboard.api'

export type ExtendedDashboard = Extract<DashboardData, { monthly_data: unknown }>
export type DashboardPoint = DashboardData['map_points'][number]
export type DashboardWidget =
  | 'statsOverview'
  | 'map'
  | 'dataEntryTrendChart'
  | 'listingCompositionChart'
  | 'latestPembandingTable'
  | 'topContributorTable'
  | 'dataFreshnessWidget'
  | 'topAreaActivityTable'
  | 'objectTypeCountTable'

// The generated schema currently describes capability values as strings,
// while Laravel AppAccess::capabilityMap returns booleans. Never use truthiness.
export function capabilityGranted(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1'
}

export function widgetAllowed(data: DashboardData, widget: DashboardWidget): boolean {
  return capabilityGranted(data.can_widgets?.[widget])
}

export function validMapPoints(points: DashboardPoint[]): DashboardPoint[] {
  return points.filter(
    ({ latitude, longitude }) =>
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180,
  )
}
