import React, { useEffect, useState } from 'react'
import ChatView from '@/features/chat/components/ChatView'
import DesktopOnly from '@/components/platform/DesktopOnly'
import { getWifi } from '@/utils/utilsIpc'
import { useIsMobile } from '@/hooks/useIsMobile'

// eslint-disable-next-line no-undef
const port = process.env.REACT_APP_ENV === 'production' ? 4000 : 3000

// const ip = '192.168.100.199'
const createURL = (ip: string) => {
  const url = `http://${ip}:${port}/ulogi/tool/chat/web?ip=${ip}`
  return url
}

const ChatRoomPage: React.FC = () => {
  const [ip, setIp] = useState('')

  const isMobile = useIsMobile()

  useEffect(() => {
    getWifi().then(res => {
      if (res) {
        setIp(res)
      }
    })
  }, [])

  return (
    <div className="p-4 space-y-4">
      {/* 聊天界面 */}
      <div className="mt-4 border-t pt-4">{ip && !isMobile && <ChatView ip={ip} />}</div>
    </div>
  )
}

export default () => <DesktopOnly children={<ChatRoomPage />} />
