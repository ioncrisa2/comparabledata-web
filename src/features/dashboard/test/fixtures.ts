import type { operations } from '../../../shared/api/generated/schema.js'

type ExtendedDashboard = Extract<
  operations['dashboard']['responses'][200]['content']['application/json']['data'],
  { monthly_data: unknown }
>

export function createDashboard(overrides: Partial<ExtendedDashboard> = {}): ExtendedDashboard {
  return {
    dashboard_variant: 'default',
    stats: { total: 120, this_month: 18, last_month: 12, with_coords: 95, province_count: 4 },
    can: { viewData: 'true' },
    can_widgets: {
      statsOverview: 'true',
      map: 'true',
      dataEntryTrendChart: 'true',
      listingCompositionChart: 'true',
      latestPembandingTable: 'true',
      topContributorTable: 'true',
      dataFreshnessWidget: 'true',
      topAreaActivityTable: 'true',
      objectTypeCountTable: 'true',
    },
    delete_request_alert: null,
    jenis_listing_options: [
      { value: 1, label: 'Penawaran' },
      { value: 2, label: 'Transaksi' },
    ],
    map_points: [
      {
        id: 42,
        alamat: 'Jl. Ir. H. Juanda, Bandung',
        latitude: -6.8915,
        longitude: 107.6107,
        tanggal: '2026-08-20',
        harga: 2500000000,
        jenis_listing_id: 1,
        jenis_listing: 'Penawaran',
        image_url: '',
      },
      {
        id: 43,
        alamat: 'Jl. Asia Afrika, Bandung',
        latitude: -6.9218,
        longitude: 107.6101,
        tanggal: '2026-08-21',
        harga: 1750000000,
        jenis_listing_id: 2,
        jenis_listing: 'Transaksi',
        image_url: '',
      },
      {
        id: 44,
        alamat: 'Jl. Setiabudi, Bandung',
        latitude: -6.8652,
        longitude: 107.5946,
        tanggal: null,
        harga: null,
        jenis_listing_id: 1,
        jenis_listing: 'Penawaran',
        image_url: '',
      },
    ],
    monthly_data: [
      { month: 'Sep 2025', count: 4 },
      { month: 'Okt 2025', count: 7 },
      { month: 'Nov 2025', count: 5 },
      { month: 'Des 2025', count: 9 },
      { month: 'Jan 2026', count: 8 },
      { month: 'Feb 2026', count: 11 },
      { month: 'Mar 2026', count: 6 },
      { month: 'Apr 2026', count: 14 },
      { month: 'Mei 2026', count: 10 },
      { month: 'Jun 2026', count: 16 },
      { month: 'Jul 2026', count: 12 },
      { month: 'Agu 2026', count: 18 },
    ],
    listing_ratio_monthly: {
      labels: ['Mar 2026', 'Apr 2026', 'Mei 2026', 'Jun 2026', 'Jul 2026', 'Agu 2026'],
      month_totals: [6, 14, 10, 16, 12, 18],
      series: [
        {
          id: 1,
          name: 'Penawaran',
          counts: [4, 8, 6, 10, 7, 12],
          ratios: [66.67, 57.14, 60, 62.5, 58.33, 66.67],
        },
        {
          id: 2,
          name: 'Transaksi',
          counts: [2, 6, 4, 6, 5, 6],
          ratios: [33.33, 42.86, 40, 37.5, 41.67, 33.33],
        },
      ],
    },
    recent_data: [
      {
        id: 42,
        alamat: 'Jl. Ir. H. Juanda, Bandung',
        harga: 2500000000,
        tanggal: '2026-08-20',
        created_at: '2026-08-26T08:00:00Z',
        image_url: '',
        jenis_listing: 'Penawaran',
        jenis_objek: 'Tanah dan bangunan',
      },
    ],
    top_contributors: [
      { name: 'Ayu Penilai', total_input: 42 },
      { name: 'Budi Santoso', total_input: 28 },
    ],
    data_freshness: {
      basis: 'Berdasarkan tanggal_data',
      total: 120,
      with_date: null,
      missing_date: 6,
      buckets: [
        { key: 'fresh_0_30', label: '0-30 hari', count: 24, percentage: 20, color: 'emerald' },
        { key: 'fresh_31_90', label: '31-90 hari', count: 60, percentage: 50, color: 'amber' },
        { key: 'stale_over_90', label: '> 90 hari', count: 30, percentage: 25, color: 'rose' },
      ],
    },
    top_area_activity: {
      period_label: '30 hari terakhir',
      total_input: 18,
      rows: [
        { district_id: '3273010', district_name: 'Coblong', total_input: 12, percentage: 66.67 },
      ],
    },
    object_type_counts: {
      total_records: 120,
      rows: [
        { id: 1, name: 'Tanah dan bangunan', total_input: 90, percentage: 75 },
        { id: 2, name: 'Tanah kosong', total_input: 30, percentage: 25 },
      ],
    },
    ...overrides,
  }
}

// Match Laravel's real boolean capability values at the HTTP boundary.
export function dashboardResponse(overrides: Partial<ExtendedDashboard> = {}) {
  const data = createDashboard(overrides)
  return {
    status: 'success',
    message: 'Data dashboard berhasil diambil.',
    data: {
      ...data,
      can: Object.fromEntries(
        Object.entries(data.can).map(([key, value]) => [key, value === 'true']),
      ),
      can_widgets: Object.fromEntries(
        Object.entries(data.can_widgets).map(([key, value]) => [key, value === 'true']),
      ),
    },
  }
}
