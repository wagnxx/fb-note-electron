// wsClient.ts
import { v4 as uuidv4 } from 'uuid'

type ClientType = {
  id: string
  socket: WebSocket
} | null

let client: ClientType = null

// 只有在首次调用时创建 WebSocket 实例
export function getWSClient(): ClientType {
  if (!client) {
    const id = uuidv4() // 生成唯一的 userId
    // 创建 WebSocket 实例并设置事件监听
    const socket = new WebSocket('ws://localhost:4000/chat') // 根据实际的 WebSocket 服务端地址修改

    socket.onopen = () => {
      console.log('WebSocket connection established')
    }

    client = {
      socket,
      id,
    }
  }
  return client
}
