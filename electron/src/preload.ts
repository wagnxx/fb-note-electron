import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC_ACTIONS } from '../../shared/ipcActions'

type IpcHandler = (...args: unknown[]) => void

contextBridge.exposeInMainWorld('electron', {
  IPC_ACTIONS,

  ipcRenderer: {
    send: (channel: string, ...data: unknown[]) => {
      ipcRenderer.send(channel, ...data)
    },

    on: (channel: string, func: IpcHandler) => {
      ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: unknown[]) => func(...args))
    },

    removeListener: (channel: string, func: IpcHandler) => {
      ipcRenderer.removeListener(channel, (_event: IpcRendererEvent, ...args: unknown[]) => func(...args))
    },

    invoke: (channel: string, data: unknown) => {
      const validChannels = Object.values(IPC_ACTIONS) as string[]

      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data)
      }
      return Promise.reject('Not supported')
    },
  },
})
