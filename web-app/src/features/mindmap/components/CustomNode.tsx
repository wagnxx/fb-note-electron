import React, { ChangeEvent } from 'react'
import { Handle, NodeProps, Position, useNodes } from 'react-flow-renderer'

export interface CustomNodeData {
  label: string
  isExpanded: boolean
  onExpandToggle: () => void
  onAddChild: () => void
  onChangeLabel: (e: ChangeEvent<HTMLInputElement>) => void
  childCount?: number
  rectRange?: {
    left: number
    right: number
    top: number
    bottom: number
  }
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, id }) => {
  const nodes = useNodes()
  const currentNode = nodes.find(node => node.id === id)
  const isDragging = currentNode?.dragging || false
  const currentNodePostion = currentNode?.position || { x: 0, y: 0 }

  return (
    <div className="custom-node">
      {id === '1' && data.isExpanded && (
        <div
          style={{
            position: 'absolute',
            top:
              (data?.rectRange?.top || 0) > currentNodePostion.y
                ? 0
                : (data?.rectRange?.top || 0) - currentNodePostion.y,
            left: 0,
            width: `${(data?.rectRange?.right || 100) - (data?.rectRange?.left || 0)}px`,
            height: `${(data?.rectRange?.bottom || 100) - (data?.rectRange?.top || 0)}px`,
            background: 'rgba(0,0,0,0.3)',
            zIndex: '-1',
          }}
        ></div>
      )}
      <div style={{ visibility: 'hidden' }}>
        <Handle type="target" position={Position.Left} />
      </div>
      <div className="node-content">
        {/* <p>x: {currentNode?.position.x}</p> */}
        <div className="node-input-wrapper">
          <input
            value={data.label}
            onChange={data.onChangeLabel}
            className="node-input"
            title={data.label}
          />
          {/* <span>{data.label}</span> */}
        </div>
      </div>
      {(data?.childCount || 0) > 0 && (
        <div
          className={`node-switch-container ${data.isExpanded ? 'expand' : ''}`}
          onClick={data.onExpandToggle}
        >
          {data.isExpanded ? (
            <span className="expand-icon">-</span>
          ) : (
            data.childCount !== undefined && (
              <span className="child-count">[{data.childCount}]</span>
            )
          )}
        </div>
      )}
      <div style={{ visibility: 'hidden' }}>
        <Handle type="source" position={Position.Right} />
      </div>

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
