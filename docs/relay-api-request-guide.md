# Relay API 请求文档（RN 联调）

> 适用服务：`http://<PC_IP>:4000`
>
> 路由挂载：`/api/hub/*`（同时兼容 `/hub/*`）

## 1. 快速结论

- `GET /api/hub/health`：已实现
- `POST /api/hub/pair`：已实现
- `GET /api/hub/pair`：**未实现（会 404）**
- WebSocket：`ws://<PC_IP>:4000/chat?token=<token>`（推荐）

---

## 2. HTTP API

## 2.1 健康检查

- **Method**: `GET`
- **Path**: `/api/hub/health`
- **Request Body**: 无
- **Success (200)**:

```json
{
  "ok": true,
  "app": "ULogi Relay Station",
  "version": "1.0.0",
  "serverTime": 1774080162772,
  "transport": {
    "httpPort": 4000,
    "wsPath": "/chat"
  },
  "network": {
    "ip": "192.168.1.3",
    "gateway": "192.168.1.1"
  },
  "stats": {
    "startedAt": 1774077583393,
    "uptimeMs": 2579379,
    "activeConnections": 1,
    "pairedDevices": 0,
    "activeTokens": 0
  },
  "relayGroupId": "relay-station"
}
```

## 2.2 设备配对（拿 token）

- **Method**: `POST`
- **Path**: `/api/hub/pair`
- **Request Body**:

```json
{
  "deviceId": "rn-device-001",
  "deviceName": "RN iPhone"
}
```

- **Success (200)**:

```json
{
  "ok": true,
  "token": "string",
  "userId": "rn-rn-device-001",
  "expiresInMs": 43200000,
  "wsURL": "ws://<LAN_IP>:4000/chat?token=<token>",
  "relayGroupId": "relay-station"
}
```

- **Error (400)**:

```json
{
  "ok": false,
  "code": "INVALID_DEVICE_ID",
  "message": "deviceId is required"
}
```

> 注意：`GET /api/hub/pair` 会返回 `404 Cannot GET /api/hub/pair`，因为当前只实现了 `POST`。

## 2.3 启动引导（token 校验 + 返回连接信息）

- **Method**: `GET`
- **Path**: `/api/hub/bootstrap`
- **Auth**:
  - Query：`?token=<token>` 或
  - Header：`Authorization: Bearer <token>`
- **Success (200)**:

```json
{
  "ok": true,
  "userId": "string",
  "deviceId": "string",
  "serverTime": 1774080162772,
  "transport": {
    "wsPath": "/chat"
  },
  "relayGroupId": "relay-station",
  "stats": {
    "startedAt": 1774077583393,
    "uptimeMs": 2579379,
    "activeConnections": 1,
    "pairedDevices": 1,
    "activeTokens": 1
  }
}
```

- **Error (401)**:

```json
{
  "ok": false,
  "code": "UNAUTHORIZED",
  "message": "token invalid or expired"
}
```

## 2.4 token 校验

- **Method**: `POST`
- **Path**: `/api/hub/token/validate`
- **Request Body**:

```json
{
  "token": "string"
}
```

- **Success (200)**:

```json
{
  "ok": true,
  "userId": "string",
  "deviceId": "string",
  "expiresAt": 1774120000000
}
```

- **Error (401)**:

```json
{
  "ok": false,
  "code": "UNAUTHORIZED",
  "message": "token invalid or expired"
}
```

## 2.5 状态统计

- **Method**: `GET`
- **Path**: `/api/hub/stats`
- **Success (200)**: 返回 `stats/devices/onlineUsers/relayGroup`

## 2.6 移出成员

- **Method**: `POST`
- **Path**: `/api/hub/kick`
- **Request Body**:

```json
{
  "userId": "target-user-id"
}
```

- **Success (200)**:

```json
{
  "ok": true,
  "userId": "target-user-id"
}
```

- **Error (400)**:

```json
{
  "ok": false,
  "code": "INVALID_USER_ID",
  "message": "userId is required"
}
```

- **Error (404)**:

```json
{
  "ok": false,
  "code": "GROUP_NOT_FOUND",
  "message": "relay group not found"
}
```

---

## 3. WebSocket 交互

- **Endpoint**: `ws://<PC_IP>:4000/chat?token=<token>`（推荐）
- 兼容：`ws://<PC_IP>:4000/chat?userId=<userId>`

如果没有 `token` 且没有 `userId`，服务端会发送：

```json
{ "type": "error", "reason": "token or userId required in query" }
```

## 3.1 建议时序

1. `init-req`
2. `join`（`groupId = relay-station`）
3. `groups-req`
4. `message-history-req`
5. `text/file` 发消息

### init-req

```json
{
  "type": "init-req",
  "payload": {
    "id": "<userId>",
    "name": "RN Mobile"
  },
  "requestId": "optional"
}
```

### join

```json
{
  "type": "join",
  "payload": {
    "username": "RN Mobile",
    "userId": "<userId>",
    "groupId": "relay-station"
  },
  "requestId": "optional"
}
```

### groups-req

```json
{
  "type": "groups-req",
  "payload": {},
  "requestId": "optional"
}
```

### message-history-req

```json
{
  "type": "message-history-req",
  "payload": {
    "groupId": "relay-station"
  },
  "requestId": "optional"
}
```

### text

```json
{
  "type": "text",
  "payload": {
    "type": "text",
    "id": "txt_1710000000000",
    "sender": "<userId>",
    "groupId": "relay-station",
    "timestamp": 1710000000000,
    "content": "hello"
  }
}
```

### file

```json
{
  "type": "file",
  "payload": {
    "type": "file",
    "id": "file_1710000000000",
    "sender": "<userId>",
    "groupId": "relay-station",
    "timestamp": 1710000000000,
    "fileName": "a.txt",
    "fileType": "text/plain",
    "content": "base64-or-data-url"
  }
}
```

---

## 4. 字段类型（给 RN 直接建模）

```ts
type User = {
  id: string
  name?: string | null
  online?: boolean | null
  avatar?: string | null
}

type ChatBaseMessage = {
  id: string
  sender: string
  groupId: string
  timestamp: number
}

type ChatTextMessage = ChatBaseMessage & {
  type: 'text'
  content: string
}

type ChatImageMessage = ChatBaseMessage & {
  type: 'image'
  content: string
}

type ChatFileMessage = ChatBaseMessage & {
  type: 'file'
  fileName: string
  fileType: string
  content: string
}

type ChatMessage = ChatTextMessage | ChatImageMessage | ChatFileMessage

type ChatGroup = {
  id: string
  name: string
  admin: string
}

type ChatGroupWithMember = ChatGroup & {
  members: User[]
}

type ClientToServerMessage<T = any> = {
  type: string
  payload: T
  requestId?: string
}

type ServerToClientMessage<T = any> = {
  type: string
  payload: T
  requestId?: string
}
```

---

## 5. cURL 快速测试

```bash
curl -sS http://<PC_IP>:4000/api/hub/health
```

```bash
curl -sS -X POST http://<PC_IP>:4000/api/hub/pair \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"rn-device-001","deviceName":"RN iPhone"}'
```

```bash
curl -sS "http://<PC_IP>:4000/api/hub/bootstrap?token=<token>"
```

```bash
curl -sS -X POST http://<PC_IP>:4000/api/hub/token/validate \
  -H 'Content-Type: application/json' \
  -d '{"token":"<token>"}'
```

```bash
curl -sS -X POST http://<PC_IP>:4000/api/hub/kick \
  -H 'Content-Type: application/json' \
  -d '{"userId":"<target-user-id>"}'
```
