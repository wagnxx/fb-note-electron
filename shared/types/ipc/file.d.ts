export type FILE_PICKER_OPEN_TYPE = 'file' | 'directory' | 'both'
export type FILE_PICKER_RES_FILE = {
  path: string
  name: string
  type: 'file'
}
export type FILE_PICKER_RES_DIR = {
  path: string
  type: 'directory'
}
export type FILE_PICKER_RES = FILE_PICKER_RES_FILE | FILE_PICKER_RES_DIR | null

export interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileSystemItem[]
}
