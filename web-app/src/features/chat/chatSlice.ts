import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Message, Group } from './types'

// 定义 WebSocket 状态
interface WebSocketState {
  ws: WebSocket | null
  id: string
  isConnected: boolean
  connectionError: string | null
}

// 定义初始状态
interface ChatState {
  messagesByGroup: Record<string, Message[]>
  groups: Group[]
  systemMessages: string[]
  wsState: WebSocketState
}

const initialState: ChatState = {
  messagesByGroup: {},
  groups: [],
  systemMessages: [],
  wsState: {
    ws: null,
    id: '',
    isConnected: false,
    connectionError: null,
  },
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      console.log('addmessae: ', action)
      const { groupId } = action.payload
      if (!state.messagesByGroup[groupId]) {
        state.messagesByGroup[groupId] = []
      }
      state.messagesByGroup[groupId].push(action.payload)
    },
    updateGroups(state, action: PayloadAction<Group[]>) {
      state.groups = action.payload
    },
    // updateJoinedGroups(state, action: PayloadAction<string[]>) {
    //   state.joinedGroupIds = action.payload
    // },
    systemNotify(state, action: PayloadAction<string>) {
      state.systemMessages.push(action.payload)
    },
    setWebSocketState(state, action: PayloadAction<WebSocketState>) {
      state.wsState = action.payload
    },
    clearSystemMessages(state) {
      state.systemMessages = []
    },
  },
})

export const { addMessage, updateGroups, systemNotify, setWebSocketState, clearSystemMessages } = chatSlice.actions

export default chatSlice.reducer
