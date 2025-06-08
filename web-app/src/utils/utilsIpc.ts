import { FileSystemItem } from '@shared/types'

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

export const getDirectoryStructure = <T extends FileSystemItem = FileSystemItem>(path: string): Promise<T[]> => {
  return ipcRenderer.invoke(IPC_ACTIONS.GET_DIRECTORY_STRUCTURE, path)
}

export const parseDocFile = (file: string | ArrayBuffer) => {
  return ipcRenderer.invoke(IPC_ACTIONS.PARSE_DOC_FILE, file)
}

export const converDocToImage = async <T extends string | ArrayBuffer>(
  file: T,
): Promise<T extends string ? { arrayBuffer: ArrayBuffer } : { arrayBuffer: ArrayBuffer; filePath: string }> => {
  return ipcRenderer.invoke<
    typeof IPC_ACTIONS.CONVERT_DOC_TO_IMAGE,
    T extends string ? { arrayBuffer: ArrayBuffer } : { arrayBuffer: ArrayBuffer; filePath: string }
  >(IPC_ACTIONS.CONVERT_DOC_TO_IMAGE, file)
}

export const saveBase64ToImage = async ({
  imageData,
  enPath,
}: {
  imageData: string
  enPath?: string
}): Promise<{ success: true; filePath: string } | { success: false; message: string }> => {
  return ipcRenderer.invoke(IPC_ACTIONS.SAVE_BASE64_IMAGE, { imageData, enPath })
}

export const getDirChildren = (
  enPath: string,
): Promise<{ ok: true; data: string[]; message?: string } | { ok: false; message: string; data?: never }> => {
  return ipcRenderer?.invoke(IPC_ACTIONS.LS_FOLDER, enPath)
}

export const getFileInfo = async <T extends 'file' | 'directory' | 'both'>(
  type: T,
): Promise<
  (T extends 'file' ? { path: string; name: string; type: string } : { path: string; type: string }) | null
> => {
  return ipcRenderer?.invoke<typeof IPC_ACTIONS.SELECT_FILE, T>(IPC_ACTIONS.SELECT_FILE, { type })
}

export const getFileDialogList = async <T extends 'file' | 'directory' | 'both'>(
  type: T,
): Promise<
  | { ok: true; folderPath: string; data: string[]; message?: string }
  | { ok: false; message: string; folderPath?: never; data?: never }
> => {
  const folder = await getFileInfo(type)
  if (!folder) {
    return {
      ok: false,
      message: 'folder canceled.',
    }
  }
  const result = await getDirChildren(encodeURIComponent(folder.path)) // TODO ...
  if (result.ok) {
    return {
      ...result,
      folderPath: folder.path,
    }
  } else {
    return result
  }
}

export const saveJsonToDocFile = (filename: string, data: any): Promise<string | null> => {
  return ipcRenderer.invoke(IPC_ACTIONS.SAVE_JSON, { data, filename })
}

export const getJsonFromDocFile = <T>(filename: string): Promise<T[] | null> => {
  return ipcRenderer.invoke(IPC_ACTIONS.READ_JSON, filename)
}

export const delJsonFile = (filePath: string): Promise<boolean> => {
  return ipcRenderer.invoke(IPC_ACTIONS.DELETE_FILE, filePath)
}
export const getWifi = () => {
  return ipcRenderer.invoke(IPC_ACTIONS.GET_WIFI)
}
