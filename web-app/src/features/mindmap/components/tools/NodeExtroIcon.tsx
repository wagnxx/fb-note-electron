import React, { FC, HTMLAttributes } from 'react'

type PositionType = 'left' | 'right' | 'top' | 'bottom'
type NodeExtroIconProps = {
  position?: PositionType
} & HTMLAttributes<HTMLDivElement> // 继承 div 的原生属性

const NodeExtroIcon: FC<NodeExtroIconProps> = ({ position = 'right', children, ...rest }) => {
  const postionsStyle: Record<PositionType, React.CSSProperties> = {
    left: {
      left: '-24px',
      top: '50%',
      transform: ' translateY(-50%)',
    },
    right: {
      right: '-24px',
      top: '50%',
      transform: ' translateY(-50%)',
    },
    top: {
      left: '50%',
      top: '-50%',
      transform: ' translateX(-50%)',
    },
    bottom: {
      left: '50%',
      bottom: '50%',
      transform: ' translateX(-50%)',
    },
  }
  return (
    <div
      style={{
        position: 'absolute',
        width: '30px',
        height: '30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...postionsStyle[position],
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export default NodeExtroIcon
