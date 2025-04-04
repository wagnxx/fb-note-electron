// src/utils/graphUtils.ts

import { ExtendedNode } from '@/features/mindmap/types'

/**
 * 拓扑排序，确保父节点（parentId）在子节点之前
 * @param nodes 要排序的节点列表
 * @returns 排序后的节点数组
 */
export const topoSortNodes = (nodes: ExtendedNode[]): ExtendedNode[] => {
  const nodeMap = new Map<string, ExtendedNode>()
  const inDegree = new Map<string, number>()
  const queue: ExtendedNode[] = []
  const sortedNodes: ExtendedNode[] = []

  // 初始化映射表和入度表
  nodes.forEach(node => {
    nodeMap.set(node.id, node)
    inDegree.set(node.id, 0)
  })

  // 计算入度
  nodes.forEach(node => {
    node.children?.forEach(childId => {
      if (nodeMap.has(childId)) {
        inDegree.set(childId, (inDegree.get(childId) || 0) + 1)
      }
    })
  })

  // 找到所有入度为 0 的节点（根节点）
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node)
    }
  })

  // 拓扑排序
  while (queue.length > 0) {
    const node = queue.shift()!
    sortedNodes.push(node)

    // 处理子节点
    node.children?.forEach(childId => {
      if (nodeMap.has(childId)) {
        inDegree.set(childId, (inDegree.get(childId) || 0) - 1)
        if (inDegree.get(childId) === 0) {
          queue.push(nodeMap.get(childId)!)
        }
      }
    })
  }

  return sortedNodes
}
