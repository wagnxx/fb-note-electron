import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  addMessage,
  updateGroups,
  systemNotify,
  setWebSocketState,
  updateMessage,
  updateWebSocketState,
  updateUsers,
  updateJoinedGroups,
} from '../chatSlice'
import { getChatTransportClient, type ChatTransportClient } from '../service/chatService'
import { useNotification } from '@/hooks/useNotification'
import { getValidObject } from '@/utils/utillsObject'
import { ChatGroupWithMember, ChatMessage, ServerMessagePayloadMap, ServerToClientMessage, User } from '@shared/types'

export function useWSListener(lanIp: string) {
  const dispatch = useDispatch()
  const { showNotification } = useNotification()

  useEffect(() => {
    let socket: WebSocket | null = null
    let wsClient: ChatTransportClient | null = null
    const unsubs: Array<() => void> = []

    const initWebSocket = async () => {
      try {
        wsClient = await getChatTransportClient(lanIp)
        if (!wsClient) return

        // const { socket: ws, id: userId } = client || {}
        const { socket: ws, userId } = wsClient || {}
        if (!ws || !userId) return
        socket = ws

        const updateConnectionState = (isConnected: boolean, error: string | null = null) => {
          dispatch(
            setWebSocketState({
              ws: socket!,
              isConnected,
              id: userId,
              connectionError: error,
            }),
          )
        }

        // 监听消息
        const offPush = wsClient.onPush((msg: ServerToClientMessage) => {
          try {
            // const data = wrapperData.payload
            const { type, payload: data } = msg

            // const data: ServerToClientMessage = JSON.parse(event.data)

            switch (type) {
              case 'text':
              case 'image':
              case 'file':
                {
                  dispatch(addMessage(data as ChatMessage))
                }
                break
              case 'message-history-res':
                dispatch(updateMessage(data as { groupId: string; messages: ChatMessage[] }))
                break
              case 'groups-res':
                dispatch(updateGroups((data as { groups: ChatGroupWithMember[] }).groups))

                break
              case 'reset-user-success': {
                console.log('reset user success')
                const { name: username, avatar } = data as User
                let update = getValidObject({ username, avatar })
                dispatch(updateWebSocketState({ ...update }))
                socket!.send(JSON.stringify({ type: 'group-req' }))
                break
              }
              case 'init-res': {
                const { joinedGroups, allGroups, allUsers, currentUser } = data as ServerMessagePayloadMap['init-res']
                dispatch(updateJoinedGroups(joinedGroups))
                dispatch(updateGroups(allGroups))
                dispatch(updateUsers(allUsers))

                const update = getValidObject({
                  username: currentUser.name,
                  avatar: currentUser.avatar,
                })
                dispatch(updateWebSocketState(update))
                break
              }

              case 'joined-groups-res':
                dispatch(updateJoinedGroups((data as ServerMessagePayloadMap['joined-groups-res']).joinedGroups))
                break

              case 'users-res':
                dispatch(updateUsers((data as ServerMessagePayloadMap['users-res']).users))
                break
              case 'system': {
                const message = (data as { message: string }).message
                dispatch(systemNotify(message))
                showNotification('success', message, 'message')
                break
              }
              default:
                console.warn('Unknown message type:', data)
            }
          } catch (err) {
            console.error('Invalid message received:', err)
          }
        })
        unsubs.push(offPush)

        const offOpen = wsClient.onOpen(() => {
          console.log('WebSocket connection opened')
          socket = wsClient?.socket ?? socket
          updateConnectionState(true)

          wsClient?.send('init-req', { id: wsClient.userId }) // 注意：userId 可封装在 wsClient 内部暴露
        })
        unsubs.push(offOpen)

        const offClose = wsClient.onClose(() => {
          socket = wsClient?.socket ?? socket
          updateConnectionState(false)
          console.log('WebSocket connection closed')
        })
        unsubs.push(offClose)

        const offError = wsClient.onError(err => {
          updateConnectionState(false, 'WebSocket error')
          console.error('WebSocket error:', err)
        })
        unsubs.push(offError)
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err)
      }
    }

    initWebSocket()

    // 清理逻辑
    return () => {
      unsubs.forEach(unsub => unsub())
      wsClient?.close()
    }
  }, [dispatch, lanIp, showNotification])
}
