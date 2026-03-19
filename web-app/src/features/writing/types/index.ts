import type { WritingBase, WritingItem, WritingType } from '@shared/types/writing'

// Frontend types for writing module
export interface WritingFormData {
  type: WritingType
  title: string
  content: string
  tags: string[]
}

export interface WritingFilters {
  type?: WritingType
  tags?: string[]
  search?: string
}

export interface WritingState {
  items: Array<WritingBase & { type?: WritingType }>
  currentItem: WritingItem | null
  loading: boolean
  error: string | null
  filters: WritingFilters
}

export interface WritingListItem {
  id: string
  title: string
  type: WritingType
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type { WritingBase, WritingItem, WritingType }
