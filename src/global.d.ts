/* eslint-disable no-undef */
// global.d.ts

declare global {
  interface Window {
    electron: {
      IPC_ACTIONS: Record<string, string>
      ipcRenderer: {
        send: (channel: string, data: any) => void
        invoke: (channel: string, data: any) => void
        on: (
          channel: string,
          listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
        ) => void
        removeListener: (
          channel: string,
          listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
        ) => void
      }
    }
  }
}

export { }
