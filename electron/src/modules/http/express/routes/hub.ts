import { getNetworkInfo } from '@/utils/netUtils'
import express, { Request, Response, Router } from 'express'
import { relaySessionManager } from '../../relay/sessionManager'
import { relayDiscovery } from '../../relay/discoveryService'
import { relayFileStore } from '../../relay/fileStore'
// relay 相关公共接口当前为临时过渡方案，后续会整体融入正式架构。
import { wsPublicApi } from '../../ws'

const RELAY_STATION_GROUP_ID = 'relay-station'

const router = Router()

const getBearerToken = (request: Request) => {
  const authHeader = request.headers.authorization || ''
  if (!authHeader.startsWith('Bearer ')) return ''
  return authHeader.slice('Bearer '.length).trim()
}

router.get('/health', async (_request: Request, response: Response) => {
  const network = await getNetworkInfo()
  const stats = relaySessionManager.getStats(wsPublicApi.getOnlineCount())

  response.status(200).json({
    ok: true,
    app: 'ULogi Relay Station',
    version: '1.0.0',
    serverTime: Date.now(),
    transport: {
      httpPort: 4000,
      wsPath: '/chat',
    },
    network,
    stats,
    relayGroupId: RELAY_STATION_GROUP_ID,
  })
})

router.post('/pair', (request: Request, response: Response) => {
  const { pairCode, deviceId, deviceName } = request.body || {}

  // 校验 pairCode
  if (!pairCode || typeof pairCode !== 'string') {
    response.status(400).json({
      ok: false,
      code: 'INVALID_PAIR_CODE',
      message: 'pairCode is required',
    })
    return
  }

  if (pairCode !== relayDiscovery.getCode()) {
    response.status(403).json({
      ok: false,
      code: 'PAIR_CODE_MISMATCH',
      message: 'pairCode is invalid',
    })
    return
  }

  if (!deviceId || typeof deviceId !== 'string') {
    response.status(400).json({
      ok: false,
      code: 'INVALID_DEVICE_ID',
      message: 'deviceId is required',
    })
    return
  }

  const pairResult = relaySessionManager.pairDevice({
    deviceId,
    deviceName: typeof deviceName === 'string' ? deviceName : undefined,
  })

  response.status(200).json({
    ok: true,
    token: pairResult.token,
    userId: pairResult.userId,
    expiresInMs: pairResult.expiresInMs,
    wsURL: `ws://<LAN_IP>:4000/chat?token=${pairResult.token}`,
    relayGroupId: RELAY_STATION_GROUP_ID,
  })
})

router.get('/bootstrap', (request: Request, response: Response) => {
  const token = getBearerToken(request) || String(request.query.token || '')
  const session = relaySessionManager.validateToken(token)
  if (!session) {
    response.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'token invalid or expired',
    })
    return
  }

  const stats = relaySessionManager.getStats(wsPublicApi.getOnlineCount())
  response.status(200).json({
    ok: true,
    userId: session.userId,
    deviceId: session.deviceId,
    serverTime: Date.now(),
    transport: {
      wsPath: '/chat',
    },
    relayGroupId: RELAY_STATION_GROUP_ID,
    stats,
  })
})

router.post('/token/validate', (request: Request, response: Response) => {
  const token = String(request.body?.token || '')
  const session = relaySessionManager.validateToken(token)
  if (!session) {
    response.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'token invalid or expired',
    })
    return
  }

  response.status(200).json({
    ok: true,
    userId: session.userId,
    deviceId: session.deviceId,
    expiresAt: session.expiresAt,
  })
})

router.get('/stats', async (_request: Request, response: Response) => {
  const relayGroup = await wsPublicApi.getRelayGroup()

  response.status(200).json({
    ok: true,
    stats: relaySessionManager.getStats(wsPublicApi.getOnlineCount()),
    devices: relaySessionManager.getDevices(),
    onlineUsers: wsPublicApi.getOnlineUserIds(),
    relayGroup,
  })
})

router.post('/kick', async (request: Request, response: Response) => {
  const userId = String(request.body?.userId || '').trim()
  if (!userId) {
    response.status(400).json({
      ok: false,
      code: 'INVALID_USER_ID',
      message: 'userId is required',
    })
    return
  }

  const kickResult = await wsPublicApi.kickFromRelayGroup(userId)
  if (!kickResult.ok) {
    response.status(404).json({
      ok: false,
      code: 'GROUP_NOT_FOUND',
      message: 'relay group not found',
    })
    return
  }

  response.status(200).json({
    ok: true,
    userId,
  })
})

router.get('/code', (_request: Request, response: Response) => {
  response.status(200).json({
    ok: true,
    code: relayDiscovery.getCode(),
  })
})

router.post('/code/refresh', (_request: Request, response: Response) => {
  const newCode = relayDiscovery.refreshCode()
  response.status(200).json({
    ok: true,
    code: newCode,
  })
})

router.post('/files', express.raw({ type: 'application/octet-stream', limit: '512mb' }), async (request, response) => {
  const fileNameHeader = String(request.headers['x-relay-file-name'] || '').trim()
  const fileType = String(request.headers['x-relay-file-type'] || 'application/octet-stream').trim()
  const uploadedBy = String(request.headers['x-relay-user-id'] || '').trim() || undefined

  if (!fileNameHeader) {
    response.status(400).json({
      ok: false,
      code: 'INVALID_FILE_NAME',
      message: 'x-relay-file-name is required',
    })
    return
  }

  const body = request.body
  if (!Buffer.isBuffer(body) || body.length === 0) {
    response.status(400).json({
      ok: false,
      code: 'INVALID_FILE_BODY',
      message: 'file binary body is required',
    })
    return
  }

  let fileName = fileNameHeader
  try {
    fileName = decodeURIComponent(fileNameHeader)
  } catch {
    // ignore decode error, fallback to header raw value
  }

  try {
    const stored = await relayFileStore.saveBuffer({
      fileName,
      fileType,
      buffer: body,
      uploadedBy,
    })

    const host = request.get('host') || '<LAN_IP>:4000'
    const protocol = request.protocol || 'http'
    const downloadUrl = `${protocol}://${host}/api/hub/files/${stored.id}/download`

    response.status(200).json({
      ok: true,
      file: {
        fileId: stored.id,
        fileName: stored.fileName,
        fileType: stored.fileType,
        size: stored.size,
        transferMode: 'remote',
        downloadUrl,
      },
    })
  } catch {
    response.status(500).json({
      ok: false,
      code: 'FILE_STORE_FAILED',
      message: 'failed to store relay file',
    })
  }
})

router.get('/files/:fileId/download', async (request: Request, response: Response) => {
  const fileId = String(request.params.fileId || '').trim()
  if (!fileId) {
    response.status(400).json({
      ok: false,
      code: 'INVALID_FILE_ID',
      message: 'fileId is required',
    })
    return
  }

  const file = await relayFileStore.getFile(fileId)
  if (!file) {
    response.status(404).json({
      ok: false,
      code: 'FILE_NOT_FOUND',
      message: 'file not found',
    })
    return
  }

  response.download(file.storagePath, file.fileName)
})

export default router
