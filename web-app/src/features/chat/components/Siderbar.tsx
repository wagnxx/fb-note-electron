import React, { useEffect, useImperativeHandle, useState } from 'react'
import { Avatar, Empty, List } from 'antd'
import { useAppSelector } from '@/store/hooks'
import { cn } from '@/lib/utils'
import { sendWithRes } from '@/features/chat/service/chatService'
import { ChatGroupWithMember } from '@shared/types'
import { mergeBase64Avatars } from '@/utils/utilsImage'
import useFirstRender from '@/hooks/useFirstRender'
import { getMessagePreviewType } from '@/utils/utilsString'
import { delayFor } from '@/utils/utilsAsyncFunc'

export const BLACK_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAEklEQVR4nO3BMQEAAAgCoNm/9F3hAAcAqCwR+AIAAAAASUVORK5CYII='

type SiderbarProps = { isMobile: boolean; onSelectGroup: (id: string) => void }
// 你期望暴露出去的 ref 类型（可以自定义具体能力）
export type SiderbarRef = {
  init: () => void
}

const Siderbar = ({ isMobile, onSelectGroup }: SiderbarProps, ref: React.Ref<SiderbarRef>) => {
  const { wsState, users, joinedGroups } = useAppSelector(state => state.chat)

  const [selectedGroupId, setSelectedGroupId] = useState<string>()

  const [groupsWithAvatar, setGroupsWithAvatar] = useState<
    (ChatGroupWithMember & { avatar?: string; lastMsg?: string })[]
  >([])

  const isFirstRender = useFirstRender()

  useEffect(() => {
    delayFor(500).then(() => {
      void sendWithRes('users-req', {}).catch(() => undefined)
    })
  }, [wsState.id])

  useEffect(() => {
    void sendWithRes('joined-groups-req', { id: wsState.id }).catch(() => undefined)
  }, [wsState.id])

  const handleSelectGroupItem = (id: string) => {
    onSelectGroup(id)
    setSelectedGroupId(id)
  }

  useImperativeHandle(
    ref,
    () => ({
      init() {
        return
      },
    }),
    [],
  )
  useEffect(() => {
    const loadAvatars = async (isEmpty: boolean) => {
      if (isEmpty) {
        const result = joinedGroups.map(({ group, latestMessage }) => {
          return {
            ...group,
            avatar: BLACK_PLACEHOLDER,
            lastMsg: getMessagePreviewType(latestMessage?.content),
          }
        })

        setGroupsWithAvatar(result)
        return
      }

      const result = await Promise.all(
        joinedGroups.map(async ({ group, latestMessage }) => {
          // 取前面成员中有头像的最多4个
          const userImages = group.members
            .map(user => user?.avatar)
            .filter(Boolean)
            .slice(0, 4) as string[]

          while (userImages.length < 4) {
            userImages.push(BLACK_PLACEHOLDER)
          }

          const avatar = await mergeBase64Avatars(userImages, 100)

          return {
            ...group,
            avatar,
            lastMsg: getMessagePreviewType(latestMessage?.content),
          }
        }),
      )

      setGroupsWithAvatar(result)
    }

    const getAvatars = () => {
      if (users?.length && joinedGroups.length) {
        loadAvatars(false)
      } else if (isFirstRender) {
        loadAvatars(true)
      }
    }
    getAvatars()
  }, [joinedGroups, users, isFirstRender])

  return (
    <div
      className={cn(
        'h-full bg-white overflow-auto custom-scrollbar',
        isMobile ? 'p-2' : 'p-2 border-r border-slate-200',
      )}
    >
      <List
        dataSource={groupsWithAvatar}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={wsState.isConnected ? '暂无会话组' : '离线状态'} />
          ),
        }}
        renderItem={group => (
          <List.Item
            key={group.id}
            onClick={() => handleSelectGroupItem(group.id)}
            className={cn(
              'px-3 py-2 mb-1 cursor-pointer rounded-xl transition-all select-none border border-transparent',
              selectedGroupId === group.id
                ? 'bg-blue-50 text-blue-700 shadow-sm border-blue-100'
                : 'hover:bg-slate-50 hover:border-slate-200',
            )}
            style={{ borderBottom: 'none' }}
          >
            <List.Item.Meta
              avatar={<Avatar src={group.avatar} className="!bg-slate-200" />}
              title={<span className="font-medium text-slate-800">{group.name}</span>}
              description={<span className="text-xs text-slate-500">{group.lastMsg || '暂无消息'}</span>}
            />
          </List.Item>
        )}
      />
    </div>
  )
}

// export default Siderbar

export default React.forwardRef(Siderbar)
