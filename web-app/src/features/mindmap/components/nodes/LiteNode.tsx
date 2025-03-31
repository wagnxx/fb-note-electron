import React, { memo } from 'react'
import { Handle, NodeResizeControl, Position } from '@xyflow/react'
import { NodeHeader, NodeHeaderTitle } from '@/components/lib/components/node-header'
import { BaseNode } from '@/components/lib/components/base-node'
import './ExNode.css'
import { MinusCircleFilled } from '@ant-design/icons'
import { Badge } from 'antd'
import NodeExtroIcon from '../tools/NodeExtroIcon'
import { CustomNodeProps } from './ExNode'
import { cn } from '@/lib/utils'
import { DefaultTopic } from '../../slices/flowSlice'
import { darkenColor } from '@/utils/utilsColor'
import { ResizeIcon } from '../tools/ResizeIcon'

const LiteNode: React.FC<CustomNodeProps> = props => {
  const {
    id,
    data,
    width: pWidth,
    height: pHeight,
    minWidth = 100,
    minHeight = 50,
    maxWidth = 300,
    maxHeight = 200,
    onExpandToggle,
    ...rest
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

  return (
    <BaseNode
      className={cn('relative flex flex-col ')}
      style={{ width: `${pWidth}px`, height: `${pHeight}`, ...mainStyle }}
    >
      <NodeHeader className="  ">
        <NodeHeaderTitle className=" flex-1" style={{ minHeight: 'maxContent' }}>
          <span>{data.label}</span>
        </NodeHeaderTitle>

        {/* <NodeHeaderActions>
          <Popover
            content={<ActionMenu {...props} />}
            getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
          >
            <EllipsisOutlined />
          </Popover>
        </NodeHeaderActions> */}
      </NodeHeader>

      <div className={`flex-1  flex border-t`} style={{ overflow: 'auto' }} onWheel={e => e.stopPropagation()}>
        <p
          style={{
            fontSize: '10px',
            background: thirdlyStyle.backgroundColor,
            color: thirdlyStyle.color,
          }}
        >
          <span>{data.note}</span>
        </p>
      </div>

      {(data?.childCount || 0) > 0 && (
        <NodeExtroIcon
          className="group"
          onClickCapture={e => {
            e.stopPropagation()
            onExpandToggle()
          }}
        >
          {data.isExpanded ? (
            <MinusCircleFilled className="hidden group-hover:block" />
          ) : (
            <Badge count={data.childCount}></Badge>
          )}
        </NodeExtroIcon>
      )}

      <div className="flex1" style={{ visibility: 'hidden' }}>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>

      <NodeResizeControl
        style={{ background: 'transparent', border: 'none' }}
        position={'bottom-right'}
        nodeId={id}
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      >
        <ResizeIcon />
      </NodeResizeControl>
    </BaseNode>
  )
}

export default memo(LiteNode)
// export default CustomNode
