import React, { memo } from 'react'
import { Handle, Node, NodeProps, Position } from '@xyflow/react'
import { NodeHeader, NodeHeaderActions, NodeHeaderTitle } from '@/components/lib/components/node-header'
import { BaseNode } from '@/components/lib/components/base-node'
import './ExNode.css'
import { CustomNodeData } from '../../types'
import { EllipsisOutlined } from '@ant-design/icons'
import { Popover, Menu } from 'antd'

// 方法类型
export interface CustomNodeProps extends NodeProps<Node<CustomNodeData, string>> {}

const BasicNode: React.FC<CustomNodeProps> = props => {
  const { data, ...rest } = props

  return (
    <BaseNode>
      <NodeHeader className="  ">
        <NodeHeaderTitle className=" flex-1">
          <p>
            <span>{data.label}</span>
          </p>
          <p>
            <span>{data.note}</span>
          </p>
        </NodeHeaderTitle>

        <NodeHeaderActions>
          <Popover content={<Menu mode="vertical" items={[]} />}>
            <EllipsisOutlined />
          </Popover>
        </NodeHeaderActions>
      </NodeHeader>

      <div className="flex1" style={{ visibility: 'hidden' }}>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
    </BaseNode>
  )
}

export default memo(BasicNode)
// export default CustomNode
