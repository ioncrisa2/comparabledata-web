import { describe, expect, it } from 'vitest'

import { createDashboard } from '../test/fixtures'
import { capabilityGranted, validMapPoints, widgetAllowed } from './widgets'

describe('dashboard permissions and locations', () => {
  it.each([false, 'false', '0', 0, '', undefined, null, 'widget_Map', {}])(
    'denies non-granted capability %s',
    (value) => {
      expect(capabilityGranted(value)).toBe(false)
    },
  )
  it.each([true, 'true', '1', 1])('accepts an explicit grant %s', (value) => {
    expect(capabilityGranted(value)).toBe(true)
  })
  it('does not infer widget access from the presence of data', () => {
    expect(widgetAllowed(createDashboard({ can_widgets: { map: 'false' } }), 'map')).toBe(false)
    expect(widgetAllowed(createDashboard({ can_widgets: {} }), 'statsOverview')).toBe(false)
  })
  it('rejects invalid coordinates without dropping valid equator or prime meridian points', () => {
    const point = createDashboard().map_points[0]!
    const zero = { ...point, id: 5, latitude: 0, longitude: 0 }
    expect(
      validMapPoints([
        point,
        zero,
        { ...point, latitude: NaN },
        { ...point, longitude: 181 },
        { ...point, latitude: -91 },
      ]),
    ).toEqual([point, zero])
  })
})
