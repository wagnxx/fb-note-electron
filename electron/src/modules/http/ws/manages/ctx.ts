import 'reflect-metadata'
import { buildProviderModule, Container, TYPES } from '../core/ioc.config'
import '../core/inversify.config'
import type { GroupController } from '../controllers/Group'
import { WebSocketManager } from '../core/WebSocketManager'
import { GroupService } from '../domains/group/GroupService'

const RELAY_STATION_GROUP_ID = 'relay-station'

const container = new Container()
container.load(buildProviderModule())

export const groupController = container.get<GroupController>(TYPES.GroupController)
export const wsManager = container.get<WebSocketManager>(TYPES.WebSocketManager)
const groupService = container.get<GroupService>(TYPES.GroupService)

// relay 过渡期内部能力：当前仅供临时公共门面调用，后续会并入统一架构层。
export async function getRelayGroupInternal() {
  const groups = await groupService.getAllGroupsWithMembers()
  return groups.find(group => group.id === RELAY_STATION_GROUP_ID) || null
}

export async function kickFromRelayGroupInternal(userId: string) {
  const relayGroup = await groupService.getGroup(RELAY_STATION_GROUP_ID)
  if (!relayGroup) {
    return {
      ok: false,
      reason: 'GROUP_NOT_FOUND',
    } as const
  }

  await groupService.removeMember(RELAY_STATION_GROUP_ID, userId)
  wsManager.disconnectUser(userId)

  const systemMessage = {
    type: 'system' as const,
    payload: {
      message: `${userId} has been removed from relay station.`,
    },
  }
  await groupService.broadcast(RELAY_STATION_GROUP_ID, systemMessage)

  return {
    ok: true,
  } as const
}

export async function broadcastRelaySystemMessageInternal(message: string) {
  const relayGroup = await groupService.getGroup(RELAY_STATION_GROUP_ID)
  if (!relayGroup) {
    return {
      ok: false,
      reason: 'GROUP_NOT_FOUND',
    } as const
  }

  await groupService.broadcast(RELAY_STATION_GROUP_ID, {
    type: 'system',
    payload: {
      message,
    },
  })

  return {
    ok: true,
  } as const
}

// 导出dispatcher
export const dispatcher = groupController.getDispatcher()
