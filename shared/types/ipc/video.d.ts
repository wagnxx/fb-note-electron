export interface CropRange {
  left: number
  top: number
  width: number
  height: number
}

export interface FileWithCropRange {
  path: string
  cropRange: CropRange
}
