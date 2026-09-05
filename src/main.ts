import '@fontsource-variable/instrument-sans'
import 'primeicons/primeicons.css'
import '@/styles/index.css'

import { type Component, createApp } from 'vue'

import App from '@/app/App.vue'
import { installPinia, pinia } from '@/app/providers/installPinia'
import { installPrimeVue } from '@/app/providers/installPrimeVue'
import { installQueryClient } from '@/app/providers/installQueryClient'
import { useAuthStore } from '@/features/auth'
import router from '@/router'
import { safeRedirectPath } from '@/router/redirect'
import { setUnauthorizedHandler } from '@/shared/api/client'

const app = createApp(App as Component)

installPinia(app)
installQueryClient(app)
installPrimeVue(app)

const auth = useAuthStore(pinia)
setUnauthorizedHandler(() => {
  auth.clearSession()

  const currentRoute = router.currentRoute.value
  if (currentRoute.meta.requiresAuth) {
    void router.replace({
      name: 'auth.login',
      query: { redirect: safeRedirectPath(currentRoute.fullPath) },
    })
  }
})

app.use(router)

app.mount('#app')
