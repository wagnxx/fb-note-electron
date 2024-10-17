/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
      // 只允许特定的频道
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel, func) => {
      // 只允许特定的频道
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    invoke: (channel, data) => {
      const validChannels = ['check-socks-service'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      return Promise.reject('not supported')
    },
  },
});
