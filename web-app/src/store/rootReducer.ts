// src/app/rootReducer.ts
import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // 使用 localStorage（或者 AsyncStorage）作为存储
import userReducer from '@/features/user/userSlice'
import authReducer from '@/features/auth/authSlice'
import settingsReducer from '@/features/settings/settingsSlice'
import langReducer from '@/features/language/languageSlice'
import videoPlayerReducer from '@/features/video/videoPlayer'
import mindmapConfigReducer from '@/features/mindmap//slices/configSlice'
import mindmapFlowwReducer from '@/features/mindmap//slices/flowSlice'
import { rolePermissionReducer } from '@/features/rolePermission'
import chatReducer from '@/features/chat/chatSlice'

// 配置持久化设置
const persistConfig = {
  key: 'root', // 设定持久化的 key
  storage, // 使用 storage（localStorage 或 AsyncStorage）
  whitelist: ['settings', 'user', 'auth', 'language', 'videoPlayer', 'mindmapConfig'], // 指定需要持久化的 slice，'settings' 和 'user' 将被存储
}

// 创建持久化的 rootReducer
const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  settings: settingsReducer,
  language: langReducer,
  videoPlayer: videoPlayerReducer,
  mindmapConfig: mindmapConfigReducer,
  mindmapFlow: mindmapFlowwReducer,
  rolePermission: rolePermissionReducer,
  chat: chatReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export default persistedReducer
