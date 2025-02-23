import React, { useCallback, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  useReactFlow,
  Background,
} from 'react-flow-renderer'
// 引入 uuid 库
import { v4 as uuidv4 } from 'uuid'
import { noop } from '@/utils/utilsMisc'

import CustomNode, { CustomItem, CustomNodeData } from './CustomNode'
import { calculateMiddleValue } from '@/utils/utilsArray'
import Toolbar from './Toolbar'
import './FlowDiagram.css'
import { useNotification } from '@/hooks/useNotification'
import useFirstRender from '@/hooks/useFirstRender'

export interface ExtendedNode extends Node<CustomNodeData> {
  isHidden?: boolean
  children?: string[]
}

type Props = {
  bgVType?: BackgroundVariant
  bgColor?: string
  bgGap?: number
  bgSize?: number
  className?: string
  nodeList: ExtendedNode[]
  edgeList: Edge[]
  // The property is only used to test。It is used in the effect function and the DEFAULT_NODES.
  compId: string
  showTollbar?: boolean
  showMiniMap?: boolean
  showControls?: boolean
  showBackground?: boolean
  onNodeListChange?: (fn: (data: ExtendedNode[]) => ExtendedNode[]) => void
  onEdgeListChange?: (fn: (data: Edge[]) => Edge[]) => void
  getSelectableItems?: () => CustomItem[] // 从父组件获取选择项的函数
}

export type FlowDiagramRef = {
  handleAddRootNode: (rootName?: string) => void
  handleCreateFreeNode: (rootName?: string[]) => void
  handleCleanCanvas: () => void
  handleAppendChildrenToParent: (id: string, names: string[]) => void
}

const NODE_DISTANCE = 150
const NODE_WIDTH = 100
const NODE_HEIGHT = 50

