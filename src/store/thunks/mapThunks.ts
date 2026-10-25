import { findPlace } from '@/api/geocode'
import i18n from '@/i18n'
import type { GeoPoint, ID } from '@/types'
import { itemUpdated } from '../actions/itemActions'
import type { AppThunk } from '../index'
import { selectLanguage } from '../slices/settingsSlice'
import { toastShown } from '../slices/toastSlice'

/**
 * Background geocoding after the item form is saved: the place was typed
 * (not picked from the suggestions) → find the best match near the trip destination.
 *
 * - found → the item gets coordinates (it appears on the map);
 * - not found → a toast; the card shows "set the place" until fixed;
 * - offline / service error → nothing: the text is kept, the card shows the same hint.
 *
 * Results are applied only if the item still has the same text and no point:
 * the user may have edited or moved it while the request was running.
 */
export const locateItem =
  (id: ID): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const item = getState().items.entities[id]
    if (!item?.location || item.coords) return
    const location = item.location
    const language = selectLanguage(getState())
    const destination = getState().trips.entities[item.tripId]?.destination

    let near: GeoPoint | undefined
    try {
      near = destination ? (await findPlace(destination, { language }))?.coords : undefined
    } catch {
      // no bias — search anyway
    }
    let point: GeoPoint | undefined
    try {
      point = (await findPlace(location, { language, near }))?.coords
    } catch {
      return
    }

    const current = getState().items.entities[id]
    if (!current || current.location !== location || current.coords) return
    if (point) dispatch(itemUpdated({ id, changes: { coords: point } }))
    else dispatch(toastShown({ message: i18n.t('plan.place.notFoundToast', { place: location }) }))
  }

/**
 * A point set on the map (marker dragged, or "Set on map" + click), with "Undo".
 * Passing `undefined` removes the item from the map (the text stays).
 */
export const setItemCoords =
  (id: ID, coords: GeoPoint | undefined): AppThunk =>
  (dispatch, getState) => {
    const item = getState().items.entities[id]
    if (!item) return
    dispatch(itemUpdated({ id, changes: { coords } }))
    dispatch(
      toastShown({
        message: i18n.t(item.coords ? 'map.pointMoved' : 'map.pointSet', { title: item.title }),
        undo: itemUpdated({ id, changes: { coords: item.coords } }),
      }),
    )
  }
