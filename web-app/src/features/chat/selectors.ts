import { RootState } from '@/store/store'
import { createSelector } from '@reduxjs/toolkit'

export const isGroupJoined = (joinedGroupIds: string[], groupId: string): boolean => joinedGroupIds.includes(groupId)

export const selectJoinedGroupIds = createSelector(
  [(state: RootState) => state.chat.joinedGroups, (state: RootState) => state.chat.wsState.id],
  (groups, userId) => {
    return groups.map(g => g.group.id)
  },
)
