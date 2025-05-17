import React, { FC, useState } from 'react'
import ChatGroupList from './ChatGroupList'
import { Input, List, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useAppSelector } from '@/store/hooks'
import { selectJoinedGroupIds } from '@/features/chat/selectors'
import { cn } from '@/lib/utils'

const ChatList: FC<{ onSelectGroup: (id: string) => void }> = ({ onSelectGroup }) => {
  const [showApplyPopover, setShowApplyPopover] = useState(false)
  const [keyword, setKeyword] = useState('')

  const { groups, wsState } = useAppSelector(state => state.chat)
  const joinedGroupIds = useAppSelector(selectJoinedGroupIds)

  const [selectedGroupId, setSelectedGroupId] = useState<string>()

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

  return (
    <div className="p-2">
      <div className="border-r border-gray-200 ">
        <Input
          allowClear
          addonAfter={<PlusOutlined onClick={() => setShowApplyPopover(prev => !prev)} />}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-1">
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
      </div>

      <Modal
        closable={false}
        title={null}
        open={showApplyPopover}
        onCancel={() => setShowApplyPopover(false)}
        children={<ChatGroupList onJoined={handleApplySuccess} onSelectGroup={id => {}} />}
        footer={null}
      />
    </div>
  )
}

export default ChatList
