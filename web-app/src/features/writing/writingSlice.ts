import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { WritingItem, WritingType } from '@shared/types/writing'
import type { WritingState, WritingFormData, WritingFilters, WritingListEntry } from './types'

const { ipcRenderer, IPC_ACTIONS } = window.electron || ({} as any)

const invokeWriting = ipcRenderer.invoke as <T>(channel: string, ...args: any[]) => Promise<T>

// Async thunks
export const initWritingDirectories = createAsyncThunk('writing/initDirectories', async () => {
  const result = await invokeWriting<{ success: boolean }>(IPC_ACTIONS.WRITING_INIT_DIRECTORIES)
  if (!result.success) {
    throw new Error('Failed to initialize writing directories')
  }
  return result
})

export const saveWriting = createAsyncThunk('writing/save', async (data: WritingFormData) => {
  const result = await invokeWriting<{ success: boolean; id?: string; error?: string }>(IPC_ACTIONS.WRITING_SAVE, data)
  if (!result.success) {
    throw new Error(result.error || 'Failed to save writing')
  }
  return result
})

export const loadWriting = createAsyncThunk('writing/load', async ({ type, id }: { type: WritingType; id: string }) => {
  const result = await invokeWriting<WritingItem | null>(IPC_ACTIONS.WRITING_LOAD, type, id)
  if (!result) {
    throw new Error('Writing not found')
  }
  return result
})

export const listWritings = createAsyncThunk('writing/list', async (type: WritingType) => {
  return await invokeWriting<WritingListEntry[]>(IPC_ACTIONS.WRITING_LIST, type)
})

export const deleteWriting = createAsyncThunk(
  'writing/delete',
  async ({ type, id }: { type: WritingType; id: string }) => {
    const result = await invokeWriting<boolean>(IPC_ACTIONS.WRITING_DELETE, type, id)
    if (!result) {
      throw new Error('Failed to delete writing')
    }
    return { type, id }
  },
)

const initialState: WritingState = {
  items: [],
  currentItem: null,
  loading: false,
  error: null,
  filters: {},
}

const writingSlice = createSlice({
  name: 'writing',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<WritingFilters>) => {
      state.filters = action.payload
    },
    clearCurrentItem: state => {
      state.currentItem = null
    },
    clearError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      // Init directories
      .addCase(initWritingDirectories.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(initWritingDirectories.fulfilled, state => {
        state.loading = false
      })
      .addCase(initWritingDirectories.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to initialize directories'
      })
      // Save writing
      .addCase(saveWriting.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(saveWriting.fulfilled, state => {
        state.loading = false
        // Optionally refresh the list or update current item
      })
      .addCase(saveWriting.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to save writing'
      })
      // Load writing
      .addCase(loadWriting.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(loadWriting.fulfilled, (state, action) => {
        state.loading = false
        state.currentItem = action.payload
      })
      .addCase(loadWriting.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load writing'
        state.currentItem = null
      })
      // List writings
      .addCase(listWritings.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(listWritings.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(listWritings.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load writings'
        state.items = []
      })
      // Delete writing
      .addCase(deleteWriting.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteWriting.fulfilled, (state, action) => {
        state.loading = false
        // Remove from items list
        state.items = state.items.filter(item => item.id !== action.payload.id)
        // Clear current item if it was deleted
        if (state.currentItem?.id === action.payload.id) {
          state.currentItem = null
        }
      })
      .addCase(deleteWriting.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete writing'
      })
  },
})

export const { setFilters, clearCurrentItem, clearError } = writingSlice.actions
export default writingSlice.reducer
