import { FILE_PICKER_OPEN_TYPE, FILE_PICKER_RES, FileSystemItem } from './file'
import { CropRange } from './video'

type noop = (...args: any[]) => any

// 核心 handlers
type IpcActionHandlers = {
  SOCKS_SERVICE_OUTPUT: (message: string) => void
  SOCKS_SERVICE_ERROR: (error: Error) => void
  SOCKS_SERVICE_STOPPED: () => void
  STOP_SOCKS_SERVICE: () => void
  SOCKS_SERVICE_STATUS: noop
  CHECK_SOCKS_SERVICE: () => boolean
  GET_SOCKS_SERVICE_INFO: () => { port: number; status: string }

  GET_LOGS: () => string[]
  SUBPROCESS_ERROR: () => Error[]

  SELECT_FILE: (options: { type: FILE_PICKER_OPEN_TYPE }) => FILE_PICKER_RES
  GET_DIRECTORY_STRUCTURE: <T extends FileSystemItem>(path: string) => T[]
  PARSE_DOC_FILE: (file: string | ArrayBuffer) => string
  CONVERT_DOC_TO_IMAGE: <T extends string | ArrayBuffer>(
    file: T,
  ) => T extends string ? { arrayBuffer: ArrayBuffer } : { arrayBuffer: ArrayBuffer; filePath: string }

  SAVE_BASE64_IMAGE: (data: {
    imageData: string
    enPath?: string
  }) => { success: true; filePath: string } | { success: false; message: string }
  LS_FOLDER: (path: string) => string[]
  LOAD_VIDEO: (filePath: string) => ArrayBuffer
  READ_STREAM: (streamId: string) => Uint8Array
  CHECK_FOLDER_EXIST: (path: string) => boolean

  READ_JSON: <T>(filename: string) => T[] | null
  SAVE_JSON: (data: { filename: string; data: any }) => string | null
  DELETE_FILE: (filePath: string) => boolean

  SAVE_SCREENSHOT: (imageData: { dataURL: string; enVideoPath: string; enFolder: string; name: string }) => {
    filePath: string
    message: string
  }
  REMOVE_SCREENSHOT: (data: { enPaths: string[] }) => {
    ok: boolean
    message?: string
  }
  BATCH_CROP_IMAGE: (params: {
    filePaths: string[] | { path: string; cropRange: CropRange }[]
    cropRange?: CropRange
    needDecode?: boolean
  }) => {
    ok: boolean
    message?: string
  }
  MERGE_IMAGES: (params: {
    enFolder: string
    layout: 'col' | 'row'
    images: Array<{ enPath: string; width: number; height: number }>
    mergedName: string
  }) => {
    ok: boolean
    message?: string
  }
  COMPARE_IMAGES: (imageA: string, imageB: string) => boolean
  EXRACT_IMAGES_TEXT: (params: { enPaths: string[] }) => string
  EXRACT_VIDEO_FRAME_TEXT: (params: { enVideoPath: string; time: number; name: string }) => string

  DOWNLOAD_PAUSE: noop
  DOWNLOAD_RESUME: noop
  DOWNLOAD_CANCEL: noop
  DOWNLOAD_START: noop
  DOWNLOAD_TITLE: noop
  DOWNLOAD_PROGRESS: noop
  DOWNLOAD_COMPLETE: noop
  DOWNLOAD_ERROR: noop

  IMAGE_TO_ICONS: (imagePath: string) => string[]
}

// 构造类型映射
export type IpcChannels = {
  [K in keyof IpcActionHandlers]: IpcActionHandlers[K] extends (...args: infer A) => infer R
    ? {
        args: A
        return: R
        // eslint-disable-next-line unused-imports/no-unused-vars
        computeReturnType?: <T>() => any
      }
    : never
}

// ✅ 返回值推导：优先使用 computeReturnType<T> 推断返回类型，否则使用 return
type InferIpcReturn<
  K extends keyof IpcChannels,
  // eslint-disable-next-line unused-imports/no-unused-vars
  T = unknown,
> = 'computeReturnType' extends keyof IpcChannels[K]
  ? IpcChannels[K]['computeReturnType'] extends (...args: any[]) => infer R
    ? R
    : never
  : IpcChannels[K]['return']

// ✅ 最终 invoke 类型
export type IpcInvoke = <K extends keyof IpcChannels, T = unknown>(
  channel: K,
  ...args: IpcChannels[K]['args']
) => Promise<InferIpcReturn<K, T>>
