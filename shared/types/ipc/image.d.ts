export interface ImageConvertRequest {
  inputPath: string
  format: 'ico' | 'icns'
}

export interface ImageConvertResponse {
  success: boolean
  outputPath: string
}

export interface IconOptions {
  input: string
  outputDir: string
  rounded?: boolean
  radius?: number
}

export interface GenerateResult {
  ok: boolean
  message: string
  data: string[]
}
