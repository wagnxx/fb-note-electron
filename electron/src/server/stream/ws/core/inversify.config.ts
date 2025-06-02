// src/core/inversify.config.ts

import '../domains/user/UserRepository'
import '../domains/user/UserService'

import '../domains/userGroup/UserGroupService'
import '../domains/group/GroupService'
import '../domains/message/MessageService'
import '../domains/coordinator/CoordinatorService'
import '../controllers/Group'

//  ==================================== bind by hand example =============================

// import '../domains/userGroup/IUserGroupService'

// import '../interfaces/services/IUserService'
// import '../interfaces/services/IGroupService'
// import '../interfaces/services/IMessageService'
// import '../interfaces/services/ICoordinatorService'
// 容器配置
// const container = new Container()

// // 注册Services
// container.bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope()
// container.bind<IUserGroupService>(TYPES.UserGroupService).to(UserGroupService).inSingletonScope()
// container.bind<IGroupService>(TYPES.GroupService).to(GroupService).inSingletonScope()
// container.bind<IMessageService>(TYPES.MessageService).to(MessageService).inSingletonScope()
// container.bind<ICoordinatorService>(TYPES.CoordinatorService).to(CoordinatorService)

// // 注册Controllers
// container.bind<GroupController>(TYPES.GroupController).to(GroupController).inSingletonScope()

// // MessageDispatcher
// container.bind(TYPES.MessageDispatcher).to(MessageDispatcher).inSingletonScope()

// export { container }
