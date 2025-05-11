import React, { useState } from 'react'
import { Button } from 'antd'
import JoinGroupModal from './JoinGroupModal'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateGroups } from '@/features/chat/chatSlice'
import { Group } from '@/features/chat/types'
import { sendMessage } from '@/features/chat/service/chatService'
import { selectJoinedGroupIds } from '@/features/chat/selectors'

const ChatGroupList: React.FC<{
  onSelectGroup: (id: string) => void
}> = ({ onSelectGroup }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>()
  const { groups, wsState } = useAppSelector(state => state.chat)
  const joinedGroupIds = useAppSelector(selectJoinedGroupIds)

  const dispatch = useAppDispatch()

  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [joinTargetGroup, setJoinTargetGroup] = useState<Group | null>(null)

  // 计算每个群组的 joined 状态
  const processedGroups = groups.map(group => ({
    ...group,
    joined: joinedGroupIds.includes(group.id), // 判断是否已加入
  }))

  // 刷新群组
  const refreshGroups = () => {
    sendMessage({ type: 'group-req' }) // 刷新请求，获取最新群组数据
  }

  const handleJoin = (group: Group) => {
    setJoinTargetGroup(group)
    setJoinModalVisible(true)
  }

  const confirmJoin = (username: string) => {
    if (joinTargetGroup) {
      // message.success(`${username} 加入了 ${joinTargetGroup.name}`)
      // 更新 groups 状态，将加入的群组标记为 joined
      const updated = processedGroups.map(g => (g.id === joinTargetGroup.id ? { ...g, joined: true } : g))
      sendMessage({
        type: 'join',
        username,
        userId: wsState.id,
        groupId: joinTargetGroup.id,
      })
      dispatch(updateGroups(updated)) // 更新群组数据
      setJoinModalVisible(false)
    }
  }

  const handleSelectGroupItem = (id: string) => {
    onSelectGroup(id)
    setSelectedGroupId(id)
  }

  return (
    <div className="space-y-2">
      {/* ✅ 刷新按钮 */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">群组列表</div>
        <Button size="small" onClick={refreshGroups}>
          刷新
        </Button>
      </div>

      {/* ✅ 展示所有群组 */}
      <div className="space-y-2">
        {processedGroups.map(group => (
          <div
            key={group.id}
            className={`border rounded p-2 flex justify-between items-center cursor-pointer ${
              selectedGroupId === group.id ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div>{group.name}</div>
            {group.joined ? (
              <Button size="small" onClick={() => handleSelectGroupItem(group.id)}>
                进入
              </Button>
            ) : (
              <Button size="small" type="primary" onClick={() => handleJoin(group)}>
                申请加入
              </Button>
            )}
          </div>
        ))}
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
    </div>
  )
}

export default ChatGroupList
