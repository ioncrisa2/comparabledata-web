import { describe, expect, it } from 'vitest'

import {
  emptyLocationSelection,
  selectDistrict,
  selectProvince,
  selectRegency,
} from './useCascadingLocation'

describe('cascading location selection', () => {
  const completeSelection = {
    provinceId: '32',
    regencyId: '3273',
    districtId: '3273030',
    villageId: '3273030001',
  }

  it('provides a stable empty selection', () => {
    expect(emptyLocationSelection()).toEqual({
      provinceId: '',
      regencyId: '',
      districtId: '',
      villageId: '',
    })
  })

  it('resets every child when province changes', () => {
    expect(selectProvince(completeSelection, '31')).toEqual({
      provinceId: '31',
      regencyId: '',
      districtId: '',
      villageId: '',
    })
  })

  it('resets district and village when regency changes', () => {
    expect(selectRegency(completeSelection, '3271')).toEqual({
      ...completeSelection,
      regencyId: '3271',
      districtId: '',
      villageId: '',
    })
  })

  it('resets village when district changes', () => {
    expect(selectDistrict(completeSelection, '3273020')).toEqual({
      ...completeSelection,
      districtId: '3273020',
      villageId: '',
    })
  })

  it('preserves edit preload values when a parent does not change', () => {
    expect(selectProvince(completeSelection, '32')).toBe(completeSelection)
    expect(selectRegency(completeSelection, '3273')).toBe(completeSelection)
    expect(selectDistrict(completeSelection, '3273030')).toBe(completeSelection)
  })
})
