import React, { useCallback, useEffect, useMemo, forwardRef, useImperativeHandle, useState, useRef } from 'react'
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  useReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  OnSelectionChangeParams,
  NodeReplaceChange,
} from '@xyflow/react'
// 引入 uuid 库
import { v4 as uuidv4 } from 'uuid'
import { noop } from '@/utils/utilsMisc'

import CustomNode, { CustomItem, CustomNodeData } from '../nodes/ExNode'
import { calculateMiddleValue } from '@/utils/utilsArray'
import Toolbar from '../tools/Toolbar'

import { useNotification } from '@/hooks/useNotification'
import useFirstRender from '@/hooks/useFirstRender'
import { ZoomSlider } from '@/components/lib/components/zoom-slider'
import '@xyflow/react/dist/style.css' // 关键修复点
import useRegisterKeypressCtrol from '../../hooks/useRegisterKeypressCtrol'
import useNodeOperaton from '../../hooks/useNodeOperaton'
import { TopicTheme } from '@/pages/mindmap/components/SideDrawer'

export interface ExtendedNode extends Node<CustomNodeData> {
  isRoot?: boolean
  isHidden?: boolean
  children?: string[]
}

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
  handleCleanCanvas: () => void
  handleAppendChildrenToParent: (id: string, names: string[]) => void
  // handleSetCurrentNodeTheme: (theme: TopicTheme) => void
}

