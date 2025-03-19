import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Tabs, Input } from 'antd'
import FlowDiagram, { ExtendedNode } from '@/features/mindmap/components/flows/Flow'
import { Edge } from '@xyflow/react'
import { v4 as uuidv4 } from 'uuid'
import './MindMapCanvasContainer.css'
import { Action } from '@/utils/utilsAction'

type TargetKey = React.MouseEvent | React.KeyboardEvent | string

export type TabItem = {
  key: string
  name: string
  nodes: ExtendedNode[] // 添加节点数据
  edges: Edge[] // 添加边数据
}

const initialItems: TabItem[] = []

const MindMapCanvasContainer = forwardRef<MindMapRef, any>((_, ref) => {
  const [activeKey, setActiveKey] = useState<string>()
  const [itemsInit, setItemsInit] = useState(initialItems)
  const [itemsSubmit, setItemsSubmit] = useState(initialItems)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState<string>('')

  const newTabIndex = useRef(0)

  useImperativeHandle(ref, () => {
    return {
      getData() {
        return itemsSubmit
      },
      resetItems,
    }
  }, [itemsSubmit])

  const resetItems = (data: TabItem[]) => {
    const action = Action.getInstance()

    action
      .do(() => {
        console.log('do umonute cavas component')
        setActiveKey(undefined)
      })
      .sleep(100)
      .then(() => {
        setItemsInit(() => data)
        setItemsSubmit(() => data)
        setActiveKey(data[0]?.key) // Allowing data length to be 0
        newTabIndex.current = data.length
      })
  }

  const onChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey)
  }

  const add = () => {
    const tabKey = uuidv4()
    const newPane = {
      key: tabKey,
      name: `tab${newTabIndex.current++}`,
      nodes: [],
      edges: [],
    }

    setItemsInit(prePanes => [...prePanes, newPane])
    setItemsSubmit(prePanes => [...prePanes, newPane])

    setActiveKey(tabKey)
  }

  const remove = (targetKey: TargetKey) => {
    let newActiveKey = activeKey
    let lastIndex = -1
    itemsInit.forEach((item, i) => {
      if (item.key === targetKey) {
        lastIndex = i - 1
      }
    })
    const filterFactory = (item: TabItem) => item.key !== targetKey
    const newPanes = itemsInit.filter(filterFactory)
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key
      } else {
        newActiveKey = newPanes[0].key
      }
    }
    setItemsInit(() => newPanes)
    setItemsSubmit(prePanes => prePanes.filter(filterFactory))
    setActiveKey(newActiveKey)
  }

  const handleRenameTab = (key: string, newName: string) => {
    setItemsInit(prevItems => prevItems.map(item => (item.key === key ? { ...item, name: newName } : item)))
    setItemsSubmit(prevItems => prevItems.map(item => (item.key === key ? { ...item, name: newName } : item)))
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
      setNewLabel(itemsInit.find(tab => tab.key === key)?.name || '')
    },
    [itemsInit],
  )

  const updateEdges = useCallback(
    (key: string, fn: (data: Edge[]) => Edge[]) => {
      if (!key || key !== activeKey) return
      setItemsSubmit(prevItems => prevItems.map(item => (item.key === key ? { ...item, edges: fn(item.edges) } : item)))
    },
    [activeKey],
  )

  const updateNodes = useCallback(
    (key: string, fn: (data: ExtendedNode[]) => ExtendedNode[]) => {
      if (!key || key !== activeKey) return
      setItemsSubmit(prevItems => prevItems.map(item => (item.key === key ? { ...item, nodes: fn(item.nodes) } : item)))
    },
    [activeKey],
  )

  const memoItems = useMemo(() => {
    return itemsInit.map(tab => ({
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
        <FlowDiagram
          bgColor="#aaa"
          className="flex-1 h-full w-full"
          initNodeList={tab.nodes}
          initEdgeList={tab.edges}
          compId={tab.key}
          onNodeListChange={list => updateNodes(tab.key, list)}
          onEdgeListChange={list => updateEdges(tab.key, list)}
        />
      ),
    }))
  }, [activeKey, editKey, handleDoubleClick, itemsInit, newLabel, updateEdges, updateNodes])

  // if (items.length === 0) {
  //   return (
  //     <div
  //       style={{
  //         width: '100%',
  //         flex: 1,
  //         display: 'flex',
  //         justifyContent: 'center',
  //         flexDirection: 'column',
  //         // padding: '20px',
  //         // textAlign: 'center',
  //       }}
  //     >
  //       <Empty description="No selected" />
  //     </div>
  //   )
  // }

  return (
    <Tabs
      style={{ width: '100%', flex: 1 }}
      type="editable-card"
      tabPosition="bottom"
      activeKey={activeKey}
      onChange={onChange}
      onEdit={onEdit}
      items={memoItems}
      renderTabBar={(tabBarProps, DefaultTabBar) => <DefaultTabBar {...tabBarProps} />}
    />
  )
})

export type MindMapRef = {
  getData: () => TabItem[]
  resetItems: (data: TabItem[]) => void
}

export default MindMapCanvasContainer
