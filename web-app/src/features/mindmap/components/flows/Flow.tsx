import React, { useCallback, useEffect, useMemo, forwardRef, useImperativeHandle, useState, useRef } from 'react'
import {
  ReactFlow,
  MiniMap,
  Edge,
  BackgroundVariant,
  useReactFlow,
  Background,
  EdgeAddChange,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  SelectionMode,
} from '@xyflow/react'
// 引入 uuid 库
import { v4 as uuidv4 } from 'uuid'
import { noop } from '@/utils/utilsMisc'

import { calculateMiddleValue } from '@/utils/utilsArray'
import Toolbar from '../tools/Toolbar'

import { useNotification } from '@/hooks/useNotification'
import useFirstRender from '@/hooks/useFirstRender'
import { ZoomSlider } from '@/components/lib/components/zoom-slider'
import '@xyflow/react/dist/style.css' // 关键修复点
import useRegisterKeypressCtrol from '../../hooks/useRegisterKeypressCtrol'
import useNodeOperaton from '../../hooks/useNodeOperaton'
import { CreateGroupNode, CustomItem, CustomNodeData, ExtendedNode, TopicTheme } from '../../types'
import ExNode from '../nodes/ExNode'

export type FlowProps = {
  bgVType?: BackgroundVariant
  bgColor?: string
  bgGap?: number
  bgSize?: number
  className?: string
  // nodeList: ExtendedNode[]
  // edgeList: Edge[]
  initNodeList: ExtendedNode[]
  initEdgeList: Edge[]
  // The property is only used to test。It is used in the effect function and the DEFAULT_NODES.
  compId: string
  showTollbar?: boolean
  showMiniMap?: boolean
  showControls?: boolean
  showBackground?: boolean
  readonly?: boolean
  topicTheme?: TopicTheme | null
  onNodeListChange?: (fn: (data: ExtendedNode[]) => ExtendedNode[]) => void
  onEdgeListChange?: (fn: (data: Edge[]) => Edge[]) => void
  getSelectableItems?: () => CustomItem[] // 从父组件获取选择项的函数
  onClickNode?: (data: ExtendedNode | null) => void
}

export type FlowDiagramRef = {
  handleAddRootNode: (rootName?: string) => void
  handleCreateFreeNode: (rootName?: string[]) => void
  handleCreateGroupNodes: (groups: CreateGroupNode[]) => void
  handleCleanCanvas: () => void
  handleAppendChildrenToParent: (id: string, names: string[]) => void
  // handleSetCurrentNodeTheme: (theme: TopicTheme) => void
}

// default config
const NODE_WIDTH = 140
const NODE_HEIGHT = 65
const NODE_DISTANCE = {
  horizontal: 50,
  vertical: 20,
}

const connectionLineStyle = { stroke: '#F6AD55', strokeWidth: 3 }
const defaultEdgeOptions = {
  style: connectionLineStyle,
  // animated: true
  type: 'default',
}