const FlowDiagram = forwardRef<FlowDiagramRef, Props>(
  (
    {
      bgVType = BackgroundVariant.Dots,
      bgColor = '#ddd',
      bgGap = 20,
      bgSize = 1,
      className = ' ',
      nodeList,
      edgeList,
      compId,
      showTollbar = true,
      showMiniMap = true,
      showControls = true,
      showBackground = true,
      onNodeListChange = noop,
      onEdgeListChange = noop,
      getSelectableItems,
    },
    ref,
  ) => {
    const { getZoom } = useReactFlow()
    const [nodes, setNodes] = useState<ExtendedNode[]>(nodeList)
    const [edges, setEdges] = useState<Edge[]>(edgeList)

    const { showNotification } = useNotification()
    const isFirstRender = useFirstRender()

    const rootId = compId

    const updateInnerState = useCallback(() => {
      setNodes(nodeList)
      setEdges(edgeList)
    }, [edgeList, nodeList])

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

    const handleAddRootNode = useCallback(
      (rootName = 'root') => {
        if (nodes.length > 0) {
          showNotification('error', 'It is used to create root nodes.', 'message')
          return
        }
        // It  won't be used for now. It's only used for the root node.
        const DEFAULT_NODES = [
          {
            id: rootId,
            type: 'customNode',
            data: {
              label: rootName,
              isExpanded: true,
              isRoot: true,
              // onExpandToggle: () => toggleExpand(compId),
              // onAddChild: () => addChildNode(compId, getZoom),
              // onDelete: () => deleteNode(compId),
              // onChangeLabel: (e: ChangeEvent<HTMLInputElement>) => changeLabel(compId, e.target.value),
              rectRange: {
                top: 5,
                bottom: NODE_HEIGHT + 5,
                left: 250,
                right: 250 + NODE_WIDTH,
              },
            },
            position: { x: 250, y: 5 },
            isHidden: false,
            children: [],
          },
        ]
        const nodesFn = (nds: ExtendedNode[]) => DEFAULT_NODES
        updateNodeList(nodesFn)
      },
      [nodes.length, rootId, showNotification, updateNodeList],
    )
    const handleCreateFreeNode = useCallback(
      (freeNames = ['free node']) => {
        // It  won't be used for now. It's only used for the root node.
        const DEFAULT_NODES = freeNames.map((newName, index) => ({
          id: 'free_' + uuidv4(),
          type: 'customNode',
          data: {
            label: newName,
            isExpanded: true,
            isRoot: false,
            rectRange: {
              top: 5,
              bottom: NODE_HEIGHT + 5,
              left: 250,
              right: 250 + NODE_WIDTH,
            },
          },
          position: { x: 500, y: 5 + NODE_HEIGHT * index },
          isHidden: false,
          children: [],
        }))

        const nodesFn = (nds: ExtendedNode[]) => [...nds, ...DEFAULT_NODES]
        updateNodeList(nodesFn)
      },
      [updateNodeList],
    )

    const handleCleanCanvas = useCallback(() => {
      const nodesFn = (nds: ExtendedNode[]) => []
      updateNodeList(nodesFn)
    }, [updateNodeList])

    const updateChildrenPos = (parentNode: ExtendedNode, children: ExtendedNode[], spacing: number = 100) => {
      // 获取父节点的位置和数量
      const parentY = parentNode.position.y
      const totalChildren = children.length

      if (totalChildren === 0) return children // 如果没有子节点，直接返回原子节点数组

      // 计算起始位置，确保父节点位于中间
      const startY = parentY - ((totalChildren - 1) * spacing) / 2

      // 更新每个子节点的位置
      const updatedChildren = children.map((child, index) => {
        const newY = startY + index * spacing // 计算每个子节点的 Y 轴位置
        return {
          ...child,
          position: {
            ...child.position,
            y: newY, // 更新 Y 轴位置，保持 X 轴不变
          },
        }
      })

      return updatedChildren
    }

    const handleResetPos = useCallback(
      (parentId: string, getZoomFunc: () => number) => {
        const zoom = getZoomFunc()

        const nodesFn: (nds: ExtendedNode[]) => ExtendedNode[] = (nds: ExtendedNode[]) => {
          const parentNodeIndex = nds.findIndex(n => n.id === parentId)
          if (parentNodeIndex === -1) return nds // 确保找到父节点

          const parentNode = nds[parentNodeIndex] // 获取最新的父节点

          const newChildren = [...(parentNode.children || [])]
          let newChildrenNodes = nds.filter(node => newChildren.includes(node.id))
          newChildrenNodes = updateChildrenPos(parentNode, newChildrenNodes, 50 / zoom)

          const newChildrenNodesPosY = newChildrenNodes.map(item => item.position.y)
          const newChildrenNodesPosX = newChildrenNodes.map(item => item.position.x)

          const rectRange = {
            bottom: Math.max.apply(newChildrenNodesPosY, newChildrenNodesPosY) + NODE_HEIGHT,
            top: Math.min.apply(newChildrenNodesPosY, newChildrenNodesPosY),
            left: Math.min.apply(newChildrenNodesPosX, newChildrenNodesPosX),
            right: Math.max.apply(newChildrenNodesPosX, newChildrenNodesPosX) + NODE_WIDTH,
          }

          const updatedParentNode = {
            ...parentNode,
            data: {
              ...parentNode.data,
              rectRange,
            },
          }

          const updatedNodes = [
            updatedParentNode,
            ...newChildrenNodes,
            ...nds.filter(node => {
              if (node.id === updatedParentNode.id) return false
              if (newChildrenNodes.some(nNode => node.id === nNode.id)) return false
              return true
            }),
          ]

          return updatedNodes
        }
        updateNodeList(nodesFn)
      },
      [updateNodeList],
    )

    const getGroupNodeIds: (node: ExtendedNode) => Set<string> = useCallback(
      (node: ExtendedNode) => {
        const updateNodeIds = new Set<string>()
        const visited = new Set<string>() // 用于跟踪已访问的节点

        function collectionChildren(currentId: string) {
          if (visited.has(currentId)) return // 如果已经访问过，直接返回
          visited.add(currentId) // 标记为已访问

          const curNode = nodes.find(n => n.id === currentId)
          if (curNode) {
            updateNodeIds.add(currentId)
            if (curNode?.children?.length) {
              curNode.children.forEach(childId => collectionChildren(childId))
            }
          }
        }

        collectionChildren(node.id)
        return updateNodeIds
      },
      [nodes],
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

    const toggleExpand = useCallback(
      (id: string) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          const currentNode = nds.find(n => n.id === id)
          if (!currentNode) return nds

          const updateNodes = new Set<string>()

          // 递归收集所有子节点
          function collectionChildren(currentId: string, state: boolean) {
            const node = nds.find(n => n.id === currentId)
            if (node) {
              updateNodes.add(currentId)
              if (node.children) {
                node.children.forEach(childId => collectionChildren(childId, state))
              }
            }
          }

          const newExpandedState = !currentNode.data.isExpanded
          collectionChildren(currentNode.id, newExpandedState)

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

    const deleteNode = useCallback(
      (id: string) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          const parentNode = nds.find(n => n.children?.includes(id))
          if (!parentNode) return nds // 如果没有找到父节点，直接返回

          const updateParentNode: ExtendedNode = {
            ...parentNode,
            children: parentNode.children?.filter(nodeId => nodeId !== id) || [],
          }

          const edsFn = (eds: Edge[]) => {
            const updateEds = eds.filter(ed => ed.target !== id)
            return updateEds
          }
          updateEdgeList(edsFn)

          let updateNds = nds.filter(n => n.id !== id) || []
          updateNds = updateNds.map(n => {
            if (n.id === parentNode?.id) {
              return updateParentNode
            }
            return n
          })

          return updateNds
        }
        updateNodeList(nodesFn)
      },
      [updateEdgeList, updateNodeList],
    )

    const creaateGroupIds = (pid: string, childLen: number): string[] => {
      const groupIds: string[] = []
      for (let i = 0; i < childLen; i++) {
        const newNodeId = `${pid}_${uuidv4()}` // 生成每个子节点的ID
        groupIds.push(newNodeId)
      }
      return groupIds
    }

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
            const newNodePostion = {
              x: parentNode.position.x + NODE_DISTANCE,
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
            console.log('has parrent ', parentNode)
            console.log('current node', node)
            const standardX = parentNode.position.x + NODE_DISTANCE
            const minX = standardX - NODE_DISTANCE / 2
            const maxX = standardX + NODE_DISTANCE

            const runAwayNodes = new Set<string>()
            let siblingsNodesIds = new Set<string>(parentNode.children)

            if (newPosition.x < minX || newPosition.x <= maxX) {
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

            console.log('newChildrenNodesPosY::', newChildrenNodesPosY)

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
      // 游离节点的操作，寻找是否有匹配的父节点
       * 
       */
          const newParentNode = nds.find(n => {
            const minX = n.position.x
            const maxX = minX + 100
            const minY = n.position.y - 50
            const maxY = n.position.y + 50

            return (
              n.id !== node.id &&
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
            const edsFn = (eds: Edge[]) => {
              if (!eds.some(edge => edge.id === newEdge.id)) {
                return [...eds, newEdge]
              }
              return eds // Prevent adding duplicate edges
            }
            updateEdgeList(edsFn)

            const curNodeFixedPosition = {
              x: newParentNode.position.x + NODE_DISTANCE,
              y: newParentNode.position.y,
            }
            const offsetX = curNodeFixedPosition.x - newPosition.x
            return updatedNodes.map(n => {
              if (n.id === node.id) {
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
              return {
                ...n,
                position: newPosition,
              }
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
      [getGroupNodeIds, getZoom, updateEdgeList, updateNodeList],
    )

    const onNodeDrag = useCallback(
      (event: React.MouseEvent, node: ExtendedNode) => {
        const zoom = getZoom()

        const updateNodeIds = getGroupNodeIds(node)

        const nodesFn = (nds: ExtendedNode[]) => {
          return nds.map(n => {
            const newPosition = {
              x: node.position.x + event.movementX / zoom,
              y: node.position.y + event.movementY / zoom,
            }

            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  rectRange: {
                    top: (n.data.rectRange?.top || 0) + event.movementY / zoom,
                    bottom: (n.data.rectRange?.bottom || 0) + event.movementY / zoom,
                    left: (n.data.rectRange?.left || 0) + event.movementX / zoom,
                    right: (n.data.rectRange?.right || 0) + event.movementX / zoom,
                  },
                },
                position: newPosition,
              }
            }

            if (node?.children?.length && updateNodeIds.has(n.id)) {
              return {
                ...n,
                position: {
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
      [getGroupNodeIds, getZoom, updateNodeList],
    )

    useEffect(() => {
      console.log('Flow component Mounted/Updated', compId)
      if (!isFirstRender) {
        updateInnerState()
      }
      return () => {
        console.log('Fow component UnMounted', compId)
      }
    }, [compId, isFirstRender, updateInnerState])

    useImperativeHandle(
      ref,
      () => ({
        handleAddRootNode,
        handleCreateFreeNode,
        handleCleanCanvas,
        handleAppendChildrenToParent: (id: string, newNames: string[]) => addChildNode(id, newNames, getZoom),
      }),
      [addChildNode, getZoom, handleAddRootNode, handleCleanCanvas, handleCreateFreeNode],
    )

    const nodeTypes = useMemo(() => {
      return {
        customNode: (props: any) => (
          <CustomNode
            {...props}
            getSelectableItems={getSelectableItems}
            onAddChild={(newNames: string[]) => addChildNode(props.id, newNames, getZoom)}
            onExpandToggle={() => toggleExpand(props.id)}
            onDelete={() => deleteNode(props.id)}
            onChangeLabel={(label: string) => changeLabel(props.id, label)}
            onResetPos={() => handleResetPos(props.id, getZoom)}
          />
        ), // 绑定 onAddChild
      }
    }, [addChildNode, changeLabel, deleteNode, getSelectableItems, getZoom, handleResetPos, toggleExpand])

    return (
      <div style={{ position: 'relative', userSelect: 'none' }} className={className}>
        {showTollbar && <Toolbar onAddNode={handleAddRootNode} />}
        <ReactFlow
          nodes={nodes.filter(n => !n.isHidden)}
          edges={edges}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeDragStop={onNodeDragStop}
          onNodeDrag={onNodeDrag}
          fitView
        >
          {' '}
          {showBackground && (
            <Background variant={bgVType} color={bgColor} size={bgSize / getZoom()} gap={bgGap / getZoom()} />
          )}
          {showMiniMap && <MiniMap />}
          {showControls && <Controls />}
        </ReactFlow>
      </div>
    )
  },
)

export default FlowDiagram
