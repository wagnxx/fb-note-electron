import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addMessage, updateGroups, systemNotify, setWebSocketState, updateMessage } from '../chatSlice'
import { getWSClient } from '../service/wsClient'
import { ServerMessage } from '../types'
import { useNotification } from '@/hooks/useNotification'

export function useWSListener() {
  const dispatch = useDispatch()

  const { showNotification } = useNotification()

  useEffect(() => {
    const client = getWSClient()
    const { socket, id: userId } = client || {}
    if (!socket || !userId) return

    // 在 WebSocket 连接状态变化时，更新 Redux 中的 WebSocket 状态
    const updateConnectionState = (isConnected: boolean, error: string | null = null) => {
      dispatch(
        setWebSocketState({
          ws: socket,
          isConnected,
          id: userId,
          connectionError: error,
        }),
      )
    }

    // 监听消息
    socket.onmessage = event => {
      try {
        const data: ServerMessage = JSON.parse(event.data)

        // 根据消息类型分发不同的 Redux action
        switch (data.type) {
          case 'text':
          case 'image':
          case 'file':
            dispatch(addMessage(data)) // 将消息添加到 state
            break
          case 'message-history':
            dispatch(updateMessage(data))
            break
          case 'group-res':
            dispatch(updateGroups(data.groups)) // 更新群组信息
            break
          case 'system':
            dispatch(systemNotify(data.message)) // 处理系统通知
            showNotification('success', data.message, 'message')
            break
          default:
            console.warn('Unknown message type:', data)
        }
      } catch (err) {
        console.error('Invalid message received:', event.data)
      }
    }

    // WebSocket 连接建立
    socket.onopen = () => {
      updateConnectionState(true) // 更新连接状态为已连接
      socket.send(JSON.stringify({ type: 'group-req' }))
    }

    // WebSocket 连接关闭
    socket.onclose = () => {
      updateConnectionState(false) // 更新连接状态为断开
      console.log('WebSocket connection closed')
    }

    // WebSocket 错误
    socket.onerror = err => {
      updateConnectionState(false, 'WebSocket error') // 更新连接状态为错误
      console.error('WebSocket error:', err)
    }

    // 清理 WebSocket 连接
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [dispatch, showNotification]) // 只在 dispatch 更新时重新启动 WebSocket 连接
}
