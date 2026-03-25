import React, { FC } from 'react'
import { User } from '@shared/types'
import { Badge, List, Tag } from 'antd'
import AvatarText from './Avatar'

const UserListItem: FC<{ user: User }> = ({ user }) => {
  return (
    <List.Item className="!px-0 !py-2 !border-none">
      <List.Item.Meta
        avatar={
          <Badge color={user.online ? 'green' : 'gray'} offset={[-8, 8]} dot>
            <AvatarText src={user.avatar} userName={user.name} shape="square" size="large" style={{ padding: '4px' }} />
          </Badge>
        }
        title={
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">{user.name || 'Unknown User'}</span>
            <Tag color={user.online ? 'green' : 'default'} className="!mr-0 rounded-full px-2 text-[11px] leading-5">
              {user.online ? '在线' : '离线'}
            </Tag>
          </div>
        }
        description={<span className="text-xs text-slate-500">{user.id}</span>}
        className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3 transition-colors hover:bg-slate-50"
      />
    </List.Item>
  )
}

export default UserListItem
