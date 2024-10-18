const SERVICE_NAMES = {
  socks5: 'my-socks-service.js'
}

const IPC_ACTIONS = {
  START_SOCKS_SERVICE: 'start-socks-service',
  SOCKS_SERVICE_OUTPUT: 'socks-service-output',
  SOCKS_SERVICE_ERROR: 'socks-service-error',
  SOCKS_SERVICE_STOPPED: 'socks-service-stopped',
  STOP_SOCKS_SERVICE: 'stop-socks-service',
  CHECK_SOCKS_SERVICE: 'check-socks-service',
  GET_SOCKS_SERVICE_INFO: 'get-socks-service-info',
  GET_LOGS: 'get-logs',
  SUBPROCESS_ERROR: 'subprocess-errors',
}


module.exports = {
  SERVICE_NAMES,
  IPC_ACTIONS
}