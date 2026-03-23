# RN WebSocket 封装策略（与桌面端一致）

参考文件：`web-app/src/pages/tools/relay/index.tsx`

## 目标

- 统一连接生命周期管理
- 统一消息发送格式
- 统一重连与心跳策略
- 统一消息分发接口

## 连接参数

- URL：`ws://<LAN_IP>:4000/chat?token=<TOKEN>`
- token 来源：`POST /api/hub/pair`

## 连接后初始化顺序

1. 发送 `init-req`
2. 发送 `join`（`groupId: relay-station`）
3. 按需发送 `message-history-req`、`groups-req`

```json
{
  "type": "init-req",
  "payload": { "id": "<userId>", "name": "<deviceName>" }
}
```

```json
{
  "type": "join",
  "payload": {
    "userId": "<userId>",
    "username": "<deviceName>",
    "groupId": "relay-station"
  }
}
```

## 发送协议

### `sendText`

```json
{
  "type": "text",
  "payload": {
    "type": "text",
    "id": "txt_<timestamp>_<random>",
    "groupId": "relay-station",
    "sender": "<userId>",
    "content": "消息内容",
    "timestamp": 1710000000000
  }
}
```

### `sendFile`（包含图片/视频）

```json
{
  "type": "file",
  "payload": {
    "type": "file",
    "id": "file_<timestamp>_<random>",
    "groupId": "relay-station",
    "sender": "<userId>",
    "timestamp": 1710000000000,
    "fileName": "photo.jpg",
    "fileType": "image/jpeg",
    "content": "data:image/jpeg;base64,/9j/...",
    "size": 102400
  }
}
```

### 心跳

```json
{ "type": "ping" }
```

## 接收分发策略

按 `msg.type` 分发处理：

- `welcome`：连接确认
- `history` / `message-history-res`：历史消息
- `peers` / `groups-res`：成员状态
- `text` / `file`：聊天内容
- `system`：系统通知（含配对码刷新提示）
- `pong`：心跳回包
- `kicked`：踢出流程（清 token + 重新配对）

## 重连策略

- 首次断线立即重连
- 之后指数退避：`1s → 2s → 4s → 8s → 16s → 最大 30s`
- 最多自动重连 10 次
- 超限后提示用户手动重连
- token 过期时停止重连并触发重新 pair

## 心跳策略

- 每 30 秒发送一次 `ping`
- 连续 2 次未收到 `pong`（>10s）则主动重连

## 推荐客户端封装（TypeScript 伪代码）

```ts
type RelayOutbound =
  | { type: 'text'; payload: any }
  | { type: 'file'; payload: any }
  | { type: 'ping' }
  | { type: 'init-req'; payload: { id: string; name: string } }
  | { type: 'join'; payload: { userId: string; username: string; groupId: string } }

export class RelayWSClient {
  private ws: WebSocket | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0

  connect(host: string, token: string, userId: string, deviceName: string) {
    this.ws = new WebSocket(`ws://${host}:4000/chat?token=${token}`)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.send({ type: 'init-req', payload: { id: userId, name: deviceName } })
      this.send({ type: 'join', payload: { userId, username: deviceName, groupId: 'relay-station' } })
      this.startHeartbeat()
    }

    this.ws.onclose = () => {
      this.stopHeartbeat()
      this.scheduleReconnect(host, token, userId, deviceName)
    }
  }

  send(payload: RelayOutbound) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => this.send({ type: 'ping' }), 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  private scheduleReconnect(host: string, token: string, userId: string, deviceName: string) {
    if (this.reconnectAttempts >= 10) return
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => this.connect(host, token, userId, deviceName), delay)
  }

  destroy() {
    this.stopHeartbeat()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }
}
```

## 图片发送建议

1. 选图后转 base64。
2. 拼接 Data URL：`data:<mime>;base64,<data>`。
3. 统一走 `sendFile`。
4. 建议压缩到 `< 1MB`。
