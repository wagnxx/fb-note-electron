import { createSelector } from '@reduxjs/toolkit'
import { PlayItem } from '@/pages/tools/video/components/FileUpload'
import { RootState } from '@/store/store'

export const selectPlaylist = (state: RootState) => state.videoPlayer.playlist
export const selectCurrentVideoId = (state: RootState) => state.videoPlayer.currentVideoId

export const selectCurrentVideo = createSelector(
  [selectPlaylist, selectCurrentVideoId],
  (playlist, currentVideoId): PlayItem | null => {
    return playlist.find(item => item.id === currentVideoId) || null
  },
)

export const isItemInPlaylist = createSelector(
  [selectPlaylist, (_: RootState, itemId: string) => itemId],
  (playlist, itemId) => {
    return playlist.some(item => item.id === itemId)
  },
)
