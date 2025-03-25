import MultiSelectWithSelectAll from '@/components/select/MultiSelectWithSelectAll'
import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { Badge, Form, FormInstance, Menu, MenuProps, Popover, Space } from 'antd'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Handle, Node, NodeProps, NodeResizeControl, Position, ResizeParams, useReactFlow } from '@xyflow/react'
import { NodeHeader, NodeHeaderTitle, NodeHeaderActions } from '@/components/lib/components/node-header'
import { BaseNode } from '@/components/lib/components/base-node'
import { EllipsisOutlined, MinusCircleFilled, PlusCircleTwoTone } from '@ant-design/icons'
import NodeExtroIcon from '../tools/NodeExtroIcon'
import { ResizeIcon } from '../tools/ResizeIcon'
import { NotebookText } from 'lucide-react'
import './ExNode.css'
import { cn } from '@/lib/utils'
import useFirstRender from '@/hooks/useFirstRender'
import { TopicTheme } from '@/pages/mindmap/components/SideDrawer'
import { DefaultTopic } from '../../mindmapSlice'
import { darkenColor } from '@/utils/utilsColor'

type MenuItem = Required<MenuProps>['items'][number]

export type CustomItem = {
  label: string
  value: string
}
export interface CustomNodeData extends Record<string, unknown> {
  label: string
  note?: string
  isExpanded: boolean
  childCount?: number
  outWidth?: number
  outHeight?: number
  topicTheme?: TopicTheme
}
// 方法类型
export interface CustomNodeProps extends NodeProps<Node<CustomNodeData, string>> {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  readonly?: boolean
  getSelectableItems?: () => CustomItem[]
  onAddChild: (newNames: string[]) => void
  onExpandToggle: (val?: boolean) => void
  onDelete: () => void
  onChangeLabel: (label: string) => void
  onChangeNote: (note: string) => void
  onResetPos: () => void
  onChangeRect?: ({ width, height }: ResizeParams) => void
  onFixedRect?: () => void
  onFixedPostion?: (fixed: boolean) => void
}

