import React, { useState } from 'react'
import { Button, Space } from 'antd'
import JoinGroupModal from './JoinGroupModal'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateGroups } from '@/features/chat/chatSlice'
import { sendMessage } from '@/features/chat/service/chatService'
import { selectJoinedGroupIds } from '@/features/chat/selectors'
import CreateGroupModal from './CreateGroupModal'
import { cn } from '@/lib/utils'
import { PlusOutlined } from '@ant-design/icons'
import { ChatGroup as Group } from '@shared/types'

const ChatGroupList: React.FC<{
  onSelectGroup: (id: string) => void
  onJoined: () => void
}> = ({ onSelectGroup, onJoined }) => {
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string>()
  const [showApplyPopover, setShowApplyPopover] = useState(false)

  const { groups, wsState } = useAppSelector(state => state.chat)
  const joinedGroupIds = useAppSelector(selectJoinedGroupIds)

  const dispatch = useAppDispatch()
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [joinTargetGroup, setJoinTargetGroup] = useState<Group | null>(null)

  const joinedGroups = groups.filter(group => joinedGroupIds.includes(group.id))
  const unjoinedGroups = groups.filter(group => !joinedGroupIds.includes(group.id))

  const refreshGroups = () => {
    sendMessage({ type: 'group-req' })
  }

  const handleJoin = (group: Group) => {
    setJoinTargetGroup(group)
    setJoinModalVisible(true)
  }

  const confirmJoin = (username: string) => {
    if (joinTargetGroup) {
      sendMessage({
        type: 'join',
        username,
        userId: wsState.id,
        groupId: joinTargetGroup.id,
      })
      const updated = groups.map(g => (g.id === joinTargetGroup.id ? { ...g, joined: true } : g))
      dispatch(updateGroups(updated))
      setJoinModalVisible(false)
      onJoined()
    }
  }

  const handleSelectGroupItem = (id: string) => {
    onSelectGroup(id)
    setSelectedGroupId(id)
  }

  const groupActions = (
    <div className="space-y-2">
      <Space className="font-medium text-sm text-gray-600">{/* <span>可申请的群组</span> */}</Space>
      {groups.length === 0 ? (
        <div className="text-gray-400 text-sm">暂无可申请的群组</div>
      ) : (
        groups.map(group => (
          <div
            key={group.id}
            // className="border rounded-md p-2 flex justify-between items-center bg-white hover:shadow-sm transition"
            className={cn(
              'flex justify-between px-4 py-2 cursor-pointer rounded-md transition-all select-none',
              selectedGroupId === group.id ? 'bg-blue-100 text-blue-700 font-medium shadow-sm' : 'hover:bg-gray-100',
            )}
          >
            <div className="truncate">{group.name}</div>

            {!joinedGroupIds.includes(group.id) && (
              <Button size="small" type="primary" onClick={() => handleJoin(group)}>
                申请
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200 p-4 rounded-tr-xl space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex justify-start items-center gap-2">
        <div className="text-base font-semibold text-gray-800">群组列表</div>
        {/* <Popover
          content={groupActions}
          title={null}
          trigger="click"
          open={showApplyPopover}
          onOpenChange={setShowApplyPopover}
          placement="bottomRight"
        >
          <Button size="small" type="dashed">
            群组操作
          </Button>
        </Popover> */}
        <Button size="small" className=" ml-auto" onClick={refreshGroups}>
          刷新
        </Button>
        <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)} />
      </div>

      {groupActions}

      {/* 群组列表区域 */}
      {/* <div className="flex-1 overflow-auto custom-scrollbar pr-1">
        <List
          dataSource={joinedGroups}
          renderItem={group => (
            <List.Item
              key={group.id}
              onClick={() => handleSelectGroupItem(group.id)}
              className={cn(
                'px-4 py-2 cursor-pointer rounded-md transition-all select-none',
                selectedGroupId === group.id ? 'bg-blue-100 text-blue-700 font-medium shadow-sm' : 'hover:bg-gray-100',
              )}
              style={{ border: 'none' }}
            >
              <div className="truncate w-full">{group.name}</div>
            </List.Item>
          )}
        />
      </div> */}

      {/* 加入群组模态框 */}
      {joinTargetGroup && (
        <JoinGroupModal
          open={joinModalVisible}
          onClose={() => setJoinModalVisible(false)}
          onJoin={confirmJoin}
          groupName={joinTargetGroup.name}
        />
      )}

      {/* 创建群组模态框 */}
      <CreateGroupModal open={createModalVisible} onClose={() => setCreateModalVisible(false)} />
    </div>
  )
}

export default ChatGroupList
