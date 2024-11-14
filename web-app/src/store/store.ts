// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { persistStore } from 'redux-persist'
import persistedReducer from './rootReducer'

const store = configureStore({
  reducer: persistedReducer, // 使用持久化后的 reducer
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // 根据需要禁用序列化检查
    }),
})

const persistor = persistStore(store) // 创建持久化对象

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>

export { store, persistor }
export default store
