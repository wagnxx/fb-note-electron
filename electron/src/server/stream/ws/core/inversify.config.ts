// src/core/inversify.config.ts
import 'reflect-metadata'
import { Container } from 'inversify'
import { TYPES } from './ioc.config'

import { UserService } from '../domains/user/UserService'
import { UserGroupService } from '../domains/userGroup/UserGroupService'
import { GroupService } from '../domains/group/GroupService'
import { MessageService } from '../domains/message/MessageService'
import { GroupController } from '../controllers/Group'

import { IGroupService } from '../interfaces/services/IGroupService'
import { IMessageService } from '../interfaces/services/IMessageService'
import { ICoordinatorService } from '../interfaces/services/ICoordinatorService'
import { CoordinatorService } from '../domains/coordinator/CoordinatorService'
import { IUserService } from '../interfaces/services/IUserService'
import { IUserGroupService } from '../domains/userGroup/IUserGroupService'
import { MessageDispatcher } from './MessageDispatcher'

// 容器配置
const container = new Container()

// 注册Services
container.bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope()
container.bind<IUserGroupService>(TYPES.UserGroupService).to(UserGroupService).inSingletonScope()
container.bind<IGroupService>(TYPES.GroupService).to(GroupService).inSingletonScope()
container.bind<IMessageService>(TYPES.MessageService).to(MessageService).inSingletonScope()
container.bind<ICoordinatorService>(TYPES.CoordinatorService).to(CoordinatorService)

// 注册Controllers
container.bind<GroupController>(TYPES.GroupController).to(GroupController).inSingletonScope()

// MessageDispatcher
container.bind(TYPES.MessageDispatcher).to(MessageDispatcher).inSingletonScope()

export { container }
