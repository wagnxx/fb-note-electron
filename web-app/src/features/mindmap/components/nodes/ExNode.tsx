import MultiSelectWithSelectAll from '@/components/select/MultiSelectWithSelectAll'
import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { Badge, Button, Form, FormInstance, Menu, MenuProps, Popconfirm, Popover, Space, Switch, Tooltip } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Handle, Node, NodeProps, NodeResizeControl, Position, useReactFlow } from '@xyflow/react'
import { NodeHeader, NodeHeaderTitle, NodeHeaderActions } from '@/components/lib/components/node-header'
import { BaseNode } from '@/components/lib/components/base-node'
import { EllipsisOutlined, MinusCircleFilled, PlusCircleTwoTone } from '@ant-design/icons'
import NodeExtroIcon from '../tools/NodeExtroIcon'
import { ResizeIcon } from '../tools/ResizeIcon'
import { NotebookText } from 'lucide-react'
import './ExNode.css'
import { cn } from '@/lib/utils'
import useFirstRender from '@/hooks/useFirstRender'
import { DefaultTopic } from '../../mindmapSlice'
import { darkenColor } from '@/utils/utilsColor'
import { noop } from '@/utils/utilsMisc'
import { CustomItem, CustomNodeData, ExtendedNode } from '../../types'

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
  const docTypeFormRef = useRef<FormInstance>(null)
  const baseNodeRef = useRef<HTMLDivElement>(null)

  const { showConfirmModal, showNotification } = useNotification()

  const { getZoom } = useReactFlow()
  const isFirstRender = useFirstRender()

  useEffect(() => {
    setlabel(data.label)
  }, [data.label])
  useEffect(() => {
    setNote(data.note)
  }, [data.note])

  const toggleNoteVisibility = () => {
    updateNodeData({ isNoteVisibility: !data.isNoteVisibility })
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
    updateNodeData({ label })
  }
  const handleTextareBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    updateNodeData({ note })
  }

  const handleFixedRect = (
    val: boolean,
    e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation()
    const w = val ? measured?.width || pWidth : minWidth
    const h = val ? measured?.height || pHeight : minHeight
    updateNodeData({
      outWidth: w,
      outHeight: h,
    })
  }
  const handleFixedPostion = (
    val: boolean,
    e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation()
    updateNodeProps({
      draggable: val,
    })
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
          onClick: () => onAddChild(['']),
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
          onClick: toggleNoteVisibility,
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
          label: (
            <Space>
              <span>Fixed Rect</span>
              <Switch
                size="small"
                value={data.outHeight === pHeight && data.outWidth === pWidth}
                onChange={(val, e) => handleFixedRect(val, e)}
              />
            </Space>
          ),
          key: 'FixedRect',
        },
        {
          label: (
            <Space>
              <span>Fixed Postion</span>
              <Switch size="small" value={draggable} onChange={(val, e) => handleFixedPostion(val, e)} />
            </Space>
          ),
          key: 'FixedPostion',
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
        {
          label: (
            <Tooltip title="The operation is mainly to address the floating state of the child element, forcing it to be fixed within the current parent element.">
              <Popconfirm
                title="Hierarchy"
                description="Would you like to fix the hierarchy at all levels (deep fix)?c"
                showCancel={true}
                okText="Yes. deep fix"
                cancelText="No. shallow fix"
                onConfirm={e => {
                  e?.stopPropagation()
                  onFixedHierarchy(true)
                }}
                onCancel={e => {
                  e?.stopPropagation()
                  onFixedHierarchy(false)
                }}
              >
                <Button onClick={e => e.stopPropagation()}>Fixed Hierarchy</Button>
                {/* <span onClick={() => onFixedHierarchy(true)}> Fixed Hierarchy</span> */}
              </Popconfirm>
            </Tooltip>
          ),
          key: 'fixedHierarchy',
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

  const computedHeight = !data.isNoteVisibility ? 'auto' : `${pHeight}px`

  return (
    <BaseNode
      ref={baseNodeRef}
      className={cn('relative flex flex-col nowheel')}
      style={{ width: `${pWidth}px`, height: computedHeight, ...mainStyle }}
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
        className={`flex-1  flex border-t ${data.isNoteVisibility ? ' ' : 'hidden'}`}
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

// export default memo(CustomNode)
export default CustomNode
