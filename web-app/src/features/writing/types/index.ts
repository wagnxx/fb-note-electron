import type { WritingBase, WritingItem, WritingType } from '@shared/types/writing'

export interface WritingChapter {
  id: string
  title: string
  content: string
  order: number
}

export interface WritingVolume {
  id: string
  title: string
  order: number
  chapters: WritingChapter[]
}

// Frontend types for writing module
export interface WritingFormData {
  id?: string
  type: WritingType
  title: string
  /** 文章类型使用；章节类型此字段忽略 */
  content: string
  tags: string[]
  /** 可选元数据，如 { relatedArticleId: string } */
  metadata?: Record<string, any>
  /** 小说使用（卷 -> 章） */
  volumes?: WritingVolume[]
  /** 章节类型使用（novel/short_story/video_script） */
  chapters?: WritingChapter[]
}

export interface WritingFilters {
  type?: WritingType
  tags?: string[]
  search?: string
}

export interface WritingListEntry extends WritingBase {
  type?: WritingType
  description?: string
}

export interface WritingState {
  items: WritingListEntry[]
  currentItem: WritingItem | null
  loading: boolean
  error: string | null
  filters: WritingFilters
  displayMode?: 'normal' | 'compact'
  activeTagFilter?: string | null
}

export interface WritingListItem {
  id: string
  title: string
  type: WritingType
  description?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type { WritingBase, WritingItem, WritingType }
