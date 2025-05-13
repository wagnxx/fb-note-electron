import React, { useState } from 'react'
import { Button, List, Popover, Space } from 'antd'
import JoinGroupModal from './JoinGroupModal'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateGroups } from '@/features/chat/chatSlice'
import { Group } from '@/features/chat/types'
import { sendMessage } from '@/features/chat/service/chatService'
import { selectJoinedGroupIds } from '@/features/chat/selectors'
import CreateGroupModal from './CreateGroupModal'
import { cn } from '@/lib/utils'

const ChatGroupList: React.FC<{
  onSelectGroup: (id: string) => void
}> = ({ onSelectGroup }) => {
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
    }
  }

  const handleSelectGroupItem = (id: string) => {
    onSelectGroup(id)
    setSelectedGroupId(id)
  }

  const groupActions = (
    <div className="w-64 space-y-2">
      <Space className="font-medium text-sm text-gray-600">
        <span>可申请的群组</span>
        <Button size="small" onClick={refreshGroups}>
          刷新
        </Button>
      </Space>
      {unjoinedGroups.length === 0 ? (
        <div className="text-gray-400 text-sm">暂无可申请的群组</div>
      ) : (
        groups.map(group => (
          <div key={group.id} className="border rounded p-2 flex justify-between items-center">
            <div>{group.name}</div>
            {!joinedGroupIds.includes(group.id) ? (
              <Button size="small" type="primary" onClick={() => handleJoin(group)}>
                申请
              </Button>
            ) : (
              <Button onClick={() => handleSelectGroupItem(group.id)}>进入</Button>
            )}
          </div>
        ))
      )}
      <div className="border-t pt-2">
        <Button
          size="small"
          block
          onClick={e => {
            setCreateModalVisible(true)
          }}
        >
          新建群组
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">群组列表</div>
        <div className="flex gap-2">
          <Popover content={groupActions} title={null} trigger="click" open={showApplyPopover} placement="bottomRight">
            <Button size="small" onClick={() => setShowApplyPopover(prev => !prev)}>
              群组操作
            </Button>
          </Popover>
        </div>
      </div>

      {/* 已加入的群组 */}
      <div>
        <List
          dataSource={joinedGroups}
          renderItem={group => (
            <List.Item
              key={group.id}
              onClick={() => handleSelectGroupItem(group.id)}
              className={cn(
                'px-3 py-2 cursor-pointer transition',
                selectedGroupId === group.id ? 'bg-blue-50' : 'hover:bg-gray-100',
              )}
              style={{ border: 'none' }}
            >
              <div className="w-full">{group.name}</div>
            </List.Item>
          )}
        />
      </div>

      {/* 加入群组模态框 */}
      {joinTargetGroup && (
        <JoinGroupModal
          open={joinModalVisible}
          onClose={() => setJoinModalVisible(false)}
          onJoin={confirmJoin}
          groupName={joinTargetGroup.name}
        />
      )}
      <CreateGroupModal open={createModalVisible} onClose={() => setCreateModalVisible(false)} />
    </div>
  )
}

export default ChatGroupList
