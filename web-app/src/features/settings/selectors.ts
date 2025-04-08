// src/features/user/selectors.ts
import { RootState } from '@/store/store'

export const getSidbarCollapsed = (state: RootState) => state.settings.sidbar.collapsed