// default config
const NODE_WIDTH = 140
const NODE_HEIGHT = 80
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
    const [nodes, setNodes, handleNodesChange] = useNodesState(initNodeList)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initEdgeList)
    const [selectedNodes, setSelectedNodes] = useState<ExtendedNode[]>([])
    const selectedNodeIds = useRef<Set<string>>(new Set())
    const [selectedNode, setselectedNode] = useState<ExtendedNode | null>(null)

    const { showNotification } = useNotification()
    const isFirstRender = useFirstRender()

    const {
      crreateNewNode,
      deleteNode,
      batchDelete,
      copyNode,
      creaateGroupIds,
      updateChildrenPos,
      getGroupNodeIds,
      grtResetPosFn,
    } = useNodeOperaton({
      nodes,
      setNodes,
      setEdges,
      selectedNodes,
      initialNodeSize: { width: NODE_WIDTH, height: NODE_HEIGHT },
      nodeDistance: NODE_DISTANCE,
      handleNodesChange,
    })

    const rootId = compId

    const updateInnerState = useCallback(() => {
      setNodes(initNodeList)
      setEdges(initEdgeList)
    }, [initEdgeList, initNodeList, setEdges, setNodes])

    // Unify the method entry.
    const updateNodeList = useCallback(
      (fn: (data: ExtendedNode[]) => ExtendedNode[]) => {
        onNodeListChange(fn)
        setNodes(fn)
      },
      [onNodeListChange, setNodes],
    )

    const updateEdgeList = useCallback(
      (fn: (data: Edge[]) => Edge[]) => {
        onEdgeListChange(fn)
        setEdges(fn)
      },
      [onEdgeListChange, setEdges],
    )

    const setNodeItemTheme = useCallback(
      (theme: TopicTheme) => {
        if (!selectedNode) return

        const change: NodeReplaceChange<ExtendedNode> = {
          id: selectedNode.id,
          type: 'replace',
          item: {
            ...selectedNode,
            data: {
              ...selectedNode.data,
              topicTheme: theme,
            },
          },
        }

        handleNodesChange([change])
      },
      [handleNodesChange, selectedNode],
    )

    const changeRect = useCallback(
      (id: string, { width, height }: { width: number; height: number }) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          return nds.map(n => {
            if (n.id === id) {
              return {
                ...n,
                data: {
                  ...n.data,
                },
                measured: {
                  width,
                  height,
                },
                width,
                height,
              }
            }
            return n
          })
        }
        updateNodeList(nodesFn)
      },
      [updateNodeList],
    )

    const addChildNode = useCallback(
      (parentId: string, newNames: string[], getZoomFunc: () => number) => {
        const newNodeIds = creaateGroupIds(parentId, newNames.length) // 创建多个新节点的ID
        const zoom = getZoomFunc()

        const nodesFn: (nds: ExtendedNode[]) => ExtendedNode[] = (nds: ExtendedNode[]) => {
          const parentNodeIndex = nds.findIndex(n => n.id === parentId)
          if (parentNodeIndex === -1) return nds // 确保找到父节点

          const parentNode = nds[parentNodeIndex] // 获取父节点
          const siblingsNodes = nds.filter(node => parentNode.children?.includes(node.id))
          const siblingsPositionY = [...new Set(siblingsNodes.map(item => item.position.y))] // 去重
          const nicePostionY = calculateMiddleValue(siblingsPositionY, parentNode.position.y, 50 / zoom)

          // 批量添加子节点，计算每个子节点的位置
          const newNodes = newNodeIds.map((newNodeId, index) => {
            const pW = parentNode.width || NODE_WIDTH
            const newNodePostion = {
              x: parentNode.position.x + pW + NODE_DISTANCE.horizontal,
              y: nicePostionY + index * (NODE_HEIGHT + 10), // 每个新节点间隔10单位
            }

            return {
              id: newNodeId,
              type: 'customNode',
              data: {
                label: newNames[index], // 使用传入的名称来作为子节点的 label
                isExpanded: true,
              },
              position: newNodePostion,
              isHidden: false,
              children: [],
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
            }
          })

          // 更新父节点的子节点列表
          const newChildren = [...(parentNode.children || []), ...newNodeIds]
          const newChildrenNodes = nds
            .filter(node => newChildren.includes(node.id))
            .concat(parentNode)
            .concat(newNodes)

          // 更新 rectRange：新的边界是所有子节点的位置的最小/最大值
          const newChildrenNodesPosY = newChildrenNodes.map(item => item.position.y)
          const newChildrenNodesPosX = newChildrenNodes.map(item => item.position.x)

          const rectRange = {
            bottom: Math.max.apply(null, newChildrenNodesPosY) + NODE_HEIGHT,
            top: Math.min.apply(null, newChildrenNodesPosY),
            left: Math.min.apply(null, newChildrenNodesPosX),
            right: Math.max.apply(null, newChildrenNodesPosX) + NODE_WIDTH,
          }

          const updatedParentNode = {
            ...parentNode,
            data: {
              ...parentNode.data,
              rectRange,
              childCount: newChildren.length,
            },
            children: newChildren,
          }

          // 更新节点列表
          const updatedNodes = [
            ...nds.slice(0, parentNodeIndex),
            updatedParentNode,
            ...newNodes,
            ...nds.slice(parentNodeIndex + 1),
          ]

          return updatedNodes
        }

        updateNodeList(nodesFn)

        // 更新边：每个新节点都需要与父节点建立边
        const newEdges = newNodeIds.map((newNodeId, index) => {
          return {
            id: `${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
          }
        })

        const edgesFn = (eds: Edge[]) => {
          // 确保没有重复的边
          const allEdges = [...eds]
          newEdges.forEach(edge => {
            if (!eds.some(existingEdge => existingEdge.id === edge.id)) {
              allEdges.push(edge)
            }
          })
          return allEdges
        }

        updateEdgeList(edgesFn)
      },
      [updateEdgeList, updateNodeList],
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

    const handleResetPos = useCallback(
      (parentId: string, getZoomFunc: () => number) => {
        const nodesFn: (nds: ExtendedNode[]) => ExtendedNode[] = grtResetPosFn(parentId)
        updateNodeList(nodesFn)
      },
      [grtResetPosFn, updateNodeList],
    )

    const changeLabel = useCallback(
      (nodeId: string, value: string) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          return nds.map(node => {
            if (node.id === nodeId) {
              node.data.label = value
            }
            return node
          })
        }
        updateNodeList(nodesFn)
      },
      [updateNodeList],
    )

    const changeNote = useCallback(
      (nodeId: string, value: string) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          return nds.map(node => {
            if (node.id === nodeId) {
              node.data.note = value
            }
            return node
          })
        }
        updateNodeList(nodesFn)
      },
      [updateNodeList],
    )

    const toggleExpand = useCallback(
      (id: string, val?: boolean) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          const currentNode = nds.find(n => n.id === id)
          if (!currentNode) return nds

          const updateNodes = new Set<string>()

          // 递归收集所有子节点
          function collectionChildren(currentId: string, state: boolean, depth: number = 0) {
            const node = nds.find(n => n.id === currentId)

            if (node) {
              updateNodes.add(currentId)

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

          const newExpandedState = val ?? !currentNode.data.isExpanded
          collectionChildren(currentNode.id, newExpandedState, 0)

          return nds.map(n => {
            if (n.id === id) {
              return {
                ...n,
                data: { ...n.data, isExpanded: newExpandedState },
              }
            }

            if (updateNodes.has(n.id)) {
              return {
                ...n,
                isHidden: !newExpandedState, // 根据展开状态更新隐藏状态
              }
            }

            return n
          })
        }
        updateNodeList(nodesFn)
      },
      [updateNodeList],
    )

    const handleCleanCanvas = useCallback(() => updateNodeList(() => []), [updateNodeList])

    const handleFixedRect = useCallback(
      (id: string) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          return nds.map(n => {
            if (n.id === id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  outWidth: n.measured?.width || n.width,
                  outHeight: n.measured?.height || n.height,
                },
              }
            }
            return n
          })
        }
        updateNodeList(nodesFn)
      },
      [updateNodeList],
    )
    const handleFixedPostion = useCallback(
      (id: string, val: boolean) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          return nds.map(n => {
            if (n.id === id) {
              return {
                ...n,
                draggable: val,
              }
            }
            return n
          })
        }
        updateNodeList(nodesFn)
      },
      [updateNodeList],
    )

    const onConnect = useCallback(
      (params: Connection) => {
        console.log('Edge connectd:', params)
        const edgesFn = (eds: Edge[]) => addEdge(params, eds)
        updateEdgeList(edgesFn)
      },
      [updateEdgeList],
    )

    const onNodeDragStop = useCallback(
      (event: React.MouseEvent, node: ExtendedNode) => {
        const zoom = getZoom()
        const updatedGroupNodeIds = getGroupNodeIds(node)
        const nodesFn = (nds: ExtendedNode[]) => {
          const currentNode = nds.find(n => n.id === node.id)
          if (!currentNode) return nds

          const newPosition = {
            x: node.position.x,
            y: node.position.y,
          }

          const parentNode = nds.find(n => n.children?.includes(node.id))
          const currentNodePostionOffsets = {
            y: 0,
            x: 0,
          }
          /**
           * 父节点存在，处理组内节点拖拽情况
           */
          if (parentNode) {
            const pW = parentNode?.measured?.width || parentNode.width || NODE_WIDTH
            const standardX = parentNode.position.x + (pW + NODE_DISTANCE.horizontal)
            const minX = parentNode.position.x - NODE_DISTANCE.horizontal / 4
            const maxX = standardX + NODE_DISTANCE.horizontal / 4

            const runAwayNodes = new Set<string>()
            let siblingsNodesIds = new Set<string>(parentNode.children)

            if (newPosition.x > minX && newPosition.x <= maxX) {
              currentNodePostionOffsets.x = newPosition.x - standardX
              newPosition.x = standardX
            } else if (newPosition.x > maxX) {
              //解绑
              // 去 link
              runAwayNodes.add(node.id)
              siblingsNodesIds.delete(node.id)
            }
            const newChildren: string[] = [...siblingsNodesIds]

            const newChildrenNodes = nds.filter(node => newChildren.includes(node.id)).concat(parentNode)
            const newChildrenNodesPosY = newChildrenNodes.map(item => item.position.y)
            const newChildrenNodesPosX = newChildrenNodes.map(item => item.position.x)

            const rectRange = {
              bottom: Math.max.apply(newChildrenNodesPosY, newChildrenNodesPosY) + NODE_HEIGHT,
              top: Math.min.apply(newChildrenNodesPosY, newChildrenNodesPosY),
              left: Math.min.apply(newChildrenNodesPosX, newChildrenNodesPosX),
              right: Math.max.apply(newChildrenNodesPosX, newChildrenNodesPosX) + NODE_WIDTH,
            }
            const updatedNodes = nds.map(n =>
              n.id === parentNode.id
                ? {
                    ...n,
                    children: newChildren,
                    data: { ...n.data, childCount: newChildren.length, rectRange },
                  }
                : n,
            )

            if (runAwayNodes.size > 0) {
              const edsFn = (eds: Edge[]) => eds.filter(ed => !runAwayNodes.has(ed.target))
              updateEdgeList(edsFn)
            }
            // updatedGroupNodeIds
            return updatedNodes.map(n => {
              if (n.id === node.id) {
                return { ...n, position: newPosition }
              }

              if (node.children?.length && updatedGroupNodeIds.has(n.id)) {
                return {
                  ...n,
                  position: {
                    ...n.position,
                    x: n.position.x - currentNodePostionOffsets.x,
                  },
                }
              }

              return n
            })
          }
          /**
           *
           * 游离节点的操作，寻找是否有匹配的父节点
           * 此处考虑选择多个节点操作
           *
           */
          const newParentNode = nds.find(n => {
            const pW = n.measured?.width || n.width || NODE_WIDTH
            const minX = n.position.x
            const maxX = minX + pW
            const minY = n.position.y - NODE_HEIGHT / 2
            const maxY = n.position.y + NODE_HEIGHT / 2

            return (
              n.id !== node.id &&
              newPosition.x >= minX &&
              newPosition.x <= maxX &&
              newPosition.y >= minY &&
              newPosition.y <= maxY
            )
          })

          if (newParentNode) {
            const movedIds = selectedNodes.length > 1 ? selectedNodes.map(item => item.id) : [node.id]
            const newChildren = [...(newParentNode.children || []), ...movedIds]

            const updatedNodes = nds.map(n =>
              n.id === newParentNode.id
                ? {
                    ...n,
                    children: newChildren,
                    data: { ...n.data, childCount: newChildren.length },
                  }
                : n,
            )

            const newEdgs: Edge[] = movedIds.map(mId => ({
              id: `${newParentNode.id}-${mId}`, // Create a unique edge ID
              source: newParentNode.id,
              target: mId,
            }))

            // Check if the edge already exists before adding
            const edsFn = (eds: Edge[]) => {
              const filterdEdgs = newEdgs.filter(item => !eds.some(old => old.id === item.id))
              return [...eds, ...filterdEdgs]
            }
            updateEdgeList(edsFn)
            const pW = newParentNode.measured?.width || newParentNode.width || NODE_WIDTH
            const curNodeFixedPosition = {
              x: newParentNode.position.x + pW + NODE_DISTANCE.horizontal,
              y: newParentNode.position.y,
            }
            const offsetX = curNodeFixedPosition.x - newPosition.x
            return updatedNodes.map(n => {
              if (movedIds.some(mId => mId === n.id)) {
                return {
                  ...n,
                  position: curNodeFixedPosition,
                }
              }
              if (node.children?.length && updatedGroupNodeIds.has(n.id)) {
                return {
                  ...n,
                  position: {
                    ...n.position,
                    x: n.position.x + event.movementX / zoom + offsetX,
                  },
                }
              }
              return n
            })
          }

          // 游离节点，可能是一组

          return nds.map(n => {
            if (n.id === node.id) {
              return n
            }
            if (node.children?.length && updatedGroupNodeIds.has(n.id)) {
              return {
                ...n,
                position: {
                  ...n.position,
                  x: n.position.x + event.movementX / zoom,
                  y: n.position.y + event.movementY / zoom,
                },
              }
            }
            return n
          })
        }
        updateNodeList(nodesFn)
      },
      [getGroupNodeIds, getZoom, selectedNodes, updateEdgeList, updateNodeList],
    )

    const onNodeDrag = useCallback(
      (event: React.MouseEvent, node: ExtendedNode) => {
        const zoom = getZoom()

        const updateNodeIds = getGroupNodeIds(node)

        const nodesFn = (nds: ExtendedNode[]) => {
          return nds.map(n => {
            const newPosition = {
              x: n.position.x + event.movementX / zoom,
              y: n.position.y + event.movementY / zoom,
            }

            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  // rectRange: {
                  //   top: (n.data.rectRange?.top || 0) + event.movementY / zoom,
                  //   bottom: (n.data.rectRange?.bottom || 0) + event.movementY / zoom,
                  //   left: (n.data.rectRange?.left || 0) + event.movementX / zoom,
                  //   right: (n.data.rectRange?.right || 0) + event.movementX / zoom,
                  // },
                },
                position: newPosition,
              }
            }

            if (node?.children?.length && updateNodeIds.has(n.id)) {
              return {
                ...n,
                position: newPosition,
              }
            }

            return n
          })
        }
        updateNodeList(nodesFn)
      },
      [getGroupNodeIds, getZoom, updateNodeList],
    )

    const handleSelectionChange = (selection: OnSelectionChangeParams<ExtendedNode, Edge>) => {
      setSelectedNodes(selection.nodes)
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
        handleAppendChildrenToParent: (id: string, newNames: string[]) => addChildNode(id, newNames, getZoom),
        // handleSetCurrentNodeTheme: setNodeItemTheme,
      }),
      [addChildNode, getZoom, handleAddRootNode, handleCleanCanvas, handleCreateFreeNode],
    )

    const nodeTypes = useMemo(() => {
      return {
        customNode: (props: any) => (
          <CustomNode
            {...props}
            readonly={readonly}
            getSelectableItems={getSelectableItems}
            onAddChild={(newNames: string[]) => addChildNode(props.id, newNames, getZoom)}
            onExpandToggle={(val?: boolean) => toggleExpand(props.id, val)}
            onDelete={() => deleteNode([props.id])}
            onChangeRect={({ width, height }: { width: number; height: number }) =>
              changeRect(props.id, { width, height })
            }
            onFixedRect={() => handleFixedRect(props.id)}
            onFixedPostion={(fixed: boolean) => handleFixedPostion(props.id, fixed)}
            onChangeLabel={(value: string) => changeLabel(props.id, value)}
            onChangeNote={(value: string) => changeNote(props.id, value)}
            onResetPos={() => handleResetPos(props.id, getZoom)}
          />
        ), // 绑定 onAddChild
        // customNode: ResizableNode,
      }
    }, [
      addChildNode,
      changeLabel,
      changeNote,
      changeRect,
      deleteNode,
      getSelectableItems,
      getZoom,
      handleFixedPostion,
      handleFixedRect,
      handleResetPos,
      readonly,
      toggleExpand,
    ])

    return (
      <div style={{ position: 'relative', userSelect: 'none' }} className={className}>
        {showTollbar && (
          <Toolbar
            onCreateRootNode={() => handleAddRootNode()}
            onCreateNode={() => handleCreateFreeNode()}
            onDelete={batchDelete}
          />
        )}
        <ReactFlow
          nodes={nodes.filter(n => !n.isHidden)}
          edges={edges}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          // onNodesChange={onNodesChange}
          // onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeDrag={onNodeDrag}
          onNodesChange={handleNodesChange}
          defaultEdgeOptions={defaultEdgeOptions}
          // connectionLineStyle={connectionLineStyle}
          // connectionLineType={ConnectionLineType.SimpleBezier}
          fitView
          proOptions={{
            hideAttribution: true,
          }}
          // selectionMode="partial" // 允许部分框选
          selectionOnDrag
          multiSelectionKeyCode="Shift" // 允许 Shift + 点击多选
          onSelectionChange={handleSelectionChange}
          onNodeClick={(e, node) => handleClickNode(e, node)}
          onPaneClick={() => handleClickNode(null, null)}
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
