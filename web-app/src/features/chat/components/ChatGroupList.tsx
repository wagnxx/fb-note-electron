import React, { useMemo, useState } from 'react'
import { Avatar, Button, Empty, Popconfirm, Tag, Tooltip } from 'antd'
import JoinGroupModal from './JoinGroupModal'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { updateWebSocketState } from '@/features/chat/chatSlice'
import { send, sendWithRes } from '@/features/chat/service/chatService'
import CreateGroupModal from './CreateGroupModal'
import { cn } from '@/lib/utils'
import { PlusOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons'
import { ChatGroup as Group } from '@shared/types'

const ChatGroupList: React.FC<{
  onSelectGroup: (id: string) => void
  onJoined: () => void
}> = ({ onSelectGroup, onJoined }) => {
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string>()

  const { groups, wsState, joinedGroups } = useAppSelector(state => state.chat)

  const dispatch = useAppDispatch()
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [joinTargetGroup, setJoinTargetGroup] = useState<Omit<Group, 'messages'> | null>(null)
  const joinedGroupIds = useMemo(() => new Set(joinedGroups.map(item => item.group.id)), [joinedGroups])

  const refreshGroups = () => {
    void sendWithRes('groups-req', {}).catch(() => undefined)
  }

  const applyJoinGroup = (username: string, group: Group) => {
    send('join', {
      username,
      userId: wsState.id,
      groupId: group.id,
    })

    onJoined()
  }

  const handleJoin = (group: Omit<Group, 'messages'>) => {
    setJoinTargetGroup(group)

    if (!wsState.username) {
      setJoinModalVisible(true)
    } else {
      applyJoinGroup(wsState.username!, group)
    }
  }

  const confirmJoin = (username: string) => {
    if (!joinTargetGroup) return

    applyJoinGroup(username, joinTargetGroup)
    dispatch(updateWebSocketState({ username }))
    setJoinModalVisible(false)
  }

  const isJoinedGroup = (groupId: string) => joinedGroupIds.has(groupId)

  const groupActions = (
    <div className="space-y-2.5">
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 py-8">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可申请的群组" />
        </div>
      ) : (
        groups.map(group => {
          const isJoined = isJoinedGroup(group.id)
          const groupInitial = group.name?.slice(0, 1).toUpperCase() || 'G'

          return (
            <div
              key={group.id}
              onClick={() => {
                if (!isJoined) return
                setSelectedGroupId(group.id)
                onSelectGroup(group.id)
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-2xl transition-all select-none border',
                isJoined ? 'cursor-pointer' : 'cursor-default',
                selectedGroupId === group.id
                  ? 'bg-blue-50/90 text-blue-700 shadow-sm border-blue-200 ring-1 ring-blue-100'
                  : isJoined
                    ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-white/90 border-slate-200',
              )}
            >
              <Avatar
                size={42}
                className={cn(
                  '!flex !items-center !justify-center !font-semibold',
                  isJoined ? '!bg-blue-100 !text-blue-700' : '!bg-slate-200 !text-slate-600',
                )}
              >
                {groupInitial}
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-slate-800">{group.name}</span>
                  <Tag color={isJoined ? 'blue' : 'default'} className="!mr-0 rounded-full px-2 text-[11px] leading-5">
                    {isJoined ? '已加入' : '可申请'}
                  </Tag>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <TeamOutlined />
                  <span>{isJoined ? '点击进入会话' : '申请后即可加入此群组'}</span>
                </div>
              </div>

              {!isJoined && (
                <Popconfirm
                  title="Join"
                  description="Are you sure  to join this Group?"
                  onConfirm={event => {
                    event?.stopPropagation()
                    handleJoin(group)
                  }}
                  onCancel={event => event?.stopPropagation()}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    size="small"
                    type="primary"
                    className="!rounded-full !shadow-none"
                    onClick={event => event.stopPropagation()}
                    onMouseDown={event => event.stopPropagation()}
                  >
                    申请
                  </Button>
                </Popconfirm>
              )}
            </div>
          )
        })
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-800">群组广场</div>
          <div className="mt-1 text-xs text-slate-500">发现新群组，已加入的群可以直接进入会话</div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip title="刷新群组列表">
            <Button size="small" icon={<ReloadOutlined />} className="!rounded-full" onClick={refreshGroups} />
          </Tooltip>
          <Tooltip title="创建群组">
            <Button
              size="small"
              type="text"
              className="!rounded-full"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            />
          </Tooltip>
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 p-1 border border-slate-100">{groupActions}</div>

      {/* 群组列表区域 */}

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
