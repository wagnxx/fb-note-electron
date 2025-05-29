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
import { getWSClient } from '../service/wsClient'
import { useNotification } from '@/hooks/useNotification'
import { ServerToClientMessage } from '@shared/types'
import { getValidObject } from '@/utils/utillsObject'

export function useWSListener() {
  const dispatch = useDispatch()
  const { showNotification } = useNotification()

  useEffect(() => {
    let socket: WebSocket | null = null

    const initWebSocket = async () => {
      try {
        const client = await getWSClient()
        const { socket: ws, id: userId } = client || {}
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
        socket.onmessage = event => {
          try {
            const data: ServerToClientMessage = JSON.parse(event.data)
            switch (data.type) {
              case 'text':
              case 'image':
              case 'file':
                dispatch(addMessage(data))
                break
              case 'message-history-res':
                dispatch(updateMessage(data))
                break
              case 'groups-res':
                dispatch(updateGroups(data.groups))
                break
              case 'reset-user-success': {
                console.log('reset user success')
                const { name: username, avatar } = data
                let update = getValidObject({ username, avatar })
                dispatch(updateWebSocketState({ ...update }))
                socket!.send(JSON.stringify({ type: 'group-req' }))
                break
              }
              case 'init-res': {
                dispatch(updateJoinedGroups(data.joinedGroups))
                dispatch(updateGroups(data.allGroups))
                dispatch(updateUsers(data.allUsers))

                const { name: username, avatar } = data.currentUser
                let update = getValidObject({ username, avatar })
                dispatch(updateWebSocketState({ ...update }))
                break
              }

              case 'joined-groups-res':
                dispatch(updateJoinedGroups(data.joinedGroups))
                break

              case 'users-res':
                dispatch(updateUsers(data.users))
                break
              case 'system':
                dispatch(systemNotify(data.message))
                showNotification('success', data.message, 'message')
                break
              default:
                console.warn('Unknown message type:', data)
            }
          } catch (err) {
            console.error('Invalid message received:', event.data)
          }
        }

        socket.onopen = () => {
          console.log('WebSocket connection opened')
          updateConnectionState(true)
          socket!.send(JSON.stringify({ type: 'init-req', id: userId }))
        }

        socket.onclose = () => {
          updateConnectionState(false)
          console.log('WebSocket connection closed')
        }

        socket.onerror = err => {
          updateConnectionState(false, 'WebSocket error')
          console.error('WebSocket error:', err)
        }
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err)
      }
    }

    initWebSocket()

    // 清理逻辑
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [dispatch, showNotification])
}
