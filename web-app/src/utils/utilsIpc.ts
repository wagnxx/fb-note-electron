const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileSystemItem[]
}
export const getDirectoryStructure = async <T extends FileSystemItem = FileSystemItem>(
  path: string,
): Promise<T[]> => {
  return ipcRenderer.invoke(IPC_ACTIONS.GET_DIRECTORY_STRUCTURE, path)
}
