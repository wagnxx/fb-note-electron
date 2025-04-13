// src/features/mindmap/components/Toolbar.tsx
import React from 'react'
import { Button, Dropdown, MenuProps } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { MenuItemType } from 'antd/es/menu/interface'

interface ToolbarProps {
  onCreateRootNode?: () => void
  onAppendNode?: () => void
  onCreateNode?: () => void
  onDelete?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onOpen?: () => void
  onLogNodes?: () => void
  onToggleNote?: () => void
  onArrange?: (type: 'line' | 'vertical' | 'grid') => void
  onGroupSelections?: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  onCreateRootNode,
  onAppendNode,
  onCreateNode,
  onDelete,
  onUndo,
  onRedo,
  onSave,
  onOpen,
  onLogNodes,
  onToggleNote,
  onArrange,
  onGroupSelections,
}) => {
  const btns: MenuProps['items'] = [
    { key: '1', label: 'Append Node', onClick: onAppendNode },
    { key: '2', label: 'Group Selections', onClick: onGroupSelections },
    { key: '3', label: 'Create Node', onClick: onCreateNode },
    { key: '4', label: 'Create Root', onClick: onCreateRootNode },
    { key: '5', label: 'Delete', onClick: onDelete },
    { key: '6', label: 'Toggle Note', onClick: onToggleNote },
    { key: '7', label: 'Log Nodes', onClick: onLogNodes },
    {
      key: 'Ar',
      label: 'Arrange',
      type: 'submenu',
      children: [
        {
          key: 'ar-line',
          label: 'Arrange Line',
          onClick: () => onArrange?.('line'),
        },
        {
          key: 'ar-vertical',
          label: 'Arrange Vertical',
          onClick: () => onArrange?.('vertical'),
        },
        {
          key: 'ar-grid',
          label: 'Arrange Grid',
          onClick: () => onArrange?.('grid'),
        },
      ],
    },
    { key: ' 撤', label: ' 撤销', onClick: onUndo },
    { key: ' 重', label: ' 重做', onClick: onRedo },
    { key: '保存', label: '保存', onClick: onSave },
    { key: ' 打', label: ' 打开文件', onClick: onOpen },
  ]
  const validBtns = btns
    .filter(Boolean)
    .filter((item): item is MenuItemType => 'onClick' in item! || item!.type === 'submenu')

  return (
    <Dropdown
      menu={{
        items: validBtns.slice(0),
      }}
    >
      <Button type="text" icon={<DownOutlined />} iconPosition="end">
        Operation Action
      </Button>
    </Dropdown>
  )
}

export default Toolbar
