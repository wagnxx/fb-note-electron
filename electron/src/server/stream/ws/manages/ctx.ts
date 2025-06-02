import 'reflect-metadata'
import { buildProviderModule, Container, TYPES } from '../core/ioc.config'
import '../core/inversify.config'
import type { GroupController } from '../controllers/Group'

const container = new Container()
container.load(buildProviderModule())

export const groupController = container.get<GroupController>(TYPES.GroupController)

// 导出dispatcher
export const dispatcher = groupController.getDispatcher()
