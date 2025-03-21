import { FC, memo } from 'react'
import { Handle, Position, NodeResizer, NodeProps, Node } from '@xyflow/react'

export interface CustomNodeData extends Record<string, unknown> {
  label: string
}
// 方法类型
export interface CustomNodeProps extends NodeProps<Node<CustomNodeData, string>> {
  a?: string
}

const ResizableNode: FC<CustomNodeProps> = ({ data }) => {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={30} />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

export default memo(ResizableNode)
