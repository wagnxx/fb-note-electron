import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Node, Edge } from '@xyflow/react'

export interface FlowState {
  nodes: Node[]
  edges: Edge[]
}

const initialState: FlowState = {
  nodes: [],
  edges: [],
}

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    setNodes(state, action: PayloadAction<Node[]>) {
      state.nodes = action.payload
    },
    setEdges(state, action: PayloadAction<Edge[]>) {
      state.edges = action.payload
    },
    addNode(state, action: PayloadAction<Node>) {
      state.nodes.push(action.payload)
    },
    updateNode(state, action: PayloadAction<{ id: string; data: Partial<Node> }>) {
      const node = state.nodes.find(n => n.id === action.payload.id)
      if (node) {
        Object.assign(node, action.payload.data)
      }
    },
    removeNode(state, action: PayloadAction<string>) {
      state.nodes = state.nodes.filter(n => n.id !== action.payload)
    },
  },
})

export const { setNodes, setEdges, addNode, updateNode, removeNode } = flowSlice.actions
export default flowSlice.reducer
