// src/features/mindmap/components/Toolbar.tsx
import React from 'react'
import { Button, Space } from 'antd'

interface ToolbarProps {
  onAddNode: () => void
  onDelete: () => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onOpen: () => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  onDelete,
  onUndo,
  onRedo,
  onSave,
  onOpen,
}) => {
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
        <Button type="primary" onClick={onAddNode}>
          添加节点
        </Button>
        <Button onClick={onDelete}>删除节点</Button>
        <Button onClick={onUndo}>撤销</Button>
        <Button onClick={onRedo}>重做</Button>
        <Button type="default" onClick={onSave}>
          保存
        </Button>
        <Button type="default" onClick={onOpen}>
          打开文件
        </Button>
      </Space>
    </div>
  )
}

export default Toolbar
