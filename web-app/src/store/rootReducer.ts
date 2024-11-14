// src/app/rootReducer.ts
import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // 使用 localStorage（或者 AsyncStorage）作为存储
import userReducer from '@/features/user/userSlice'
import authReducer from '@/features/auth/authSlice'
import settingsReducer from '@/features/settings/settingsSlice'
// import mindMapReducer from './mindMapSlice'

// 配置持久化设置
const persistConfig = {
  key: 'root', // 设定持久化的 key
  storage, // 使用 storage（localStorage 或 AsyncStorage）
  whitelist: ['settings', 'user'], // 指定需要持久化的 slice，'settings' 和 'user' 将被存储
}

// 创建持久化的 rootReducer
const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  settings: settingsReducer,
  // mindMap: mindMapReducer, // 其他的 slice，如果需要的话可以继续添加
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export default persistedReducer
