import React, { useMemo, useRef, useState } from 'react'
import { useWSListener } from '@/features/chat/hooks/useWSListener'
import { cn } from '@/lib/utils'
import ChatWindow from './ChatWindow'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectGroup } from '@/features/chat/chatSlice'
import Siderbar, { SiderbarRef } from './Siderbar'
import { afterRaf } from '@/utils/utilsAsyncFunc'
import { Badge, Button, Empty, Popover } from 'antd'
import { useDraggable } from '@/hooks/useDraggable'
import { useIsMobile } from '@/hooks/useIsMobile'
import { LinkOutlined, MessageOutlined, SettingOutlined } from '@ant-design/icons'
import QRCode from './QRCode'
import ChatSettingsPanel from './ChatSettingsPanel'
import { reconnectChatTransport } from '@/features/chat/service/chatService'

const ChatView: React.FC<{ ip: string }> = ({ ip }) => {
  const [stage, setStage] = useState<'siderbar' | 'chat'>('siderbar')
  const siderbarRef = useRef<SiderbarRef>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const { wsState } = useAppSelector(state => state.chat)

  const { resetPosition } = useDraggable({ ref: wrapperRef })

  const isOnline = useMemo(() => wsState.isConnected || false, [wsState.isConnected])

  const isMobile = useIsMobile({
    onChange: isM => {
      if (isM) {
        resetPosition('top-left')
      } else {
        resetPosition('center')
      }
    },
  })

  const selectedGroupId = useAppSelector(state => state.chat.currentGroupId)
  const dispatch = useAppDispatch()

  useWSListener(ip)

  const handleSelectGroup = (groupId: string) => {
    dispatch(selectGroup(groupId))
    setStage('chat')
  }

  const handleBack = () => {
    setStage('siderbar')
    afterRaf().then(() => {
      siderbarRef.current?.init()
    })
  }

  const handleReconnect = async () => {
    if (isReconnecting) return
    setIsReconnecting(true)
    try {
      await reconnectChatTransport(ip)
    } catch (error) {
      console.error('Manual reconnect failed:', error)
    } finally {
      setIsReconnecting(false)
    }
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        zIndex: 1000,
        height: 'calc(100vh - 28px)',
        ...(isMobile
          ? { position: 'static', width: '100%' }
          : {
              position: 'fixed',
              width: '74%',
              minWidth: '860px',
              maxWidth: '1280px',
              minHeight: '620px',
              maxHeight: '760px',
              left: 0,
              top: 0,
              boxShadow: '0 14px 42px rgba(15, 23, 42, 0.24)',
            }),
      }}
      className={cn(
        'flex bg-slate-100 relative',
        isMobile
          ? 'flex-col w-full rounded-none'
          : 'flex-row rounded-2xl overflow-hidden border border-slate-200/80 backdrop-blur-sm',
      )}
    >
      {isMobile && (
        <Button
          type="text"
          icon={<SettingOutlined />}
          className="!absolute top-1 right-1 z-20"
          onClick={() => setShowSettingsPanel(true)}
        />
      )}

      {!isMobile && (
        <div className="drag-header w-full h-10 bg-slate-800/95 cursor-move absolute top-0 left-0 z-10 rounded-t-2xl flex items-center px-3">
          <div className="flex items-center gap-2 text-slate-100 text-sm font-medium">
            <MessageOutlined />
            <span>Chat Room</span>
            <Badge status={isOnline ? 'success' : 'error'} />
          </div>
          <Button
            icon={<SettingOutlined />}
            type="link"
            className="ml-auto !text-slate-200"
            onClick={() => setShowSettingsPanel(true)}
          >
            配置
          </Button>
          <Popover
            trigger="click"
            placement="bottomRight"
            content={<QRCode ip={ip} />}
            overlayClassName="chat-qr-popover"
            overlayStyle={{ zIndex: 2500 }}
            getPopupContainer={() => document.body}
          >
            <Button icon={<LinkOutlined />} type="link" className="!text-slate-200">
              Web Link
            </Button>
          </Popover>
        </div>
      )}

      <div className={cn('flex w-full h-full', isMobile ? '' : 'pt-10')}>
        {(!isMobile || stage === 'siderbar') && (
          <div
            style={{
              width: isMobile ? '100%' : '350px',
              height: '100%',
            }}
            className="bg-white/95"
          >
            <Siderbar ref={siderbarRef} onSelectGroup={handleSelectGroup} isMobile={isMobile} />
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-gradient-to-br from-slate-50 to-slate-100">
          {stage === 'chat' && selectedGroupId && isOnline ? (
            <ChatWindow className="flex-1 min-h-0" groupId={selectedGroupId} isMobile={isMobile} onBack={handleBack} />
          ) : (
            !isMobile && (
              <Empty
                className="pt-28 flex-1"
                description={!selectedGroupId ? 'No active conversation' : !isOnline ? 'Currently unavailable' : ''}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                {...(!isOnline && {
                  image: Empty.PRESENTED_IMAGE_SIMPLE,
                  description: '连接已断开',
                  children: (
                    <Button type="primary" loading={isReconnecting} onClick={handleReconnect}>
                      重连
                    </Button>
                  ),
                })}
              />
            )
          )}
        </div>
      </div>

      <ChatSettingsPanel
        open={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        onSelectGroup={groupId => {
          handleSelectGroup(groupId)
          setShowSettingsPanel(false)
        }}
      />
    </div>
  )
}

export default ChatView
