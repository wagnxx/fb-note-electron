import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../store/store'
import type { WritingState } from './types'
import type { WritingBase } from '@shared/types/writing'

// Basic selectors
export const selectWritingState = (state: RootState): WritingState => state.writing

export const selectWritingItems = createSelector(selectWritingState, writing => writing.items)

export const selectCurrentWritingItem = createSelector(selectWritingState, writing => writing.currentItem)

export const selectWritingLoading = createSelector(selectWritingState, writing => writing.loading)

export const selectWritingError = createSelector(selectWritingState, writing => writing.error)

export const selectWritingFilters = createSelector(selectWritingState, writing => writing.filters)

// Filtered selectors
export const selectFilteredWritingItems = createSelector(
  [selectWritingItems, selectWritingFilters],
  (items, filters) => {
    let filtered = items

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(searchLower) ||
          item.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)),
      )
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item => filters.tags!.some((tag: string) => item.tags.includes(tag)))
    }

    return filtered
  },
)

// Derived selectors
export const selectWritingStats = createSelector(selectWritingItems, items => ({
  total: items.length,
  byType: items.reduce(
    (acc, item) => {
      acc[(item as WritingBase & { type?: string }).type || 'unknown'] =
        (acc[(item as WritingBase & { type?: string }).type || 'unknown'] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  ),
}))
