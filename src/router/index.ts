import { createRouter, createWebHistory } from 'vue-router'

import { pinia } from '@/app/providers/installPinia'
import { useAuthStore } from '@/features/auth'
import { env } from '@/shared/config/env'

import { safeRedirectPath } from './redirect'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/features/dashboard/pages/DashboardPage.vue'),
      meta: {
        title: 'Dashboard',
        layout: 'app',
        requiresAuth: true,
        breadcrumb: 'Dashboard',
      },
    },
    {
      path: '/login',
      name: 'auth.login',
      component: () => import('@/features/auth/pages/LoginPage.vue'),
      meta: {
        title: 'Masuk',
        layout: 'auth',
        requiresAuth: false,
        guestOnly: true,
      },
    },
    {
      path: '/pembandings',
      name: 'pembanding.list',
      component: () => import('@/features/pembanding/pages/PembandingListPage.vue'),
      meta: {
        title: 'Data pembanding',
        layout: 'app',
        requiresAuth: true,
        breadcrumb: 'Data pembanding',
      },
    },
    {
      path: '/pembandings/new',
      name: 'pembanding.create',
      component: () => import('@/features/pembanding/pages/PembandingCreatePage.vue'),
      meta: {
        title: 'Tambah data pembanding',
        layout: 'app',
        requiresAuth: true,
        permissions: ['create_data::pembanding'],
        breadcrumb: 'Tambah pembanding',
      },
    },
    {
      path: '/pembandings/submissions/:submissionId',
      name: 'pembanding.duplicate-review',
      component: () => import('@/features/pembanding/pages/PembandingDuplicateReviewPage.vue'),
      meta: {
        title: 'Tinjau duplikat pembanding',
        layout: 'app',
        requiresAuth: true,
        breadcrumb: 'Tinjau duplikat',
      },
    },
    {
      path: '/pembandings/:id',
      name: 'pembanding.detail',
      component: () => import('@/features/pembanding/pages/PembandingDetailPage.vue'),
      meta: {
        title: 'Detail pembanding',
        layout: 'app',
        requiresAuth: true,
        breadcrumb: 'Detail pembanding',
      },
    },
    {
      path: '/pembandings/:id/edit',
      name: 'pembanding.edit',
      component: () => import('@/features/pembanding/pages/PembandingEditPage.vue'),
      meta: {
        title: 'Edit data pembanding',
        layout: 'app',
        requiresAuth: true,
        breadcrumb: 'Edit pembanding',
      },
    },
    {
      path: '/moderation',
      name: 'moderation.index',
      component: () => import('@/features/moderation/pages/ModerationPage.vue'),
      meta: {
        title: 'Moderasi data',
        layout: 'app',
        requiresAuth: true,
        permissions: ['approve_delete_request', 'reject_delete_request', 'view_moderation'],
        permissionMode: 'any',
        breadcrumb: 'Moderasi data',
      },
    },
    {
      path: '/master-data',
      name: 'master-data.index',
      component: () => import('@/features/master-data/pages/MasterDataPage.vue'),
      meta: {
        title: 'Manajemen Master Data',
        layout: 'app',
        requiresAuth: true,
        permissions: ['view_master_data', 'create_master_data', 'update_master_data'],
        permissionMode: 'any',
        breadcrumb: 'Master Data',
      },
    },
    {
      path: '/wilayah',
      name: 'wilayah.index',
      component: () => import('@/features/wilayah/pages/WilayahPage.vue'),
      meta: {
        title: 'Manajemen Wilayah',
        layout: 'app',
        requiresAuth: true,
        permissions: ['view_geo_data', 'create_geo_data', 'update_geo_data'],
        permissionMode: 'any',
        breadcrumb: 'Wilayah',
      },
    },
    {
      path: '/users',
      name: 'user.index',
      component: () => import('@/features/users/pages/UsersPage.vue'),
      meta: {
        title: 'Manajemen Pengguna',
        layout: 'app',
        requiresAuth: true,
        permissions: ['view_any_user', 'create_user', 'update_user'],
        permissionMode: 'any',
        breadcrumb: 'Pengguna',
      },
    },
    {
      path: '/access-control',
      name: 'access-control.index',
      component: () => import('@/features/access-control/pages/AccessControlPage.vue'),
      meta: {
        title: 'Manajemen Hak Akses',
        layout: 'app',
        requiresAuth: true,
        permissions: ['view_access_control', 'create_role', 'update_role'],
        permissionMode: 'any',
        breadcrumb: 'Hak Akses',
      },
    },
    {
      path: '/contributor-invitations',
      name: 'contributor-invitation.index',
      component: () =>
        import('@/features/contributor-invitations/pages/ContributorInvitationsPage.vue'),
      meta: {
        title: 'Undangan & Registrasi Kontributor',
        layout: 'app',
        requiresAuth: true,
        permissions: ['manage_data_contributor_invitations', 'view_any_user'],
        permissionMode: 'any',
        breadcrumb: 'Undangan Kontributor',
      },
    },
    {
      path: '/register-contributor/:token',
      name: 'contributor.register',
      component: () =>
        import('@/features/contributor-invitations/pages/PublicContributorRegistrationPage.vue'),
      meta: {
        title: 'Registrasi Kontributor Data',
        layout: 'auth',
        requiresAuth: false,
        breadcrumb: 'Registrasi Kontributor',
      },
    },
    {
      path: '/imports',
      name: 'import.index',
      component: () => import('@/features/bulk-import/pages/ImportBatchesPage.vue'),
      meta: {
        title: 'Impor Data Pembanding',
        layout: 'app',
        requiresAuth: true,
        permissions: [
          'create_data::pembanding',
          'update_data::pembanding',
          'view_any_data::pembanding',
        ],
        permissionMode: 'any',
        breadcrumb: 'Impor Data',
      },
    },
    {
      path: '/imports/:id',
      name: 'import.detail',
      component: () => import('@/features/bulk-import/pages/ImportBatchDetailPage.vue'),
      meta: {
        title: 'Detail Batch Impor',
        layout: 'app',
        requiresAuth: true,
        permissions: [
          'create_data::pembanding',
          'update_data::pembanding',
          'view_any_data::pembanding',
        ],
        permissionMode: 'any',
        breadcrumb: 'Detail Impor',
      },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/features/search/pages/SearchPage.vue'),
      meta: {
        title: 'Pencarian Global',
        layout: 'app',
        requiresAuth: true,
        permissions: ['view_search'],
        breadcrumb: 'Pencarian',
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/features/settings/pages/SettingsPage.vue'),
      meta: {
        title: 'Pengaturan Sistem',
        layout: 'app',
        requiresAuth: true,
        permissions: ['view_settings', 'update_settings'],
        permissionMode: 'any',
        breadcrumb: 'Pengaturan Sistem',
      },
    },
    {
      path: '/activity-logs',
      name: 'activity-log.index',
      component: () => import('@/features/activity-logs/pages/ActivityLogsPage.vue'),
      meta: {
        title: 'Log Aktivitas Sistem',
        layout: 'app',
        requiresAuth: true,
        permissions: ['view_activity_log', 'view_activity_logs', 'view_audit_trail'],
        permissionMode: 'any',
        breadcrumb: 'Log Aktivitas',
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/features/profile/pages/ProfilePage.vue'),
      meta: {
        title: 'Profil Pengguna',
        layout: 'app',
        requiresAuth: true,
        breadcrumb: 'Profil Pengguna',
      },
    },
    {
      path: '/notifications',
      name: 'notifications.index',
      component: () => import('@/features/notifications/pages/NotificationsPage.vue'),
      meta: {
        title: 'Pusat Notifikasi',
        layout: 'app',
        requiresAuth: true,
        breadcrumb: 'Notifikasi',
      },
    },
    {
      path: '/backup',
      name: 'backup.index',
      component: () => import('@/features/backup/pages/BackupPage.vue'),
      meta: {
        title: 'Cadangan & Pemulihan',
        layout: 'app',
        requiresAuth: true,
        permissions: ['view_backup'],
        breadcrumb: 'Cadangan & Pemulihan',
      },
    },
    {
      path: '/__foundation',
      name: 'foundation',
      component: () => import('@/features/foundation/pages/FoundationPage.vue'),
      meta: {
        title: 'Fondasi aplikasi',
        layout: 'public',
        requiresAuth: false,
        breadcrumb: 'Fondasi aplikasi',
      },
    },
    {
      path: '/__design-system',
      name: 'design-system',
      component: () => import('@/features/design-system/pages/DesignSystemPage.vue'),
      meta: {
        title: 'Design system',
        layout: 'public',
        requiresAuth: false,
        breadcrumb: 'Design system',
      },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/features/system/pages/ForbiddenPage.vue'),
      meta: {
        title: 'Akses ditolak',
        layout: 'public',
        requiresAuth: false,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/features/system/pages/NotFoundPage.vue'),
      meta: {
        title: 'Halaman tidak ditemukan',
        layout: 'public',
        requiresAuth: false,
      },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)

  if ((to.meta.requiresAuth || to.meta.guestOnly) && !auth.initialized) {
    await auth.initialize()
  }

  if (to.meta.requiresAuth && !auth.authenticated) {
    return {
      name: 'auth.login',
      query: { redirect: safeRedirectPath(to.fullPath) },
    }
  }

  if (to.meta.guestOnly && auth.authenticated) {
    return safeRedirectPath(to.query.redirect) ?? { name: 'dashboard' }
  }

  const requiredPermissions = to.meta.permissions ?? []
  if (requiredPermissions.length > 0) {
    if (auth.roles.includes('super_admin')) {
      return true
    }

    const allowed =
      to.meta.permissionMode === 'any'
        ? auth.canAny(requiredPermissions)
        : requiredPermissions.every(auth.can)

    if (!allowed) return { name: 'forbidden' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${env.VITE_APP_NAME}` : env.VITE_APP_NAME
})

export * from './routes'
export default router
