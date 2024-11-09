/* eslint-disable no-undef */
// global.d.ts

declare global {
  interface Window {
    electron: {
      IPC_ACTIONS: Record<string, string>
      ipcRenderer: {
        send: (channel: string, data: any) => void
        invoke: (channel: string, data: any) => any
        on: (channel: string, listener: (...args: any[]) => void) => void
        removeListener: (channel: string, listener: (...args: any[]) => void) => void
      }
    }
  }
}

export { }
