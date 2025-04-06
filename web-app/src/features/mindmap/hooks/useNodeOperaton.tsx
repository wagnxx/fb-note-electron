import React, { useCallback } from 'react'
import {
  applyNodeChanges,
  Edge,
  EdgeChange,
  NodeChange,
  NodeReplaceChange,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { v4 as uuidv4 } from 'uuid'
import { CreateGroupNode, CustomNodeData, ExtendedEdge, ExtendedNode } from '../types'
import { calculateMiddleValue } from '@/utils/utilsArray'
import { useApplyNodeChange } from './useApplyNodeChange'
import { GROUP_NODE_GUTTER, GROUP_NODE_PREFIX, NODE_TYPES } from '../constants'

type FlowStateReducerParams = {
  nodeReducer?: (currentNodes: ExtendedNode[]) => ExtendedNode[]
  edgeReducer?: (currentNodes: ExtendedEdge[]) => ExtendedEdge[]
}

type Props = {
  readonly?: boolean
  initNodeList: ExtendedNode[]
  initEdgeList: ExtendedEdge[]
  initialNodeSize: { width: number; height: number }
  nodeDistance: { vertical: number; horizontal: number }
  selectedNodes: ExtendedNode[]
}

const SELECTION_GRID_SPACING = {
  x: 200,
  y: 120,
}
let createdIndex = 0

const useNodeOperaton = ({
  readonly,
  initNodeList,
  initEdgeList,
  initialNodeSize,
  selectedNodes,
  nodeDistance,
}: Props) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodeList)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdgeList)

  const { getZoom } = useReactFlow()

  const { applyWorkerNodeChanges, applyWorkerEdgeChanges } = useApplyNodeChange({ setNodes, setEdges })

  const { getIntersectingNodes } = useReactFlow<ExtendedNode>()

  const handleFlowStateChange = useCallback(
    (
      nodeChanges: NodeChange<ExtendedNode>[],
      edgeChanges: EdgeChange<ExtendedEdge>[],
      { nodeReducer, edgeReducer }: FlowStateReducerParams = {},
    ) => {
      // combine todo
      if (nodeReducer) {
        const data = nodeReducer(nodes)
        setNodes(data)
      } else {
        if (nodeChanges.length > 200) {
          applyWorkerNodeChanges(nodes, nodeChanges)
        } else {
          onNodesChange(nodeChanges)
        }
      }

      if (edgeReducer) {
        const data = edgeReducer(edges)
        setEdges(data)
      } else {
        if (edgeChanges.length > 200) {
          applyWorkerEdgeChanges(edges, edgeChanges)
        } else {
          onEdgesChange(edgeChanges)
        }
      }
    },
    [applyWorkerEdgeChanges, applyWorkerNodeChanges, edges, nodes, onEdgesChange, onNodesChange, setEdges, setNodes],
  )

  const createNewNode = useCallback(
    ({
      id,
      type = NODE_TYPES.CUSTOM,
      isRoot = false,
      label = '',
      parentId,
      position = { x: 250, y: 5 },
      width = initialNodeSize.width,
      height = initialNodeSize.height,
      draggable = true,
      zIndex = 0,
    }: {
      id: string
      type?: string
      label?: string
      isRoot?: boolean
      parentId?: string
      width?: number
      height?: number
      position?: { x: number; y: number }
      resizable?: boolean
      draggable?: boolean
      zIndex?: number
    }): ExtendedNode => {
      // outWidth
      return {
        id,
        type,
        isRoot,
        parentId,
        data: {
          label: label,
          isExpanded: true,
        },
        position,
        isHidden: false,
        children: [],
        style: {
          width,
          height,
        },
        draggable,
        index: createdIndex++,
        zIndex,
      }
    },
    [initialNodeSize.height, initialNodeSize.width],
  )

  function createEdge(sourceId: string, targetId: string): Edge {
    return { id: `${sourceId}-${targetId}`, source: sourceId, target: targetId }
  }

  function isInside(position: { x: number; y: number }, parent: ExtendedNode): boolean {
    return (
      position.x >= parent.position.x &&
      position.x <= parent.position.x + (parent.width || 0) &&
      position.y >= parent.position.y &&
      position.y <= parent.position.y + (parent.height || 0)
    )
  }
  function alignToParent(x: number, parentNode: ExtendedNode): number {
    return parentNode.position.x + 10
  }

  const deleteNode = useCallback(
    (ids: string[]) => {
      const updateEdges = ids.map(id => edges.filter(edge => edge.source === id)).flat()
      handleFlowStateChange(
        ids.map(id => ({ id, type: 'remove' })),
        updateEdges.map(edg => ({ id: edg.id, type: 'remove' })),
      )
    },
    [edges, handleFlowStateChange],
  )
  const batchDelete = useCallback(() => {
    if (selectedNodes.length) {
      const ids = selectedNodes.map(item => item.id)
      deleteNode(ids)
    }
  }, [deleteNode, selectedNodes])

  const copyNode = useCallback(
    (nodeIds: string[]) => {
      setNodes(prevNodes => {
        const nodesToCopy = prevNodes.filter(node => nodeIds.includes(node.id))
        if (!nodesToCopy.length) return prevNodes
        const idMap = new Map<string, string>()
        nodesToCopy.forEach(node => {
          idMap.set(node.id, `${node.id}-copy-${uuidv4()}`)
        })
        // 复制节点并更新 children ID
        const copiedNodes = nodesToCopy.map((node, index) => ({
          ...node,
          id: idMap.get(node.id)!, // 使用映射的新 ID
          position: {
            x: node.position.x + 50, // 右移
            y: node.position.y + 50, // 避免完全重叠
          },
          selected: false,
          children: node.children?.map(childId => idMap.get(childId) || childId) || [],
        }))

        setEdges((prevEdges: Edge[]) => {
          // 复制边，替换 source 和 target
          const copiedEdges = prevEdges
            .filter(edge => nodeIds.includes(edge.source) && nodeIds.includes(edge.target))
            .map(edge => ({
              id: `${edge.id}-copy-${uuidv4()}`,
              source: idMap.get(edge.source) || '',
              target: idMap.get(edge.target) || '',
            }))
            .filter(item => item.source && item.target)

          return [...prevEdges, ...copiedEdges]
        })

        return [...prevNodes, ...copiedNodes]
      })
    },
    [setEdges, setNodes],
  )

  const creaateGroupIds = useCallback((pid: string, childLen: number): string[] => {
    const groupIds: string[] = []
    for (let i = 0; i < childLen; i++) {
      const newNodeId = `${pid}_${uuidv4()}` // 生成每个子节点的ID
      groupIds.push(newNodeId)
    }
    return groupIds
  }, [])

  const updateChildrenPos = (parentNode: ExtendedNode, children: ExtendedNode[]) => {
    const pW = parentNode.measured?.width || parentNode.width || initialNodeSize.width
    const pH = parentNode.measured?.height || parentNode.height || initialNodeSize.height

    const totalChildren = children.length

    if (totalChildren === 0) return children // 没有子节点直接返回

    // 计算子节点总高度（所有子节点的高度之和 + 每个间隔的高度）
    const totalChildrenHeight =
      children.reduce((sum, child) => sum + (child.height || initialNodeSize.height) + nodeDistance.vertical, 0) +
      (totalChildren - 1) * nodeDistance.vertical

    let currentY = pH / 2 - totalChildrenHeight / 2

    // 逐个放置子节点
    const updatedChildren = children.map((child, index) => {
      const relativeX = child.parentId === parentNode.id ? 0 : parentNode.position.x
      const relativeY = child.parentId === parentNode.id ? 0 : parentNode.position.y
      // 计算起始 Y 坐标，确保父节点居中

      const standardX = relativeX + pW + nodeDistance.horizontal

      const childHeight = child.measured?.height || child.height || initialNodeSize.height
      const newChild = {
        ...child,
        position: {
          ...child.position,
          x: standardX,
          y: currentY + relativeY, // 让子节点的中心对齐计算出的 `currentY`
        },
      }
      currentY += childHeight + nodeDistance.vertical // 更新 `currentY`

      return newChild
    })

    return updatedChildren
  }

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

  const updateNodeData = useCallback(
    (id: string, data: Partial<CustomNodeData>) => {
      const node = nodes.find(item => item.id === id)
      if (!node) return
      const changes: { type: 'replace'; id: string; item: ExtendedNode }[] = [
        {
          id,
          item: { ...node, data: { ...node.data, ...data } },
          type: 'replace',
        },
      ]
      setNodes(oldNodes => applyNodeChanges(changes, oldNodes))
    },
    [nodes, setNodes],
  )
  const updateNodeProps = useCallback(
    (id: string, attrs: Partial<ExtendedNode>) => {
      const node = nodes.find(item => item.id === id)
      if (!node) return
      const changes: { type: 'replace'; id: string; item: ExtendedNode }[] = [
        {
          id,
          item: { ...node, ...attrs },
          type: 'replace',
        },
      ]
      handleFlowStateChange(changes, [])
    },
    [handleFlowStateChange, nodes],
  )
  const alignNodesLinear = useCallback(() => {
    if (!selectedNodes.length) return
    const sortedNodes = [...selectedNodes].sort((a, b) => a.position.x - b.position.x)

    const startX = sortedNodes[0].position.x
    const startY = sortedNodes[0].position.y

    const newNodes = sortedNodes.map((node, index) => ({
      ...node,
      position: { x: startX + index * SELECTION_GRID_SPACING.x, y: startY },
    }))

    handleFlowStateChange(
      newNodes.map(item => ({ id: item.id, type: 'replace', item })),
      [],
    )
  }, [handleFlowStateChange, selectedNodes])

  const alignNodesVertical = useCallback(() => {
    if (!selectedNodes.length) return
    const sortedNodes = [...selectedNodes].sort((a, b) => a.position.y - b.position.y)

    const startX = sortedNodes[0].position.x
    const startY = sortedNodes[0].position.y

    const newNodes = sortedNodes.map((node, index) => ({
      ...node,
      position: { x: startX, y: startY + index * SELECTION_GRID_SPACING.y },
    }))

    setNodes(nds => nds.map(node => newNodes.find(n => n.id === node.id) || node))
  }, [selectedNodes, setNodes])

  const alignNodesGrid = useCallback(() => {
    if (!selectedNodes.length) return
    const cols = Math.ceil(Math.sqrt(selectedNodes.length)) // 计算列数（取平方根）

    const newNodes = selectedNodes.map((node, index) => ({
      ...node,
      position: {
        x: 0 + (index % cols) * SELECTION_GRID_SPACING.x,
        y: 0 + Math.floor(index / cols) * SELECTION_GRID_SPACING.y,
      },
    }))

    setNodes(nds => nds.map(node => newNodes.find(n => n.id === node.id) || node))
  }, [selectedNodes, setNodes])

  const onGroupSelections = useCallback(() => {
    if (!selectedNodes.length) return

    const floatNodes = selectedNodes.filter(item => !item.parentId)
    if (!floatNodes.length) return

    const cols = Math.ceil(Math.sqrt(floatNodes.length)) // 列数
    const rows = Math.ceil(floatNodes.length / cols) // 行数

    // 计算所有选中节点的最小 X/Y 和最大 X/Y
    const minX = Math.min(...floatNodes.map(node => node.position.x))
    const minY = Math.min(...floatNodes.map(node => node.position.y))
    const maxX = Math.max(...floatNodes.map(node => node.position.x + (node.width || initialNodeSize.width)))
    const maxY = Math.max(...floatNodes.map(node => node.position.y + (node.height || initialNodeSize.height)))

    // 计算 Group 的尺寸
    const groupWidth = maxX - minX + GROUP_NODE_GUTTER * 2
    const groupHeight = maxY - minY + GROUP_NODE_GUTTER * 2

    const groupId = GROUP_NODE_PREFIX + uuidv4()
    const groupParentNode = createNewNode({
      id: groupId,
      type: NODE_TYPES.GROUP,
      position: { x: minX - GROUP_NODE_GUTTER, y: minY - GROUP_NODE_GUTTER }, // Group 位置调整为包围所有子节点
      label: 'new group',
      width: groupWidth,
      height: groupHeight,
    })

    // 计算子节点的新位置，确保均匀分布
    const nodeSpacingX = groupWidth / cols // 列间距
    const nodeSpacingY = groupHeight / rows // 行间距

    const nodeChanges: NodeChange<ExtendedNode>[] = [
      {
        type: 'add',
        item: {
          ...groupParentNode,
          children: floatNodes.map(item => item.id),
          data: { ...groupParentNode.data, childCount: floatNodes.length, isExpanded: true },
        },
      },
      ...floatNodes.map((item, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols

        return {
          id: item.id,
          type: 'replace',
          item: {
            ...item,
            parentId: groupId,
            extent: 'parent',
            position: {
              x: minX - GROUP_NODE_GUTTER + col * nodeSpacingX + nodeSpacingX / 2, // 居中分布
              y: minY + GROUP_NODE_GUTTER + row * nodeSpacingY + nodeSpacingY / 2, // 居中分布
            },
          },
        } as NodeReplaceChange<ExtendedNode>
      }),
    ]

    handleFlowStateChange(nodeChanges, [])
  }, [createNewNode, handleFlowStateChange, initialNodeSize.height, initialNodeSize.width, selectedNodes])

  const addChildNode = useCallback(
    (parentId: string, newNames: string[]) => {
      const newNodeIds = creaateGroupIds(parentId, newNames.length) // 创建多个新节点的ID

      const parentNode = nodes.find(n => n.id === parentId)

      if (!parentNode) return
      const siblingsNodes = nodes.filter(node => parentNode.children?.includes(node.id))
      const siblingsPositionY = [...new Set(siblingsNodes.map(item => item.position.y))] // 去重
      // TODO: compute Reasonable number
      const nicePostionY = calculateMiddleValue(siblingsPositionY, parentNode.position.y, nodeDistance.vertical)

      const childrenNodes = newNodeIds.map((childId, index) => {
        const pW = parentNode.width || initialNodeSize.width
        const newNodePostion = {
          x: pW + nodeDistance.horizontal,
          y: nicePostionY + (index + siblingsNodes.length - 1) * (initialNodeSize.height + nodeDistance.vertical), // 每个新节点间隔10单位
        }
        return createNewNode({
          id: childId,
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

      handleFlowStateChange(
        [
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
        ],
        newEdges.map(item => ({ item, type: 'add' })),
      )
    },
    [
      creaateGroupIds,
      nodes,
      nodeDistance.vertical,
      nodeDistance.horizontal,
      handleFlowStateChange,
      initialNodeSize.width,
      initialNodeSize.height,
      createNewNode,
    ],
  )

  const batchUpdateNodeProps = useCallback(
    (updateNodes: ExtendedNode[]) => {
      if (!updateNodes.length) return

      handleFlowStateChange(
        updateNodes.map(item => ({ id: item.id, item: { ...item }, type: 'replace' })),
        [],
      )
    },
    [handleFlowStateChange],
  )

  const createGroupChanges = useCallback(
    (group: CreateGroupNode, groupIndex: number) => {
      let parent = createNewNode({
        id: uuidv4(),
        label: group.name,
        position: { x: 500, y: 899 + 50 + 50 * groupIndex },
      })
      const childrenIds: string[] = []
      let chidrenNodes = [] as ExtendedNode[]
      if (group.children?.length) {
        chidrenNodes = group.children.map((child, index) => {
          const nodeId = parent.id + '_' + child.name
          childrenIds.push(nodeId)
          const childNode = createNewNode({
            id: nodeId,
            label: child.name,
            parentId: parent.id,
            position: {
              x: 500 + 100 + 100,
              y: 899 + 50 * (index + groupIndex),
            },
          })

          return childNode
        })
      }

      parent = {
        ...parent,
        data: {
          ...parent.data,
          childCount: childrenIds.length,
        },
        children: childrenIds,
      }

      const nodes = [parent, ...chidrenNodes]

      let changesNodes: { item: ExtendedNode; type: 'add' }[] = []
      if (nodes.length === 1) {
        changesNodes = [{ type: 'add', item: nodes[0] }]
      }

      let changesEdges: { item: Edge; type: 'add' }[] = []
      if (nodes.length > 1) {
        changesNodes = nodes.map(item => ({ item, type: 'add' }))

        const newEdges = childrenIds.map(childId => {
          return {
            id: `${parent.id}-${childId}`,
            source: parent.id,
            target: childId,
          }
        })
        changesEdges = newEdges.map(item => ({ item, type: 'add' }))
      }

      return {
        nodes: changesNodes,
        edges: changesEdges,
      }
    },
    [createNewNode],
  )

  const filterTopLevelNodes = useCallback((nds: ExtendedNode[]): ExtendedNode[] => {
    const nodeMap = new Map(nds.map(node => [node.id, node]))

    return nds.filter(node => {
      // 没有 parentId，表示是游离节点，直接保留
      if (!node.parentId) return true

      // 如果 parentId 不在 selectedNodes 内，则保留
      return !nodeMap.has(node.parentId)
    })
  }, [])

  const getGlobalPosition = useCallback((node: ExtendedNode, nodes: ExtendedNode[]): { x: number; y: number } => {
    let pos = { x: node.position.x, y: node.position.y }

    let parent = nodes.find(n => n.id === node.parentId)
    while (parent) {
      pos.x += parent.position.x
      pos.y += parent.position.y
      parent = nodes.find(n => n.id === parent?.parentId) // 递归寻找更高层的 parent
    }

    return pos
  }, [])

  const fixedHierarchy = useCallback((id: string, deep: boolean, nds: ExtendedNode[]): ExtendedNode[] => {
    const nodeMap = new Map(nds.map(node => [node.id, node]))
    const updatedNodes = new Set<string>() // 用来追踪哪些节点发生了变化

    const fixNodeHierarchy = (nodeId: string) => {
      const parentNode = nodeMap.get(nodeId)
      if (!parentNode) return

      parentNode.children?.forEach(childId => {
        const childNode = nodeMap.get(childId)
        if (childNode) {
          const previousParentId = childNode.parentId

          // 强制固定父子关系
          childNode.parentId = parentNode.id

          // 如果父ID有变化，则记录该子节点已更新
          if (childNode.parentId !== previousParentId) {
            updatedNodes.add(childNode.id)
          }

          if (deep) {
            fixNodeHierarchy(childId) // 深度递归
          }
        }
      })
    }

    // 修改完后返回更新后的节点
    fixNodeHierarchy(id)

    // 只返回被修改过的节点
    return nds.filter(node => updatedNodes.has(node.id))
  }, [])
  const toggleExpandGroupNode = useCallback(
    (node: ExtendedNode, val?: boolean) => {
      const children = nodes.filter(item => (node.children || []).includes(item.id))

      const newExpandedState = val ?? !node.data.isExpanded
      const parentNodeChange: NodeChange<ExtendedNode> = {
        id: node.id,
        type: 'replace',
        item: {
          ...node,
          data: {
            ...node.data,
            isExpanded: newExpandedState,
          },
          // width: 10,
          // height: 10,
          width: newExpandedState ? node.data.outWidth : 50,
          height: newExpandedState ? node.data.outHeight : 20,
        },
      }
      const childrenNodeChanges: NodeChange<ExtendedNode>[] = children?.map(item => ({
        id: item.id,
        type: 'replace',
        item: { ...item, isHidden: !newExpandedState },
      }))
      handleFlowStateChange([parentNodeChange, ...childrenNodeChanges], [])
    },
    [handleFlowStateChange, nodes],
  )

  const toggleExpand = useCallback(
    (id: string, val?: boolean) => {
      const currentNode = nodes.find(n => n.id === id)
      if (!currentNode) return nodes
      if (currentNode.type === NODE_TYPES.GROUP) {
        toggleExpandGroupNode(currentNode, val)
        return
      }
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

      handleFlowStateChange(nodeChanges, [])
    },
    [handleFlowStateChange, nodes, toggleExpandGroupNode],
  )

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: ExtendedNode) => {
      if (readonly) {
        return
      }
      const groupsNodes = nodes.filter(item => item.type === NODE_TYPES.GROUP)
      const groupMap = new Map(groupsNodes.map(n => [n.id, n]))
      if (groupMap.get(node.parentId || '')) {
        // TODO
        return
      }

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
        if (node.type === NODE_TYPES.GROUP) {
          return
        }
        const pW = parentNode?.measured?.width || parentNode.width || initialNodeSize.width
        const standardX = 0 + (pW + nodeDistance.horizontal)
        const minX = 0 - nodeDistance.horizontal / 4
        const maxX = standardX + nodeDistance.horizontal / 4

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
              position: {
                x: getGlobalPosition(parentNode, nodes).x + node.position.x,
                y: getGlobalPosition(parentNode, nodes).y + node.position.y,
              },
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

        handleFlowStateChange(nodeChanges, edgeChanges)
        return
      }

      // 处理游离节点拖拽

      const intersectionNodes = getIntersectingNodes(node)
      const validIntersectionNodes = intersectionNodes.filter(item => !groupMap.get(item.parentId || ''))

      const hasEnterTarget =
        validIntersectionNodes.length === 1 && !selectedNodes.some(sel => sel.id === intersectionNodes[0].id)

      if (!hasEnterTarget) {
        return
      }

      const newParentNode = validIntersectionNodes[0]
      const filterdSelectedNodes = filterTopLevelNodes(selectedNodes)

      const movedIds = filterdSelectedNodes.length > 1 ? filterdSelectedNodes.map(item => item.id) : [node.id]
      const newChildren = [...(newParentNode.children || []), ...movedIds]

      const floatingNodes = nodes.filter(n => movedIds.includes(n.id)).map(n => ({ ...n, parentId: newParentNode.id }))

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

      const pW = newParentNode.measured?.width || newParentNode.width || initialNodeSize.width
      const curNodeFixedPosition = {
        x: 0 + pW + nodeDistance.horizontal,
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
              (n.measured?.height || n.height || initialNodeSize.height + nodeDistance.vertical) * deep,
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

      const newNodes = applyNodeChanges(nodeChanges, nodes)
      // setNodes(prevNodes => {
      //   if (!newNodes) return prevNodes
      //   const updatedNodes = newNodes

      //   // 🟢 找到父节点和游离节点的索引
      //   const parentIndex = updatedNodes.findIndex(n => n.id === newParentNode.id)
      //   const floatingIndexes = floatingNodes
      //     .map(n => updatedNodes.findIndex(p => p.id === n.id))
      //     .filter(index => index !== -1) // 过滤找不到的项
      //   const minFloatingIndex = Math.min(...floatingIndexes)

      //   // 🛠️ 处理节点顺序
      //   if (
      //     parentIndex !== minFloatingIndex &&
      //     parentIndex !== -1 &&
      //     minFloatingIndex !== -1 &&
      //     parentIndex > minFloatingIndex
      //   ) {
      //     const reorderedNodes = [...updatedNodes]
      //     ;[reorderedNodes[parentIndex], reorderedNodes[minFloatingIndex]] = [
      //       reorderedNodes[minFloatingIndex],
      //       reorderedNodes[parentIndex],
      //     ]
      //     return reorderedNodes
      //   }

      //   return updatedNodes
      // })
      // It‘s replaced by topoSortNodes
      const nodeReducer = (prevNodes: ExtendedNode[]) => {
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
      }

      handleFlowStateChange(nodeChanges, edgeChanges, {})
    },
    [
      readonly,
      nodes,
      getIntersectingNodes,
      selectedNodes,
      filterTopLevelNodes,
      initialNodeSize.width,
      initialNodeSize.height,
      nodeDistance.horizontal,
      nodeDistance.vertical,
      handleFlowStateChange,
      getGlobalPosition,
    ],
  )

  const onNodeDrag = useCallback(
    (event: React.MouseEvent, node: ExtendedNode) => {
      const groupsNodes = nodes.filter(item => item.type === NODE_TYPES.GROUP)
      const groupMap = new Map(groupsNodes.map(n => [n.id, n]))
      if (groupMap.get(node.parentId || '')) {
        // TODO
        return
      }
      const intersectionNodes = getIntersectingNodes(node)
      const historyIntersectionNodes = nodes.filter(node => node.className?.includes('highlight'))
      const intersectionNodesChanges: NodeChange<ExtendedNode>[] = intersectionNodes
        .filter(node => !selectedNodes.some(sel => sel.id === node.id))
        .filter(node => !groupMap.get(node.parentId || ''))
        .map(item => ({
          id: item.id,
          type: 'replace',
          item: {
            ...item,
            className: 'highlight',
          },
        }))
      const historyIntersectionNodesChanges: NodeChange<ExtendedNode>[] = historyIntersectionNodes.map(item => ({
        id: item.id,
        type: 'replace',
        item: { ...item, className: '' },
      }))

      const draggedNodeChange: NodeChange<ExtendedNode> = {
        id: node.id,
        type: 'position',
        position: {
          x: node.position.x + event.movementX / getZoom(),
          y: node.position.y + event.movementY / getZoom(),
        },
      }

      // handleFlowStateChange([...historyIntersectionNodesChanges, ...intersectionNodesChanges], [])
      const newNodes = applyNodeChanges(
        [draggedNodeChange, ...historyIntersectionNodesChanges, ...intersectionNodesChanges],
        nodes,
      )

      setNodes(newNodes)
    },
    [getIntersectingNodes, getZoom, nodes, selectedNodes, setNodes],
  )

  const onError = (code: string, message: string) => {
    const whiteList = ['002']
    if (!whiteList.includes(code)) {
      console.log(`Flow Error, Code[${code}], message: [${message}]`)
    }
  }

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    handleFlowStateChange,
    createNewNode,
    createEdge,
    addChildNode,
    isInside,
    alignToParent,
    deleteNode,
    batchDelete,
    copyNode,
    creaateGroupIds,
    updateChildrenPos,
    getGroupNodeIds,
    updateNodeData,
    updateNodeProps,
    createGroupChanges,
    batchUpdateNodeProps,
    filterTopLevelNodes,
    getGlobalPosition,
    fixedHierarchy,
    toggleExpand,
    onNodeDragStop,
    onNodeDrag,
    onError,
    alignNodesLinear,
    alignNodesVertical,
    alignNodesGrid,
    onGroupSelections,
  }
}

export default useNodeOperaton
