import type {
  WritingItem,
  WritingType,
  WritingBase,
  WritingExportData,
  WritingSaveRequest,
} from '@shared/types/writing'
const { ipcRenderer, IPC_ACTIONS } = window.electron || ({} as any)

const invokeWriting = ipcRenderer.invoke as <T>(channel: string, ...args: any[]) => Promise<T>

// API functions for writing operations
export const writingAPI = {
  // Initialize writing directories
  initDirectories: async (): Promise<{ success: boolean }> => {
    return await invokeWriting<{ success: boolean }>(IPC_ACTIONS.WRITING_INIT_DIRECTORIES)
  },

  // Save writing content
  saveWriting: async (data: WritingSaveRequest): Promise<{ success: boolean; id?: string; error?: string }> => {
    return await invokeWriting<{ success: boolean; id?: string; error?: string }>(IPC_ACTIONS.WRITING_SAVE, data)
  },

  // Load writing content
  loadWriting: async (type: WritingType, id: string): Promise<WritingItem | null> => {
    return await invokeWriting<WritingItem | null>(IPC_ACTIONS.WRITING_LOAD, type, id)
  },

  // List writings by type
  listWritings: async (type: WritingType): Promise<Array<WritingBase & { type?: WritingType }>> => {
    return await invokeWriting<Array<WritingBase & { type?: WritingType }>>(IPC_ACTIONS.WRITING_LIST, type)
  },

  // Delete writing content
  deleteWriting: async (type: WritingType, id: string): Promise<boolean> => {
    return await invokeWriting<boolean>(IPC_ACTIONS.WRITING_DELETE, type, id)
  },

  // Export all writing data
  exportData: async (): Promise<WritingExportData> => {
    return await invokeWriting<WritingExportData>(IPC_ACTIONS.WRITING_EXPORT_DATA)
  },

  // Import writing data
  importData: async (data: WritingExportData): Promise<{ success: number; failed: number }> => {
    return await invokeWriting<{ success: number; failed: number }>(IPC_ACTIONS.WRITING_IMPORT_DATA, data)
  },
}
