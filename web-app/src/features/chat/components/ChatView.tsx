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
import { SettingOutlined } from '@ant-design/icons'
import ChatSettingsPanel from './ChatSettingsPanel'
import { reconnectChatTransport } from '@/features/chat/service/chatService'

const ChatView: React.FC<{ ip: string }> = ({ ip }) => {
  const [stage, setStage] = useState<'siderbar' | 'chat'>('siderbar')
  const siderbarRef = useRef<SiderbarRef>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const { wsState } = useAppSelector(state => state.chat)

  // Stabilize online state to prevent UI flicker when WS flaps briefly
  const [stableOnline, setStableOnline] = useState<boolean>(wsState.isConnected || false)
  const stableTimerRef = useRef<number | null>(null)

  React.useEffect(() => {
    if (stableTimerRef.current) {
      window.clearTimeout(stableTimerRef.current)
      stableTimerRef.current = null
    }

    // Wait a short period before committing the new isConnected value
    stableTimerRef.current = window.setTimeout(() => {
      setStableOnline(!!wsState.isConnected)
      stableTimerRef.current = null
    }, 700)

    return () => {
      if (stableTimerRef.current) {
        window.clearTimeout(stableTimerRef.current)
        stableTimerRef.current = null
      }
    }
  }, [wsState.isConnected])

  const { resetPosition } = useDraggable({ ref: wrapperRef })

  const isOnline = useMemo(() => stableOnline, [stableOnline])

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
        height: '100vh',
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
      {/* 移动端右上角设置按钮，始终可见且不与其它按钮重叠 */}
      {isMobile && (
        <Button
          type="text"
          icon={<SettingOutlined />}
          className="!fixed right-3 top-3 z-30 bg-white/80 !rounded-full shadow border border-slate-200"
          style={{ width: 38, height: 38 }}
          onClick={() => setShowSettingsPanel(true)}
        />
      )}
      {/* 移动端设置按钮已移入 ChatWindow header，外层不再渲染 */}
      {/* Desktop: show a settings button at top-right so user can open settings
          even when the chat area is empty/offline. */}
      {!isMobile && (
        <Button
          type="text"
          icon={<SettingOutlined />}
          className="!fixed right-6 top-6 z-30 bg-white/90 !rounded-full shadow border border-slate-200"
          style={{ width: 38, height: 38 }}
          onClick={() => setShowSettingsPanel(true)}
        />
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
            <ChatWindow
              className="flex-1 min-h-0"
              groupId={selectedGroupId}
              isMobile={isMobile}
              onBack={handleBack}
              onShowSettings={() => setShowSettingsPanel(true)}
            />
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
