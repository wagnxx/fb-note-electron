import React, { useCallback, useEffect, useMemo, forwardRef, useImperativeHandle, useState } from 'react'
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

// default config
const NODE_WIDTH = 100
const NODE_HEIGHT = 40
const NODE_DISTANCE = {
  horizontal: 50,
  vertical: 20,
}

const nodeOrigin: [number, number] = [0.5, 1]
const connectionLineStyle = { stroke: '#F6AD55', strokeWidth: 2 }
const defaultEdgeOptions = {
  style: connectionLineStyle,
  // type: 'mindmap', animated: true
  type: 'bezier',
  // animated: true,
  // markerEnd: {
  //   type: MarkerType.Arrow,
  //   color: 'green',
  // },
}

const FlowDiagram = forwardRef<FlowDiagramRef, Props>(
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
      onNodeListChange = noop,
      onEdgeListChange = noop,
      getSelectableItems,
    },
    ref,
  ) => {
    const { getZoom } = useReactFlow()
    // const [nodes, setNodes] = useState<ExtendedNode[]>(initNodeList)
    // const [edges, setEdges] = useState<Edge[]>(initEdgeList)

    const [nodes, setNodes, onNodesChange] = useNodesState(initNodeList)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initEdgeList)
    const [selectedNodes, setSelectedNodes] = useState<ExtendedNode[]>([])

    const { showNotification } = useNotification()
    const isFirstRender = useFirstRender()

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

    useEffect(() => {
      if (isFirstRender) return
      onNodeListChange(() => nodes) // 传递最新的 `nodes` 到父组件
    }, [isFirstRender, nodes, onNodeListChange])
    useEffect(() => {
      if (isFirstRender) return
      onEdgeListChange(() => edges) // 传递最新的 `nodes` 到父组件
    }, [edges, isFirstRender, onEdgeListChange])

    // const handleNodesChange = (changes: NodeChange[]) => {
    //   setNodes(prevNodes => {
    //     const updatedNodes: ExtendedNode[] = applyNodeChanges(changes, prevNodes) as ExtendedNode[] // 确保返回正确类型
    //     // onNodesUpdate(updatedNodes)
    //     // onNodeListChange(() => updatedNodes)
    //     return updatedNodes
    //   })
    // }

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
              // width: NODE_WIDTH,
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
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            resizable: true,
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
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
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

    const updateChildrenPos = (parentNode: ExtendedNode, children: ExtendedNode[]) => {
      const parentY = parentNode.position.y
      const parentX = parentNode.position.x
      const pW = parentNode.width || parentNode.measured?.width || NODE_WIDTH
      const pH = parentNode.height || parentNode.measured?.height || NODE_HEIGHT
      const totalChildren = children.length

      if (totalChildren === 0) return children // 没有子节点直接返回

      // 计算子节点总高度（所有子节点的高度之和 + 每个间隔的高度）
      const totalChildrenHeight =
        children.reduce((sum, child) => sum + (child.height || NODE_HEIGHT), 0) +
        (totalChildren - 1) * NODE_DISTANCE.vertical

      // 计算起始 Y 坐标，确保父节点居中
      let currentY = parentY + pH / 2 - totalChildrenHeight / 2
      const standardX = parentX + pW + NODE_DISTANCE.horizontal

      // 逐个放置子节点
      const updatedChildren = children.map(child => {
        const childHeight = child.height || NODE_HEIGHT
        const newChild = {
          ...child,
          position: {
            ...child.position,
            x: standardX,
            y: currentY + childHeight / 2, // 让子节点的中心对齐计算出的 `currentY`
          },
        }
        currentY += childHeight + NODE_DISTANCE.vertical // 更新 `currentY`
        return newChild
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

          if (newChildren.length === 0) return nds

          let newChildrenNodes = nds.filter(node => newChildren.includes(node.id))
          newChildrenNodes = updateChildrenPos(parentNode, newChildrenNodes)

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

          // Fix bug: nodes were covered.
          const rootNode = nds.find(n => n.data.isRoot)
          const firstNode = updatedParentNode.data.isRoot ? updatedParentNode : rootNode
          const previousNodes: ExtendedNode[] = [
            firstNode,
            updatedParentNode.data.isRoot ? null : updatedParentNode,
            ...newChildrenNodes,
          ].filter(Boolean) as ExtendedNode[]

          const updatedNodes = [
            ...previousNodes,
            ...nds.filter(node => {
              if (node.id === updatedParentNode.id) return false
              if (previousNodes.some(nNode => node.id === nNode.id)) return false
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
      (id: string) => {
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

          const newExpandedState = !currentNode.data.isExpanded
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

    const deleteNode = useCallback(
      (id: string) => {
        const nodesFn = (nds: ExtendedNode[]) => {
          const parentNode = nds.find(n => n.children?.includes(id))
          if (!parentNode) {
            const currentNode = nds.find(item => item.id === id)
            if (currentNode?.data.isRoot) {
              showNotification('error', 'The root node cannot be removed.', 'message')
              return nds
            }
            return nds.filter(nd => nd.id !== id)
          }

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

    const onConnect = useCallback(
      (params: Connection) => {
        console.log('Edge connectd:', params)
        const edgesFn = (eds: Edge[]) => addEdge(params, eds)
        updateEdgeList(edgesFn)
      },
      [updateEdgeList],
    )
    const isColliding = (pos: { x: number; y: number }, target: ExtendedNode) => {
      return !(
        (
          pos.x + 100 < target.position.x || // 右侧未接触
          pos.x > target.position.x + (target.width || 100) || // 左侧未接触
          pos.y + 50 < target.position.y || // 下侧未接触
          pos.y > target.position.y + (target.height || 50)
        ) // 上侧未接触
      )
    }
    const onNodeDragStop = useCallback(
      (event: React.MouseEvent, node: ExtendedNode) => {
        const zoom = getZoom()
        const updatedGroupNodeIds = getGroupNodeIds(node)
        const nodesFn = (nds: ExtendedNode[]) => {
          const currentNode = nds.find(n => n.id === node.id)
          if (!currentNode) return nds

          // if (selectedNodes.length) {
          //   const panrentNode = nds.find(target => {
          //     if (selectedNodes.some(n => n.id === target.id)) return false // 排除自己
          //     return isColliding(node.position, target)
          //   })

          //   if (panrentNode) {
          //     console.log(`框选的节点拖拽到了 ${panrentNode.id}`)
          //     // handleDropOnTarget(targetNode, selectedNodes)
          //   }
          //   return nds
          // }

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
            const pW = parentNode.width || NODE_WIDTH
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
            const pW = NODE_WIDTH
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

            // const newEdge: Edge = {
            //   id: `${newParentNode.id}-${node.id}`, // Create a unique edge ID
            //   source: newParentNode.id,
            //   target: node.id,
            // }
            const newEdgs: Edge[] = movedIds.map(mId => ({
              id: `${newParentNode.id}-${mId}`, // Create a unique edge ID
              source: newParentNode.id,
              target: mId,
            }))

            // Check if the edge already exists before adding
            const edsFn = (eds: Edge[]) => {
              const filterdEdgs = newEdgs.filter(item => !eds.some(old => old.id === item.id))
              // if (!eds.some(edge => edge.id === newEdge.id)) {
              //   return [...eds, ...newEdgs]
              // }
              // return eds // Prevent adding duplicate edges
              return [...eds, ...filterdEdgs]
            }
            updateEdgeList(edsFn)
            const pW = NODE_WIDTH
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
            onChangeRect={({ width, height }: { width: number; height: number }) =>
              changeRect(props.id, { width, height })
            }
            onChangeLabel={(value: string) => changeLabel(props.id, value)}
            onChangeNote={(value: string) => changeNote(props.id, value)}
            onResetPos={() => handleResetPos(props.id, getZoom)}
          />
        ), // 绑定 onAddChild
      }
    }, [
      addChildNode,
      changeLabel,
      changeNote,
      changeRect,
      deleteNode,
      getSelectableItems,
      getZoom,
      handleResetPos,
      toggleExpand,
    ])

    return (
      <div style={{ position: 'relative', userSelect: 'none' }} className={className}>
        {showTollbar && (
          <Toolbar onCreateRootNode={() => handleAddRootNode()} onCreateNode={() => handleCreateFreeNode()} />
        )}
        <ReactFlow
          // defaultNodes={nodes.filter(n => !n.isHidden)}
          // defaultEdges={edges}
          nodes={nodes.filter(n => !n.isHidden)}
          edges={edges}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          // onNodesChange={onNodesChange}
          // onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onNodeDrag={onNodeDrag}
          onNodesChange={onNodesChange}
          // defaultEdgeOptions={defaultEdgeOptions}
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

export default FlowDiagram
