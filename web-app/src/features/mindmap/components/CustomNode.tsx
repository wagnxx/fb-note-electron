import React, { ChangeEvent } from 'react'
import { Handle, NodeProps, Position, useNodes } from 'react-flow-renderer'

export interface CustomNodeData {
  label: string
  isExpanded: boolean
  onExpandToggle: () => void
  onAddChild: () => void
  onChangeLabel: (e: ChangeEvent<HTMLInputElement>) => void
  childCount?: number
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, id }) => {
  const nodes = useNodes()
  const currentNode = nodes.find(node => node.id === id)
  const isDragging = currentNode?.dragging || false

  return (
    <div className="custom-node">
      {id === '1' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 'calc(100% + 100px)',
            height: '100px',
            background: 'rgba(0,0,0,0.3)',
            zIndex: '-1',
          }}
        ></div>
      )}
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <p>x: {currentNode?.position.x}</p>
        <input value={data.label} onChange={data.onChangeLabel} className="node-input" />
        {/* <span>{data.label}</span> */}
      </div>
      <div
        className={`node-switch-container ${data.isExpanded ? 'expand' : ''}`}
        onClick={data.onExpandToggle}
      >
        {data.isExpanded ? (
          <span className="expand-icon">-</span>
        ) : (
          data.childCount !== undefined && <span className="child-count">[{data.childCount}]</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
      <div className={`context-menu-container ${isDragging ? 'hidden' : ''}`}>
        <div className="context-menu">
          <div className="context-menu-list">
            <button onClick={data.onAddChild}>Add Child</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomNode
