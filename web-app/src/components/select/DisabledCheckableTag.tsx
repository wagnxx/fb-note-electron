import React, { ReactNode } from 'react'
import { Tag } from 'antd'

// 定义Props类型
interface DisabledCheckableTagProps {
  disabled?: boolean // 控制是否禁用
  checked: boolean // 当前选中状态
  onChange: (checked: boolean) => void // 变更选中状态的回调
  children: ReactNode // Tag 的子元素
}

const DisabledCheckableTag: React.FC<DisabledCheckableTagProps> = ({
  disabled = false,
  onChange,
  checked,
  children,
}) => {
  return (
    <Tag.CheckableTag
      checked={checked}
      onChange={disabled ? undefined : onChange} // 禁用时不处理 onChange
      style={disabled ? { pointerEvents: 'none', opacity: 0.5 } : {}} // 禁用时样式
    >
      {children}
    </Tag.CheckableTag>
  )
}

export default DisabledCheckableTag
