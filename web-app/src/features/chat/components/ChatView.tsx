import React, { useMemo, useRef, useState } from 'react'
import { useWSListener } from '@/features/chat/hooks/useWSListener'
import { cn } from '@/lib/utils'
import ChatWindow from './ChatWindow'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectGroup } from '@/features/chat/chatSlice'
import Siderbar, { SiderbarRef } from './Siderbar'
import { afterRaf } from '@/utils/utilsAsyncFunc'
import { Button, Empty } from 'antd'
import { useDraggable } from '@/hooks/useDraggable'
import { useIsMobile } from '@/hooks/useIsMobile'
import { LinkOutlined } from '@ant-design/icons'
import QRCode from './QRCode'

const ChatView: React.FC<{ ip: string }> = ({ ip }) => {
  const [stage, setStage] = useState<'siderbar' | 'chat'>('siderbar')
  const siderbarRef = useRef<SiderbarRef>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [showQRCode, setShowQRCode] = useState(false)

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

  return (
    <div
      ref={wrapperRef}
      style={{
        backgroundColor: '#f1f5f9',
        zIndex: 1000,
        height: ' calc(-28px + 100vh)',
        ...(isMobile
          ? { position: 'static', width: '100%' }
          : {
              position: 'fixed',
              aspectRatio: '6 / 4',
              width: '66%',
              minWidth: '680px',
              maxHeight: '700px',
              left: 0,
              top: 0,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }),
      }}
      className={cn('flex ', isMobile ? 'flex-col w-full ' : 'flex-row rounded-lg overflow-hidden')}
    >
      {!isMobile && (
        <div className="drag-header w-full h-8 bg-slate-300 cursor-move absolute top-0 left-0 z-10 rounded-t-lg">
          <Button icon={<LinkOutlined />} type="link" className="ml-2" onClick={() => setShowQRCode(prev => !prev)}>
            Web Link
          </Button>
          {showQRCode && (
            <div className="absolute top-full left-0 p-2 rounded-lg bg-slate-200">
              <QRCode ip={ip} />
            </div>
          )}
        </div>
      )}

      <div className="flex  w-full h-full pt-8">
        {(!isMobile || stage === 'siderbar') && (
          <div
            style={{
              width: isMobile ? '100%' : '340px',
              height: '100%',
            }}
          >
            <Siderbar ref={siderbarRef} onSelectGroup={handleSelectGroup} isMobile={isMobile} />
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {stage === 'chat' && selectedGroupId && isOnline ? (
            <ChatWindow className="flex-1 min-h-0" groupId={selectedGroupId} isMobile={isMobile} onBack={handleBack} />
          ) : (
            !isMobile && (
              <Empty
                className="pt-20 bg-white flex-1"
                description={!selectedGroupId ? 'No active conversation' : !isOnline ? 'Currently unavailable' : ''}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatView
