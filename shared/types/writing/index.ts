export type WritingType = 'article' | 'short_story' | 'video_script' | 'novel'

/** 章节结构，用于小说、短剧剧本、短篇故事等分章节类型 */
export interface WritingChapter {
  id: string
  title: string
  content: string
  order: number
}

/** 需要分章节的写作类型 */
export const CHAPTERED_TYPES: WritingType[] = ['novel', 'short_story', 'video_script']

/** 判断某类型是否为分章节类型 */
export function hasChapters(type: WritingType): boolean {
  return CHAPTERED_TYPES.includes(type)
}

export interface WritingItem {
  id: string
  type: WritingType
  title: string
  /** 文章类型使用 content；章节类型此字段为空或第一章摘要 */
  content: string
  /** 章节列表，仅章节类型（novel/short_story/video_script）使用 */
  chapters?: WritingChapter[]
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
