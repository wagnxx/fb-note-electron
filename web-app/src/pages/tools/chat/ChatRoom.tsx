import React, { useState } from 'react'
import ChatGroupList from './components/ChatGroupList'
import ChatWindow from './components/ChatWindow'
import { useWSListener } from '@/features/chat/hooks/useWSListener'

const ChatRoom: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  useWSListener()

  return (
    <div className="flex bg-white" style={{ height: 'calc(100vh - 30px)' }}>
      {/* 左侧群组列表 */}
      <div className="w-1/4 border-r border-gray-200 p-4 space-y-4">
        <ChatGroupList onSelectGroup={setSelectedGroupId} />
      </div>

      {/* 右侧聊天窗口 */}
      <div className="flex-1 p-4 overflow-hidden">
        {selectedGroupId ? (
          <ChatWindow groupId={selectedGroupId} />
        ) : (
          <div className="text-gray-500 text-center mt-32">请选择一个聊天组</div>
        )}
      </div>
    </div>
  )
}

export default ChatRoom
