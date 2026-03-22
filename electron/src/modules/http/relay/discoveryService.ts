export type RelayCodeUpdatePayload = {
  type: 'relayCodeUpdate'
  pairCode: string
}

export class RelayDiscoveryService {
  private pairCode = this.generateCode()
  private refreshTimer: NodeJS.Timeout | null = null
  private port = 0
  private wsPublicApi: any = null

  private generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * 启动发现服务，包括 mDNS 广播和 5 分钟自动刷新
   * @param port HTTP 服务端口
   * @param wsPublicApi WS 公共 API 用于广播
   */
  publish(port: number, wsPublicApi: any) {
    this.port = port
    this.wsPublicApi = wsPublicApi

    // mDNS 广播（当前暂未实现 bonjour-service，占位）
    console.log(`[Discovery] Relay service published: _ulogi-relay._tcp.local :${port}`)

    // 启动 5 分钟自动刷新
    this.startAutoRefresh()
  }

  private startAutoRefresh() {
    this.refreshTimer = setInterval(
      () => {
        this.pairCode = this.generateCode()
        console.log(`[Discovery] Code auto-refreshed: ${this.pairCode}`)
        this.broadcastCodeUpdate()
      },
      5 * 60 * 1000,
    ) // 5 分钟
  }

  /**
   * 通过 WS 广播配对码更新给所有在线的桌面端
   */
  private async broadcastCodeUpdate() {
    if (!this.wsPublicApi) return

    try {
      const onlineUserIds = this.wsPublicApi.getOnlineUserIds?.()
      if (onlineUserIds?.length) {
        await this.wsPublicApi.broadcastRelaySystemMessage?.(`Relay Pair Code Updated: ${this.pairCode}`)
      }
    } catch (err) {
      console.error('[Discovery] Failed to broadcast code update:', err)
    }
  }

  /**
   * 获取当前配对码
   */
  getCode() {
    return this.pairCode
  }

  /**
   * 手动刷新配对码（通常来自 UI 的"刷新"按钮）
   */
  refreshCode() {
    this.pairCode = this.generateCode()
    console.log(`[Discovery] Code manually refreshed: ${this.pairCode}`)
    this.broadcastCodeUpdate()
    return this.pairCode
  }

  /**
   * 停止发现服务
   */
  unpublish() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
    console.log('[Discovery] Relay service unpublished.')
  }
}

export const relayDiscovery = new RelayDiscoveryService()
