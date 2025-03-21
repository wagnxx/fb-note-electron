import React, { useCallback } from 'react'
import { ExtendedNode } from '../components/flows/Flow'
import { Edge, OnNodesChange } from '@xyflow/react'
import { v4 as uuidv4 } from 'uuid'

type Props = {
  nodes: ExtendedNode[]
  setNodes: React.Dispatch<React.SetStateAction<ExtendedNode[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  initialNodeSize: { width: number; height: number }
  nodeDistance: { vertical: number; horizontal: number }
  selectedNodes: ExtendedNode[]
  handleNodesChange: OnNodesChange<ExtendedNode>
}

const useNodeOperaton = ({
  nodes,
  setNodes,
  setEdges,
  initialNodeSize,
  selectedNodes,
  nodeDistance,
  handleNodesChange,
}: Props) => {
  const crreateNewNode = ({
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
  }
  const deleteNode = useCallback(
    (ids: string[]) => {
      handleNodesChange(ids.map(id => ({ id, type: 'remove' })))
    },
    [handleNodesChange],
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

  const grtResetPosFn = (id: string) => {
    const nodesFn: (nds: ExtendedNode[]) => ExtendedNode[] = (nds: ExtendedNode[]) => {
      const parentNodeIndex = nds.findIndex(n => n.id === id)
      if (parentNodeIndex === -1) return nds // 确保找到父节点

      const parentNode = nds[parentNodeIndex] // 获取最新的父节点

      const newChildren = [...(parentNode.children || [])]

      if (newChildren.length === 0) return nds

      let newChildrenNodes = nds.filter(node => newChildren.includes(node.id))
      newChildrenNodes = updateChildrenPos(parentNode, newChildrenNodes)

      const newChildrenNodesPosY = newChildrenNodes.map(item => item.position.y)
      const newChildrenNodesPosX = newChildrenNodes.map(item => item.position.x)

      const rectRange = {
        bottom: Math.max.apply(newChildrenNodesPosY, newChildrenNodesPosY) + initialNodeSize.height,
        top: Math.min.apply(newChildrenNodesPosY, newChildrenNodesPosY),
        left: Math.min.apply(newChildrenNodesPosX, newChildrenNodesPosX),
        right: Math.max.apply(newChildrenNodesPosX, newChildrenNodesPosX) + initialNodeSize.width,
      }

      const updatedParentNode = {
        ...parentNode,
        data: {
          ...parentNode.data,
          rectRange,
        },
      }

      // Fix bug: nodes were covered.
      const rootNode = nds.find(n => n.isRoot)
      const firstNode = updatedParentNode.isRoot ? updatedParentNode : rootNode
      const previousNodes: ExtendedNode[] = [
        firstNode,
        updatedParentNode.isRoot ? null : updatedParentNode,
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
    return nodesFn
  }

  return {
    crreateNewNode,
    deleteNode,
    batchDelete,
    copyNode,
    creaateGroupIds,
    updateChildrenPos,
    getGroupNodeIds,
    grtResetPosFn,
  }
}

export default useNodeOperaton
