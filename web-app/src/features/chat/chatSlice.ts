import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChatGroup as Group, ChatMessage as Message, User } from '@shared/types'

// 定义 WebSocket 状态
interface WebSocketState {
  ws: WebSocket | null
  id: string
  username?: string
  avatar?: string
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
  users?: User[] | null
}

const initialState: ChatState = {
  messagesByGroup: {},
  groups: [],
  currentGroupId: '',
  systemMessages: [],
  wsState: {
    ws: null,
    id: '',
    username: '',
    avatar: '',
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
    updateUsers(state, action: PayloadAction<User[]>) {
      state.users = action.payload
    },
    setWebSocketState(state, action: PayloadAction<WebSocketState>) {
      state.wsState = action.payload
    },
    updateWebSocketState(state, action: PayloadAction<Partial<WebSocketState>>) {
      state.wsState = {
        ...state.wsState,
        ...action.payload,
      }
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
  updateUsers,
  setWebSocketState,
  updateWebSocketState,
  clearSystemMessages,
  selectGroup,
} = chatSlice.actions

export default chatSlice.reducer
