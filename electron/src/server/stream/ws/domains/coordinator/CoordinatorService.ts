import { inject, injectable, TYPES } from '../../core/ioc.config'
import type { ICoordinatorService } from '../../interfaces/services/ICoordinatorService'
import type { IMessageService } from '../../interfaces/services/IMessageService'
import type { IGroupService } from '../../interfaces/services/IGroupService'
import type { JoinedGroupResponse } from '../../interfaces/types'

@injectable()
export class CoordinatorService implements ICoordinatorService {
  constructor(
    @inject(TYPES.GroupService) private readonly groupService: IGroupService,

    @inject(TYPES.MessageService) private readonly messageService: IMessageService,
  ) {
    //
  }

  public getJoinedGroupsWithLatestMessage(userId: string): JoinedGroupResponse[] {
    const groups = this.groupService.getGroupsWithMembers(userId)

    return groups.map(group => ({
      group,
      latestMessage: this.messageService.getLatestMessage(group.id),
    })) as JoinedGroupResponse[]
  }
}
