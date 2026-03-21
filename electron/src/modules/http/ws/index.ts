import { bindServer } from './server'
import { Server as HTTPServer } from 'http'
import { getRelayGroupInternal, kickFromRelayGroupInternal, wsManager } from './manages/ctx'

export function bindWSServer(httpServer: HTTPServer) {
  bindServer(httpServer)
}

// relay 对外能力临时门面：当前用于过渡期接入，后续会统一融入整体 ws/http 架构。
export const wsPublicApi = {
  getOnlineCount() {
    return wsManager.getOnlineCount()
  },
  getOnlineUserIds() {
    return wsManager.getOnlineUserIds()
  },
  async getRelayGroup() {
    return getRelayGroupInternal()
  },
  async kickFromRelayGroup(userId: string) {
    return kickFromRelayGroupInternal(userId)
  },
}
