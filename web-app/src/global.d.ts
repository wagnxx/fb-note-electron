/* eslint-disable no-undef */
// global.d.ts
import { IPC_ACTIONS } from '../../shared/ipcActions'
// import IPC_ACTIONS from '../shared/ipcActions.json'

declare global {
  interface Window {
    electron: {
      // IPC_ACTIONS: Record<string, string>
      IPC_ACTIONS: typeof IPC_ACTIONS
      ipcRenderer: {
        send: (channel: string, data: any) => void
        invoke: (channel: (typeof IPC_ACTIONS)[keyof typeof IPC_ACTIONS], data: any) => any
        on: (channel: string, listener: (...args: any[]) => void) => void
        removeListener: (channel: string, listener: (...args: any[]) => void) => void
      }
    }
  }
}

export {}
