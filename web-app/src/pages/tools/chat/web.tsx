import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spin } from 'antd'
import ChatView from '@/features/chat/components/ChatView'

const ChatRoomWeb: React.FC = () => {
  const [searchParams] = useSearchParams()
  const ip = searchParams.get('ip') ?? ''

  if (!ip) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin tip="加载中..." size="large" />
      </div>
    )
  }

  return <ChatView ip={ip} />
}

export default ChatRoomWeb
