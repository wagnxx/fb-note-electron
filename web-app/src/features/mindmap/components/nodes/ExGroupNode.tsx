import React, { memo, useRef, useState } from 'react'
import { Handle, NodeResizeControl, Position, useReactFlow } from '@xyflow/react'
import './ExNode.css'
import { CustomNodeProps } from './ExNode'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { darkenColor } from '@/utils/utilsColor'
import { DefaultTopic } from '../../slices/flowSlice'
import { BaseNode } from '@/components/lib/components/base-node'
import { FileLock2 } from 'lucide-react'
import { Button, Space } from 'antd'
import { cn } from '@/lib/utils'
import { ResizeIcon } from '../tools/ResizeIcon'

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
    <div className="relative w-full h-full" style={mainStyle}>
      <div
        style={{
          position: 'absolute',
          width: '250px',
          height: '100px',
          // top: 0,
          left: 0,
          pointerEvents: 'auto',
          transform: `translateY(-100%) scale(${1 / getZoom()})`,
          transformOrigin: 'bottom left',
          background: 'yellow',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
        className={cn(!data.isExpanded ? ' border-red-600 top-5' : 'bg-slate-200 top-0')}
      >
        {/* <div
          style={{
            width: '450px',
            height: '80px',
            flex: 1,
          }}
        > */}
        <div
          className={cn(
            ' flex justify-between  items-center p-2   bg-white border  rounded-md',
            // !data.isExpanded ? ' border-red-600 top-5' : 'bg-slate-200 top-0',
          )}
          style={{
            width: '250px',
            height: '100px',
            flex: 1,
          }}
          // style={{ transform: 'translateY(-100%)', width: `${450}px`, height: `${80}px` }}
          // style={{
          //   transform: `scale(${1 / getZoom()}),translateY(-100%)`,
          //   transformOrigin: 'top left',
          //   width: `${450}px`,
          //   height: `${80}px`,
          // }}
        >
          <div className="flex-1">
            <input
              className=" border-none  outline-0"
              style={{
                width: '100%',
                backgroundColor: secondlyStyle.backgroundColor,
                color: secondlyStyle.color,
                fontSize: 20,
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

          <Space style={{ gap: 8, alignItems: 'baseline' }}>
            {(data?.childCount || 0) > 0 &&
              (data?.isExpanded ? (
                <EyeOutlined style={{ fontSize: 26 }} onClick={() => handleExpandToggle()} />
              ) : (
                <EyeInvisibleOutlined style={{ fontSize: 26 }} onClick={() => handleExpandToggle()} />
              ))}
            <Button
              type="text"
              icon={<FileLock2 size={20} />}
              onClick={() => onFixedHierarchy()}
              disabled={Boolean(data.outWidth)}
            />
          </Space>
        </div>
        {/* </div> */}
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
        {data?.isExpanded && <ResizeIcon />}
      </NodeResizeControl>
    </div>
  )
}

export default memo(ExGroupNode)
// export default CustomNode
