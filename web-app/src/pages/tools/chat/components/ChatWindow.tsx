// 📁 src/pages/chat/components/ChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react'
import { Input, Button, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useDispatch } from 'react-redux'
import { addMessage } from '@/features/chat/chatSlice'
import { ClientMeta, Message } from '@/features/chat/types'
import { useAppSelector } from '@/store/hooks'
import { sendMessage } from '@/features/chat/service/chatService'
import { cn } from '@/lib/utils'

const ChatWindow: React.FC<{ groupId: string }> = ({ groupId }) => {
  const [input, setInput] = useState('')
  const dispatch = useDispatch()

  const { wsState, groups } = useAppSelector(state => state.chat)
  const messages = useAppSelector(state => state.chat.messagesByGroup[groupId] || [])
  const bottomRef = useRef<HTMLDivElement>(null)

  // 注册 socket，并将收到的消息派发到 Redux

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
    // dispatch(addMessage(msg))
    sendMessage(msg)
    setInput('')
  }

  const sendFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const msg: Message = {
        id: Date.now().toString(),
        groupId,
        sender: wsState.id,
        type: 'file',
        content: reader.result as string,
        timestamp: Date.now(),
      }
      dispatch(addMessage(msg))
      sendMessage(msg)
    }
    reader.readAsDataURL(file)
    return false
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getUserName = (id: string) => {
    if (id === wsState.id) return 'Me'
    const curGroup = groups.find(item => item.id === groupId)
    if (!curGroup) return
    const members: ClientMeta[] = curGroup.members

    const item = members.find(mem => mem.userId === id)
    return item?.username || 'Unkown'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex', msg.sender !== wsState.id ? 'justify-start' : 'justify-end')}>
            <div className="p-2 ">
              <strong>{getUserName(msg.sender)}: </strong>
              {msg.type === 'text' ? (
                <span>{msg.content}</span>
              ) : (
                <a href={msg.content} download target="_blank" rel="noreferrer">
                  下载文件
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t pt-2 mt-2 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={sendMessageText}
          placeholder="输入消息..."
        />
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
