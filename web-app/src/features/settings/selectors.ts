// src/features/user/selectors.ts
import { RootState } from '@/store/store'

export const getSidbarCollapsed = (state: RootState) => state.settings.sidbar.collapsed

export const selectUserById = (state: RootState, userId: string) =>
  state.user.users.find(user => user.id === userId)
