import 'vue-router'

export {}

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    layout?: 'app' | 'auth' | 'public'
    requiresAuth: boolean
    guestOnly?: boolean
    permissions?: string[]
    permissionMode?: 'all' | 'any'
    breadcrumb?: string
  }
}
