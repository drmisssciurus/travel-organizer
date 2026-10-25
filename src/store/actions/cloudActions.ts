import { createAction } from '@reduxjs/toolkit'
import type { EntitySlices } from '../sanitize'

/**
 * Data downloaded from the cloud replaces all trip data at once (settings stay).
 * Handled by the root reducer (`store/index.ts`), not by each slice: it is a wholesale replace.
 */
export const cloudStateLoaded = createAction<EntitySlices>('cloud/stateLoaded')
