import { RootState } from '@/store/store'

export const selectGlobalSettings = (state: RootState) => state.mindmapConfig.globalSettings
export const selectSelectedNode = (state: RootState) => state.mindmapConfig.currentNode
