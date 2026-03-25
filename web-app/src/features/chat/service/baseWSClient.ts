// wsClient.ts
import { generateFingerprint } from '@/utils/utilsFingerprint'

type ClientType = {
  id: string
  socket: WebSocket
} | null

let client: ClientType = null

type GetWSClientOptions = {
  forceNew?: boolean
}

const SOCKET_USER_ID = 'socket_user_id'

const getId = (id: string) => {
  let sId = sessionStorage.getItem(SOCKET_USER_ID)

  if (!sId) {
    sessionStorage.setItem(SOCKET_USER_ID, id)
    sId = id
  }
  return sId
}

const isSocketReusable = (socket: WebSocket | null | undefined) => {
  if (!socket) return false
  return socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN
}

const createClient = (lanIp: string) => {
  const fingerprint = generateFingerprint()
  const id = getId(fingerprint)
  const socket = new WebSocket(`ws://${lanIp}:4000/chat?userId=${id}`)

  socket.onopen = () => {
    console.log('WebSocket connection established')
  }

  client = {
    socket,
    id,
  }

  return client
}

// 只有在首次调用时创建 WebSocket 实例；forceNew 用于断线重连场景
export async function getWSClient(lanIp: string, options?: GetWSClientOptions): Promise<ClientType> {
  const forceNew = options?.forceNew ?? false

  if (!client || forceNew || !isSocketReusable(client.socket)) {
    if (client?.socket && client.socket.readyState !== WebSocket.CLOSED) {
      client.socket.close()
    }
    return createClient(lanIp)
  }

  return client
}

// 不合理的方案
// const getApiBaseUrl = () => {
//   // eslint-disable-next-line no-undef
//   // return process.env.REACT_APP_ENV !== 'production' ? 'http://localhost:4000' : ''
//   // return process.env.REACT_APP_ENV !== 'production' ? 'http://192.168.100.200:4000' : ''
//   return 'http://192.168.100.200:4000'
// }
