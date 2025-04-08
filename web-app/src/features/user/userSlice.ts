// src/features/user/userSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState {
  user: { id: string; name: string }[]
  isLoading: boolean
}

const initialState: UserState = {
  user: [],
  isLoading: false,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<{ id: string; name: string }[]>) {
      state.user = action.payload
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
  },
})

export const { setUsers, setLoading } = userSlice.actions
export default userSlice.reducer
