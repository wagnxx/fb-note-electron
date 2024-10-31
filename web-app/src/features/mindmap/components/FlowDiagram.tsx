import React, { useState, useCallback } from 'react'
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Handle,
  Node,
  Edge,
  Connection,
  Position,
} from 'react-flow-renderer'
import './FlowDiagram.css'

interface CustomNodeData {
  label: string
  isExpanded: boolean
  onExpandToggle: () => void
  onAddChild: () => void
}

interface ExtendedNode extends Node<CustomNodeData> {
  isHidden?: boolean // 是否隐藏
  children?: string[] // 存储顶层节点的 id
}

const FlowDiagram = () => {
  const [nodes, setNodes] = useState<ExtendedNode[]>([
    {
      id: '1',
      type: 'customNode',
      data: {
        label: 'Root Node',
        isExpanded: true,
        onExpandToggle: () => toggleExpand('1'),
        onAddChild: () => addChildNode('1'),
      },
      position: { x: 250, y: 5 },
      isHidden: false,
      children: [],
    },
  ])
  const [edges, setEdges] = useState<Edge[]>([])

  const toggleExpand = useCallback((id: string) => {
    setNodes(nds => {
      return nds.map(n => {
        if (n.id === id) {
          const isExpanded = !n.data.isExpanded
          const updatedChildren = n.children || []

          // 根据展开/折叠状态更新顶层节点的 isHidden 属性
          updatedChildren.forEach(childId => {
            const parentNode = nds.find(p => p.id === childId)
            if (parentNode) {
              parentNode.isHidden = !isExpanded // 更新顶层节点的 isHidden
            }
          })

          return {
            ...n,
            data: {
              ...n.data,
              isExpanded,
            },
          }
        }
        return n
      })
    })
  }, [])

  const addChildNode = useCallback(
    (parentId: string) => {
      const newNodeId = `${parentId}-child-${Math.random().toString(36).substr(2, 9)}`

      const newNode: ExtendedNode = {
        id: newNodeId,
        type: 'customNode',
        data: {
          label: `Child of ${parentId}`,
          isExpanded: true,
          onExpandToggle: () => toggleExpand(newNodeId),
          onAddChild: () => addChildNode(newNodeId),
        },
        position: { x: Math.random() * 300, y: Math.random() * 300 },
        isHidden: false,
        children: [],
      }

      setNodes(nds => {
        return nds
          .map(n => {
            if (n.id === parentId) {
              return {
                ...n,
                children: [...(n.children || []), newNodeId], // 仅存储子节点的 id
              }
            }
            return n
          })
          .concat(newNode) // 确保新节点添加到顶层 nodes
      })

      const newEdge: Edge = {
        id: `${parentId}-${newNode.id}`,
        source: parentId,
        target: newNode.id,
      }
      setEdges(eds => [...eds, newEdge])
    },
    [toggleExpand],
  )

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge(params, eds))
  }, [])

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: ExtendedNode) => {
    setNodes(nds => {
      return nds.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            position: node.position,
          }
        }
        return n
      })
    })
  }, [])

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={nodes.filter(n => !n.isHidden)} // 仅显示未隐藏的节点
        edges={edges}
        onConnect={onConnect}
        nodeTypes={{ customNode: CustomNode }}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  )
}

const CustomNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
  return (
    <div className="custom-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <span>{data.label}</span>
        <button onClick={data.onExpandToggle}>{data.isExpanded ? 'Collapse' : 'Expand'}</button>
        <button onClick={data.onAddChild}>Add Child</button>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default FlowDiagram
