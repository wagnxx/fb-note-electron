import React, { useState, useEffect, useRef, useMemo } from 'react'
import { AutoComplete, Badge, Button, Input, Tooltip, Upload } from 'antd'
import { ArrowLeftOutlined, HistoryOutlined } from '@ant-design/icons'
import { ClientToServerMessage } from '@shared/types'
import { useAppSelector } from '@/store/hooks'
import { send, sendWithRes } from '@/features/chat/service/chatService'
import { cn } from '@/lib/utils'
import FileMessageItem from './FileMessageItem'
import Avatar from './Avatar'
import { readFileAsBase64 } from '@/utils/utilsFile'
import { FileUpIcon, SendIcon } from 'lucide-react'
import TextMessageItem from './TextMessageItem'

const FUNCTION_COMMANDS = ['@getWifiIp', '@getUsers']

const ChatWindow: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { groupId: string; isMobile: boolean; onBack: () => void }
> = ({ groupId, isMobile, onBack, className, style }) => {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<{ value: string }[]>([])

  const { wsState, groups, users } = useAppSelector(state => state.chat)
  const messages = useAppSelector(state => state.chat.messagesByGroup[groupId] || [])
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const group = useMemo(() => {
    return groups.find(item => item.id === groupId)
  }, [groupId, groups])

  // 发送文本消息
  const sendMessageText = () => {
    if (!input.trim()) return
    const msg: ClientToServerMessage = {
      type: 'text',
      payload: {
        type: 'text',
        id: Date.now().toString(),
        groupId,
        sender: wsState.id,
        content: input,
        timestamp: Date.now(),
      },
    }
    send(msg.type, msg.payload)
    setInput('')
  }

  // 发送文件消息
  const sendFile = (file: File) => {
    readFileAsBase64(file).then(result => {
      const msg: ClientToServerMessage = {
        type: 'file',
        payload: {
          id: Date.now().toString(),
          groupId,
          sender: wsState.id,
          type: 'file',
          content: result,
          fileName: file.name,
          fileType: file.type,
          timestamp: Date.now(),
        },
      }
      send(msg.type, msg.payload)
    })
    return false
  }

  const fetchInitialHistory = () => {
    return sendWithRes('message-history-req', { groupId })
  }

  useEffect(() => {
    if (!wsState.isConnected || !groupId) return
    void sendWithRes('message-history-req', { groupId }).catch(() => undefined)
  }, [groupId, wsState.isConnected])

  useEffect(() => {
    const timeout = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
    return () => clearTimeout(timeout)
  }, [messages])

  const getUser = (id: string) => {
    const user = users?.find(item => item.id === id)
    if (!user) return
    return {
      ...user,
      isSelef: id === wsState.id,
    }
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    if (value.includes('@')) {
      const match = value.split(' ').pop() || ''
      const filtered = FUNCTION_COMMANDS.filter(cmd => cmd.toLowerCase().startsWith(match.toLowerCase()))
      setOptions(filtered.map(cmd => ({ value: cmd })))
    } else {
      setOptions([])
    }
  }

  const handleSelect = (value: string) => {
    const words = input.split(' ')
    words[words.length - 1] = value
    setInput(words.join(' '))
    setOptions([])
  }

  return (
    <div className={cn('flex flex-col gap-2 p-2', className)} style={style}>
      <div className="h-12 px-2 flex items-center rounded-xl bg-white border border-slate-200">
        {isMobile && (
          <Button icon={<ArrowLeftOutlined />} type="link" className="-ml-2" onClick={onBack}>
            返回
          </Button>
        )}
        <div className="mx-auto flex items-center gap-2">
          <span className="font-semibold text-slate-800">{group?.name}</span>
          <span className="text-xs text-slate-500">({group?.members.length || 0})</span>
          <Badge status={wsState.isConnected ? 'success' : 'error'} />
        </div>
        <Tooltip title="刷新当前群消息">
          <Button
            icon={<HistoryOutlined />}
            type="text"
            onClick={() => void fetchInitialHistory().catch(() => undefined)}
          />
        </Tooltip>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white/75" ref={containerRef}>
        <div className="h-full space-y-3 overflow-auto p-3">
          {messages.map(msg => {
            const sender = getUser(msg.sender)
            const isSender = sender?.isSelef
            return (
              <div key={`${msg.id}-${msg.groupId}`} className={cn('flex', isSender ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn('flex items-start gap-2 max-w-[80%]', isSender ? 'flex-row-reverse' : 'flex-row')}
                  style={{ minWidth: 0 }}
                >
                  <Avatar
                    userName={isSender ? 'M' : sender?.name}
                    src={sender?.avatar}
                    style={{ width: 34, height: 34, flexShrink: 0 }}
                  />
                  <div
                    className={cn(
                      'rounded-2xl px-3 py-2 whitespace-pre-line break-words shadow-sm border',
                      isSender ? 'bg-blue-500 text-white border-blue-400' : 'bg-white text-slate-800 border-slate-200',
                    )}
                    style={{ flexGrow: 1, minWidth: 0 }}
                  >
                    {msg.type === 'text' ? (
                      <TextMessageItem content={msg.content} containerRef={containerRef} />
                    ) : msg.type === 'file' ? (
                      <FileMessageItem fileUrl={msg.content} fileName={msg.fileName} fileType={msg.fileType} />
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-2 flex gap-2 items-center">
        <AutoComplete
          value={input}
          options={options}
          onSelect={handleSelect}
          onChange={handleInputChange}
          onKeyDown={e => {
            if (e.key === 'Enter') sendMessageText()
          }}
          style={{ flex: 1 }}
        >
          <Input className="ant-input" placeholder="输入消息，支持 @ 快捷命令" />
        </AutoComplete>
        <Upload beforeUpload={sendFile} showUploadList={false}>
          <Tooltip title="发送文件">
            <Button icon={<FileUpIcon size={16} />} />
          </Tooltip>
        </Upload>
        <Tooltip title="发送">
          <Button type="primary" icon={<SendIcon size={16} />} onClick={sendMessageText} />
        </Tooltip>
      </div>
    </div>
  )
}

export default ChatWindow
