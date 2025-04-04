// utils/flowUtils.ts
import { applyNodeChanges, NodeChange } from '@xyflow/react'
import { ExtendedNode } from '@/features/mindmap/types'

export function applyNodeChangesWorker(changes: NodeChange<ExtendedNode>[], nodes: ExtendedNode[]) {
  return applyNodeChanges(changes, nodes)
}
