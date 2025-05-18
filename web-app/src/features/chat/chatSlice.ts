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
  currentGroupId: string
}

const initialState: ChatState = {
  messagesByGroup: {},
  groups: [],
  currentGroupId: '',
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
    updateMessage(state, action: PayloadAction<{ groupId: string; messages: Message[] }>) {
      const { groupId, messages } = action.payload
      state.messagesByGroup[groupId] = messages
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
    selectGroup(state, action: PayloadAction<string>) {
      state.currentGroupId = action.payload
    },
  },
})

export const {
  addMessage,
  updateMessage,
  updateGroups,
  systemNotify,
  setWebSocketState,
  clearSystemMessages,
  selectGroup,
} = chatSlice.actions

export default chatSlice.reducer
