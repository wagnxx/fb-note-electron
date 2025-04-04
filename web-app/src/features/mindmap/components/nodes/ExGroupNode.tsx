import React, { memo, useRef, useState } from 'react'
import { Handle, NodeResizeControl, Position, useReactFlow } from '@xyflow/react'
import './ExNode.css'
import { CustomNodeProps } from './ExNode'
import { ResizeIcon } from '../tools/ResizeIcon'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { darkenColor } from '@/utils/utilsColor'
import { DefaultTopic } from '../../slices/flowSlice'
import { BaseNode } from '@/components/lib/components/base-node'
import { FileLock2 } from 'lucide-react'
import { Button, Space } from 'antd'
import { cn } from '@/lib/utils'

const ExGroupNode: React.FC<CustomNodeProps> = props => {
  const {
    id,
    data,
    width,
    height,
    selected,
    draggable,
    onExpandToggle,
    updateNodeData,
    updateNodeProps,
    onFixedHierarchy,
  } = props

  const topicTheme = data.topicTheme || DefaultTopic

  const mainStyle = topicTheme.style
  const secondlyStyle = {
    ...mainStyle,
    backgroundColor: darkenColor(mainStyle.backgroundColor || (mainStyle.background as string), 5),
    color: darkenColor(topicTheme.style.color as string, 5),
  }
  const thirdlyStyle = {
    ...mainStyle,
    backgroundColor: darkenColor(mainStyle.backgroundColor || (mainStyle.background as string), 3),
    color: darkenColor(topicTheme.style.color as string, 3),
  }
  const [canEditLabel, setCanEditLabel] = useState(false)
  const [label, setlabel] = useState(data.label)
  const inputLabel = useRef<HTMLInputElement>(null)

  const { getZoom } = useReactFlow()

  const handleDoubleClick = () => {
    inputLabel.current?.focus()
    setCanEditLabel(true)
  }
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setCanEditLabel(false)
    updateNodeData({ label })
  }
  const handleExpandToggle = () => {
    onExpandToggle()
  }

  return (
    <div className="relative w-full h-full">
      <div
        className={cn(
          'flex justify-between  items-center p-0  absolute border',
          !data.isExpanded ? ' border-red-600 top-5' : 'bg-slate-200 top-0',
        )}
        style={{ transform: 'translateY(-100%)', width: 250 / getZoom() }}
      >
        <div className="flex-1">
          <input
            className=" border-none  outline-0"
            style={{
              width: '100%',
              backgroundColor: secondlyStyle.backgroundColor,
              color: secondlyStyle.color,
              fontSize: 20 / getZoom(),
            }}
            onDoubleClickCapture={handleDoubleClick}
            ref={inputLabel}
            readOnly={!canEditLabel}
            onBlur={e => handleInputBlur(e)}
            onClickCapture={e => e.stopPropagation()}
            value={label}
            onChange={e => setlabel(e.target.value)}
            placeholder="Node Name"
          />
        </div>

        <Space style={{ gap: 12 / getZoom(), alignItems: 'baseline' }}>
          {(data?.childCount || 0) > 0 &&
            (data?.isExpanded ? (
              <EyeOutlined style={{ fontSize: 26 / getZoom() }} onClick={() => handleExpandToggle()} />
            ) : (
              <EyeInvisibleOutlined style={{ fontSize: 26 / getZoom() }} onClick={() => handleExpandToggle()} />
            ))}
          <Button
            type="text"
            icon={<FileLock2 size={20 / getZoom()} />}
            onClick={() => onFixedHierarchy()}
            disabled={Boolean(data.outWidth)}
          />
        </Space>
      </div>
      <BaseNode
        className=" border-gray-950"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      ></BaseNode>
      <div className="flex1" style={{ visibility: 'hidden' }}>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
      <NodeResizeControl style={{ background: 'transparent', border: 'none' }} position={'bottom-right'} nodeId={id}>
        <ResizeIcon />
      </NodeResizeControl>
    </div>
  )
}

export default memo(ExGroupNode)
// export default CustomNode
