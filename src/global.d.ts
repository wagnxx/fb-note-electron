// global.d.ts

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, data: any) => void
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
