import '@fontsource-variable/instrument-sans'
import 'primeicons/primeicons.css'
import '@/styles/index.css'

import { type Component, createApp } from 'vue'

import App from '@/app/App.vue'
import { installPinia } from '@/app/providers/installPinia'
import { installPrimeVue } from '@/app/providers/installPrimeVue'
import { installQueryClient } from '@/app/providers/installQueryClient'
import router from '@/router'

const app = createApp(App as Component)

installPinia(app)
installQueryClient(app)
installPrimeVue(app)
app.use(router)

app.mount('#app')
