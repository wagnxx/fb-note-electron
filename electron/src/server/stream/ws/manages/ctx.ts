import { GroupController } from '../controllers/Group'
import { container } from '../core/inversify.config'
import { TYPES } from '../core/ioc.config'

export const groupController = container.get<GroupController>(TYPES.GroupController)

// 导出dispatcher
export const dispatcher = groupController.getDispatcher()
