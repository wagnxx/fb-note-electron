import React from 'react'
import { Edge, EdgeChange, NodeChange } from '@xyflow/react'
import { useEffect, useRef } from 'react'
import { ExtendedEdge, ExtendedNode } from '../types'

type WorkerResponse = {
  nodes?: any
  edges?: any
}

const testworkerUrl = new URL('@/workers/test.worker.ts', import.meta.url)
console.log('testworkerUrl', testworkerUrl.href) // 打印解析后的 URL

type Props = {
  setNodes: React.Dispatch<React.SetStateAction<ExtendedNode[]>>
  setEdges: React.Dispatch<React.SetStateAction<ExtendedEdge[]>>
}
export const useApplyNodeChange = ({ setNodes, setEdges }: Props) => {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('@/workers/applyNodeChange.worker.ts', import.meta.url), {
        type: 'module',
      })

      workerRef.current.onmessage = event => {
        if (event.data.type === 'nodes') {
          setNodes(event.data.data)
        }
        if (event.data.type === 'edges') {
          setEdges(event.data.data)
        }
      }
    } catch (error) {
      console.error('Failed to create worker:', error)
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [setEdges, setNodes])

  const applyWorkerNodeChanges = (
    nodes: ExtendedNode[],
    changes: NodeChange<ExtendedNode>[],
  ): Promise<WorkerResponse> => {
    return new Promise(resolve => {
      if (!workerRef.current) return resolve({ nodes })

      workerRef.current.postMessage({ type: 'nodes', nodes, changes })
    })
  }
  const applyWorkerEdgeChanges = (edges: ExtendedEdge[], changes: EdgeChange<Edge>[]): Promise<WorkerResponse> => {
    return new Promise(resolve => {
      if (!workerRef.current) return resolve({ edges })
      workerRef.current.postMessage({ type: 'edges', edges, changes })
    })
  }

  return { applyWorkerNodeChanges, applyWorkerEdgeChanges }
}
