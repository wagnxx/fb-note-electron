import { PlayItem } from '@/pages/tools/video/components/FileUpload'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface VideoPlayerState {
  playlist: PlayItem[]
  currentVideoId: string | null
}

const initialState: VideoPlayerState = {
  playlist: [],
  currentVideoId: null,
}

const videoPlayerSlice = createSlice({
  name: 'videoPlayer',
  initialState,
  reducers: {
    setCurrentVideoId(state, action: PayloadAction<string | null>) {
      state.currentVideoId = action.payload
    },
    setPlaylist(state, action: PayloadAction<PlayItem[] | ((playlist: PlayItem[]) => PlayItem[])>) {
      if (typeof action.payload === 'function') {
        state.playlist = (action.payload as (playlist: PlayItem[]) => PlayItem[])(state.playlist)
      } else {
        state.playlist = action.payload
      }
    },
  },
})

export const { setCurrentVideoId, setPlaylist } = videoPlayerSlice.actions
export default videoPlayerSlice.reducer
