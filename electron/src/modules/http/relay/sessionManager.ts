import { randomBytes, randomUUID } from 'crypto'

export type RelayDevice = {
  deviceId: string
  deviceName: string
  userId: string
  pairedAt: number
  lastSeenAt: number
}

type RelayTokenSession = {
  token: string
  userId: string
  deviceId: string
  issuedAt: number
  expiresAt: number
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12

class RelaySessionManager {
  private readonly startedAt = Date.now()
  private readonly devices = new Map<string, RelayDevice>()
  private readonly tokenSessions = new Map<string, RelayTokenSession>()

  public pairDevice(params: { deviceId: string; deviceName?: string; userId?: string }) {
    const now = Date.now()
    const deviceId = params.deviceId.trim()
    const userId = params.userId?.trim() || `rn-${deviceId}`
    const deviceName = params.deviceName?.trim() || 'RN Mobile'

    const existed = this.devices.get(deviceId)
    const device: RelayDevice = {
      deviceId,
      userId,
      deviceName,
      pairedAt: existed?.pairedAt ?? now,
      lastSeenAt: now,
    }

    this.devices.set(deviceId, device)

    const token = this.generateToken()
    const tokenSession: RelayTokenSession = {
      token,
      userId,
      deviceId,
      issuedAt: now,
      expiresAt: now + TOKEN_TTL_MS,
    }
    this.tokenSessions.set(token, tokenSession)

    return {
      token,
      expiresInMs: TOKEN_TTL_MS,
      userId,
      device,
    }
  }

  public validateToken(token: string | null | undefined) {
    if (!token) return null
    const record = this.tokenSessions.get(token)
    if (!record) return null

    if (record.expiresAt <= Date.now()) {
      this.tokenSessions.delete(token)
      return null
    }

    this.touchDevice(record.deviceId)
    return record
  }

  public touchDevice(deviceId: string) {
    const device = this.devices.get(deviceId)
    if (!device) return
    device.lastSeenAt = Date.now()
    this.devices.set(deviceId, device)
  }

  public getStats(activeConnections: number) {
    this.cleanupExpiredTokens()
    return {
      startedAt: this.startedAt,
      uptimeMs: Date.now() - this.startedAt,
      activeConnections,
      pairedDevices: this.devices.size,
      activeTokens: this.tokenSessions.size,
    }
  }

  public getDevices() {
    return Array.from(this.devices.values()).sort((left, right) => right.lastSeenAt - left.lastSeenAt)
  }

  public getDevice(deviceId: string) {
    return this.devices.get(deviceId)
  }

  private cleanupExpiredTokens() {
    const now = Date.now()
    for (const [token, session] of this.tokenSessions.entries()) {
      if (session.expiresAt <= now) {
        this.tokenSessions.delete(token)
      }
    }
  }

  private generateToken() {
    return `${randomUUID().replace(/-/g, '')}${randomBytes(8).toString('hex')}`
  }
}

export const relaySessionManager = new RelaySessionManager()
