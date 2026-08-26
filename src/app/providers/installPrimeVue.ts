import PrimeVue from 'primevue/config'
import type { App } from 'vue'

import { hjarPreset } from '@/styles/primevue-preset'

export function installPrimeVue(app: App): void {
  app.use(PrimeVue, {
    ripple: false,
    inputVariant: 'outlined',
    theme: {
      preset: hjarPreset,
      options: {
        darkModeSelector: false,
        cssLayer: {
          name: 'primevue',
          order: 'theme, base, primevue',
        },
      },
    },
    zIndex: {
      menu: 600,
      overlay: 800,
      modal: 800,
      tooltip: 1000,
    },
  })
}
