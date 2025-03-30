import { RootState } from '@/store/store'

export const selectGlobalSettings = (state: RootState) => state.mindmapConfig.globalSettings
