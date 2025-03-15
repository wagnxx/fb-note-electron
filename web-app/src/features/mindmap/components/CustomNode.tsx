import MultiSelectWithSelectAll from '@/components/select/MultiSelectWithSelectAll'
import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { DownOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, FormInstance } from 'antd'
import React, { useMemo, useRef, useState } from 'react'
import { Handle, NodeProps, Position, useNodes } from 'react-flow-renderer'

export type CustomItem = {
  label: string
  value: string
}
export interface CustomNodeData {
  label: string
  note?: string
  isExpanded: boolean
  isRoot?: boolean
  childCount?: number
  rectRange?: {
    left: number
    right: number
    top: number
    bottom: number
  }
}
// 方法类型
export interface CustomNodeProps extends NodeProps<CustomNodeData> {
  getSelectableItems?: () => CustomItem[]
  onAddChild: (newNames: string[]) => void
  onExpandToggle: () => void
  onDelete: () => void
  onChangeLabel: (label: string) => void
  onChangeNote: (note: string) => void
  onResetPos: () => void
}

const CustomNode: React.FC<CustomNodeProps> = ({
  data,
  id,
  getSelectableItems,
  onAddChild,
  onExpandToggle,
  onDelete,
  onChangeLabel,
  onResetPos,
  onChangeNote,
}) => {
  const [isNoteVisibility, setIsNoteVisibility] = useState(false)
  const [width, setWidth] = useState(200)
  const [isResizing, setIsResizing] = useState(false)
  const nodes = useNodes()
  const currentNode = nodes.find(node => node.id === id)
  const isDragging = currentNode?.dragging || false
  const currentNodePostion = currentNode?.position || { x: 0, y: 0 }

  const [canEditLabel, setCanEditLabel] = useState(false)
  const inputLabel = useRef<HTMLInputElement>(null)

  const { showConfirmModal, showNotification } = useNotification()

  const options = useMemo(() => {
    if (getSelectableItems) {
      const opts = getSelectableItems()
      console.log('getSelectableItems: ', opts)
      return opts.map(item => ({
        value: item.value,
        label: item.label,
      }))
    }
    return []
  }, [getSelectableItems])

  const dbClickNodeHandler = () => {
    // inputLabel?.current?.select()
    inputLabel?.current?.focus()
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
    const docTypeFormRef = React.createRef<FormInstance<any>>()
    const values = await showConfirmModal<{ names: string[] }>({
      title: 'Input File Name',
      content: (
        <Form ref={docTypeFormRef}>
          <Form.Item name="names" rules={[{ required: true, message: 'Please input filername!' }]}>
            <MultiSelectWithSelectAll options={options} />
          </Form.Item>
        </Form>
      ),
    })
    if (!values || !values.names) return

    console.log('values: ', values.names)

    if (values.names.length) {
      onAddChild(values.names)
    }
  }

  const handleCopyeNodeId = async () => {
    await copyText(id)
    showNotification('success', `Successfully copied Node【${data.label}】ID: ${id}`, 'notice')
  }

  return (
    <div
      className="custom-node"
      style={{
        width: `${width}px`,
        userSelect: 'none',
        border: '1px solid #aaa',
      }}
    >
      <div style={{ visibility: 'hidden' }}>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>

      {data.isRoot && data.isExpanded && (
        <div
          style={{
            position: 'absolute',
            top:
              (data?.rectRange?.top || 0) > currentNodePostion.y
                ? 0
                : (data?.rectRange?.top || 0) - currentNodePostion.y,
            left: 0,
            width: `${(data?.rectRange?.right || 100) - (data?.rectRange?.left || 0)}px`,
            height: `${(data?.rectRange?.bottom || 100) - (data?.rectRange?.top || 0)}px`,
            background: 'rgba(0,0,0,0.3)',
            zIndex: '-1',
          }}
        ></div>
      )}

      <div className="node-content" style={{ userSelect: 'none' }}>
        {/* <p>x: {currentNode?.position.x}</p> */}
        <div className=" flex items-center gap-2">
          <Button
            size="small"
            className={data.note ? ' ' : 'hidden'}
            onClick={() => setIsNoteVisibility(!isNoteVisibility)}
            icon={<DownOutlined size={12} style={{ fontSize: 8 }} />}
            type="text"
          ></Button>
          <div className="node-input-wrapper">
            <input
              ref={inputLabel}
              readOnly={!canEditLabel}
              onBlur={e => handleInputBlur(e)}
              defaultValue={data.label}
              // onChange={onChangeLabel}
              className="node-input"
              title={data.label}
            />
          </div>
        </div>
        <div className={`node-note ${isNoteVisibility ? ' ' : 'hidden'}`}>
          {/* <div className=" bg-gray-300  px-1 " style={{ fontSize: '8px' }}>
              Note
            </div> */}
          <textarea
            className=" w-full h-full px-1 outline-none bg-gray-100"
            style={{ fontSize: '10px' }}
            defaultValue={data.note}
            onBlur={e => handleTextareBlur(e)}
          />
        </div>
      </div>

      {(data?.childCount || 0) > 0 && (
        <div className={`node-switch-container ${data.isExpanded ? 'expand' : ''}`} onClick={onExpandToggle}>
          {data.isExpanded ? (
            <span className="expand-icon">-</span>
          ) : (
            data.childCount !== undefined && <span className="child-count">[{data.childCount}]</span>
          )}
        </div>
      )}

      <div className={`context-menu-container ${isDragging ? 'hidden' : ''}`} onDoubleClick={e => e.stopPropagation()}>
        <div className="context-menu">
          <div className="context-menu-list">
            <button onClick={() => onAddChild(['child'])}>
              <PlusOutlined />
            </button>
            <button onClick={onDelete}>
              <MinusOutlined />
            </button>
            {/* {options && <Select style={{ width: 120 }} options={options}></Select>} */}
            <button onClick={() => setIsNoteVisibility(true)}>Add Note</button>
            <button onClick={handleStartFetch}>Fech Select</button>
            <button onClick={onResetPos}>Reset Position</button>
            <button onClick={handleCopyeNodeId}>Copy Node ID</button>
          </div>
        </div>
      </div>

      {/* <NodeResizer minWidth={100} minHeight={30} /> */}
    </div>
  )
}

export default CustomNode
