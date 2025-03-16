import MultiSelectWithSelectAll from '@/components/select/MultiSelectWithSelectAll'
import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { Form, FormInstance, Space } from 'antd'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  Handle,
  NodeProps,
  Position,
  useNodes,
  Node,
  NodeResizeControl,
  ResizeDragEvent,
  ResizeParams,
  NodeToolbar,
} from '@xyflow/react'

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

export interface CustomNodeProps extends NodeProps<Node<CustomNodeData>> {
  getSelectableItems?: () => CustomItem[]
  onAddChild: (newNames: string[]) => void
  onExpandToggle: () => void
  onDelete: () => void
  onChangeLabel: (label: string) => void
  onChangeNote: (note: string) => void
  onResetPos: () => void
  onChangeRect?: ({ width, height }: ResizeParams) => void
}

const controlStyle = {
  background: 'transparent',
  border: 'none',
}

const CustomNode: React.FC<CustomNodeProps> = ({
  id,
  data,
  width,
  height,
  selected,
  getSelectableItems,
  onAddChild,
  onExpandToggle,
  onDelete,
  onChangeLabel,
  onResetPos,
  onChangeNote,
  onChangeRect,
}) => {
  const [isNoteVisibility, setIsNoteVisibility] = useState(false)
  const [innerWidth, setInnerWidth] = useState(width)
  const [isResizing, setIsResizing] = useState(false)
  const nodes = useNodes()
  const currentNode = useMemo(() => nodes.find(node => node.id === id), [nodes, id])
  const isDragging = currentNode?.dragging || false
  const currentNodePosition = currentNode?.position || { x: 0, y: 0 }

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

  const handleInputBlur = () => {
    setCanEditLabel(false)
    if (inputLabel.current) {
      onChangeLabel(inputLabel.current.value)
    }
  }

  const handleTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
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

  const handleResizeEnd = (event: ResizeDragEvent, params: ResizeParams) => {
    setInnerWidth(params.width)
    onChangeRect?.(params)
  }
  const handleResizing = (event: ResizeDragEvent, params: ResizeParams) => {
    setInnerWidth(params.width)
    onChangeRect?.(params)
  }

  useEffect(() => {
    console.log('Exnode mouted')
    return () => {
      console.log('Exnode unmouted')
    }
  }, [])

  return (
    <div style={{ background: '#ddd', width: `${innerWidth}px` }}>
      <NodeToolbar isVisible={true}>
        <Space>
          <button>delete</button>
          <button>copy</button>
          <button>expand</button>
          <button onClick={() => onAddChild(['child'])}>add</button>
        </Space>
      </NodeToolbar>

      <NodeResizeControl
        style={controlStyle}
        minWidth={50}
        minHeight={20}
        onResize={handleResizing}
        onResizeEnd={handleResizeEnd}
      >
        <ResizeIcon />
      </NodeResizeControl>
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(CustomNode)

function ResizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="#ff0071"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: 'absolute', right: 5, bottom: 5 }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="16 20 20 20 20 16" />
      <line x1="14" y1="14" x2="20" y2="20" />
      <polyline points="8 4 4 4 4 8" />
      <line x1="4" y1="4" x2="10" y2="10" />
    </svg>
  )
}
