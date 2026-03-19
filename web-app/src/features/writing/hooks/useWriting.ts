import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import type { WritingType } from '@shared/types/writing'
import { useAppDispatch } from '@/store/hooks'
import { initWritingDirectories, saveWriting, loadWriting, listWritings, deleteWriting } from '../writingSlice'
import {
  selectWritingState,
  selectWritingItems,
  selectCurrentWritingItem,
  selectWritingLoading,
  selectWritingError,
  selectFilteredWritingItems,
  selectWritingStats,
} from '../selectors'
import type { WritingFormData } from '../types'

export const useWriting = () => {
  const dispatch = useAppDispatch()

  // Selectors
  const writingState = useSelector(selectWritingState)
  const items = useSelector(selectWritingItems)
  const currentItem = useSelector(selectCurrentWritingItem)
  const loading = useSelector(selectWritingLoading)
  const error = useSelector(selectWritingError)
  const filteredItems = useSelector(selectFilteredWritingItems)
  const stats = useSelector(selectWritingStats)

  // Actions
  const initializeDirectories = useCallback(() => {
    dispatch(initWritingDirectories())
  }, [dispatch])

  const createWriting = useCallback(
    (data: WritingFormData) => {
      dispatch(saveWriting(data))
    },
    [dispatch],
  )

  const fetchWriting = useCallback(
    (type: WritingType, id: string) => {
      dispatch(loadWriting({ type, id }))
    },
    [dispatch],
  )

  const fetchWritings = useCallback(
    (type: WritingType) => {
      dispatch(listWritings(type))
    },
    [dispatch],
  )

  const removeWriting = useCallback(
    (type: WritingType, id: string) => {
      dispatch(deleteWriting({ type, id }))
    },
    [dispatch],
  )

  return {
    // State
    writingState,
    items,
    currentItem,
    loading,
    error,
    filteredItems,
    stats,

    // Actions
    initializeDirectories,
    createWriting,
    fetchWriting,
    fetchWritings,
    removeWriting,
  }
}
