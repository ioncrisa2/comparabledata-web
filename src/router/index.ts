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

export default router
