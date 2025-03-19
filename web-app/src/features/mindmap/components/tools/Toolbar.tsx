// src/features/mindmap/components/Toolbar.tsx
import React from 'react'
import { Button, Space } from 'antd'

interface ToolbarProps {
  onCreateRootNode?: () => void
  onAppendNode?: () => void
  onCreateNode?: () => void
  onDelete?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onOpen?: () => void
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
}) => {
  const btns = [
    { label: '添加子节点', handler: onAppendNode },
    { label: '创建节点', handler: onCreateNode },
    { label: '创建根节点', handler: onCreateRootNode },
    { label: '删除节点', handler: onDelete },
    { label: ' 撤销', handler: onUndo },
    { label: ' 重做', handler: onRedo },
    { label: '保存', handler: onSave },
    { label: ' 打开文件', handler: onOpen },
  ]
  return (
    <div
      style={{
        marginBottom: '10px',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        position: 'fixed',
        zIndex: '99',
      }}
    >
      <Space>
        {btns.map((btn, index) => (
          <Button key={index} size="small" type="primary" disabled={!btn.handler} onClick={btn.handler}>
            {btn.label}
          </Button>
        ))}
      </Space>
    </div>
  )
}

export default Toolbar
