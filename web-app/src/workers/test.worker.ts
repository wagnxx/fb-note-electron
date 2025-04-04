/// <reference lib="webworker" />

import { ExtendedEdge, ExtendedNode } from '@/features/mindmap/types'
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'

self.onmessage = (
  event: MessageEvent<{ nodes: ExtendedNode[]; edges: ExtendedEdge[]; changes: []; type: 'nodes' | 'edges' }>,
) => {
  // self.onmessage = (event ) => {
  // console.log('applyNodeChnge worker received messge：', event.data)
  const { nodes, edges, changes, type } = event.data

  if (type === 'nodes') {
    const updatedNodes = applyNodeChanges(changes, nodes)
    // console.log('updatedNodes: ', updatedNodes)
    // 发送更新后的 nodes 回主线程
    self.postMessage({ type: 'nodes', data: updatedNodes })
  }

  if (type === 'edges') {
    const updatedNodes = applyEdgeChanges(changes, edges)
    self.postMessage({ type: 'edges', data: updatedNodes })
  }

  // self.postMessage(event.data)
}

export {}
