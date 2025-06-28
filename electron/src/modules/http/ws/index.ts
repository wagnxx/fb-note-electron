import { bindServer } from './server'
import { Server as HTTPServer } from 'http'

export function bindWSServer(httpServer: HTTPServer) {
  bindServer(httpServer)
}
