import { WebSocketServer, WebSocket } from 'ws'
import { Server as HTTPServer } from 'http'
import { parse } from 'url'

// 数据结构定义
interface ClientMeta {
  userId: string // 新增 userId
  username: string
  groupId: string
  socket: WebSocket
}

interface Group {
  id: string
  name: string
  members: ClientMeta[]
  admin: string
  messages: Message[]
}

interface Message {
  type: 'text' | 'image' | 'file'
  sender: string
  groupId: string
  content: string
  timestamp: number
}

export type ServerMessage =
  | {
      type: 'system'
      message: string
    }
  | {
      type: 'group-res'
      groups: Group[]
      timestamp: number
    }
  | Message

// 存储群组信息
const groups = new Map<string, Group>()
let groupInited = false

let wss: WebSocketServer | null = null

// 启动 WebSocket 服务器
export function bindWSServer(httpServer: HTTPServer) {
  wss = new WebSocketServer({ noServer: true })

  // HTTP 升级到 WebSocket
  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url || '')

    console.log('  Parsed pathname:', pathname)

    if (pathname === '/chat') {
      wss!.handleUpgrade(req, socket, head, ws => {
        wss!.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  // 处理 WebSocket 连接
  wss.on('connection', (ws: WebSocket) => {
    let client: ClientMeta | null = null

    // 处理消息
    ws.on('message', raw => {
      try {
        const data = JSON.parse(raw.toString())
        handleClientMessage(ws, data, client)
      } catch (err) {
        console.error('Error processing message:', err)
      }
    })

    // 处理客户端断开连接
    ws.on('close', () => {
      if (client) {
        handleClientDisconnect(client)
      }
    })
  })
}

// 处理客户端消息
function handleClientMessage(ws: WebSocket, data: any, client: ClientMeta | null) {
  // console.log('handleClientMessage :: ', data)
  switch (data.type) {
    case 'join':
      handleJoinGroup(ws, data)
      break
    case 'group-init':
      handleGroupInit(data)
      break
    case 'group-create':
      handleGroupCreate(data)
      break
    case 'group-req':
      handleGroupRequest(ws)
      break
    case 'text':
    case 'image':
    case 'file':
      handleMessage(data)
      break
    default:
      console.warn('Unknown message type:', data.type)
  }
}

// 处理客户端加入群组
function handleJoinGroup(ws: WebSocket, data: any) {
  const { username, groupId, userId } = data
  // const userId = uuidv4() // 生成唯一的 userId
  const client: ClientMeta = { userId, username, groupId, socket: ws }

  if (!groups.has(groupId)) {
    groups.set(groupId, { id: groupId, name: '', members: [], admin: '', messages: [] })
  }

  const group = groups.get(groupId)!
  group.members.push(client)

  if (!group.admin) group.admin = username

  console.log(`👤 ${username} (userId: ${userId}) joined group [${groupId}]`)
  broadcast(groupId, { type: 'system', message: `${username} joined the chat.` })

  const message: ServerMessage = {
    type: 'group-res',
    timestamp: Date.now(),
    groups: [...groups.values()],
  }
  broadcast(groupId, message)
}

// 处理群组初始化
function handleGroupInit(data: any) {
  if (groupInited) return
  groupInited = true
  const initialGroups = data.groups as Group[]
  console.log('Initial groups:', initialGroups)
  initialGroups.forEach(group => groups.set(group.id, group))
}

// 处理群组创建
function handleGroupCreate(data: any) {
  groups.set(data.group.id, data.group)
  console.log('Group created:', data.group)
}

// 处理群组请求
function handleGroupRequest(ws: WebSocket) {
  const message = {
    type: 'group-res',
    groups: [...groups.values()],
    timestamp: Date.now(),
  }
  const payload = JSON.stringify(message)
  ws.send(payload)
}

// 处理消息发送
function handleMessage(data: any) {
  const { content, fileName, fileType, sender, groupId } = data
  const message: Message = {
    type: 'text', // 默认文本消息
    sender,
    groupId, // 👈 修复关键
    content,
    timestamp: Date.now(),
  }

  if (fileName) {
    message.type = 'file'
    message.content = fileName
  }

  if (fileType) {
    message.content = fileType
  }

  // 保存消息到群组
  const group = groups.get(groupId)
  if (group) {
    group.messages.push(message)
    broadcast(groupId, message)
  }
}

// 处理客户端断开连接
function handleClientDisconnect(client: ClientMeta) {
  const group = groups.get(client.groupId)
  if (group) {
    group.members = group.members.filter(c => c !== client)
    console.log(`👤 ${client.username} left group [${client.groupId}]`)
    broadcast(client.groupId, { type: 'system', message: `${client.username} left the chat.` })
  }
}

// 广播消息到群组
function broadcast(groupId: string, message: ServerMessage) {
  const group = groups.get(groupId)
  if (!group) return
  const payload = JSON.stringify(message)

  group.members.forEach(client => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(payload)
    }
  })
}
