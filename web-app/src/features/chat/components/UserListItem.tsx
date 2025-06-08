import React, { FC } from 'react'
import { User } from '@shared/types'
import { Badge, List } from 'antd'
import AvatarText from './Avatar'

const UserListItem: FC<{ user: User }> = ({ user }) => {
  return (
    // <div className="flex  items-center gap-3">
    //   <Badge color={user.online ? 'green' : 'gray'} offset={[-8, 8]} dot>
    //     <AvatarText src={user.avatar} userName={user.name} shape="square" size="large" style={{ padding: '4px' }} />
    //   </Badge>
    //   <Title level={5}>{user.name}</Title>
    // </div>
    <List.Item>
      <List.Item.Meta
        avatar={
          <Badge color={user.online ? 'green' : 'gray'} offset={[-8, 8]} dot>
            <AvatarText src={user.avatar} userName={user.name} shape="square" size="large" style={{ padding: '4px' }} />
          </Badge>
        }
        title={user.name}
      />
    </List.Item>
  )
}

export default UserListItem
