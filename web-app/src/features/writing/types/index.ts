import type { WritingBase, WritingItem, WritingType, WritingChapter } from '@shared/types/writing'

// Frontend types for writing module
export interface WritingFormData {
  type: WritingType
  title: string
  /** 文章类型使用；章节类型此字段忽略 */
  content: string
  tags: string[]
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

export type { WritingBase, WritingItem, WritingType, WritingChapter }
