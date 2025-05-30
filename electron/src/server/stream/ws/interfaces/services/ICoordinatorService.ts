import type { JoinedGroupResponse } from '../types'

export interface ICoordinatorService {
  getJoinedGroupsWithLatestMessage(userId: string): JoinedGroupResponse[]
}
