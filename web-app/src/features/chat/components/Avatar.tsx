import { Avatar, AvatarProps } from 'antd'
import React, { FC } from 'react'

type Props = { userName?: string | null; style?: React.CSSProperties; className?: string } & Partial<AvatarProps>

const AvatarText: FC<Props> = ({ userName, ...rest }) => {
  // return <div>{userName}</div>
  const U = userName?.charAt(0).toUpperCase() || 'U'
  return <Avatar {...rest}>{U}</Avatar>
}

export default AvatarText
