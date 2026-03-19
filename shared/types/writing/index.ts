export type WritingType = 'article' | 'short_story' | 'video_script' | 'novel'

export interface WritingItem {
  id: string
  type: WritingType
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface WritingBase {
  id: string
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

export interface WritingListResponse {
  items: WritingBase[]
  total: number
}

export interface WritingSaveRequest {
  type: WritingType
  title: string
  content: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface WritingUpdateRequest extends WritingSaveRequest {
  id: string
}

export interface WritingExportData {
  items: WritingItem[]
  exportedAt: string
  version: string
}
