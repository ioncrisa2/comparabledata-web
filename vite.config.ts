import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8000'
  const apiProxyTarget = env.API_PROXY_TARGET || apiBaseUrl

  const apiProxy = {
    target: apiProxyTarget,
    changeOrigin: true,
    cookieDomainRewrite: '',
  }

  return {
    plugins: [
      vue(),
      tailwindcss(),
      env.VITE_DISABLE_DEVTOOLS === 'true' ? undefined : vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': apiProxy,
        '/sanctum': apiProxy,
      },
    },
    build: {
      manifest: true,
    },
  }
})
