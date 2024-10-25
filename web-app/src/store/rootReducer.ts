// src/app/rootReducer.ts
import { combineReducers } from 'redux'
import userReducer from '@/features/user/userSlice'
import authReducer from '@/features/auth/authSlice'

const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
  // 添加其他 slice
})

export default rootReducer
