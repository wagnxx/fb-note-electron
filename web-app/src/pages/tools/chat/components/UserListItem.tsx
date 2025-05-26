import { Badge } from 'antd'
import React, { FC } from 'react'
import AvatarText from './Avatar'
import { User } from '@shared/types'
import Title from 'antd/es/typography/Title'

const UserListItem: FC<{ user: User }> = ({ user }) => {
  return (
    <div className="flex justify-center gap-3">
      <Badge color={user.online ? 'green' : 'gray'} offset={[-8, 8]} dot>
        <AvatarText src={user.avatar} userName={user.name} shape="square" size="large" style={{ padding: '4px' }} />
      </Badge>
      <Title level={5}>{user.name}</Title>
    </div>
  )
}

export default UserListItem
