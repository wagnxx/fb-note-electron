// wsClient.ts
import { v4 as uuidv4 } from 'uuid'

type ClientType = {
  id: string
  socket: WebSocket
} | null

let client: ClientType = null

const SOCKET_USER_ID = 'socket_user_id'

const getId = (id: string) => {
  let sId = sessionStorage.getItem(SOCKET_USER_ID)

  if (!sId) {
    sessionStorage.setItem(SOCKET_USER_ID, id)
    sId = id
  }
  return sId
}

// 只有在首次调用时创建 WebSocket 实例
export async function getWSClient(): Promise<ClientType> {
  if (!client) {
    const id = getId(uuidv4()) // 生成唯一的 userId
    // 动态获取 WebSocket 服务端地址
    const res = await fetch(`${getApiBaseUrl()}/wifiIP`)
    const { ip } = await res.json()
    // 创建 WebSocket 实例并设置事件监听
    const socket = new WebSocket(`ws://${ip}:4000/chat`)

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
const getApiBaseUrl = () => {
  // eslint-disable-next-line no-undef
  // return process.env.REACT_APP_ENV !== 'production' ? 'http://localhost:4000' : ''
  // return process.env.REACT_APP_ENV !== 'production' ? 'http://192.168.100.200:4000' : ''
  return 'http://192.168.100.200:4000'
}
