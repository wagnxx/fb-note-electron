import React, { useState } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Node,
  Edge,
  BackgroundVariant,
} from 'react-flow-renderer'
import './MindMapCanvas.css'

// Initial nodes
const initialNodes: Node<{ label: string }>[] = [
  { id: '1', data: { label: 'Central Topic' }, position: { x: 250, y: 50 }, type: 'parent' },
  {
    id: '2',
    data: { label: 'Main Topic 1' },
    position: { x: 100, y: 150 },
    parentNode: '1',
    extent: 'parent',
  },
  {
    id: '3',
    data: { label: 'Main Topic 2' },
    position: { x: 400, y: 150 },
    parentNode: '1',
    extent: 'parent',
  },
]

const initialEdges: Edge[] = []

const MindMapCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({})

  // Toggle the expanded state of a node
  const onToggleCollapse = (nodeId: string) => {
    setExpanded(prev => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  // Add a new node under a parent node
  const addNode = (parentId: string) => {
    const newNodeId = `${nodes.length + 1}`
    const newNode: Node<{ label: string }> = {
      id: newNodeId,
      data: { label: `Sub Topic ${newNodeId}` },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      parentNode: parentId,
      extent: 'parent',
    }

    // Check for overlapping nodes
    const overlappingNodes = nodes.filter(n => isOverlapping(n.position, newNode.position))
    if (overlappingNodes.length > 0) {
      // Adjust position to avoid overlap
      newNode.position.y += overlappingNodes.length * 40 // Adjust this value as needed
    }

    // Update nodes and edges
    setNodes(nds => nds.concat(newNode))
    setEdges(eds =>
      addEdge({ id: `e${parentId}-${newNodeId}`, source: parentId, target: newNodeId }, eds),
    )
  }

  // Check if two positions are overlapping
  const isOverlapping = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
    const overlapThreshold = 50 // Define how close is considered overlapping
    return (
      Math.abs(pos1.x - pos2.x) < overlapThreshold && Math.abs(pos1.y - pos2.y) < overlapThreshold
    )
  }

  // Handle node drag event
  const onDragStop = (event: any, node: Node) => {
    setNodes(nds => nds.map(n => (n.id === node.id ? { ...n, position: node.position } : n)))
  }

  const nodeTypes = {
    parent: (props: any) => (
      <div className="custom-node" onClick={() => onToggleCollapse(props.id)}>
        <div className="node-content">
          {props.data.label}
          <span>{expanded[props.id] ? ' ▲' : ' ▼'}</span> {/* Collapse/expand indicator */}
        </div>
        {expanded[props.id] && (
          <div className="children-container">
            {props.children}
            <button className="add-node-button" onClick={() => addNode(props.id)}>
              Add Node
            </button>
          </div>
        )}
      </div>
    ),
    child: (props: any) => (
      <div className="child-node">
        {props.data.label}
        <button className="add-node-button" onClick={() => addNode(props.id)}>
          Add Node
        </button>
      </div>
    ),
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      onNodeDragStop={onDragStop}
      color="#fff"
    >
      <Background gap={10} color="#ddd" variant={BackgroundVariant.Lines} />
      <MiniMap />
      <Controls />
    </ReactFlow>
  )
}

export default MindMapCanvas
