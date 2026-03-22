import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DesktopOnly from '@/components/platform/DesktopOnly'
import { getWifi } from '@/utils/utilsIpc'
import {
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd'
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  DownloadOutlined,
  LinkOutlined,
  MobileOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SendOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { QRCodeSVG } from 'qrcode.react'

type RelayMember = {
  id: string
  name?: string | null
  avatar?: string | null
  online?: boolean | null
}

type RelayGroup = {
  id: string
  name: string
  members: RelayMember[]
}

type ChatTextMessage = {
  type: 'text'
  id: string
  sender: string
  groupId: string
  timestamp: number
  content: string
}

type ChatFileMessage = {
  type: 'file'
  id: string
  sender: string
  groupId: string
  timestamp: number
  fileName: string
  fileType: string
  content: string
}

type ChatImageMessage = {
  type: 'image'
  id: string
  sender: string
  groupId: string
  timestamp: number
  content: string
}

type ChatSystemMessage = {
  type: 'system'
  payload: {
    message: string
  }
}

type HistoryResponse = {
  type: 'message-history-res'
  payload: {
    groupId: string
    messages: (ChatTextMessage | ChatImageMessage | ChatFileMessage)[]
  }
}

type GroupsResponse = {
  type: 'groups-res'
  payload: {
    groups: RelayGroup[]
  }
}

type ChatWSMessage =
  | ChatTextMessage
  | ChatImageMessage
  | ChatFileMessage
  | ChatSystemMessage
  | HistoryResponse
  | GroupsResponse

// 临时方案备注：当前 relay 通过过渡接口接入。
// 后续并入统一架构时，请评估并按需还原/收敛以下文件：
// - electron/src/modules/http/express/routes/hub.ts
// - electron/src/modules/http/ws/index.ts
// - electron/src/modules/http/ws/manages/ctx.ts
// - electron/src/modules/http/ws/server.ts
// - electron/src/modules/http/relay/sessionManager.ts
// - electron/src/modules/http/relay/relayHub.ts
// - web-app/src/pages/tools/relay/web.tsx
// - web-app/src/routes/config/tool.ts
// - web-app/src/routes/routes.ts
const RELAY_GROUP_ID = 'relay-station'
const RELAY_DEVICE_STORAGE_KEY = 'relay.station.desktop.user.id'
const AUTO_RECONNECT_LIMIT = 10
const RECONNECT_INTERVAL_MS = 30000
const HEARTBEAT_INTERVAL_MS = 30000

const extractRelayCode = (content: string) => {
  const matched = content.match(/Relay Pair Code(?: Updated)?:\s*(\d{6})/)
  return matched?.[1] || ''
}

const RelayStationPage: React.FC = () => {
  const { message } = App.useApp()

  const [lanIp, setLanIp] = useState('')
  const [selfId, setSelfId] = useState('')
  const [selfName] = useState('Desktop Relay')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<
    (ChatTextMessage | ChatImageMessage | ChatFileMessage | { type: 'system'; text: string; id: string })[]
  >([])
  const [members, setMembers] = useState<RelayMember[]>([])
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [relayCode, setRelayCode] = useState('')
  const [relayCodeLoading, setRelayCodeLoading] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'image' | 'video'
    src: string
    fileName: string
  } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const heartbeatTimerRef = useRef<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const host = useMemo(() => lanIp || window.location.hostname || '127.0.0.1', [lanIp])
  const baseURL = useMemo(() => `http://${host}:4000`, [host])
  const healthURL = useMemo(() => `${baseURL}/api/hub/health`, [baseURL])
  const wsEndpoint = useMemo(() => `ws://${host}:4000/chat`, [host])

  const userId = useMemo(() => {
    const existed = localStorage.getItem(RELAY_DEVICE_STORAGE_KEY)
    if (existed) return existed
    const next = `desktop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(RELAY_DEVICE_STORAGE_KEY, next)
    return next
  }, [])

  const requestRelayGroupData = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(
      JSON.stringify({
        type: 'groups-req',
        payload: {},
      }),
    )

    ws.send(
      JSON.stringify({
        type: 'message-history-req',
        payload: { groupId: RELAY_GROUP_ID },
      }),
    )
  }, [])

  const connectChatSocket = useCallback(() => {
    if (!host) return

    const currentWs = wsRef.current
    if (currentWs && (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING)) {
      return
    }

    setConnecting(true)

    const ws = new WebSocket(`ws://${host}:4000/chat?userId=${encodeURIComponent(userId)}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setConnecting(false)
      reconnectAttemptsRef.current = 0

      ws.send(
        JSON.stringify({
          type: 'init-req',
          payload: {
            id: userId,
            name: selfName,
          },
        }),
      )

      ws.send(
        JSON.stringify({
          type: 'join',
          payload: {
            username: selfName,
            userId,
            groupId: RELAY_GROUP_ID,
          },
        }),
      )

      requestRelayGroupData()
    }

    ws.onclose = () => {
      setConnected(false)
      setConnecting(false)
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
      }

      if (reconnectAttemptsRef.current >= AUTO_RECONNECT_LIMIT) {
        message.warning('自动重连已达 10 次，请点击 Reconnect 手动连接')
        return
      }

      reconnectAttemptsRef.current += 1
      reconnectTimerRef.current = window.setTimeout(() => {
        connectChatSocket()
      }, RECONNECT_INTERVAL_MS)
    }

    ws.onerror = () => {
      setConnected(false)
    }

    ws.onmessage = event => {
      const rawData = event.data
      let parsedData: ChatWSMessage
      try {
        parsedData = JSON.parse(rawData) as ChatWSMessage
      } catch {
        return
      }

      if (parsedData.type === 'text' && parsedData.groupId === RELAY_GROUP_ID) {
        const textMessage: ChatTextMessage = parsedData
        const nextRelayCode = extractRelayCode(textMessage.content)
        if (nextRelayCode) {
          setRelayCode(nextRelayCode)
        }
        setMessages(prev => [...prev, textMessage])
        return
      }

      if (parsedData.type === 'file' && parsedData.groupId === RELAY_GROUP_ID) {
        const fileMessage: ChatFileMessage = parsedData
        setMessages(prev => [...prev, fileMessage])
        return
      }

      if (parsedData.type === 'image' && parsedData.groupId === RELAY_GROUP_ID) {
        const imageMessage: ChatImageMessage = parsedData
        setMessages(prev => [...prev, imageMessage])
        return
      }

      if (parsedData.type === 'system') {
        const systemText = parsedData.payload.message
        const nextRelayCode = extractRelayCode(systemText)
        if (nextRelayCode) {
          setRelayCode(nextRelayCode)
        }
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            text: systemText,
            id: `system-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          },
        ])
        requestRelayGroupData()
        return
      }

      if (parsedData.type === 'message-history-res' && parsedData.payload.groupId === RELAY_GROUP_ID) {
        setMessages(
          parsedData.payload.messages.map(item => {
            if (item.type === 'text' || item.type === 'file' || item.type === 'image') {
              return item
            }
            return {
              type: 'system',
              text: '',
              id: `skip-${Date.now()}`,
            }
          }),
        )
        return
      }

      if (parsedData.type === 'groups-res') {
        const relayGroup = parsedData.payload.groups.find(group => group.id === RELAY_GROUP_ID)
        setMembers(relayGroup?.members || [])
      }
    }
  }, [host, message, requestRelayGroupData, selfName, userId])

  const init = useCallback(async () => {
    const ip = await getWifi().catch(() => '')
    setLanIp(ip || window.location.hostname || '127.0.0.1')
    setSelfId(userId)
  }, [userId])

  const refreshRelayCode = useCallback(async () => {
    setRelayCodeLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/hub/code/refresh`, { method: 'POST' })
      const data = await res.json()
      if (data?.ok) {
        setRelayCode(data.code)
        message.success('配对码已刷新')
      } else {
        message.error('刷新配对码失败')
      }
    } catch {
      message.error('请求失败，请检查服务连接')
    } finally {
      setRelayCodeLoading(false)
    }
  }, [baseURL, message])

  const fetchRelayCode = useCallback(async () => {
    setRelayCodeLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/hub/code`)
      const data = await res.json()
      if (data?.ok) {
        setRelayCode(data.code)
      }
    } catch {
      // 忽略初始化错误
    } finally {
      setRelayCodeLoading(false)
    }
  }, [baseURL])

  const bootstrap = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connectChatSocket()
  }, [connectChatSocket])

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (!host) return
    bootstrap()
  }, [bootstrap, host])

  useEffect(() => {
    if (!host) return
    fetchRelayCode()
  }, [fetchRelayCode, host])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    if (!connected) return

    heartbeatTimerRef.current = window.setInterval(() => {
      requestRelayGroupData()
    }, HEARTBEAT_INTERVAL_MS)

    return () => {
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current)
      }
    }
  }, [connected, requestRelayGroupData])

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
      }
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current)
      }
      wsRef.current?.close()
    }
  }, [])

  const sendPayload = (payload: any) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      message.warning('连接未就绪')
      return
    }
    ws.send(JSON.stringify(payload))
  }

  const handleSendText = () => {
    if (!text.trim()) return
    sendPayload({
      type: 'text',
      payload: {
        type: 'text',
        id: `txt_${Date.now()}`,
        groupId: RELAY_GROUP_ID,
        sender: userId,
        content: text,
        timestamp: Date.now(),
      },
    })
    setText('')
  }

  const fileToDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleUploadFile = async (file: File) => {
    setUploading(true)
    try {
      const content = await fileToDataURL(file)
      sendPayload({
        type: 'file',
        payload: {
          id: `file_${Date.now()}`,
          groupId: RELAY_GROUP_ID,
          sender: userId,
          type: 'file',
          content,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          timestamp: Date.now(),
        },
      })
    } catch {
      message.error('文件读取失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleKick = async (targetUserId: string) => {
    try {
      const response = await fetch(`${baseURL}/api/hub/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: targetUserId }),
      })
      const result = await response.json()
      if (!response.ok || !result?.ok) {
        message.error(result?.message || '踢出失败')
        return
      }
      message.success('成员已移出中转站群')
      requestRelayGroupData()
    } catch {
      message.error('踢出请求失败')
    }
  }

  const handleDownload = (file: ChatFileMessage | ChatImageMessage) => {
    const anchor = document.createElement('a')
    anchor.href = file.content
    anchor.download = file.type === 'file' ? file.fileName : `image-${file.id}.png`
    anchor.click()
  }

  const isImageFile = (fileType: string) => fileType.startsWith('image/')
  const isVideoFile = (fileType: string) => fileType.startsWith('video/')

  const handlePreviewMedia = (file: ChatFileMessage | ChatImageMessage) => {
    if (file.type === 'image') {
      setPreviewMedia({
        type: 'image',
        src: file.content,
        fileName: `image-${file.id}`,
      })
      return
    }

    if (isImageFile(file.fileType)) {
      setPreviewMedia({
        type: 'image',
        src: file.content,
        fileName: file.fileName,
      })
      return
    }

    if (isVideoFile(file.fileType)) {
      setPreviewMedia({
        type: 'video',
        src: file.content,
        fileName: file.fileName,
      })
    }
  }

  const memberMap = useMemo(() => {
    return members.reduce<Record<string, RelayMember>>((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})
  }, [members])

  const memberStatus = useMemo(() => {
    const online = members.filter(item => item.online || (item.id === selfId && connected)).length
    const total = members.length
    const offline = Math.max(total - online, 0)
    return {
      online,
      total,
      offline,
    }
  }, [connected, members, selfId])

  return (
    <div className="h-[calc(100vh-30px)] w-full p-4 box-border overflow-hidden bg-gradient-to-br from-slate-100 via-cyan-50 to-indigo-100">
      <Card
        bordered={false}
        className="h-full shadow-xl"
        bodyStyle={{ height: '100%', padding: 0, overflow: 'hidden' }}
      >
        <div className="h-full flex">
          <div className="w-[280px] border-r border-slate-200 bg-white/80 backdrop-blur-md p-3 flex flex-col">
            <Card size="small" title="已接入成员">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded bg-slate-100 px-2 py-2 text-center">
                  <div className="text-xs text-slate-500">总数</div>
                  <div className="text-base font-semibold text-slate-900">{memberStatus.total}</div>
                </div>
                <div className="rounded bg-emerald-50 px-2 py-2 text-center">
                  <div className="text-xs text-emerald-600">在线</div>
                  <div className="text-base font-semibold text-emerald-700">{memberStatus.online}</div>
                </div>
                <div className="rounded bg-slate-100 px-2 py-2 text-center">
                  <div className="text-xs text-slate-500">离线</div>
                  <div className="text-base font-semibold text-slate-700">{memberStatus.offline}</div>
                </div>
              </div>
            </Card>

            <div className="mt-4 flex-1 min-h-0 overflow-auto">
              <Typography.Text strong>
                <MobileOutlined /> Group Members
              </Typography.Text>
              <List
                className="mt-2"
                dataSource={members}
                locale={{ emptyText: '暂无成员（可在 ChatRoom 申请加入）' }}
                renderItem={item => {
                  const isSelf = item.id === selfId
                  return (
                    <List.Item
                      actions={
                        isSelf
                          ? [
                              <Tag key="self" color="green">
                                Me
                              </Tag>,
                            ]
                          : [
                              <Tooltip key="kick" title="移出中转站群">
                                <Button
                                  size="small"
                                  danger
                                  type="text"
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleKick(item.id)}
                                />
                              </Tooltip>,
                            ]
                      }
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar src={item.avatar || undefined}>
                            {(item.name || item.id).slice(0, 1).toUpperCase()}
                          </Avatar>
                        }
                        title={
                          <Space size={6}>
                            <span>{item.name || item.id}</span>
                            {isSelf && <Tag color="green">Desktop</Tag>}
                            {item.online || (isSelf && connected) ? <Tag color="blue">Online</Tag> : <Tag>Offline</Tag>}
                          </Space>
                        }
                        description={<Typography.Text type="secondary">{item.id}</Typography.Text>}
                      />
                    </List.Item>
                  )
                }}
              />
            </div>
          </div>

          <div className="flex-1 h-full flex flex-col bg-slate-50">
            <div className="h-14 px-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <Typography.Title level={5} style={{ margin: 0 }}>
                <DeploymentUnitOutlined /> 中转站群聊（与 ChatRoom 同群）
              </Typography.Title>
              <Space wrap>
                <Badge status={connected ? 'success' : connecting ? 'processing' : 'error'} />
                <Typography.Text type="secondary">
                  {connected ? 'Connected' : connecting ? 'Connecting' : 'Disconnected'}
                </Typography.Text>
                <Button size="small" icon={<SettingOutlined />} onClick={() => setShowSettings(true)}>
                  配置
                </Button>
              </Space>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <Empty description="暂无消息，发送一条试试" className="mt-20" />
              ) : (
                messages.map(item => {
                  if (item.type === 'system') {
                    return (
                      <div key={item.id} className="text-center text-xs text-slate-500">
                        {item.text}
                      </div>
                    )
                  }

                  const isSelf = item.sender === selfId
                  const sender = memberMap[item.sender]
                  const senderName = sender?.name || item.sender

                  return (
                    <div key={item.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[72%] rounded-xl px-3 py-2 shadow-sm ${
                          isSelf ? 'bg-blue-500 text-white' : 'bg-white text-slate-900 border border-slate-200'
                        }`}
                      >
                        <div className={`text-xs mb-1 ${isSelf ? 'text-blue-100' : 'text-slate-500'}`}>
                          {senderName}
                        </div>

                        {item.type === 'text' ? (
                          <Typography.Text style={{ color: isSelf ? '#fff' : undefined }}>
                            {item.content}
                          </Typography.Text>
                        ) : item.type === 'image' ? (
                          <div>
                            <button
                              type="button"
                              className="block"
                              onClick={() => handlePreviewMedia(item)}
                              title="点击全屏预览"
                            >
                              <img
                                src={item.content}
                                alt={`image-${item.id}`}
                                className="max-h-64 rounded-md border border-slate-200"
                              />
                            </button>
                            <div className="mb-2 text-xs text-slate-500">点击媒体可全屏预览</div>
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(item)}>
                              下载
                            </Button>
                          </div>
                        ) : (
                          <div>
                            {isImageFile(item.fileType) ? (
                              <button
                                type="button"
                                className="block"
                                onClick={() => handlePreviewMedia(item)}
                                title="点击全屏预览"
                              >
                                <img
                                  src={item.content}
                                  alt={item.fileName}
                                  className="max-h-64 rounded-md border border-slate-200"
                                />
                              </button>
                            ) : isVideoFile(item.fileType) ? (
                              <button
                                type="button"
                                className="block"
                                onClick={() => handlePreviewMedia(item)}
                                title="点击全屏预览"
                              >
                                <video
                                  src={item.content}
                                  className="max-h-64 rounded-md border border-slate-200"
                                  muted
                                  playsInline
                                />
                              </button>
                            ) : (
                              <div className="text-sm mb-2">📎 {item.fileName}</div>
                            )}
                            {(isImageFile(item.fileType) || isVideoFile(item.fileType)) && (
                              <div className="mb-2 text-xs text-slate-500">点击媒体可全屏预览</div>
                            )}
                            <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(item)}>
                              下载
                            </Button>
                          </div>
                        )}

                        <div className={`text-[11px] mt-1 ${isSelf ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-slate-200 bg-white p-3 flex items-center gap-2">
              <Upload beforeUpload={handleUploadFile} showUploadList={false} disabled={!connected || uploading}>
                <Button icon={<CloudUploadOutlined />} loading={uploading} />
              </Upload>
              <Input
                value={text}
                onChange={event => setText(event.target.value)}
                placeholder="输入消息，回车发送"
                onPressEnter={handleSendText}
                disabled={!connected}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSendText} disabled={!connected}>
                发送
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {showQRCode && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={() => setShowQRCode(false)}
        >
          <Card className="w-[340px]" onClick={event => event.stopPropagation()}>
            <Space direction="vertical" className="w-full" size={12} align="center">
              <Typography.Title level={5} style={{ margin: 0 }}>
                扫码获取电脑端 API 地址
              </Typography.Title>
              <QRCodeSVG value={healthURL} size={220} />
              <Typography.Text type="secondary" className="text-center break-all">
                {healthURL}
              </Typography.Text>
              <Typography.Text type="secondary" className="text-center">
                扫码后先探活，成功后由设备端自行进入聊天室。
              </Typography.Text>
              <Space>
                <Button onClick={() => setShowQRCode(false)}>关闭</Button>
              </Space>
            </Space>
          </Card>
        </div>
      )}

      <Drawer
        title="配置"
        onClose={() => setShowSettings(false)}
        open={showSettings}
        width={400}
        bodyStyle={{ paddingBottom: '80px' }}
      >
        <Tabs
          defaultActiveKey="pair"
          items={[
            {
              key: 'control',
              label: '控制',
              children: (
                <Space direction="vertical" className="w-full" size={12}>
                  <Card size="small" title="会话状态">
                    <Space direction="vertical" size={8}>
                      <Space>
                        <Badge status={connected ? 'success' : connecting ? 'processing' : 'error'} />
                        <Typography.Text type="secondary">
                          {connected ? 'Connected' : connecting ? 'Connecting' : 'Disconnected'}
                        </Typography.Text>
                      </Space>
                      <Tag icon={<LinkOutlined />} color={connected ? 'blue' : 'default'}>
                        {connected ? 'Live sync with ChatRoom' : 'Waiting connection'}
                      </Tag>
                    </Space>
                  </Card>

                  <Card size="small" title="快捷操作">
                    <Space wrap>
                      <Button icon={<ReloadOutlined />} onClick={bootstrap} loading={connecting}>
                        Reconnect
                      </Button>
                      <Button icon={<QrcodeOutlined />} onClick={() => setShowQRCode(true)}>
                        扫码连接
                      </Button>
                    </Space>
                  </Card>
                </Space>
              ),
            },
            {
              key: 'pair',
              label: '配对',
              children: (
                <Space direction="vertical" className="w-full" size={16}>
                  <div>
                    <Typography.Text strong>配对码</Typography.Text>
                    <Typography.Paragraph type="secondary" style={{ marginTop: '8px', marginBottom: '12px' }}>
                      对方设备通过此码进行配对，每 5 分钟自动刷新；输入 `@getRelayCode` 也可重新查看当前码。
                    </Typography.Paragraph>
                    <div className="flex items-center gap-2">
                      <Typography.Title
                        level={2}
                        code
                        style={{
                          margin: 0,
                          fontFamily: 'monospace',
                          letterSpacing: '8px',
                          flex: 1,
                          textAlign: 'center',
                          padding: '12px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                        }}
                      >
                        {relayCode || '---'}
                      </Typography.Title>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={refreshRelayCode}
                        loading={relayCodeLoading}
                        type="primary"
                      >
                        刷新
                      </Button>
                    </div>
                  </div>

                  <Card size="small" title="当前会话">
                    <Space direction="vertical" size={6}>
                      <Typography.Text type="secondary">Host: {host}:4000</Typography.Text>
                      <Typography.Text type="secondary">Group: {RELAY_GROUP_ID}</Typography.Text>
                      <Typography.Text type="secondary">Token 有效期: 12 小时</Typography.Text>
                    </Space>
                  </Card>
                </Space>
              ),
            },
            {
              key: 'guide',
              label: '接入',
              children: (
                <Space direction="vertical" className="w-full" size={12}>
                  <Card size="small" title="设备接入说明（API 模式）">
                    <Space direction="vertical" size={4}>
                      <Typography.Text type="secondary">1) 扫码拿到电脑端 API 地址（不是 Web 页面）</Typography.Text>
                      <Typography.Text type="secondary">2) 先调用 `GET /api/hub/health` 验证可达</Typography.Text>
                      <Typography.Text type="secondary">3) 再走 `POST /api/hub/pair`，并带上当前配对码</Typography.Text>
                      <Typography.Text type="secondary">4) 使用 `WS /chat` 建连并 `join relay-station`</Typography.Text>
                    </Space>
                  </Card>
                  <Card size="small" title="连接地址">
                    <Space direction="vertical" size={8} className="w-full">
                      <Typography.Text code>{healthURL}</Typography.Text>
                      <Typography.Text code>{wsEndpoint}</Typography.Text>
                    </Space>
                  </Card>
                </Space>
              ),
            },
            {
              key: 'command',
              label: '命令',
              children: (
                <Space direction="vertical" className="w-full" size={12}>
                  <Card size="small" title="快速命令">
                    <Space direction="vertical" className="w-full">
                      <div className="flex items-center gap-2 rounded bg-slate-100 p-2">
                        <Tag color="blue">@getRelayCode</Tag>
                        <Typography.Text type="secondary" className="flex-1">
                          显示当前配对码
                        </Typography.Text>
                      </div>
                      <div className="flex items-center gap-2 rounded bg-slate-100 p-2">
                        <Tag color="green">@getWifiIp</Tag>
                        <Typography.Text type="secondary" className="flex-1">
                          显示设备 IP 信息
                        </Typography.Text>
                      </div>
                    </Space>
                  </Card>
                  <Card size="small" title="技术细节">
                    <Space direction="vertical" size={6}>
                      <Typography.Text type="secondary">API 基础 URL: {baseURL}</Typography.Text>
                      <Typography.Text type="secondary">WebSocket 端点: {wsEndpoint}</Typography.Text>
                      <Typography.Text type="secondary">配对需要正确的配对码</Typography.Text>
                    </Space>
                  </Card>
                </Space>
              ),
            },
          ]}
        />
      </Drawer>

      <Modal
        open={!!previewMedia}
        title={previewMedia?.fileName || '媒体预览'}
        onCancel={() => setPreviewMedia(null)}
        footer={null}
        width="92vw"
        centered
        destroyOnClose
      >
        {previewMedia?.type === 'image' ? (
          <img src={previewMedia.src} alt={previewMedia.fileName} className="mx-auto max-h-[78vh] max-w-full" />
        ) : previewMedia?.type === 'video' ? (
          <video src={previewMedia.src} controls autoPlay className="mx-auto max-h-[78vh] max-w-full" />
        ) : null}
      </Modal>
    </div>
  )
}

export default () => <DesktopOnly children={<RelayStationPage />} />
