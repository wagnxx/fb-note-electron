import React, { useState, useEffect, useRef } from 'react'
import { AutoComplete, Button, Input, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { ClientMeta, Message } from '@/features/chat/types'
import { useAppSelector } from '@/store/hooks'
import { sendMessage } from '@/features/chat/service/chatService'
import { cn } from '@/lib/utils'
import FileMessageItem from './FileMessageItem'

const FUNCTION_COMMANDS = ['@getWifiIp', '@getUsers']

const ChatWindow: React.FC<{ groupId: string }> = ({ groupId }) => {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<{ value: string }[]>([])

  const { wsState, groups } = useAppSelector(state => state.chat)
  const messages = useAppSelector(state => state.chat.messagesByGroup[groupId] || [])
  const bottomRef = useRef<HTMLDivElement>(null)

  // 发送文本消息
  const sendMessageText = () => {
    if (!input.trim()) return
    const msg: Message = {
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
    const reader = new FileReader()
    reader.onload = () => {
      const msg: Message = {
        id: Date.now().toString(),
        groupId,
        sender: wsState.id,
        type: 'file',
        content: reader.result as string,
        fileName: file.name,
        fileType: file.type,
        timestamp: Date.now(),
      }
      sendMessage(msg)
    }
    reader.readAsDataURL(file)
    return false
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
    return () => clearTimeout(timeout)
  }, [messages])

  const getUserName = (id: string) => {
    if (id === wsState.id) return 'Me'
    const curGroup = groups.find(item => item.id === groupId)
    if (!curGroup) return
    const members: ClientMeta[] = curGroup.members
    const item = members.find(mem => mem.userId === id)
    return item?.username || 'Unknown'
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
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-2">
        {messages.map(msg => (
          <div
            key={`${msg.id}-${msg.groupId}`}
            className={cn('flex', msg.sender !== wsState.id ? 'justify-start' : 'justify-end')}
          >
            <div className="p-2">
              <strong>{getUserName(msg.sender)}: </strong>
              {msg.type === 'text' ? (
                <span>{msg.content}</span>
              ) : msg.type === 'file' ? (
                <FileMessageItem fileUrl={msg.content} fileName={msg.fileName} fileType={msg.fileType} />
              ) : null}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t pt-2 mt-2 flex gap-2">
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
