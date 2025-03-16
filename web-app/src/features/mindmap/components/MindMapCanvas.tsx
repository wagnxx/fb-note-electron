// src/features/mindmap/components/MindMapCanvas.tsx
import React, { useState } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Edge,
  Node,
} from 'react-flow-renderer'
import Toolbar from './Toolbar'

const initialNodes: Node[] = [{ id: '1', data: { label: '中心主题' }, position: { x: 250, y: 5 } }]
const initialEdges: Edge[] = []

const MindMapCanvas: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const getCenterPosition = () => {
    const totalX = nodes.reduce((sum, node) => sum + node.position.x, 0)
    const totalY = nodes.reduce((sum, node) => sum + node.position.y, 0)
    return {
      x: totalX / nodes.length,
      y: totalY / nodes.length,
    }
  }

  const onAddNode = () => {
    const centerPosition = getCenterPosition()

    // 在中心位置附近添加新节点
    const newNode = {
      id: `${nodes.length + 1}`,
      data: { label: `节点 ${nodes.length + 1}` },
      position: {
        x: centerPosition.x + (Math.random() > 0.5 ? 50 : -50), // 随机在中心点附近偏移
        y: centerPosition.y + (Math.random() > 0.5 ? 50 : -50),
      },
    }
    setHistory([...history, { nodes, edges }])
    setNodes(nds => [...nds, newNode])
  }

  const onSelectNode = (nodeId: string) => {
    setSelectedNodeId(selectedNodeId === nodeId ? null : nodeId)
  }

  const onConnect = (params: any) => {
    const newEdge: Edge = {
      id: `e${edges.length + 1}`,
      source: params.source,
      target: params.target,
    }
    setHistory([...history, { nodes, edges }])
    setEdges(eds => addEdge(newEdge, eds))
  }

  const onDeleteNode = () => {
    if (selectedNodeId) {
      setHistory([...history, { nodes, edges }])
      setNodes(nds => nds.filter(node => node.id !== selectedNodeId))
      setEdges(eds => eds.filter(edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId))
      setSelectedNodeId(null)
    }
  }

  const onDeleteEdge = (edgeId: string) => {
    setHistory([...history, { nodes, edges }])
    setEdges(eds => eds.filter(edge => edge.id !== edgeId))
  }

  const onUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1]
      setNodes(previousState.nodes)
      setEdges(previousState.edges)
      setHistory(history.slice(0, -1))
    }
  }

  const onRedo = () => {
    // Redo 功能可以通过更复杂的状态管理来实现，这里仅作示例。
  }

  const onNodeDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      const newLabel = prompt('编辑节点名称:', node.data.label)
      if (newLabel) {
        setHistory([...history, { nodes, edges }])
        setNodes(nds => nds.map(n => (n.id === nodeId ? { ...n, data: { label: newLabel } } : n)))
      }
    }
  }

  const handleContextMenu = (event: React.MouseEvent, id: string, isEdge: boolean) => {
    event.preventDefault()
    if (isEdge) {
      const confirmation = window.confirm('确定要删除这个连接吗？')
      if (confirmation) {
        onDeleteEdge(id)
      }
    } else {
      const confirmation = window.confirm('确定要删除这个节点吗？')
      if (confirmation) {
        setSelectedNodeId(id)
        onDeleteNode()
      }
    }
  }

  const saveToFile = () => {
    const data = { nodes, edges }
    const fileBlob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(fileBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mindmap.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        const contents = e.target?.result
        if (contents) {
          const { nodes, edges } = JSON.parse(contents as string)
          setHistory([...history, { nodes, edges }])
          setNodes(nodes)
          setEdges(edges)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <>
      <Toolbar
        onCreateRootNode={onAddNode}
        onDelete={onDeleteNode}
        onUndo={onUndo}
        onRedo={onRedo}
        onSave={saveToFile}
        onOpen={() => document.getElementById('file-input')?.click()} // 点击打开文件
      />
      <input type="file" accept=".json" onChange={loadFromFile} style={{ display: 'none' }} id="file-input" />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onNodeDoubleClick={(event, node) => onNodeDoubleClick(node.id)}
        onConnect={onConnect}
        onEdgeClick={(event, edge) => handleContextMenu(event, edge.id, true)}
        onNodeContextMenu={(event, node) => handleContextMenu(event, node.id, false)}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </>
  )
}

export default MindMapCanvas