const CustomNode: React.FC<CustomNodeProps> = props => {
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
    onChangeRect,
    onFixedRect,
    onFixedPostion,
    getSelectableItems,
    onAddChild,
    onExpandToggle,
    onDelete,
    onChangeLabel,
    onResetPos,
    onChangeNote,
    ...rest
  } = props

  const topicTheme = data.topicTheme || DefaultTopic

  const [isNoteVisibility, setIsNoteVisibility] = useState(true)
  const [canEditLabel, setCanEditLabel] = useState(false)
  const inputLabel = useRef<HTMLInputElement>(null)
  const docTypeFormRef = useRef<FormInstance>(null)
  const baseNodeRef = useRef<HTMLDivElement>(null)

  const { showConfirmModal, showNotification } = useNotification()

  const { getZoom } = useReactFlow()
  const isFirstRender = useFirstRender()

  const updateNodeRect = useCallback(
    (show: boolean) => {
      const rect = baseNodeRef.current?.getBoundingClientRect()
      const zoom = getZoom()
      if (show && data.outWidth && data.outHeight) {
        console.log('data width height out: ', { outerWidth: data.outWidth, outerHeight: data.outHeight })
        onChangeRect?.({ width: data.outWidth, height: data.outHeight, x: 0, y: 0 })
        return
      }
      if (!isFirstRender && !show && rect && rect.width && rect.height) {
        console.log('chagne rect : ', rect)
        onChangeRect?.({ width: rect.width / zoom, height: 50, x: rect.x, y: rect.y })
      }
    },
    [data.outHeight, data.outWidth, getZoom, isFirstRender, onChangeRect],
  )

  const toggleNoteVisibility = () => {
    setIsNoteVisibility(pre => {
      const result = !pre
      requestAnimationFrame(() => updateNodeRect(result))

      return result
    })
  }

  const options = useMemo(() => {
    if (getSelectableItems) {
      return getSelectableItems().map(item => ({
        value: item.value,
        label: item.label,
      }))
    }
    return []
  }, [getSelectableItems])

  const handleDoubleClick = () => {
    inputLabel.current?.focus()
    setCanEditLabel(true)
  }
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setCanEditLabel(false)

    onChangeLabel(e.target.value)
  }
  const handleTextareBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    onChangeNote?.(e.target.value)
  }

  const handleStartFetch = async () => {
    const values = await showConfirmModal<{ names: string[] }>({
      title: 'Input File Name',
      content: (
        <Form ref={docTypeFormRef}>
          <Form.Item name="names" rules={[{ required: true, message: 'Please input file name!' }]}>
            <MultiSelectWithSelectAll options={options} />
          </Form.Item>
        </Form>
      ),
    })

    if (values && values?.names?.length) {
      onAddChild(values.names)
    }
  }

  const handleCopyNodeId = async () => {
    await copyText(id)
    showNotification('success', `Successfully copied Node 【${data.label}】 ID: ${id}`, 'notice')
  }

  const items: MenuItem[] = [
    {
      label: 'Insert',
      key: 'Insert',
      // icon: <AppstoreOutlined />,
      children: [
        {
          label: 'Node',
          key: 'Node',
          onClick: () => onAddChild(['child']),
        },
        {
          label: 'Group node',
          key: 'groupNode',
          disabled: true,
        },
        {
          label: 'Fetch Select',
          key: 'Fetch Select',
          onClick: handleStartFetch,
        },
        {
          label: 'Note Description',
          key: 'Note',
          onClick: () => setIsNoteVisibility(!isNoteVisibility),
        },
      ],
    },
    {
      label: 'Delete',
      key: 'Delete',
      onClick: onDelete,
    },
    {
      label: 'Duplicate',
      key: 'Duplicate',
      disabled: true,
    },

    {
      label: 'Copy Node ID',
      key: 'Copy_Node_ID',
      onClick: handleCopyNodeId,
    },
    {
      label: 'Fixed',
      key: 'Fixed',
      type: 'submenu',
      children: [
        {
          label: 'Fixed Rect',
          key: 'FixedRect',
          onClick: onFixedRect,
        },
        {
          label: 'Fixed Postion',
          key: 'FixedPostion',
          onClick: () => onFixedPostion?.(!draggable),
        },
        {
          label: "Fixed children's Rect",
          key: 'FixedChildrenRect',
          disabled: true,
        },
        {
          label: "Fixed children's Postion",
          key: 'FixedChildrenPostion',
          disabled: true,
        },
        {
          label: "Fixed deep children's Rect",
          key: 'FixedDeepChildrenRect',
          disabled: true,
        },
        {
          label: "Fixed deep children's Postion",
          key: 'FixedDeepChildrenPostion',
          disabled: true,
        },
      ],
    },
    {
      label: 'Reset',
      key: 'Reset',
      type: 'submenu',
      children: [
        {
          label: 'Reset Children Postion',
          key: 'Reset_Children_Postion',
          onClick: onResetPos,
        },
        {
          label: "Reset deep children's position",
          key: 'Reset_deep_Children_Postion',
          disabled: true,
        },
        {
          label: 'Reset standard size',
          key: 'Reset_standard_size',
          disabled: true,
        },
        {
          label: "Reset children's standard size",
          key: 'Reset_children_standard_size',
          disabled: true,
        },
        {
          label: 'Reset standard width',
          key: 'Reset_standard_width',
          disabled: true,
        },
        {
          label: 'Reset standard height',
          key: 'Reset_standard_height',
          disabled: true,
        },
        {
          label: "Reset children's standard width",
          key: 'Reset_children_standard_width',
          disabled: true,
        },
        {
          label: "Reset children's standard height",
          key: 'Reset_children_standard_height',
          disabled: true,
        },
      ],
    },
  ]

  const computedHeight = !isNoteVisibility ? 'auto' : `${pHeight}px`

  return (
    <BaseNode
      ref={baseNodeRef}
      className={cn('relative flex flex-col nowheel')}
      style={{ width: `${pWidth}px`, height: computedHeight, ...topicTheme.style }}
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
              background: darkenColor(topicTheme.style.background as string, 5),
              color: darkenColor(topicTheme.style.color as string, 5),
            }}
            onDoubleClickCapture={handleDoubleClick}
            ref={inputLabel}
            readOnly={!canEditLabel}
            onBlur={e => handleInputBlur(e)}
            onClickCapture={e => e.stopPropagation()}
            defaultValue={data.label}
            // onChange={onChangeLabel}
            title={data.label}
            placeholder="Node Name"
          />
        </NodeHeaderTitle>
        <NodeHeaderActions>
          {!readonly && (
            <Popover content={<Menu mode="vertical" items={items} />}>
              <EllipsisOutlined />
            </Popover>
          )}
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
          <PlusCircleTwoTone onClick={() => onAddChild(['child'])} />
          <MinusCircleFilled onClick={onDelete} />
          <NotebookText size={16} onClick={toggleNoteVisibility} />
        </Space>
      </NodeExtroIcon>

      <div
        className={`flex-1  flex border-t ${isNoteVisibility ? ' ' : 'hidden'}`}
        style={{ overflow: 'auto' }}
        onWheel={e => e.stopPropagation()}
      >
        <textarea
          className="w-full h-full outline-none  bg-slate-100 resize-none overflow-auto "
          style={{
            fontSize: '10px',
            background: darkenColor(topicTheme.style.background as string, 3),
            color: darkenColor(topicTheme.style.color as string, 5),
          }}
          defaultValue={data.note}
          readOnly={readonly}
          placeholder="Add Note"
          onBlur={e => handleTextareBlur(e)}
          onClickCapture={e => e.stopPropagation()}
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

export default memo(CustomNode)
