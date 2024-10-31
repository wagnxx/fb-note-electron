// src/app/rootReducer.ts
import { combineReducers } from 'redux'
import userReducer from '@/features/user/userSlice'
import authReducer from '@/features/auth/authSlice'
// import mindMapReducer from './mindMapSlice'

const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  // mindMap: mindMapReducer,
  // 添加其他 slice
})

export default rootReducer
