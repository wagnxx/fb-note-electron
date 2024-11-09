// src/features/user/userSlice.ts
import { createSlice } from '@reduxjs/toolkit'

interface SettingsState {
  sidbar: {
    collapsed: boolean
  }
}

const initialState: SettingsState = {
  sidbar: {
    collapsed: false,
  },
}

const SettingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidbar.collapsed = !state.sidbar.collapsed
    },
  },
})

export const { toggleSidebar } = SettingsSlice.actions
export default SettingsSlice.reducer
