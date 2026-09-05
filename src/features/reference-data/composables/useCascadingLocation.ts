import { computed, type Ref } from 'vue'

import {
  useDistrictsQuery,
  useProvincesQuery,
  useRegenciesQuery,
  useVillagesQuery,
} from './useLocationQueries'

export type LocationSelection = {
  provinceId: string
  regencyId: string
  districtId: string
  villageId: string
}

export function emptyLocationSelection(): LocationSelection {
  return { provinceId: '', regencyId: '', districtId: '', villageId: '' }
}

export function selectProvince(
  selection: LocationSelection,
  provinceId: string,
): LocationSelection {
  if (selection.provinceId === provinceId) return selection
  return { provinceId, regencyId: '', districtId: '', villageId: '' }
}

export function selectRegency(selection: LocationSelection, regencyId: string): LocationSelection {
  if (selection.regencyId === regencyId) return selection
  return { ...selection, regencyId, districtId: '', villageId: '' }
}

export function selectDistrict(
  selection: LocationSelection,
  districtId: string,
): LocationSelection {
  if (selection.districtId === districtId) return selection
  return { ...selection, districtId, villageId: '' }
}

export function useCascadingLocation(selection: Ref<LocationSelection>) {
  const regencyParams = computed(() => ({
    province_id: selection.value.provinceId || undefined,
    limit: 200,
  }))
  const districtParams = computed(() => ({
    regency_id: selection.value.regencyId || undefined,
    limit: 200,
  }))
  const villageParams = computed(() => ({
    district_id: selection.value.districtId || undefined,
    limit: 200,
  }))

  const provinces = useProvincesQuery({ limit: 200 })
  const regencies = useRegenciesQuery(regencyParams, () => Boolean(selection.value.provinceId))
  const districts = useDistrictsQuery(districtParams, () => Boolean(selection.value.regencyId))
  const villages = useVillagesQuery(villageParams, () => Boolean(selection.value.districtId))

  function setProvince(provinceId: string) {
    selection.value = selectProvince(selection.value, provinceId)
  }

  function setRegency(regencyId: string) {
    selection.value = selectRegency(selection.value, regencyId)
  }

  function setDistrict(districtId: string) {
    selection.value = selectDistrict(selection.value, districtId)
  }

  function setVillage(villageId: string) {
    selection.value = { ...selection.value, villageId }
  }

  return {
    districts,
    provinces,
    regencies,
    setDistrict,
    setProvince,
    setRegency,
    setVillage,
    villages,
  }
}
