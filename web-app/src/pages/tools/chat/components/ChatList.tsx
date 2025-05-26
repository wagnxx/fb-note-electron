import React, { FC, useState } from 'react'
import ChatGroupList from './ChatGroupList'
import { Descriptions, DescriptionsProps, Flex, Input, List, Space, Tabs, TabsProps } from 'antd'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectJoinedGroupIds } from '@/features/chat/selectors'
import { cn } from '@/lib/utils'
import { sendMessage } from '@/features/chat/service/chatService'
import AvatarUploader from './AvatarUploader'
import UserListItem from './UserListItem'
import Title from 'antd/es/typography/Title'
import { ChatGroup } from '@shared/types'
import { getMessagePreviewType } from '@/utils/utilsString'

const TAB_KEYS = {
  ALL_USER: 'allUser',
}

const ChatList: FC<{ onSelectGroup: (id: string) => void }> = ({ onSelectGroup }) => {
  const [keyword, setKeyword] = useState('')

  const dispatch = useAppDispatch()

  const { groups, wsState, users } = useAppSelector(state => state.chat)
  const joinedGroupIds = useAppSelector(selectJoinedGroupIds)

  const [selectedGroupId, setSelectedGroupId] = useState<string>()
  const [activeTabKey, setActiveTabKey] = useState('tab1')

  const joinedGroups = groups
    .filter(group => joinedGroupIds.includes(group.id))
    .filter(group => group.name.toLowerCase().includes(keyword.toLowerCase()))

  const handleApplySuccess = () => {}
  const handleSelectGroup = (groupId: string) => {
    // setSelectedGroupId(groupId)
    // setStage('chat')
  }

  const handleSelectGroupItem = (id: string) => {
    onSelectGroup(id)
    setSelectedGroupId(id)
  }
  const handleTabKeyChange = (k: string) => {
    setActiveTabKey(k)
    if (k === TAB_KEYS.ALL_USER) {
      sendMessage({ type: 'user-req' })
    }
  }

  const handleUpdateAvatar = (avatar: string) => {
    sendMessage({ type: 'reset-user', avatar, id: wsState.id })
  }

  const getLastedChat = (group: ChatGroup) => {
    const content = group?.messages[group.messages.length - 1].content
    return getMessagePreviewType(content)
  }

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
      key: '1',
      label: 'chat',
      children: (
        <>
          <div className="flex-1 overflow-auto custom-scrollbar pr-1">
            <List
              dataSource={joinedGroups}
              renderItem={group => (
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
                  <div className="truncate w-full">
                    <Title level={5}>{group.name}</Title>
                    <span>{getLastedChat(group)}</span>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </>
      ),
    },
    {
      key: TAB_KEYS.ALL_USER,
      label: 'all user',
      children: (
        <Space direction="vertical">
          {users && users.map(user => <UserListItem key={user.id} user={user}></UserListItem>)}
        </Space>
      ),
    },
    {
      key: '3',
      label: 'groups',
      children: <ChatGroupList onJoined={handleApplySuccess} onSelectGroup={id => {}} />,
    },
    {
      key: '4',
      label: 'profile',
      children: (
        <>
          <Flex justify="center">
            <AvatarUploader username={wsState.username} avatar={wsState.avatar} onUpdateAvatar={handleUpdateAvatar} />
          </Flex>
          <Descriptions items={userDescItems} />
        </>
      ),
    },
  ]

  return (
    <div className="p-2 bg-slate-100 h-full">
      <div className="border-r border-gray-200 ">
        <Input
          allowClear
          // addonAfter={<PlusOutlined onClick={() => setShowApplyPopover(prev => !prev)} />}
          placeholder="Search the list"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </div>

      <Tabs items={tabItems} activeKey={activeTabKey} onChange={handleTabKeyChange} />
    </div>
  )
}

export default ChatList
