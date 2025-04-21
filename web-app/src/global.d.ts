/* eslint-disable no-undef */
// global.d.ts
import { ELECTRON_BRIDGE } from '../../shared/types'

declare global {
  interface Window {
    electron: ELECTRON_BRIDGE
  }
}

export { }
