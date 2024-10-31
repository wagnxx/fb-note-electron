import React from 'react'
import { Handle, Position } from 'react-flow-renderer'

interface CustomNodeProps {
  data: {
    label: string
    isExpanded: boolean
    onExpandToggle: () => void
  }
}

const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  return (
    <div className="custom-node">
      <div className="node-label" onClick={data.onExpandToggle}>
        {data.label}
        <span>{data.isExpanded ? '[-]' : '[+]'}</span>
      </div>
      {data.isExpanded && <div className="children">{/* Render children here */}</div>}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default CustomNode
