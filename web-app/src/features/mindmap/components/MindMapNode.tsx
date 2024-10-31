// src/features/mindmap/components/MindMapNode.tsx
import React from 'react'
import { Handle, Position } from 'react-flow-renderer'

const MindMapNode: React.FC<{ data: { label: string } }> = ({ data }) => {
  return (
    <div
      style={{ padding: 10, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 5 }}
    >
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default MindMapNode
