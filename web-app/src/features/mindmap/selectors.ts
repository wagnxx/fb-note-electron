import { RootState } from '@/store/store'

export const selectGlobalSettings = (state: RootState) => state.mindmap.globalSettings
export const selectSelectedNode = (state: RootState) => state.mindmap.selectedNode
