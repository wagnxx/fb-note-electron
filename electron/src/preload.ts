import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC_ACTIONS } from '@shared/ipcActions'
import type { ELECTRON_BRIDGE } from '@shared/types/'

const electronBridge: ELECTRON_BRIDGE = {
  IPC_ACTIONS,

  ipcRenderer: {
    send: (channel, ...args) => {
      ipcRenderer.send(channel, ...args)
    },

    on: (channel, listener) => {
      const wrapped = (_event: IpcRendererEvent, ...args: unknown[]) => {
        listener(...(args as any))
      }
      ipcRenderer.on(channel, wrapped)
    },

    removeListener: (channel, listener) => {
      const wrapped = (_event: IpcRendererEvent, ...args: unknown[]) => {
        listener(...(args as any))
      }
      ipcRenderer.removeListener(channel, wrapped)
    },

    invoke: (channel, ...args) => {
      return ipcRenderer.invoke(channel, ...args)
    },
  },
}

contextBridge.exposeInMainWorld('electron', electronBridge)
