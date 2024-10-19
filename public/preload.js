/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require('electron');

// from constans.js file
const SERVICE_NAMES = {
  socks5: 'my-socks-service.js'
}

const IPC_ACTIONS = {
  START_SOCKS_SERVICE: 'start-socks-service',
  SOCKS_SERVICE_OUTPUT: 'socks-service-output',
  SOCKS_SERVICE_ERROR: 'socks-service-errort',
  SOCKS_SERVICE_STOPPED: 'socks-service-stopped',
  STOP_SOCKS_SERVICE: 'stop-socks-service',
  CHECK_SOCKS_SERVICE: 'check-socks-service',
  GET_SOCKS_SERVICE_INFO: 'get-socks-service-info',
  GET_LOGS: 'get-logs',
}




contextBridge.exposeInMainWorld('electron', {
  SERVICE_NAMES,
  IPC_ACTIONS,

  ipcRenderer: {
    send: (channel, ...data) => {
      ipcRenderer.send(channel, ...data);
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

      const validChannels = [
          IPC_ACTIONS.CHECK_SOCKS_SERVICE,
          IPC_ACTIONS.GET_SOCKS_SERVICE_INFO,
          IPC_ACTIONS.GET_LOGS
        ];

      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      return Promise.reject('not supported')
    },
  },
});
