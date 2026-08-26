import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { useVisibleSelection } from './useVisibleSelection'

describe('useVisibleSelection', () => {
  it('selects and clears only keys visible on the current page', () => {
    const visibleKeys = ref([1, 2, 3])
    const selection = useVisibleSelection(visibleKeys)

    selection.toggle(9, true)
    selection.toggleVisible(true)

    expect([...selection.selectedKeys.value]).toEqual([9, 1, 2, 3])
    expect(selection.allVisibleSelected.value).toBe(true)

    visibleKeys.value = [4, 5]
    expect(selection.allVisibleSelected.value).toBe(false)

    selection.toggleVisible(true)
    selection.toggleVisible(false)
    expect([...selection.selectedKeys.value]).toEqual([9, 1, 2, 3])
  })

  it('retains selections that still exist in the dataset', () => {
    const selection = useVisibleSelection([1, 2])
    selection.toggle(1, true)
    selection.toggle(2, true)
    selection.retain([2, 3])

    expect([...selection.selectedKeys.value]).toEqual([2])
    expect(selection.someVisibleSelected.value).toBe(true)
  })
})
