import React, { useEffect, useState } from 'react'
import ChatList from './components/ChatList'
import { useWSListener } from '@/features/chat/hooks/useWSListener'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { cn } from '@/lib/utils'
import ChatWindow from './components/ChatWindow'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectGroup } from '@/features/chat/chatSlice'

const ChatRoomPage: React.FC = () => {
  const [stage, setStage] = useState<'chatList' | 'chat'>('chatList') // 控制主内容区域
  const [isMobile, setIsMobile] = useState(false)

  const selectedGroupId = useAppSelector(state => state.chat.currentGroupId)
  const dispatch = useAppDispatch()

  useWSListener()

  const handleSelectGroup = (groupId: string) => {
    // setSelectedGroupId(groupId)
    dispatch(selectGroup(groupId))
    setStage('chat')
  }

  useEffect(() => {
    const handleResize = function () {
      const isMob = window.innerWidth < 768
      setIsMobile(isMob)
    }

    window.addEventListener('resize', handleResize, false)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })

  return (
    <div className={cn(' bg-white   h-full w-full flex', isMobile ? 'flex-col' : 'flex-row')}>
      {(!isMobile || stage === 'chatList') && (
        <div
          style={{
            width: isMobile ? '100%' : '240px',
          }}
        >
          <ChatList onSelectGroup={id => handleSelectGroup(id)} />
        </div>
      )}

      {/* 主内容区域 */}
      <div className={cn('flex-1 flex flex-col   min-h-0')}>
        {/* 移动端返回按钮 */}
        {isMobile && stage === 'chat' && (
          <div className="h-max ">
            <Button icon={<ArrowLeftOutlined />} type="link" className="-ml-2" onClick={() => setStage('chatList')}>
              返回
            </Button>
          </div>
        )}

        {stage === 'chat' && selectedGroupId && <ChatWindow groupId={selectedGroupId} className="flex-1 min-h-0 " />}
      </div>
    </div>
  )
}

export default ChatRoomPage
