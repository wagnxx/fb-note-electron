import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Tabs, Input } from 'antd'
import MindMapCanvas, { ExtendedNode } from '@/features/mindmap/components/FlowDiagram'
import { Edge } from 'react-flow-renderer'
import './MindMapCanvasContainer.css'

type TargetKey = React.MouseEvent | React.KeyboardEvent | string

type TabItem = {
  key: string
  name: string
  nodes: ExtendedNode[] // 添加节点数据
  edges: Edge[] // 添加边数据
}

const initialItems: TabItem[] = []

const MindMapCanvasContainer: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>()
  const [items, setItems] = useState(initialItems)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState<string>('')

  const newTabIndex = useRef(0)

  const onChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey)
  }

  const add = () => {
    const newActiveKey = `tab${newTabIndex.current++}`
    const newPanes = [...items]
    newPanes.push({
      key: newActiveKey,
      name: newActiveKey,
      nodes: [],
      edges: [],
    })
    setItems(newPanes)
    setActiveKey(newActiveKey)
  }

  const remove = (targetKey: TargetKey) => {
    let newActiveKey = activeKey
    let lastIndex = -1
    items.forEach((item, i) => {
      if (item.key === targetKey) {
        lastIndex = i - 1
      }
    })
    const newPanes = items.filter(item => item.key !== targetKey)
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key
      } else {
        newActiveKey = newPanes[0].key
      }
    }
    setItems(newPanes)
    setActiveKey(newActiveKey)
  }

  const handleRenameTab = (key: string, newName: string) => {
    setItems(prevItems => prevItems.map(item => (item.key === key ? { ...item, name: newName } : item)))
    setEditKey(null)
    setNewLabel('')
  }

  const onEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === 'add') {
      add()
    } else {
      remove(targetKey)
    }
  }

  const handleDoubleClick = useCallback(
    (key: string) => {
      setEditKey(key)
      setNewLabel(items.find(tab => tab.key === key)?.name || '')
    },
    [items],
  )

  const updateEdges = useCallback(
    (key: string, fn: (data: Edge[]) => Edge[]) => {
      if (!key || key !== activeKey) return
      setItems(prevItems => prevItems.map(item => (item.key === key ? { ...item, edges: fn(item.edges) } : item)))
    },
    [activeKey],
  )

  const updateNodes = useCallback(
    (key: string, fn: (data: ExtendedNode[]) => ExtendedNode[]) => {
      if (!key || key !== activeKey) return
      setItems(prevItems => prevItems.map(item => (item.key === key ? { ...item, nodes: fn(item.nodes) } : item)))
    },
    [activeKey],
  )

  const memoItems = useMemo(() => {
    return items.map(tab => ({
      key: tab.key,
      label:
        editKey === tab.key ? (
          <Input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onBlur={() => handleRenameTab(tab.key, newLabel)}
            onPressEnter={() => handleRenameTab(tab.key, newLabel)}
            autoFocus
          />
        ) : (
          <span onDoubleClick={() => handleDoubleClick(tab.key)}>{tab.name}</span>
        ),
      children: activeKey === tab.key && (
        <MindMapCanvas
          bgColor="#aaa"
          className="flex-1 h-full w-full"
          nodeList={tab.nodes}
          edgeList={tab.edges}
          compId={tab.key}
          onNodeListChange={list => updateNodes(tab.key, list)}
          onEdgeListChange={list => updateEdges(tab.key, list)}
        />
      ),
    }))
  }, [activeKey, editKey, handleDoubleClick, items, newLabel, updateEdges, updateNodes])

  return (
    <Tabs
      style={{ width: '100%', flex: 1 }}
      type="editable-card"
      tabPosition="bottom"
      animated
      activeKey={activeKey}
      onChange={onChange}
      onEdit={onEdit}
      items={memoItems}
      renderTabBar={(tabBarProps, DefaultTabBar) => <DefaultTabBar {...tabBarProps} />}
    />
  )
}

export default MindMapCanvasContainer
