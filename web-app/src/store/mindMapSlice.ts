// src/store/mindMapSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
// import { MindMapNode } from '@/features/mindmap/types'

type MindMapNode = {
  id: string
  title: string
  children: MindMapNode[]
}

interface MindMapState {
  rootNode: MindMapNode
}

const initialState: MindMapState = {
  rootNode: { id: 'root', title: '中心主题', children: [] },
}

const mindMapSlice = createSlice({
  name: 'mindMap',
  initialState,
  reducers: {
    addNode: (state, action: PayloadAction<{ parentId: string; title: string }>) => {
      const findNode = (node: MindMapNode, id: string): MindMapNode | null => {
        if (node.id === id) return node
        for (const child of node.children) {
          const found = findNode(child, id)
          if (found) return found
        }
        return null
      }

      const parentNode = findNode(state.rootNode, action.payload.parentId)
      if (parentNode) {
        parentNode.children.push({
          id: `${Math.random()}`,
          title: action.payload.title,
          children: [],
        })
      }
    },
  },
})

export const { addNode } = mindMapSlice.actions
export default mindMapSlice.reducer
