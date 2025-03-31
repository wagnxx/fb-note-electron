// src/features/mindmap/components/Toolbar.tsx
import React from 'react'
import { Button, Dropdown, Space } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'

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
}) => {
  const btns = [
    { label: 'Append Node', handler: onAppendNode },
    { label: 'Create Node', handler: onCreateNode },
    { label: 'Create Root', handler: onCreateRootNode },
    { label: 'Delete', handler: onDelete },
    { label: 'Toggle Note', handler: onToggleNote },
    { label: 'Log Nodes', handler: onLogNodes },
    { label: ' 撤销', handler: onUndo },
    { label: ' 重做', handler: onRedo },
    { label: '保存', handler: onSave },
    { label: ' 打开文件', handler: onOpen },
  ]
  const validBtns = btns.filter(item => item.handler)
  return (
    <div
      style={{
        marginBottom: '10px',
        padding: '10px',
        backgroundColor: 'rgb(238 242 255 / var(--tw-bg-opacity))',
        borderRadius: '6px',
        // boxShadow: '1px 1px 4px rgba(0, 0, 0, 0.4)',
        position: 'absolute',
        right: '12px',
        top: '16px',
        zIndex: '99',
      }}
    >
      <Space>
        {validBtns
          .slice(0, 1)
          .filter(item => item.handler)
          .map((btn, index) => (
            <Button key={index} size="small" type="text" disabled={!btn.handler} onClick={btn.handler}>
              {btn.label}
            </Button>
          ))}
        <Dropdown
          menu={{
            items: validBtns.slice(1).map((btn, index) => ({
              key: index,
              label: (
                <Button key={index} size="small" type="text" disabled={!btn.handler} onClick={btn.handler}>
                  {btn.label}
                </Button>
              ),
            })),
          }}
        >
          <Button type="text" icon={<EllipsisOutlined />}></Button>
        </Dropdown>
      </Space>
    </div>
  )
}

export default Toolbar
