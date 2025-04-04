import { Badge, MenuProps, Popover, Space } from 'antd'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Handle, Node, NodeProps, NodeResizeControl, Position } from '@xyflow/react'
import { NodeHeader, NodeHeaderActions, NodeHeaderTitle } from '@/components/lib/components/node-header'
import { BaseNode } from '@/components/lib/components/base-node'
import { EllipsisOutlined, MinusCircleFilled, PlusCircleTwoTone } from '@ant-design/icons'
import NodeExtroIcon from '../tools/NodeExtroIcon'
import { ResizeIcon } from '../tools/ResizeIcon'
import { NotebookText } from 'lucide-react'
import './ExNode.css'
import { cn } from '@/lib/utils'
import { darkenColor } from '@/utils/utilsColor'
import { noop } from '@/utils/utilsMisc'
import { CustomItem, CustomNodeData, ExtendedNode } from '../../types'
import { DefaultTopic } from '../../slices/flowSlice'
import ActionMenu from './ActionMenu'

type MenuItem = Required<MenuProps>['items'][number]

// 方法类型
export interface CustomNodeProps extends NodeProps<Node<CustomNodeData, string>> {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  readonly?: boolean
  measured?: {
    width?: number
    height?: number
  }
  getSelectableItems?: () => CustomItem[]
  onAddChild: (newNames: string[]) => void
  onExpandToggle: (val?: boolean) => void
  onDelete: () => void
  onResetPos: () => void
  onFixedHierarchy: (deep?: boolean) => void
  updateNodeData: (data: Partial<CustomNodeData>) => void
  updateNodeProps: (data: Partial<ExtendedNode>) => void
}

const ExNode: React.FC<CustomNodeProps> = props => {
  const {
    data,
    id,
    selected,
    draggable,
    readonly = false,
    width: pWidth,
    height: pHeight,
    minWidth = 100,
    minHeight = 50,
    maxWidth = 300,
    maxHeight = 200,
    measured,
    updateNodeData,
    updateNodeProps,
    onFixedHierarchy = noop,
    getSelectableItems,
    onAddChild,
    onExpandToggle,
    onDelete,
    onResetPos,

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

  const [canEditLabel, setCanEditLabel] = useState(false)
  const [label, setlabel] = useState(data.label)
  const [note, setNote] = useState(data.note)
  const inputLabel = useRef<HTMLInputElement>(null)
  const baseNodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setlabel(data.label)
  }, [data.label])
  useEffect(() => {
    setNote(data.note)
  }, [data.note])

  const toggleNoteVisibility = useCallback(() => {
    updateNodeData({ isNoteVisibility: !data.isNoteVisibility })
  }, [data.isNoteVisibility, updateNodeData])

  const handleDoubleClick = () => {
    inputLabel.current?.focus()
    setCanEditLabel(true)
  }
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setCanEditLabel(false)
    updateNodeData({ label })
  }
  const handleTextareBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    updateNodeData({ note })
  }

  const computedHeight = !data.isNoteVisibility ? 'auto' : `${pHeight}px`

  return (
    <BaseNode
      ref={baseNodeRef}
      className={cn('relative flex flex-col ')}
      style={{ width: `${pWidth}px`, height: computedHeight, ...mainStyle }}
      title={data.label + ' \n' + data.note}
      selected={selected}
      draggable={draggable}
      onPointerDown={e => e.stopPropagation()}
    >
      <NodeHeader className="  ">
        <NodeHeaderTitle className=" flex-1">
          <input
            className=" border-none  outline-0"
            style={{
              width: '100%',
              backgroundColor: secondlyStyle.backgroundColor,
              color: secondlyStyle.color,
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
        </NodeHeaderTitle>
        <NodeHeaderActions>
          {!readonly && (
            <Popover
              content={<ActionMenu {...props} />}
              getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
            >
              <EllipsisOutlined />
            </Popover>
          )}
          {/* <ActionMenu {...props} /> */}
        </NodeHeaderActions>
      </NodeHeader>

      {/* expanded/collapsed icon */}
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

      <NodeExtroIcon position="top-right" className=" group">
        <Space direction="vertical" className="hidden group-hover:block bg-white">
          <PlusCircleTwoTone
            onClick={e => {
              e.stopPropagation()
              onAddChild([''])
            }}
          />
          <MinusCircleFilled
            onClick={e => {
              onDelete()
              e.stopPropagation()
            }}
          />
          <NotebookText
            size={16}
            onClick={e => {
              toggleNoteVisibility()
              e.stopPropagation()
            }}
          />
        </Space>
      </NodeExtroIcon>

      <div
        className={`flex-1  flex border-t nowheel ${data.isNoteVisibility ? ' ' : 'hidden'}`}
        style={{ overflow: 'auto' }}
        onWheel={e => e.stopPropagation()}
      >
        <textarea
          className="w-full h-full outline-none  bg-slate-100 resize-none overflow-auto  "
          style={{
            fontSize: '10px',
            background: thirdlyStyle.backgroundColor,
            color: thirdlyStyle.color,
          }}
          value={note}
          readOnly={readonly}
          placeholder="Add Note"
          onChange={e => setNote(e.target.value)}
          onBlur={e => handleTextareBlur(e)}
          onClickCapture={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        />
      </div>

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

export default memo(ExNode)
