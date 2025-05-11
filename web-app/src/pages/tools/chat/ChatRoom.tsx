import React, { useState } from 'react'
import { Button } from 'antd'
import ChatGroupList from './components/ChatGroupList'
import ChatWindow from './components/ChatWindow'
import CreateGroupModal from './components/CreateGroupModal'
import { useWSListener } from '@/features/chat/hooks/useWSListener'

const ChatRoom: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [joinGroupId, setJoinGroupId] = useState<string | null>(null)

  // const joinedGroupIds = useAppSelector(selectJoinedGroupIds)

  useWSListener()

  return (
    <div className="flex bg-white" style={{ height: 'calc(100vh - 30px)' }}>
      {/* 左侧群组列表 */}
      <div className="w-1/4 border-r border-gray-200 p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">聊天组</h2>
          <Button type="primary" size="small" onClick={() => setCreateModalVisible(true)}>
            新建
          </Button>
        </div>

        {/* 申请加入 */}
        {/* <div className="space-y-2">
          <div className="font-medium">申请加入群组</div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择一个群组"
            onChange={setJoinGroupId}
            options={groups
              .filter(group => !isGroupJoined(joinedGroupIds, group.id)) // 使用纯函数来动态筛选未加入的群组
              .map(group => ({ value: group.id, label: group.name }))}
          />
        </div> */}

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

      <CreateGroupModal open={createModalVisible} onClose={() => setCreateModalVisible(false)} />
    </div>
  )
}

export default ChatRoom
