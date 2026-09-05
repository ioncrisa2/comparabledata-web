import { VueQueryPlugin } from '@tanstack/vue-query'
import type { App } from 'vue'

import { queryClient } from '@/shared/query/client'

export function installQueryClient(app: App): void {
  app.use(VueQueryPlugin, { queryClient })
}
