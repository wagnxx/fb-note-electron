// wsClient.ts
import { generateFingerprint } from '@/utils/utilsFingerprint'

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
export async function getWSClient(lanIp: string): Promise<ClientType> {
  if (!client) {
    const fingerprint = generateFingerprint()
    const id = getId(fingerprint) // 生成唯一的 userId

    const socket = new WebSocket(`ws://${lanIp}:4000/chat?userId=${id}`)

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

// 不合理的方案
// const getApiBaseUrl = () => {
//   // eslint-disable-next-line no-undef
//   // return process.env.REACT_APP_ENV !== 'production' ? 'http://localhost:4000' : ''
//   // return process.env.REACT_APP_ENV !== 'production' ? 'http://192.168.100.200:4000' : ''
//   return 'http://192.168.100.200:4000'
// }
