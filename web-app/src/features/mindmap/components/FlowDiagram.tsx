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
  NodeProps,
  useNodes,
  Background,
  BackgroundVariant,
} from 'react-flow-renderer'
// 引入 uuid 库
import './FlowDiagram.css'

interface CustomNodeData {
  label: string
  isExpanded: boolean
  onExpandToggle: () => void
  onAddChild: () => void
  childCount?: number
}

interface ExtendedNode extends Node<CustomNodeData> {
  isHidden?: boolean
  children?: string[]
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, id }) => {
  const nodes = useNodes()
  const currentNode = nodes.find(node => node.id === id)
  const isDragging = currentNode?.dragging || false

  return (
    <div className="custom-node">
      {id === '1' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 'calc(100% + 100px)',
            height: '100px',
            background: 'rgba(0,0,0,0.3)',
          }}
        ></div>
      )}
      <Handle type="target" position={Position.Left} />
      <div className="node-content">
        <p>x: {currentNode?.position.x}</p>
        <span>{data.label}</span>
        {data.isExpanded ? (
          <span className="expand-icon" onClick={data.onExpandToggle}>
            -
          </span>
        ) : (
          data.childCount !== undefined && (
            <span className="child-count" onClick={data.onExpandToggle}>
              {data.childCount}
            </span>
          )
        )}
      </div>
      <Handle type="source" position={Position.Right} />
      <div className={`context-menu-container ${isDragging ? 'hidden' : ''}`}>
        <div className="context-menu">
          <div className="context-menu-list">
            <button onClick={data.onAddChild}>Add Child</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = {
  customNode: CustomNode,
}

const NODE_DISTANCE = 150

const FlowDiagram: React.FC = () => {
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
      const currentNode = nds.find(n => n.id === id)
      if (!currentNode) return nds

      const newExpandedState = !currentNode.data.isExpanded

      return nds.map(n =>
        n.id === id
          ? {
              ...n,
              data: { ...n.data, isExpanded: newExpandedState },
            }
          : n,
      )
    })
  }, [])

  const addChildNode = useCallback(
    (parentId: string) => {
      const newNodeId = `${parentId}-child-${Math.random().toString(36).substr(2, 9)}`

      setNodes(nds => {
        const parentNodeIndex = nds.findIndex(n => n.id === parentId)
        if (parentNodeIndex === -1) return nds // 确保找到父节点

        const parentNode = nds[parentNodeIndex] // 获取最新的父节点

        const newNode: ExtendedNode = {
          id: newNodeId,
          type: 'customNode',
          data: {
            label: `Child of ${parentId}`,
            isExpanded: true,
            onExpandToggle: () => toggleExpand(newNodeId),
            onAddChild: () => addChildNode(newNodeId),
          },
          position: { x: parentNode.position.x + NODE_DISTANCE, y: Math.random() * 200 },
          isHidden: false,
          children: [],
        }

        const updatedParentNode = {
          ...parentNode,
          children: [...(parentNode.children || []), newNodeId],
        }

        const updatedNodes = [
          ...nds.slice(0, parentNodeIndex),
          updatedParentNode,
          newNode,
          ...nds.slice(parentNodeIndex + 1),
        ]

        return updatedNodes
      })

      const newEdge: Edge = {
        id: `${parentId}-${newNodeId}`, // 确保这个ID是唯一的
        source: parentId,
        target: newNodeId,
      }

      setEdges(eds => {
        // 确保没有重复的边
        if (!eds.some(edge => edge.id === newEdge.id)) {
          return [...eds, newEdge]
        }
        return eds // 防止添加重复的边
      })
    },
    [toggleExpand],
  )

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge(params, eds))
  }, [])
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: ExtendedNode) => {
    setNodes(nds => {
      const currentNode = nds.find(n => n.id === node.id)
      if (!currentNode) return nds

      const newPosition = {
        x: node.position.x,
        y: node.position.y,
      }

      const parentNode = nds.find(n => n.children?.includes(node.id))
      /**
       * 父节点存在，处理组内节点拖拽情况
       */
      if (parentNode) {
        const standardX = parentNode.position.x + NODE_DISTANCE
        const minX = standardX - NODE_DISTANCE / 2
        const maxX = standardX + NODE_DISTANCE
        console.log('nodes::', nds)

        const runAwayNodes = new Set<string>()
        let siblingsNodesIds = new Set<string>(parentNode.children)

        if (newPosition.x < minX || newPosition.x <= maxX) {
          newPosition.x = standardX
        } else if (newPosition.x > maxX) {
          //解绑
          // 去 link
          runAwayNodes.add(node.id)
          siblingsNodesIds.delete(node.id)
        }
        const newChildren: string[] = [...siblingsNodesIds]
        const updatedNodes = nds.map(n =>
          n.id === parentNode.id
            ? {
                ...n,
                children: newChildren,
                data: { ...n.data, childCount: newChildren.length },
              }
            : n,
        )

        if (runAwayNodes.size > 0) {
          setEdges(eds => eds.filter(ed => !runAwayNodes.has(ed.target)))
        }

        return updatedNodes.map(n =>
          n.id === node.id
            ? {
                ...n,
                position: newPosition,
                // isHidden: false,
              }
            : n,
        )
      }

      /**
       * 
      // 游离节点的操作，寻找是否有匹配的父节点
       * 
       */
      const newParentNode = nds.find(n => {
        const minX = NODE_DISTANCE + n.position.x
        const maxX = minX + 100
        const minY = n.position.y - 50
        const maxY = n.position.y + 50

        return (
          newPosition.x >= minX &&
          newPosition.x <= maxX &&
          newPosition.y >= minY &&
          newPosition.y <= maxY
        )
      })

      if (newParentNode) {
        const newChildren = [...(newParentNode.children || []), node.id]

        const updatedNodes = nds.map(n =>
          n.id === newParentNode.id
            ? {
                ...n,
                children: newChildren,
                data: { ...n.data, childCount: newChildren.length },
              }
            : n,
        )

        const newEdge: Edge = {
          id: `${newParentNode.id}-${node.id}`, // Create a unique edge ID
          source: newParentNode.id,
          target: node.id,
        }

        // Check if the edge already exists before adding
        setEdges(eds => {
          if (!eds.some(edge => edge.id === newEdge.id)) {
            return [...eds, newEdge]
          }
          return eds // Prevent adding duplicate edges
        })

        return updatedNodes.map(n =>
          n.id === node.id
            ? {
                ...n,
                position: {
                  x: newParentNode.position.x + NODE_DISTANCE,
                  y: newParentNode.position.y,
                },
                isHidden: false,
              }
            : n,
        )
      }

      return nds.map(n =>
        n.id === node.id
          ? {
              ...n,
              position: newPosition,
              isHidden: false,
            }
          : n,
      )
    })
  }, [])

  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: ExtendedNode) => {
      const newPosition = {
        x: node.position.x + event.movementX,
        y: node.position.y + event.movementY,
      }
      setNodes(nds => {
        const ns = nds.map(n =>
          n.id === node.id
            ? {
                ...n,
                position: newPosition,
              }
            : n,
        )
        return ns
      })
    },
    [setNodes],
  )

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <ReactFlow
        nodes={nodes.filter(n => !n.isHidden)}
        edges={edges}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeDragStop={onNodeDragStop}
        onNodeDrag={onNodeDrag}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default FlowDiagram
