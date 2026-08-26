import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

export type SelectionKey = string | number

export function useVisibleSelection(visibleKeys: MaybeRefOrGetter<readonly SelectionKey[]>) {
  const selectedKeys = ref<Set<SelectionKey>>(new Set())
  const visible = computed(() => toValue(visibleKeys))
  const selectedVisibleCount = computed(
    () => visible.value.filter((key) => selectedKeys.value.has(key)).length,
  )
  const allVisibleSelected = computed(
    () => visible.value.length > 0 && selectedVisibleCount.value === visible.value.length,
  )
  const someVisibleSelected = computed(
    () => selectedVisibleCount.value > 0 && !allVisibleSelected.value,
  )

  function replace(next: Set<SelectionKey>) {
    selectedKeys.value = next
  }

  function toggle(key: SelectionKey, selected = !selectedKeys.value.has(key)) {
    const next = new Set(selectedKeys.value)
    if (selected) next.add(key)
    else next.delete(key)
    replace(next)
  }

  function toggleVisible(selected = !allVisibleSelected.value) {
    const next = new Set(selectedKeys.value)
    visible.value.forEach((key) => (selected ? next.add(key) : next.delete(key)))
    replace(next)
  }

  function retain(validKeys: readonly SelectionKey[]) {
    const valid = new Set(validKeys)
    replace(new Set([...selectedKeys.value].filter((key) => valid.has(key))))
  }

  function clear() {
    replace(new Set())
  }

  return {
    selectedKeys,
    selectedVisibleCount,
    allVisibleSelected,
    someVisibleSelected,
    isSelected: (key: SelectionKey) => selectedKeys.value.has(key),
    toggle,
    toggleVisible,
    retain,
    clear,
  }
}
