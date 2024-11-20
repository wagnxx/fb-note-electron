/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require('electron');

// from constans.js file


const IPC_ACTIONS = {
  START_SOCKS_SERVICE: 'start-socks-service',
  SOCKS_SERVICE_OUTPUT: 'socks-service-output',
  SOCKS_SERVICE_ERROR: 'socks-service-errort',
  SOCKS_SERVICE_STOPPED: 'socks-service-stopped',
  STOP_SOCKS_SERVICE: 'stop-socks-service',
  CHECK_SOCKS_SERVICE: 'check-socks-service',
  GET_SOCKS_SERVICE_INFO: 'get-socks-service-info',
  GET_LOGS: 'get-logs',
  SELECT_FILE: 'select-file',
  LS_FOLDER: 'ls-folder',
  LOAD_VIDEO: 'load-video',
  READ_STREAM: 'read-stream',
  SAVE_SCREENSHOT: 'save-screenshot',
  REMOVE_SCREENSHOT: 'remove-screenshot',
  BATCH_CROP_IMAGE: 'batch-crop-image',
  MERGE_IMAGES: 'merge-images',
  COMPARE_IMAGES: 'compare-images',
  EXRACT_IMAGES_TEXT: 'exract-images-text',
  EXRACT_VIDEO_FRAME_TEXT: 'exract-video-frame-text'
}




contextBridge.exposeInMainWorld('electron', {
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

      const validChannels = Object.values(IPC_ACTIONS) 

      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      return Promise.reject('not supported')
    },
  },
});
