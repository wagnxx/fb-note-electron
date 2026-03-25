import { ClientToServerMessage, ServerMessagePayloadMap } from '@shared/types'
import { createSocketConnectionFactory, RealtimeSocketClient } from '@/core/ws'
import { generateFingerprint } from '@/utils/utilsFingerprint'

const SOCKET_USER_ID = 'socket_user_id'

const chatSocketConnectionFactory = createSocketConnectionFactory<string>({
  identityStorageKey: SOCKET_USER_ID,
  createIdentity: generateFingerprint,
  buildSocketUrl: (id, lanIp) => `ws://${lanIp}:4000/chat?userId=${encodeURIComponent(id)}`,
})

let chatRealtimeClient: RealtimeSocketClient | null = null

export type ChatTransportClient = RealtimeSocketClient

export async function getChatTransportClient(lanIp?: string): Promise<ChatTransportClient | null> {
  if (chatRealtimeClient) {
    if (!lanIp) return chatRealtimeClient
    if (chatRealtimeClient.isForEndpoint(lanIp) && chatRealtimeClient.socket.readyState !== WebSocket.CLOSED) {
      return chatRealtimeClient
    }
    chatRealtimeClient.disconnect(true)
    chatRealtimeClient = null
  }

  if (!lanIp) return null

  const identity = await chatSocketConnectionFactory.acquire(lanIp)
  if (!identity) return null

  chatRealtimeClient = new RealtimeSocketClient({
    initialIdentity: identity,
    endpointKey: lanIp,
    acquireSocket: options => chatSocketConnectionFactory.acquire(lanIp, options),
  })

  return chatRealtimeClient
}

export const getWSClientInstance = getChatTransportClient
export type WSClient = ChatTransportClient

type AnyClientMessage = ClientToServerMessage<any>
type AnyClientMessageType = Extract<AnyClientMessage['type'], string>

type RequestMessageType = 'groups-req' | 'message-history-req' | 'users-req' | 'init-req' | 'joined-groups-req'
type BroadcastMessageType = Exclude<AnyClientMessageType, RequestMessageType>

type RequestResponseMap = {
  'groups-req': ServerMessagePayloadMap['groups-res']
  'message-history-req': ServerMessagePayloadMap['message-history-res']
  'users-req': ServerMessagePayloadMap['users-res']
  'init-req': ServerMessagePayloadMap['init-res']
  'joined-groups-req': ServerMessagePayloadMap['joined-groups-res']
}

const getConnectedClient = async (): Promise<ChatTransportClient> => {
  const client = await getChatTransportClient()
  if (!client) {
    throw new Error('WebSocket client not available')
  }
  return client
}

export async function sendWithRes<T extends RequestMessageType>(
  type: T,
  payload: Extract<AnyClientMessage, { type: T }>['payload'],
): Promise<RequestResponseMap[T]> {
  const client = await getConnectedClient()
  return client.request(type, payload)
}

export async function send<T extends BroadcastMessageType>(
  type: T,
  payload: Extract<AnyClientMessage, { type: T }>['payload'],
): Promise<void> {
  const client = await getConnectedClient()
  client.publish(type as string, payload)
}

// export const fetchInitialHistoryByGroup = (groupId: string) => {
//   const ws = getWSClientInstance()
//   if (!ws) {
//     return Promise.reject(new Error('WebSocket client not available'))
//   }
//   return ws.then(client => {
//     if (!client) {
//       return Promise.reject(new Error('WebSocket client not initialized'))
//     }
//     return client.request('message-history-req', { groupId })
//   })
// }
