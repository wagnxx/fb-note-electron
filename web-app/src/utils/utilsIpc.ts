const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileSystemItem[]
}
export const getDirectoryStructure = <T extends FileSystemItem = FileSystemItem>(
  path: string,
): Promise<T[]> => {
  return ipcRenderer.invoke(IPC_ACTIONS.GET_DIRECTORY_STRUCTURE, path)
}

export const parseDocFile = (file: string | ArrayBuffer) => {
  return ipcRenderer.invoke(IPC_ACTIONS.PARSE_DOC_FILE, file)
}

export const converDocToImage = (file: string | ArrayBuffer) => {
  return ipcRenderer.invoke(IPC_ACTIONS.CONVERT_DOC_TO_IMAGE, file)
}

export const getDirChildren = (
  enPath: string,
): Promise<
  { ok: true; data: string[]; message?: string } | { ok: false; message: string; data?: never }
> => {
  return ipcRenderer?.invoke(IPC_ACTIONS.LS_FOLDER, enPath)
}

export const getFileInfo = async <T extends 'file' | 'directory' | 'both'>(
  type: T,
): Promise<
  | (T extends 'file'
      ? { path: string; name: string; type: string }
      : { path: string; type: string })
  | null
> => {
  return ipcRenderer?.invoke(IPC_ACTIONS.SELECT_FILE, { type })
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
