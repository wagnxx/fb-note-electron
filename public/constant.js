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
}


module.exports = {
  SERVICE_NAMES,
  IPC_ACTIONS
}