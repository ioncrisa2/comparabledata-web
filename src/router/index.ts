import { createRouter, createWebHistory } from 'vue-router'

import { env } from '@/shared/config/env'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
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
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${env.VITE_APP_NAME}` : env.VITE_APP_NAME
})

export default router
