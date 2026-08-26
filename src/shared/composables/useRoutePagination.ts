import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function useRoutePagination(defaultPerPage = 25) {
  const route = useRoute()
  const router = useRouter()

  const page = computed(() => positiveInteger(route.query.page, 1))
  const perPage = computed(() => positiveInteger(route.query.perPage, defaultPerPage))

  async function update(next: { page?: number; perPage?: number }) {
    await router.replace({
      query: {
        ...route.query,
        page: String(next.page ?? page.value),
        perPage: String(next.perPage ?? perPage.value),
      },
    })
  }

  return {
    page,
    perPage,
    setPage: (value: number) => update({ page: Math.max(1, value) }),
    setPerPage: (value: number) => update({ page: 1, perPage: Math.max(1, value) }),
  }
}
