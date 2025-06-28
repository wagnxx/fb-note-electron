import 'reflect-metadata'
import { buildProviderModule, Container, TYPES } from '../core/ioc.config'
import '../core/inversify.config'
import type { GroupController } from '../controllers/Group'
import { WebSocketManager } from '../core/WebSocketManager'

const container = new Container()
container.load(buildProviderModule())

export const groupController = container.get<GroupController>(TYPES.GroupController)
export const wsManager = container.get<WebSocketManager>(TYPES.WebSocketManager)

// 导出dispatcher
export const dispatcher = groupController.getDispatcher()
