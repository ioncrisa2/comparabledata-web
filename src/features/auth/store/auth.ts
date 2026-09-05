import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import { initializeCsrf } from '@/shared/api/csrf'
import { type ApiError, isApiError } from '@/shared/api/error'
import { queryClient } from '@/shared/query/client'

import {
  type AuthUser,
  fetchCurrentUser,
  type LoginCredentials,
  loginSession,
  logoutSession,
} from '../api/auth.api'

export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<AuthUser | null>(null)
  const initialized = ref(false)
  const initializationError = shallowRef<ApiError | null>(null)
  let initializationRequest: Promise<void> | null = null

  const authenticated = computed(() => user.value !== null)
  const roles = computed(() => user.value?.roles ?? [])
  const permissions = computed(() => user.value?.permissions ?? [])

  function clearSession(): void {
    user.value = null
    initialized.value = true
    queryClient.clear()
  }

  async function initialize(): Promise<void> {
    if (initialized.value) return
    if (initializationRequest) return initializationRequest

    initializationRequest = (async () => {
      initializationError.value = null

      try {
        user.value = await fetchCurrentUser()
      } catch (error) {
        user.value = null
        if (!isApiError(error) || error.status !== 401) {
          initializationError.value = isApiError(error) ? error : null
        }
      } finally {
        initialized.value = true
      }
    })()

    try {
      await initializationRequest
    } finally {
      initializationRequest = null
    }
  }

  async function login(credentials: LoginCredentials): Promise<AuthUser> {
    await initializeCsrf()
    const authenticatedUser = await loginSession(credentials)

    queryClient.clear()
    user.value = authenticatedUser
    initialized.value = true
    initializationError.value = null

    return authenticatedUser
  }

  async function logout(): Promise<void> {
    try {
      await logoutSession()
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) throw error
    }

    clearSession()
  }

  function can(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  function canAny(requiredPermissions: readonly string[]): boolean {
    return requiredPermissions.some(can)
  }

  return {
    authenticated,
    can,
    canAny,
    clearSession,
    initializationError,
    initialized,
    initialize,
    login,
    logout,
    permissions,
    roles,
    user,
  }
})
