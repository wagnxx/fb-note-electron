// src/features/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserInfo {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}
interface AuthState {
  isAuthenticated: boolean
  user: UserInfo | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    setAuthState: (state, action: PayloadAction<{ isAuthenticated: boolean; user: UserInfo | null }>) => {
      state.isAuthenticated = action.payload.isAuthenticated
      state.user = action.payload.user
    },
    clearAuthState: state => {
      state.isAuthenticated = false
      state.user = null
    },
  },
})

export const { setAuthState, clearAuthState } = authSlice.actions
export default authSlice.reducer
