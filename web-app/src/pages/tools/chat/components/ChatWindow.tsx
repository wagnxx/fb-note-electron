import React, { useState, useEffect, useRef, useMemo } from 'react'
import { AutoComplete, Button, Input, Upload } from 'antd'
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons'
import { ChatMessage } from '@shared/types'
import { useAppSelector } from '@/store/hooks'
import { sendMessage } from '@/features/chat/service/chatService'
import { cn } from '@/lib/utils'
import FileMessageItem from './FileMessageItem'
import Avatar from './Avatar'
import { readFileAsBase64 } from '@/utils/utilsFile'
import { MoreHorizontal } from 'lucide-react'

const FUNCTION_COMMANDS = ['@getWifiIp', '@getUsers']

const ChatWindow: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { groupId: string; isMobile: boolean; onBack: () => void }
> = ({ groupId, isMobile, onBack, className, style, ...rest }) => {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<{ value: string }[]>([])

  const { wsState, groups, users } = useAppSelector(state => state.chat)
  const messages = useAppSelector(state => state.chat.messagesByGroup[groupId] || [])
  const bottomRef = useRef<HTMLDivElement>(null)

  const group = useMemo(() => {
    return groups.find(item => item.id === groupId)
  }, [groupId, groups])

  // 发送文本消息
  const sendMessageText = () => {
    if (!input.trim()) return
    const msg: ChatMessage = {
      id: Date.now().toString(),
      groupId,
      sender: wsState.id,
      type: 'text',
      content: input,
      timestamp: Date.now(),
    }
    sendMessage(msg)
    setInput('')
  }

  // 发送文件消息
  const sendFile = (file: File) => {
    readFileAsBase64(file).then(result => {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        groupId,
        sender: wsState.id,
        type: 'file',
        content: result,
        fileName: file.name,
        fileType: file.type,
        timestamp: Date.now(),
      }
      sendMessage(msg)
    })
    return false
  }

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
    <div className={cn('flex flex-col  gap-2', className)} style={style}>
      <div className="h-max flex  items-center">
        {isMobile && (
          <Button icon={<ArrowLeftOutlined />} type="link" className="-ml-2" onClick={onBack}>
            返回
          </Button>
        )}
        <span className=" mx-auto">
          {group?.name}({/* {group?.members.length */})
        </span>
        <Button icon={<MoreHorizontal color="#333" size="16" />} type="link" disabled></Button>
      </div>
      {/* 中间内容区 */}

      <div className="flex-1 bg-slate-50 min-h-0">
        <div className="h-full space-y-2 overflow-auto px-1 py-2">
          {messages.map(msg => {
            const sender = getUser(msg.sender)
            const isSender = sender?.isSelef
            return (
              <div key={`${msg.id}-${msg.groupId}`} className={cn('flex', isSender ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn('flex items-start gap-2 ', isSender ? 'flex-row-reverse' : 'flex-row')}
                  style={{ minWidth: 0 }}
                >
                  <Avatar
                    userName={isSender ? 'M' : sender?.name}
                    src={sender?.avatar}
                    style={{ width: 40, height: 40, flexShrink: 0 }}
                  />
                  <div
                    className={cn(
                      'rounded-xl px-3 py-2 whitespace-pre-line break-words',
                      isSender ? 'bg-blue-100 text-black' : 'bg-gray-100 text-black',
                    )}
                    style={{ flexGrow: 1, minWidth: 0 }}
                  >
                    {msg.type === 'text' ? (
                      msg.content
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

      {/* 输入区域 */}
      <div className="border-t py-2 px-1  flex gap-2  h-max pr-1">
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
          <Input className="ant-input" placeholder="输入消息..." />
        </AutoComplete>
        <Upload beforeUpload={sendFile} showUploadList={false}>
          <Button icon={<UploadOutlined />}>发送文件</Button>
        </Upload>
        <Button type="primary" onClick={sendMessageText}>
          发送
        </Button>
      </div>
    </div>
  )
}

export default ChatWindow
