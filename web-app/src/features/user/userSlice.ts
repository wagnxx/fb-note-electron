// src/features/user/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState {
  users: { id: string; name: string }[]
  isLoading: boolean
}

const initialState: UserState = {
  users: [],
  isLoading: false,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<{ id: string; name: string }[]>) {
      state.users = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
  },
})

export const { setUsers, setLoading } = userSlice.actions
export default userSlice.reducer
