// src/app/rootReducer.ts
import { combineReducers } from 'redux'
import userReducer from '@/features/user/userSlice'
import authReducer from '@/features/auth/authSlice'
import SettingsRedducer from '@/features/settings/settingsSlice'
// import mindMapReducer from './mindMapSlice'

const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  settings: SettingsRedducer,
  // mindMap: mindMapReducer,
  // 添加其他 slice
})

export default rootReducer
