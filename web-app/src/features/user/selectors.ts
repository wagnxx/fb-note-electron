// src/features/user/selectors.ts
import { RootState } from '@/store/store'

export const selectUser = (state: RootState) => state.user

export const selectUserById = (state: RootState, userId: string) =>
  state.user.users.find(user => user.id === userId)

export const selectIsLoading = (state: RootState) => state.user.isLoading
