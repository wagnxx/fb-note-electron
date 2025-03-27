import React, { useCallback } from 'react'
import { CreateGroupNode, ExtendedNode } from '../components/flows/Flow'
import { applyNodeChanges, Edge, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import { v4 as uuidv4 } from 'uuid'
import { CustomNodeData } from '../components/nodes/ExNode'

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
      position = { x: 250, y: 5 },
      width = initialNodeSize.width,
      height = initialNodeSize.height,
      draggable = true,
    }: {
      id: string
      type?: string
      label?: string
      isRoot?: boolean
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
    const parentY = parentNode.position.y
    const parentX = parentNode.position.x
    const pW = parentNode.measured?.width || parentNode.width || initialNodeSize.width
    const pH = parentNode.measured?.height || parentNode.height || initialNodeSize.height
    const totalChildren = children.length

    if (totalChildren === 0) return children // 没有子节点直接返回

    // 计算子节点总高度（所有子节点的高度之和 + 每个间隔的高度）
    const totalChildrenHeight =
      children.reduce((sum, child) => sum + (child.height || initialNodeSize.height), 0) +
      (totalChildren - 1) * nodeDistance.vertical

    // 计算起始 Y 坐标，确保父节点居中
    let currentY = parentY + pH / 2 - totalChildrenHeight / 2
    const standardX = parentX + pW + nodeDistance.horizontal

    // 逐个放置子节点
    const updatedChildren = children.map(child => {
      const childHeight = child.height || initialNodeSize.height
      const newChild = {
        ...child,
        position: {
          ...child.position,
          x: standardX,
          y: currentY + childHeight / 2, // 让子节点的中心对齐计算出的 `currentY`
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

  return {
    crreateNewNode,
    deleteNode,
    batchDelete,
    copyNode,
    creaateGroupIds,
    updateChildrenPos,
    getGroupNodeIds,
    updateNodeData,
    updateNodeProps,
    createGroupChanges,
  }
}

export default useNodeOperaton
