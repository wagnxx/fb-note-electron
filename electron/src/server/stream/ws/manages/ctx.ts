// // manages/context.ts
import { UserRepository } from '../domains/user/UserRepository'
import { GroupRepository } from '../domains/group/GroupRepository'
import { MessageRepository } from '../domains/message/MessageRepository'
import { UserService } from '../domains/user/UserService'
import { UserGroupService } from '../domains/userGroup/UserGroupService'
import { GroupService } from '../domains/group/GroupService'
import { MessageService } from '../domains/message/MessageService'

// ===================== 1. 首先初始化基础设施层（Repositories） =====================
const userRepository = new UserRepository()
const groupRepository = new GroupRepository()
const messageRepository = new MessageRepository()

// ===================== 2. 然后初始化领域服务（Services） =====================
// 无依赖的服务最先初始化
const userService = new UserService(userRepository)
const userGroupService = new UserGroupService() // 可能需要注入repo，根据实际情况调整

// 有依赖的服务后初始化

const messageService = new MessageService(messageRepository, userService)
const groupService = new GroupService(groupRepository, userGroupService, userService, messageService)
messageService.setGroupService(groupService)
// ===================== 3. 最后初始化控制器层 =====================
import { GroupController } from '../controllers/Group'

const groupController = new GroupController(groupService, userService, userGroupService, messageService)

// ===================== 4. 导出公共接口 =====================
// export { userService, groupService, userGroupService, messageService }

// WebSocket 相关导出
export const dispatcher = groupController.getDispatcher()
