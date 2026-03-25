import React, { useEffect, useImperativeHandle, useState } from 'react'
import ChatGroupList from './ChatGroupList'
import { Avatar, Descriptions, DescriptionsProps, Flex, Input, List, Tabs, TabsProps } from 'antd'
import { useAppSelector } from '@/store/hooks'
import { cn } from '@/lib/utils'
import { send, sendWithRes } from '@/features/chat/service/chatService'
import AvatarUploader from './AvatarUploader'
import UserListItem from './UserListItem'
import { ChatGroupWithMember } from '@shared/types'
import { mergeBase64Avatars } from '@/utils/utilsImage'
import useFirstRender from '@/hooks/useFirstRender'
import { getMessagePreviewType } from '@/utils/utilsString'
import { delayFor } from '@/utils/utilsAsyncFunc'

const TAB_KEYS = {
  ALL_USER: 'allUser',
  CHAT_LIST: 'chatList',
  ALL_GROUPS: 'allGroups',
}

export const BLACK_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAEklEQVR4nO3BMQEAAAgCoNm/9F3hAAcAqCwR+AIAAAAASUVORK5CYII='

type SiderbarProps = { isMobile: boolean; onSelectGroup: (id: string) => void }
// 你期望暴露出去的 ref 类型（可以自定义具体能力）
export type SiderbarRef = {
  init: () => void
}

const Siderbar = ({ isMobile, onSelectGroup }: SiderbarProps, ref: React.Ref<SiderbarRef>) => {
  const [keyword, setKeyword] = useState('')

  const { wsState, users, joinedGroups } = useAppSelector(state => state.chat)

  const [selectedGroupId, setSelectedGroupId] = useState<string>()
  const [activeTabKey, setActiveTabKey] = useState('')

  const [groupsWithAvatar, setGroupsWithAvatar] = useState<
    (ChatGroupWithMember & { avatar?: string; lastMsg?: string })[]
  >([])

  const isFirstRender = useFirstRender()

  useEffect(() => {
    delayFor(500).then(() => {
      sendWithRes('users-req', {})
    })

    if (activeTabKey === TAB_KEYS.CHAT_LIST) {
      sendWithRes('joined-groups-req', { id: wsState.id })
    }
    if (activeTabKey === TAB_KEYS.ALL_GROUPS) {
      sendWithRes('groups-req', {})
    }
  }, [activeTabKey, wsState.id])

  const handleApplySuccess = () => {}

  const handleSelectGroupItem = (id: string) => {
    onSelectGroup(id)
    setSelectedGroupId(id)
  }

  const handleUpdateAvatar = (avatar: string) => {
    send('reset-user', { avatar, id: wsState.id })
  }

  useImperativeHandle(
    ref,
    () => ({
      init() {
        setActiveTabKey(TAB_KEYS.CHAT_LIST)
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
      if (activeTabKey !== TAB_KEYS.CHAT_LIST) return

      if (users?.length && joinedGroups.length) {
        loadAvatars(false)
      } else if (isFirstRender) {
        loadAvatars(true)
      }
    }
    getAvatars()
  }, [joinedGroups, users, isFirstRender, activeTabKey])

  const userDescItems: DescriptionsProps['items'] = [
    {
      key: '1',
      label: 'userName',
      children: wsState.username,
    },
    {
      key: '2',
      label: 'userId',
      children: wsState.id,
    },
    {
      key: '3',
      label: 'ws is connected',
      children: String(wsState.isConnected),
    },
  ]

  const tabItems: TabsProps['items'] = [
    {
      key: TAB_KEYS.CHAT_LIST,
      label: 'chat',
      disabled: !wsState.isConnected,
      children: (
        <>
          <div className="flex-1 overflow-auto custom-scrollbar pr-1">
            <List
              dataSource={groupsWithAvatar}
              renderItem={(group, index) => (
                <List.Item
                  key={group.id}
                  onClick={() => handleSelectGroupItem(group.id)}
                  className={cn(
                    'px-4 py-2 cursor-pointer rounded-md transition-all select-none',
                    selectedGroupId === group.id
                      ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                      : 'hover:bg-gray-100',
                  )}
                  style={{ border: 'none' }}
                >
                  {/* <div className="truncate w-full">
                    <Title level={5}>{group.name}</Title>
                    <span>{getLastedChat(group)}</span>
                  </div> */}
                  <List.Item.Meta
                    avatar={<Avatar src={group.avatar} />}
                    title={<a>{group.name}</a>}
                    description={group.lastMsg}
                  />
                </List.Item>
              )}
            />
            <div>
              <img src={BLACK_PLACEHOLDER} style={{ width: '90%', height: '40px' }} />
            </div>
          </div>
        </>
      ),
    },
    {
      key: TAB_KEYS.ALL_USER,
      label: 'all user',
      disabled: !wsState.isConnected,
      children: users && (
        <div className="flex-1 overflow-auto custom-scrollbar pr-1">
          <List
            dataSource={users}
            renderItem={user => <UserListItem key={user.id} user={user}></UserListItem>}
            rowKey={'id'}
            split
          />
        </div>
      ),
    },
    {
      key: TAB_KEYS.ALL_GROUPS,
      label: 'groups',
      disabled: !wsState.isConnected,
      children: <ChatGroupList onJoined={handleApplySuccess} onSelectGroup={id => {}} />,
    },
    {
      key: '4',
      label: 'profile',
      children: (
        <div>
          <Flex justify="center">
            <AvatarUploader username={wsState.username} avatar={wsState.avatar} onUpdateAvatar={handleUpdateAvatar} />
          </Flex>
          <Descriptions items={userDescItems} column={1} />
        </div>
      ),
    },
  ]

  return (
    <div className={cn('p-2 h-full flex flex-col', isMobile ? '' : '  border-r-slate-50')}>
      <div className="border-r border-gray-200  pb-3">
        <Input
          allowClear
          // addonAfter={<PlusOutlined onClick={() => setShowApplyPopover(prev => !prev)} />}
          placeholder="Search the list"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </div>

      <Tabs
        className="flex-1 overflow-hidden"
        items={tabItems}
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        tabPosition={isMobile ? 'top' : 'left'}
      />
    </div>
  )
}

// export default Siderbar

export default React.forwardRef(Siderbar)
