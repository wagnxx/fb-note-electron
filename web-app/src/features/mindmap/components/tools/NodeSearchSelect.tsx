import React, { useCallback, useMemo, useState } from 'react'
import { AutoComplete, Input } from 'antd'
import { EdgeChange, NodeChange, useReactFlow } from '@xyflow/react'
import { ExtendedEdge, ExtendedNode } from '../../types'
import { FlowStateReducerParams } from '../../hooks/useNodeOperaton'

interface NodeSearchSelectProps {
  nodes: ExtendedNode[]
  placeholder?: string
  handleFlowStateChange?: (
    nodeChanges: NodeChange<ExtendedNode>[],
    edgeChanges: EdgeChange<ExtendedEdge>[],
    stateReducers?: FlowStateReducerParams,
  ) => void
}

const NodeSearchSelect: React.FC<NodeSearchSelectProps & React.HTMLAttributes<HTMLDivElement>> = ({
  nodes,
  placeholder = '搜索节点',
  handleFlowStateChange,
  ...props
}) => {
  const [searchValue, setSearchValue] = useState('')
  const { getNode, setCenter } = useReactFlow<ExtendedNode>()

  const getGlobalPosition = useCallback(
    (node: ExtendedNode): { x: number; y: number } => {
      let pos = { x: node.position.x, y: node.position.y }

      let parent = nodes.find(n => n.id === node.parentId)
      while (parent) {
        pos.x += parent.position.x
        pos.y += parent.position.y
        parent = nodes.find(n => n.id === parent?.parentId) // 递归寻找更高层的 parent
      }

      return pos
    },
    [nodes],
  )

  const options = useMemo(() => {
    if (!searchValue) return []
    return nodes
      .filter(node => node.data?.label?.toLowerCase().includes(searchValue.toLowerCase()))
      .map(node => ({
        value: node.data.label,
        label: node.data.label,
        nodeId: node.id,
      }))
  }, [searchValue, nodes])

  const handleSelect = (_: string, option: any) => {
    const node = getNode(option.nodeId)
    if (!node) return
    const pos = { x: 0, y: 0 }
    if (!node.parentId) {
      pos.x = node.position.x
      pos.y = node.position.y
    } else {
      const globalPos = getGlobalPosition(node)
      pos.x = globalPos.x
      pos.y = globalPos.y
    }
    handleFlowStateChange?.([{ id: node.id, type: 'replace', item: { ...node, className: 'highlight' } }], [])
    setCenter(pos.x, pos.y, { zoom: 1.2, duration: 600 })
  }

  return (
    <div {...props}>
      <AutoComplete
        style={{ width: 240 }}
        options={options}
        value={searchValue}
        onChange={setSearchValue}
        onSelect={handleSelect}
      >
        <Input.Search placeholder={placeholder} allowClear />
      </AutoComplete>
    </div>
  )
}

export default NodeSearchSelect
