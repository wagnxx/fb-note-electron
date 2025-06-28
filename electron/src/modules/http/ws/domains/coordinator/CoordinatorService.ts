import { inject, provide, TYPES } from '../../core/ioc.config'
import type { ICoordinatorService } from '../../interfaces/services/ICoordinatorService'
import type { IMessageService } from '../../interfaces/services/IMessageService'
import type { IGroupService } from '../../interfaces/services/IGroupService'
import type { JoinedGroupResponse } from '../../interfaces/types'

@provide(TYPES.CoordinatorService)
export class CoordinatorService implements ICoordinatorService {
  constructor(
    @inject(TYPES.GroupService) private readonly groupService: IGroupService,

    @inject(TYPES.MessageService) private readonly messageService: IMessageService,
  ) {
    //
  }

  public async getJoinedGroupsWithLatestMessage(userId: string): Promise<JoinedGroupResponse[]> {
    const groups = await this.groupService.getGroupsWithMembers(userId)

    return groups.map(group => ({
      group,
      latestMessage: this.messageService.getLatestMessage(group.id),
    })) as JoinedGroupResponse[]
  }
}
