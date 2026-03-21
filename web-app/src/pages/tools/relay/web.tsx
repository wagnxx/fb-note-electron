import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { App, Button, Card, Empty, Input, Space, Tag, Typography } from 'antd'
import { CopyOutlined, SendOutlined } from '@ant-design/icons'
import { copyText } from '@/utils/utilsClipboard'

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

type MessageHistoryResponse = {
  type: 'message-history-res'
  payload: {
    groupId: string
    messages: (ChatTextMessage | ChatFileMessage)[]
  }
}

type SystemMessage = {
  type: 'system'
  payload: {
    message: string
  }
}

type WsMessage = ChatTextMessage | ChatFileMessage | MessageHistoryResponse | SystemMessage

const RELAY_GROUP_ID = 'relay-station'
const MOBILE_RELAY_USER_ID_KEY = 'relay.mobile.web.user.id'

const RelayWebConnectPage: React.FC = () => {
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<(ChatTextMessage | { id: string; type: 'system'; text: string })[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const host = searchParams.get('ip') || window.location.hostname || ''
  const wsURL = useMemo(() => (host ? `ws://${host}:4000/chat` : ''), [host])

  const userId = useMemo(() => {
    const existed = localStorage.getItem(MOBILE_RELAY_USER_ID_KEY)
    if (existed) return existed
    const next = `mobile-web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(MOBILE_RELAY_USER_ID_KEY, next)
    return next
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    if (!host) return

    const ws = new WebSocket(`${wsURL}?userId=${encodeURIComponent(userId)}`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)

      ws.send(
        JSON.stringify({
          type: 'init-req',
          payload: {
            id: userId,
            name: 'Mobile Web',
          },
        }),
      )

      ws.send(
        JSON.stringify({
          type: 'join',
          payload: {
            username: 'Mobile Web',
            userId,
            groupId: RELAY_GROUP_ID,
          },
        }),
      )

      ws.send(
        JSON.stringify({
          type: 'message-history-req',
          payload: {
            groupId: RELAY_GROUP_ID,
          },
        }),
      )
    }

    ws.onclose = () => {
      setConnected(false)
    }

    ws.onerror = () => {
      setConnected(false)
    }

    ws.onmessage = event => {
      let parsed: WsMessage
      try {
        parsed = JSON.parse(event.data) as WsMessage
      } catch {
        return
      }

      if (parsed.type === 'text' && parsed.groupId === RELAY_GROUP_ID) {
        const textMessage: ChatTextMessage = parsed
        setMessages(prev => [...prev, textMessage])
        return
      }

      if (parsed.type === 'system') {
        const systemText = parsed.payload.message
        setMessages(prev => [
          ...prev,
          {
            id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'system',
            text: systemText,
          },
        ])
        return
      }

      if (parsed.type === 'message-history-res' && parsed.payload.groupId === RELAY_GROUP_ID) {
        setMessages(parsed.payload.messages.filter((item): item is ChatTextMessage => item.type === 'text'))
      }
    }

    return () => {
      ws.close()
    }
  }, [host, userId, wsURL])

  const sendText = () => {
    if (!input.trim()) return
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      message.warning('连接未就绪')
      return
    }

    ws.send(
      JSON.stringify({
        type: 'text',
        payload: {
          type: 'text',
          id: `txt-${Date.now()}`,
          groupId: RELAY_GROUP_ID,
          sender: userId,
          content: input,
          timestamp: Date.now(),
        },
      }),
    )
    setInput('')
  }

  const copyWs = async () => {
    if (!wsURL) return
    const ok = await copyText(wsURL)
    if (ok) message.success('已复制连接地址')
  }

  if (!host) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full">
          <Empty description="缺少 ip 参数，无法连接中转站" />
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen p-3 bg-slate-100">
      <Card className="h-full" bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Space direction="vertical" size={2}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Relay Station Connect
          </Typography.Title>
          <Space>
            <Tag color={connected ? 'blue' : 'default'}>{connected ? 'Connected' : 'Disconnected'}</Tag>
            <Typography.Text type="secondary">{host}:4000</Typography.Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyWs} />
          </Space>
        </Space>

        <div className="flex-1 overflow-auto mt-3 space-y-2 pr-1">
          {messages.length === 0 ? (
            <Empty description="暂无消息" className="mt-20" />
          ) : (
            messages.map(item => {
              if (item.type === 'system') {
                return (
                  <div key={item.id} className="text-center text-xs text-slate-500">
                    {item.text}
                  </div>
                )
              }

              const isSelf = item.sender === userId
              return (
                <div key={item.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${isSelf ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200'}`}
                  >
                    {item.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex gap-2">
          <Input
            value={input}
            onChange={event => setInput(event.target.value)}
            onPressEnter={sendText}
            placeholder="输入消息"
          />
          <Button type="primary" icon={<SendOutlined />} onClick={sendText}>
            发送
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default RelayWebConnectPage