const Flow = forwardRef<FlowDiagramRef, FlowProps>(
  (
    {
      bgVType = BackgroundVariant.Dots,
      bgColor = '#ddd',
      bgGap = 20,
      bgSize = 1,
      className = ' ',
      initNodeList,
      initEdgeList,
      compId,
      showTollbar = true,
      showMiniMap = true,
      showControls = true,
      showBackground = true,
      readonly = false,
      topicTheme = null,
      onNodeListChange = noop,
      onEdgeListChange = noop,
      onClickNode = noop,
      getSelectableItems,
    },
    ref,
  ) => {
    const { getZoom } = useReactFlow()
    // const [nodes, setNodes, handleNodesChange] = useNodesState(initNodeList)
    // const [edges, setEdges, handleEdgesChange] = useEdgesState(initEdgeList)
    const [selectedNodes, setSelectedNodes] = useState<ExtendedNode[]>([])
    const selectedNodeIds = useRef<Set<string>>(new Set())
    const [selectedNode, setselectedNode] = useState<ExtendedNode | null>(null)

    const { showNotification } = useNotification()
    const isFirstRender = useFirstRender()
    const { getIntersectingNodes } = useReactFlow<ExtendedNode>()

    const {
      nodes,
      edges,
      setNodes,
      setEdges,
      handleNodesChange,
      handleEdgesChange,
      crreateNewNode,
      batchDelete,
      copyNode,
      creaateGroupIds,
      updateChildrenPos,
      updateNodeData,
      updateNodeProps,
      deleteNode,
      createGroupChanges,
      batchUpdateNodeProps,
      filterTopLevelNodes,
      getGlobalPosition,
      fixedHierarchy,
    } = useNodeOperaton({
      initNodeList,
      initEdgeList,
      selectedNodes,
      initialNodeSize: { width: NODE_WIDTH, height: NODE_HEIGHT },
      nodeDistance: NODE_DISTANCE,
    })

    const rootId = compId

    const updateInnerState = useCallback(() => {
      setNodes(initNodeList)
      setEdges(initEdgeList)
    }, [initEdgeList, initNodeList, setEdges, setNodes])

    const setNodeItemTheme = useCallback(
      (theme: TopicTheme) => {
        if (!selectedNode) return
        updateNodeData(selectedNode.id, { topicTheme: theme })
      },
      [selectedNode],
    )

    const addChildNode = useCallback(
      (parentId: string, newNames: string[]) => {
        const newNodeIds = creaateGroupIds(parentId, newNames.length) // 创建多个新节点的ID

        const parentNode = nodes.find(n => n.id === parentId)

        if (!parentNode) return
        const siblingsNodes = nodes.filter(node => parentNode.children?.includes(node.id))
        const siblingsPositionY = [...new Set(siblingsNodes.map(item => item.position.y))] // 去重
        // TODO: compute Reasonable number
        const nicePostionY = calculateMiddleValue(siblingsPositionY, parentNode.position.y, NODE_DISTANCE.vertical)

        const childrenNodes = newNodeIds.map((childId, index) => {
          const pW = parentNode.width || NODE_WIDTH
          const newNodePostion = {
            x: pW + NODE_DISTANCE.horizontal,
            y: nicePostionY + (index + siblingsNodes.length - 1) * (NODE_HEIGHT + NODE_DISTANCE.vertical), // 每个新节点间隔10单位
          }
          return crreateNewNode({
            id: childId,
            isRoot: false,
            label: newNames[index],
            parentId,
            position: newNodePostion,
          })
        })
        const nodechanges: NodeChange<ExtendedNode>[] = childrenNodes.map(item => ({ item, type: 'add' }))

        // 更新边：每个新节点都需要与父节点建立边
        const newEdges = newNodeIds.map(newNodeId => {
          return {
            id: `${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
          }
        })

        handleNodesChange([
          {
            item: {
              ...parentNode,
              data: {
                ...parentNode.data,
                childCount: [...(parentNode.children || []), ...newNodeIds].length,
              },
              children: [...(parentNode.children || []), ...newNodeIds],
            },
            type: 'replace',
            id: parentNode.id,
          },
          ...nodechanges,
        ])
        handleEdgesChange(newEdges.map(item => ({ item, type: 'add' })))
      },
      [creaateGroupIds, nodes, handleNodesChange, handleEdgesChange, crreateNewNode],
    )

    const handleAddRootNode = useCallback(
      (rootName = 'root') => {
        if (nodes.length > 0) {
          showNotification('error', 'It is used to create root nodes.', 'message')
          return
        }

        // It  won't be used for now. It's only used for the root node.
        const DEFAULT_NODES = [crreateNewNode({ id: rootId, label: rootName, isRoot: true })]
        const changes: { item: ExtendedNode; type: 'add' }[] = DEFAULT_NODES.map(item => ({ item, type: 'add' }))
        handleNodesChange(changes)
      },
      [crreateNewNode, handleNodesChange, nodes.length, rootId, showNotification],
    )
    const handleCreateFreeNode = useCallback(
      (freeNames = ['free node']) => {
        // It  won't be used for now. It's only used for the root node.
        const DEFAULT_NODES = freeNames.map((newName, index) =>
          crreateNewNode({
            id: 'free_' + uuidv4(),
            isRoot: false,
            label: newName,
            position: { x: 500, y: 5 + NODE_HEIGHT * index },
          }),
        )
        const changes: { item: ExtendedNode; type: 'add' }[] = DEFAULT_NODES.map(item => ({ item, type: 'add' }))
        handleNodesChange(changes)
      },
      [crreateNewNode, handleNodesChange],
    )

    // only supporting  depth 2
    const handleCreateGroupNodes = useCallback(
      (groups: CreateGroupNode[]) => {
        const changes = groups.map(createGroupChanges)
        const changesNodes = changes.reduce<
          {
            item: ExtendedNode
            type: 'add'
          }[]
        >((pre, cur) => {
          return pre.concat(cur.nodes)
        }, [])
        const changesEdges = changes.reduce<EdgeAddChange[]>((pre, cur) => {
          return pre.concat(cur.edges)
        }, [])
        handleNodesChange(changesNodes)
        handleEdgesChange(changesEdges)
      },
      [createGroupChanges, handleEdgesChange, handleNodesChange],
    )

    const handleResetPos = useCallback(
      (parentId: string) => {
        const parentNode = nodes.find(n => n.id === parentId)
        if (!parentNode?.children?.length) return

        let newChildrenNodes = nodes.filter(node => (parentNode.children ?? []).includes(node.id))
        newChildrenNodes = updateChildrenPos(parentNode, newChildrenNodes)
        handleNodesChange(newChildrenNodes.map(item => ({ position: item.position, id: item.id, type: 'position' })))
      },
      [handleNodesChange, nodes, updateChildrenPos],
    )

    const toggleExpand = useCallback(
      (id: string, val?: boolean) => {
        // 递归收集所有子节点
        const updateNodes = new Set<ExtendedNode>()
        function collectionChildren(currentId: string, state: boolean, depth: number = 0) {
          const node = nodes.find(n => n.id === currentId)

          if (node) {
            updateNodes.add(node)

            if (node.children) {
              if (state) {
                // 如果state为true，继续递归所有子节点
                if (depth === 0) {
                  node.children.forEach(childId => collectionChildren(childId, state, depth + 1))
                }
              } else {
                // 如果state为false，只执行当前层的子节点

                node.children.forEach(childId => collectionChildren(childId, state, depth + 1))
              }
            }
          }
        }

        const currentNode = nodes.find(n => n.id === id)
        if (!currentNode) return nodes

        const newExpandedState = val ?? !currentNode.data.isExpanded
        collectionChildren(currentNode.id, newExpandedState, 0)
        updateNodes.delete(currentNode)
        const updatedNodes: ExtendedNode[] = [...updateNodes].map(item => ({
          ...item,
          data: { ...item.data, isExpanded: !newExpandedState },
          isHidden: !newExpandedState,
        }))

        const nodeChanges: NodeChange<ExtendedNode>[] = [
          {
            id: currentNode.id,
            type: 'replace',
            item: {
              ...currentNode,
              data: { ...currentNode.data, isExpanded: newExpandedState },
            },
          },
          ...updatedNodes.map(item => ({ id: item.id, item, type: 'replace' }) as NodeChange<ExtendedNode>),
        ]

        handleNodesChange(nodeChanges)
      },
      [handleNodesChange, nodes],
    )

    const handleCleanCanvas = useCallback(() => {
      setNodes([])
      setEdges([])
    }, [setEdges, setNodes])

    const onNodeDragStop = useCallback(
      (event: React.MouseEvent, node: ExtendedNode) => {
        const nodeChanges: NodeChange<ExtendedNode>[] = []
        const edgeChanges: EdgeChange[] = []

        const newPosition = { x: node.position.x, y: node.position.y }

        const nodeMap = new Map(nodes.map(n => [n.id, n]))

        const historyIntersectionNodes = nodes.filter(node => node.className?.includes('highlight'))
        const historyIntersectionNodesChanges: NodeChange<ExtendedNode>[] = historyIntersectionNodes.map(item => ({
          id: item.id,
          type: 'replace',
          item: { ...item, className: '' },
        }))
        nodeChanges.push(...historyIntersectionNodesChanges)

        // 处理组内节点拖拽
        let parentNode = nodeMap.get(node.parentId ?? '')
        if (parentNode) {
          const pW = parentNode?.measured?.width || parentNode.width || NODE_WIDTH
          const standardX = 0 + (pW + NODE_DISTANCE.horizontal)
          const minX = 0 - NODE_DISTANCE.horizontal / 4
          const maxX = standardX + NODE_DISTANCE.horizontal / 4

          let siblingsNodesIds = new Set<string>(parentNode.children)
          if (newPosition.x > maxX || newPosition.x < minX) {
            // 解绑节点
            siblingsNodesIds.delete(node.id)
            edgeChanges.push({ id: `${parentNode.id}-${node.id}`, type: 'remove' }) // ✅ 修复
            nodeChanges.push({
              id: node.id,
              type: 'replace',
              item: {
                ...node,
                parentId: void 0,
              },
            })
          } else {
            nodeChanges.push({
              id: node.id,
              type: 'position',
              position: {
                ...newPosition,
                x: standardX,
              },
            })
          }

          const parentNodeChange: NodeChange<ExtendedNode> = {
            id: parentNode.id,
            type: 'replace',
            item: {
              ...parentNode,
              children: [...siblingsNodesIds],
              data: {
                ...parentNode.data,
                childCount: siblingsNodesIds.size,
              },
            },
          }

          nodeChanges.push(parentNodeChange)

          handleNodesChange(nodeChanges)
          handleEdgesChange(edgeChanges)
          return
        }

        // 处理游离节点拖拽
        const globalNewPosition = getGlobalPosition(node, nodes)
        const intersectionNodes = getIntersectingNodes(node)
        const newParentNode = intersectionNodes.find(n => {
          const isNotSelf = n.id !== node.id
          const isNotInSelected = !selectedNodes.some(sn => sn.id === n.id)

          const globalParentPosition = getGlobalPosition(n, nodes)
          const pW = n.measured?.width || n.width || NODE_WIDTH

          const minX = globalParentPosition.x
          const maxX = minX + pW
          const minY = globalParentPosition.y - NODE_HEIGHT / 2
          const maxY = globalParentPosition.y + NODE_HEIGHT / 2

          return (
            isNotSelf &&
            isNotInSelected &&
            globalNewPosition.x >= minX &&
            globalNewPosition.x <= maxX &&
            globalNewPosition.y >= minY &&
            globalNewPosition.y <= maxY
          )
        })

        if (!newParentNode) {
          nodeChanges.push({
            id: node.id,
            type: 'position',
            position: newPosition,
          })
          return
        }

        const filterdSelectedNodes = filterTopLevelNodes(selectedNodes)

        const movedIds = filterdSelectedNodes.length > 1 ? filterdSelectedNodes.map(item => item.id) : [node.id]
        const newChildren = [...(newParentNode.children || []), ...movedIds]

        const floatingNodes = nodes
          .filter(n => movedIds.includes(n.id))
          .map(n => ({ ...n, parentId: newParentNode.id }))

        movedIds.forEach(movedId => {
          edgeChanges.push({
            item: {
              id: `${newParentNode.id}-${movedId}`,
              source: newParentNode.id,
              target: movedId,
            },
            type: 'add',
          })
        })

        const pW = newParentNode.measured?.width || newParentNode.width || NODE_WIDTH
        const curNodeFixedPosition = {
          x: 0 + pW + NODE_DISTANCE.horizontal,
          y: 0,
        }

        const floatingNodesChanges: NodeChange<ExtendedNode>[] = floatingNodes.map((n, deep) => ({
          id: n.id,
          type: 'replace',
          item: {
            ...n,
            position: {
              ...curNodeFixedPosition,
              y:
                curNodeFixedPosition.y +
                (n.measured?.height || n.height || NODE_HEIGHT + NODE_DISTANCE.vertical) * deep,
            },
          },
        }))
        const parentNodesChange: NodeChange<ExtendedNode> = {
          id: newParentNode.id,
          type: 'replace',
          item: {
            ...newParentNode,
            children: newChildren,
            data: { ...newParentNode.data, childCount: newChildren.length },
            className: '',
          },
        }
        nodeChanges.push(...floatingNodesChanges, parentNodesChange)

        // 调用 handleNodesChange 和 handleEdgesChange
        // handleNodesChange(nodeChanges)
        handleEdgesChange(edgeChanges)
        const newNodes = applyNodeChanges(nodeChanges, nodes)
        setNodes(prevNodes => {
          if (!newNodes) return prevNodes
          const updatedNodes = newNodes

          // 🟢 找到父节点和游离节点的索引
          const parentIndex = updatedNodes.findIndex(n => n.id === newParentNode.id)
          const floatingIndexes = floatingNodes
            .map(n => updatedNodes.findIndex(p => p.id === n.id))
            .filter(index => index !== -1) // 过滤找不到的项
          const minFloatingIndex = Math.min(...floatingIndexes)

          // 🛠️ 处理节点顺序
          if (
            parentIndex !== minFloatingIndex &&
            parentIndex !== -1 &&
            minFloatingIndex !== -1 &&
            parentIndex > minFloatingIndex
          ) {
            const reorderedNodes = [...updatedNodes]
            ;[reorderedNodes[parentIndex], reorderedNodes[minFloatingIndex]] = [
              reorderedNodes[minFloatingIndex],
              reorderedNodes[parentIndex],
            ]
            return reorderedNodes
          }

          return updatedNodes
        })
      },
      [
        nodes,
        getGlobalPosition,
        getIntersectingNodes,
        filterTopLevelNodes,
        selectedNodes,
        handleEdgesChange,
        setNodes,
        handleNodesChange,
      ],
    )

    const onNodeDrag = useCallback(
      (_: React.MouseEvent, node: ExtendedNode) => {
        const intersectionNodes = getIntersectingNodes(node)
        const historyIntersectionNodes = nodes.filter(node => node.className?.includes('highlight'))
        const intersectionNodesChanges: NodeChange<ExtendedNode>[] = intersectionNodes.map(item => ({
          id: item.id,
          type: 'replace',
          item: { ...item, className: 'highlight' },
        }))
        const historyIntersectionNodesChanges: NodeChange<ExtendedNode>[] = historyIntersectionNodes.map(item => ({
          id: item.id,
          type: 'replace',
          item: { ...item, className: '' },
        }))

        handleNodesChange([...historyIntersectionNodesChanges, ...intersectionNodesChanges])
      },
      [getIntersectingNodes, handleNodesChange, nodes],
    )

    const onError = (code: string, message: string) => {
      const whiteList = ['002']
      if (!whiteList.includes(code)) {
        console.log(`Flow Error, Code[${code}], message: [${message}]`)
      }
    }

    const handleClickNode = (e: React.MouseEvent | null, node: ExtendedNode | null) => {
      if (e) {
        const isResizeControl = (e.target as HTMLElement).closest('.react-flow__resize-control')
        if (isResizeControl) return
      }

      setselectedNode(node)
      onClickNode(node)
    }

    function cmdAndCPressedFn() {
      if (selectedNodes.length) {
        selectedNodeIds.current = new Set(selectedNodes.map(item => item.id))
      }
    }

    function cmdAndVPressedFn() {
      if (selectedNodeIds.current.size > 0) {
        console.log('start copy')
        copyNode([...selectedNodeIds.current])
        selectedNodeIds.current = new Set()
      } else {
        showNotification('error', 'Copied stack is empty', 'message')
      }
    }

    const HandleFixedHierarchy = useCallback(
      (id: string, deep?: boolean) => {
        const updateNodes = fixedHierarchy(id, deep || false, [...nodes])
        console.log(
          'updateNodes: ',
          updateNodes.map(item => ({ id: item.id, name: item.data.label, parentId: item.parentId })),
        )
        batchUpdateNodeProps(updateNodes)
      },
      [batchUpdateNodeProps, fixedHierarchy, nodes],
    )

    const handleLogNodes = () => {
      console.log('handleLogNodes: ', nodes)
    }

    useRegisterKeypressCtrol({
      readonly,
      cmdAndCPressedFn,
      cmdAndVPressedFn,
      metaDeletePresseFn: batchDelete,
    })

    useEffect(() => {
      if (topicTheme && selectedNode) {
        setNodeItemTheme(topicTheme)
      }
    }, [selectedNode, setNodeItemTheme, topicTheme])

    // notify parent component updated action
    useEffect(() => {
      if (isFirstRender) return
      onNodeListChange(() => nodes) // 传递最新的 `nodes` 到父组件
    }, [isFirstRender, nodes, onNodeListChange])
    useEffect(() => {
      if (isFirstRender) return
      onEdgeListChange(() => edges) // 传递最新的 `nodes` 到父组件
    }, [edges, isFirstRender, onEdgeListChange])

    useEffect(() => {
      if (!isFirstRender) {
        updateInnerState()
      }
      return () => {}
    }, [compId, isFirstRender, updateInnerState])

    useImperativeHandle(
      ref,
      () => ({
        handleAddRootNode,
        handleCreateFreeNode,
        handleCleanCanvas,
        handleAppendChildrenToParent: (id: string, newNames: string[]) => addChildNode(id, newNames),
        handleCreateGroupNodes,
        // handleSetCurrentNodeTheme: setNodeItemTheme,
      }),
      [addChildNode, handleAddRootNode, handleCleanCanvas, handleCreateFreeNode, handleCreateGroupNodes],
    )

    const nodeTypes = useMemo(() => {
      const handleCustomNodeProps = (props: any) => ({
        ...props,
        readonly,
        getSelectableItems,
        onAddChild: (newNames: string[]) => addChildNode(props.id, newNames),
        onExpandToggle: (val?: boolean) => toggleExpand(props.id, val),
        onDelete: () => deleteNode([props.id]),
        updateNodeData: (data: Partial<CustomNodeData>) => updateNodeData(props.id, data),
        updateNodeProps: (data: Partial<ExtendedNode>) => updateNodeProps(props.id, data),
        onResetPos: () => handleResetPos(props.id),
        onFixedHierarchy: (deep: boolean) => HandleFixedHierarchy(props.id, deep),
      })

      return {
        customNode: (props: any) => <ExNode {...handleCustomNodeProps(props)} />,
        // customNode: BasicNode,
      }
    }, [
      HandleFixedHierarchy,
      addChildNode,
      deleteNode,
      getSelectableItems,
      handleResetPos,
      readonly,
      toggleExpand,
      updateNodeData,
      updateNodeProps,
    ])

    return (
      <div style={{ position: 'relative', userSelect: 'none' }} className={className}>
        {showTollbar && (
          <Toolbar
            onCreateRootNode={() => handleAddRootNode()}
            onCreateNode={() => handleCreateFreeNode()}
            onDelete={batchDelete}
            onLogNodes={handleLogNodes}
          />
        )}
        <ReactFlow
          nodes={nodes.filter(n => !n.isHidden)}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          // connectionLineStyle={connectionLineStyle}
          // connectionLineType={ConnectionLineType.SimpleBezier}
          onSelectionChange={selection => setSelectedNodes(selection.nodes)}
          onNodeClick={(e, node) => handleClickNode(e, node)}
          onPaneClick={() => handleClickNode(null, null)}
          onError={onError}
          selectionMode={SelectionMode.Full} // 允许部分框选
          selectionOnDrag
          multiSelectionKeyCode="Shift" // 允许 Shift + 点击多选
          defaultEdgeOptions={defaultEdgeOptions}
          zoomOnScroll={true}
          nodeDragThreshold={10}
          minZoom={0.2}
          maxZoom={5}
          proOptions={{
            hideAttribution: true,
          }}
          fitView
        >
          {showBackground && (
            <Background variant={bgVType} color={bgColor} size={bgSize / getZoom()} gap={bgGap / getZoom()} />
          )}
          {showMiniMap && <MiniMap />}
          {showControls && <ZoomSlider position="top-left" />}、
        </ReactFlow>
      </div>
    )
  },
)

export default Flow
