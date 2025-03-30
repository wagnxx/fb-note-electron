import React from 'react'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react'
import { ExtendedEdge, ExtendedNode, TopicTheme } from '../types'

interface HistoryRecord {
  snapshot: { nodes: ExtendedNode[]; edges: ExtendedEdge[] }
}

interface FlowState {
  nodes: ExtendedNode[]
  edges: ExtendedEdge[]
  history: HistoryRecord[]
  current: number
  initData: { nodes: ExtendedNode[]; edges: ExtendedEdge[] } | null

  // setings
  currentNoteTheme: TopicTheme | null
  currentNodeId: string | null
  topicThemes: TopicTheme[]
}

export const DefaultTopic: TopicTheme = {
  key: 'defaul',
  name: 'default',
  label: 'Default',
  style: { backgroundColor: '#fff', color: '#000000' },
}

const topicThemes = [
  {
    key: 1,
    name: 'veryImportant',
    label: 'Very Important',
    style: { background: '#6A1F87', color: '#FFFFFF' },
  },
  {
    key: 2,
    name: 'important',
    label: 'Important',
    style: { background: '#861F56', color: '#FFFFFF' },
  },
  {
    key: 3,
    name: 'crossout',
    label: 'Cross out',
    style: { background: '#FFFFFF', color: '#000000', textDecorationLine: 'line-through' },
  },
  {
    key: 4,
    name: 'default',
    label: 'Default',
    style: { background: '#FFC947', color: '#000000' },
  },
  DefaultTopic,
]

const initialState: FlowState = {
  nodes: [],
  edges: [],
  history: [],
  current: -1,
  initData: null,
  // settings

  currentNodeId: null,
  currentNoteTheme: DefaultTopic,
  topicThemes,
}

const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    // ✅ 1. 初始化 API 数据，不进入历史
    initialize: (state, action: PayloadAction<{ nodes: ExtendedNode[]; edges: ExtendedEdge[] }>) => {
      state.nodes = action.payload.nodes
      state.edges = action.payload.edges
      state.initData = action.payload // ✅ 记录 API 初始状态
      state.history = [] // 清空历史
      state.current = -1
    },

    // ✅ 2. 只有用户操作才会保存历史
    saveHistory: (state, action: PayloadAction<{ nodes: ExtendedNode[]; edges: ExtendedEdge[] }>) => {
      if (!state.initData) return // ✅ 如果未初始化，不能存历史

      state.nodes = action.payload.nodes
      state.edges = action.payload.edges

      if (state.current < state.history.length - 1) {
        state.history = state.history.slice(0, state.current + 1)
      }

      state.history.push({ snapshot: action.payload })
      state.current = state.history.length - 1

      if (state.history.length > 20) {
        state.history.shift()
        state.current -= 1
      }
    },

    // ✅ 3. 使用 `applyNodeChanges` 和 `applyEdgeChanges` 处理 `saveState`
    saveFlowState: (
      state,
      action: PayloadAction<{
        nodeChanges: NodeChange<ExtendedNode>[]
        edgeChanges: EdgeChange<ExtendedEdge>[]
        fn?: (
          currentNodes: ExtendedNode[],
          currentEdegs: ExtendedEdge[],
        ) => { nodes: ExtendedNode[]; edges: ExtendedEdge[] }
      }>,
    ) => {
      const { nodeChanges, edgeChanges, fn } = action.payload

      let newNodes
      let newEdges

      // 如果提供了 fn，则用 fn 来处理节点更新
      if (fn) {
        const newState = fn(state.nodes, state.edges)
        newNodes = newState.nodes
        newEdges = newState.edges
      } else {
        // 如果没有提供 fn，则调用默认的 applyNodeChanges
        newNodes = applyNodeChanges(nodeChanges, state.nodes)
        newEdges = applyEdgeChanges(edgeChanges, state.edges)
      }

      // 检查是否有 `add/remove` 类型的更改
      if (
        nodeChanges.some(change => change.type === 'add' || change.type === 'remove') ||
        edgeChanges.some(change => change.type === 'add' || change.type === 'remove')
      ) {
        // flowSlice.caseReducers.saveHistory(state, { payload: { nodes: newNodes, edges: newEdges } } as any)
      }
      if (nodeChanges.length) {
        state.nodes = newNodes
      }
      if (edgeChanges.length) {
        state.edges = newEdges
      }
    },

    clearFlowData: state => {
      state.nodes = []
      state.edges = []
    },

    undo: state => {
      if (state.current > 0) {
        state.current -= 1
        const { nodes, edges } = state.history[state.current].snapshot
        state.nodes = nodes
        state.edges = edges
      } else if (state.initData) {
        state.nodes = state.initData.nodes
        state.edges = state.initData.edges
      }
    },

    redo: state => {
      if (state.current < state.history.length - 1) {
        state.current += 1
        const { nodes, edges } = state.history[state.current].snapshot
        state.nodes = nodes
        state.edges = edges
      }
    },
    setSelectedNodeId: (state, action: PayloadAction<string | null>) => {
      state.currentNodeId = action.payload
    },
    setSelectedNoteTheme: (state, action: PayloadAction<TopicTheme>) => {
      state.currentNoteTheme = action.payload
    },
    updateSelectedNoteTheme: (state, action: PayloadAction<React.CSSProperties>) => {
      if (!state.currentNoteTheme) return
      state.currentNoteTheme = {
        ...state.currentNoteTheme,
        style: {
          ...state.currentNoteTheme?.style,
          ...action.payload,
        },
      }
    },
  },
})

export const {
  initialize,
  saveHistory,
  saveFlowState,
  clearFlowData,
  undo,
  redo,
  setSelectedNoteTheme,
  setSelectedNodeId,
  updateSelectedNoteTheme,
} = flowSlice.actions
export default flowSlice.reducer
