import MultiSelectWithSelectAll from '@/components/select/MultiSelectWithSelectAll'
import { useNotification } from '@/hooks/useNotification'
import { copyText } from '@/utils/utilsClipboard'
import { noop } from '@/utils/utilsMisc'
import { Button, Form, FormInstance, Menu, MenuProps, Popconfirm, Space, Switch, Tooltip } from 'antd'
import React, { memo, useCallback, useMemo, useRef } from 'react'
import { CustomItem, ExtendedNode } from '../../types'
import { CustomNodeData } from './ResizableNode'
import { Node, NodeProps } from '@xyflow/react'
type MenuItem = Required<MenuProps>['items'][number]

// 方法类型
export interface CustomNodeProps extends NodeProps<Node<CustomNodeData, string>> {
  getSelectableItems?: () => CustomItem[]
  onAddChild: (newNames: string[]) => void
  onExpandToggle: (val?: boolean) => void
  onDelete: () => void
  onResetPos: () => void
  onFixedHierarchy: (deep?: boolean) => void
  updateNodeData: (data: Partial<CustomNodeData>) => void
  updateNodeProps: (data: Partial<ExtendedNode>) => void
}

const ActionMenu: React.FC<CustomNodeProps> = props => {
  const {
    data,
    id,
    draggable,
    updateNodeData,
    updateNodeProps,
    onFixedHierarchy = noop,
    getSelectableItems,
    onAddChild,
    onDelete,
    onResetPos,
  } = props

  const docTypeFormRef = useRef<FormInstance>(null)

  const { showConfirmModal, showNotification } = useNotification()

  const toggleNoteVisibility = useCallback(() => {
    updateNodeData({ isNoteVisibility: !data.isNoteVisibility })
  }, [data.isNoteVisibility, updateNodeData])

  const options = useMemo(() => {
    if (getSelectableItems) {
      return getSelectableItems().map(item => ({
        value: item.value,
        label: item.label,
      }))
    }
    return []
  }, [getSelectableItems])

  const handleFixedRect = useCallback(
    (val: boolean, e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      // TODO get rect size
      const w = 100
      const h = 80
      updateNodeData({
        outWidth: w,
        outHeight: h,
      })
    },
    [updateNodeData],
  )
  const handleFixedPostion = useCallback(
    (val: boolean, e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      updateNodeProps({
        draggable: val,
      })
    },
    [updateNodeProps],
  )

  const handleStartFetch = useCallback(async () => {
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
  }, [onAddChild, options, showConfirmModal])

  const handleCopyNodeId = useCallback(async () => {
    await copyText(id)
    showNotification('success', `Successfully copied Node 【${data.label}】 ID: ${id}`, 'notice')
  }, [data.label, id, showNotification])

  const items: MenuItem[] = useMemo(
    () => [
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
                <Switch size="small" onChange={(val, e) => handleFixedRect(val, e)} />
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
    ],
    [
      draggable,
      handleCopyNodeId,
      handleFixedPostion,
      handleFixedRect,
      handleStartFetch,
      onAddChild,
      onDelete,
      onFixedHierarchy,
      onResetPos,
      toggleNoteVisibility,
    ],
  )

  return <Menu mode="vertical" items={items} />
}

export default memo(ActionMenu)
