import MultiSelectWithSelectAll from '@/components/select/MultiSelectWithSelectAll'
import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { Badge, Form, FormInstance, Menu, MenuProps, Popover } from 'antd'
import React, { useMemo, useRef, useState } from 'react'
import { Handle, Node, NodeProps, NodeResizeControl, Position, ResizeParams } from '@xyflow/react'
import { NodeHeader, NodeHeaderTitle, NodeHeaderActions } from '@/components/lib/components/node-header'
import { BaseNode } from '@/components/lib/components/base-node'
import { EllipsisOutlined, MinusCircleFilled } from '@ant-design/icons'
import { ResizeIcon } from '../tools/ResizeIcon'
import NodeExtroIcon from '../tools/NodeExtroIcon'

type MenuItem = Required<MenuProps>['items'][number]

export type CustomItem = {
  label: string
  value: string
}
export interface CustomNodeData extends Record<string, unknown> {
  label: string
  note?: string
  isExpanded: boolean
  isRoot?: boolean
  childCount?: number

  // gorup rect range
  rectRange?: {
    left: number
    right: number
    top: number
    bottom: number
  }
}
// 方法类型
export interface CustomNodeProps extends NodeProps<Node<CustomNodeData, string>> {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  getSelectableItems?: () => CustomItem[]
  onAddChild: (newNames: string[]) => void
  onExpandToggle: () => void
  onDelete: () => void
  onChangeLabel: (label: string) => void
  onChangeNote: (note: string) => void
  onResetPos: () => void
  onChangeRect?: ({ width, height }: ResizeParams) => void
}

const CustomNode: React.FC<CustomNodeProps> = ({
  data,
  id,
  selected,
  width: pWidth,
  height: pHeight,
  minWidth = 80,
  maxWidth = 300,
  minHeight = 50,
  maxHeight = 200,
  onChangeRect,
  getSelectableItems,
  onAddChild,
  onExpandToggle,
  onDelete,
  onChangeLabel,
  onResetPos,
  onChangeNote,
}) => {
  const [isNoteVisibility, setIsNoteVisibility] = useState(false)
  const [canEditLabel, setCanEditLabel] = useState(false)
  const inputLabel = useRef<HTMLInputElement>(null)
  const docTypeFormRef = useRef<FormInstance>(null)

  const { showConfirmModal, showNotification } = useNotification()

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
          label: 'Note',
          key: 'Note',
          onClick: () => setIsNoteVisibility(!isNoteVisibility),
        },
        {
          label: 'Node',
          key: 'Node',
          onClick: () => onAddChild(['child']),
        },
        {
          label: 'Fetch Select',
          key: 'Fetch Select',
          onClick: handleStartFetch,
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
      label: 'Reset Position',
      key: 'Reset_Position',
      onClick: onResetPos,
    },
  ]

  return (
    <BaseNode selected={selected}>
      <NodeHeader className="  ">
        <NodeHeaderTitle className=" flex-1">
          <input
            className=" border-none  outline-0"
            style={{ width: '100%' }}
            onDoubleClickCapture={handleDoubleClick}
            ref={inputLabel}
            readOnly={!canEditLabel}
            onBlur={e => handleInputBlur(e)}
            defaultValue={data.label}
            // onChange={onChangeLabel}
            title={data.label}
          />
        </NodeHeaderTitle>
        <NodeHeaderActions>
          <Popover content={<Menu mode="vertical" items={items} />}>
            <EllipsisOutlined />
          </Popover>
        </NodeHeaderActions>
      </NodeHeader>

      {/* expanded/collapsed icon */}
      {(data?.childCount || 0) > 0 && (
        <NodeExtroIcon className=" group" onClick={onExpandToggle}>
          {data.isExpanded ? (
            <MinusCircleFilled className="hidden group-hover:block" />
          ) : (
            <Badge count={data.childCount}></Badge>
          )}
        </NodeExtroIcon>
      )}

      <div
        className={` border-t ${isNoteVisibility ? ' ' : 'hidden'}`}
        style={{ minHeight: '50px', maxHeight: '200px' }}
      >
        <textarea
          className=" w-full  outline-none bg-white resize-none"
          style={{ fontSize: '10px' }}
          defaultValue={data.note}
          placeholder="Add Note"
          onBlur={e => handleTextareBlur(e)}
        />
      </div>

      <div style={{ visibility: 'hidden' }}>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>

      <NodeResizeControl
        style={{ background: 'transparent', border: 'none' }}
        nodeId={id}
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      >
        {selected && <ResizeIcon />}
      </NodeResizeControl>
    </BaseNode>
  )
}

export default CustomNode
