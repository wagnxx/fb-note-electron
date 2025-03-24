// src/app/rootReducer.ts
import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // 使用 localStorage（或者 AsyncStorage）作为存储
import userReducer from '@/features/user/userSlice'
import authReducer from '@/features/auth/authSlice'
import settingsReducer from '@/features/settings/settingsSlice'
import langReducer from '@/features/language/languageSlice'
import videoPlayerSlice from '@/features/video/videoPlayer'
import mindmapSlice from '@/features/mindmap/mindmapSlice'
// import mindMapReducer from './mindMapSlice'

// 配置持久化设置
const persistConfig = {
  key: 'root', // 设定持久化的 key
  storage, // 使用 storage（localStorage 或 AsyncStorage）
  whitelist: ['settings', 'user', 'language', 'videoPlayer'], // 指定需要持久化的 slice，'settings' 和 'user' 将被存储
}

// 创建持久化的 rootReducer
const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  settings: settingsReducer,
  language: langReducer,
  videoPlayer: videoPlayerSlice,
  mindmap: mindmapSlice,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export default persistedReducer
