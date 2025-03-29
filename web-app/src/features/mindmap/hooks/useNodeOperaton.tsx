import React, { useCallback } from 'react'
import { applyNodeChanges, Edge, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import { v4 as uuidv4 } from 'uuid'
import { CreateGroupNode, CustomNodeData, ExtendedNode } from '../types'

type Props = {
  nodes: ExtendedNode[]
  edges: Edge[]
  setNodes: React.Dispatch<React.SetStateAction<ExtendedNode[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  initialNodeSize: { width: number; height: number }
  nodeDistance: { vertical: number; horizontal: number }
  selectedNodes: ExtendedNode[]
  handleNodesChange: OnNodesChange<ExtendedNode>
  handleEdgesChange: OnEdgesChange<Edge>
}

const useNodeOperaton = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  initialNodeSize,
  selectedNodes,
  nodeDistance,
  handleNodesChange,
  handleEdgesChange,
}: Props) => {
  const crreateNewNode = useCallback(
    ({
      id,
      type = 'customNode',
      isRoot = false,
      label = '',
      parentId,
      position = { x: 250, y: 5 },
      width = initialNodeSize.width,
      height = initialNodeSize.height,
      draggable = true,
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
        width,
        height,
        draggable,
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
      handleNodesChange(ids.map(id => ({ id, type: 'remove' })))
      const updateEdges = ids.map(id => edges.filter(edge => edge.source === id)).flat()
      handleEdgesChange(updateEdges.map(edg => ({ id: edg.id, type: 'remove' })))
    },
    [edges, handleEdgesChange, handleNodesChange],
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

  const creaateGroupIds = (pid: string, childLen: number): string[] => {
    const groupIds: string[] = []
    for (let i = 0; i < childLen; i++) {
      const newNodeId = `${pid}_${uuidv4()}` // 生成每个子节点的ID
      groupIds.push(newNodeId)
    }
    return groupIds
  }

  const updateChildrenPos = (parentNode: ExtendedNode, children: ExtendedNode[]) => {
    const pW = parentNode.measured?.width || parentNode.width || initialNodeSize.width
    const pH = parentNode.measured?.height || parentNode.height || initialNodeSize.height

    const totalChildren = children.length

    if (totalChildren === 0) return children // 没有子节点直接返回

    // 计算子节点总高度（所有子节点的高度之和 + 每个间隔的高度）
    const totalChildrenHeight =
      children.reduce((sum, child) => sum + (child.height || initialNodeSize.height), 0) +
      (totalChildren - 1) * nodeDistance.vertical

    let currentY = pH / 2 - totalChildrenHeight / 2

    // 逐个放置子节点
    const updatedChildren = children.map((child, index) => {
      const relativeX = child.parentId === parentNode.id ? 0 : parentNode.position.x
      const relativeY = child.parentId === parentNode.id ? 0 : parentNode.position.y
      // 计算起始 Y 坐标，确保父节点居中

      const standardX = relativeX + pW + nodeDistance.horizontal

      const childHeight = child.height || initialNodeSize.height
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
      handleNodesChange(changes)
    },
    [handleNodesChange, nodes],
  )

  const batchUpdateNodeProps = useCallback(
    (updateNodes: ExtendedNode[]) => {
      if (!updateNodes.length) return

      handleNodesChange(updateNodes.map(item => ({ id: item.id, item: { ...item }, type: 'replace' })))
    },
    [handleNodesChange],
  )

  const createGroupChanges = useCallback(
    (group: CreateGroupNode, groupIndex: number) => {
      let parent = crreateNewNode({
        id: group.name,
        isRoot: false,
        label: group.name,
        position: { x: 500, y: 899 + 50 + 50 * groupIndex },
      })
      const childrenIds: string[] = []
      let chidrenNodes = [] as ExtendedNode[]
      if (group.children?.length) {
        chidrenNodes = group.children.map((child, index) => {
          const nodeId = parent.id + '_' + child.name
          childrenIds.push(nodeId)
          const childNode = crreateNewNode({
            id: nodeId,
            isRoot: false,
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
    [crreateNewNode],
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

  return {
    crreateNewNode,
    createEdge,
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
  }
}

export default useNodeOperaton
