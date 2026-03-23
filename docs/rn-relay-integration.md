# ULogi Relay Station RN 接入文档

本文档用于 RN 端对接桌面端 Relay（Electron 服务）的 HTTP + WebSocket 协议。

## 基础信息

- 服务地址：`http://<LAN_IP>:4000`
- WS 地址：`ws://<LAN_IP>:4000/chat?token=<TOKEN>`
- API Base：`http://<LAN_IP>:4000/api/hub`
- Relay Group：`relay-station`

## 接入流程

1. 获取桌面端当前配对码。
2. 调用 `POST /pair` 获取 token。
3. 用 token 连接 WS。
4. 正常收发消息。
5. token 过期后重新 pair。

## HTTP 接口

### `GET /health`

- 说明：健康检查。
- 鉴权：无需 token。

```json
{
  "ok": true,
  "app": "ULogi Relay Station",
  "version": "1.0.0",
  "serverTime": 1710000000000,
  "transport": { "httpPort": 4000, "wsPath": "/chat" },
  "relayGroupId": "relay-station"
}
```

### `POST /pair`

- 说明：使用配对码换取 token。

```json
{
  "pairCode": "123456",
  "deviceId": "my-phone-uuid",
  "deviceName": "iPhone 15"
}
```

```json
{
  "ok": true,
  "token": "abc123...",
  "userId": "rn-my-phone-uuid",
  "expiresInMs": 43200000,
  "wsURL": "ws://<LAN_IP>:4000/chat?token=abc123...",
  "relayGroupId": "relay-station"
}
```

### `GET /bootstrap`

- 说明：校验 token 并获取初始化信息。

### `POST /token/validate`

- 说明：主动校验 token 是否有效。

### `GET /code`

- 说明：获取当前配对码（调试）。

### `POST /code/refresh`

- 说明：手动刷新配对码（调试）。

### `GET /stats`

- 说明：获取设备与在线状态统计。

## WebSocket 协议

### 连接

- 地址：`ws://<LAN_IP>:4000/chat?token=<TOKEN>`
- 缺少 token/userId 时服务端会返回：

```json
{ "type": "error", "reason": "token or userId required in query" }
```

### 连接后服务端推送顺序

1. `welcome`
2. `history`
3. `peers`

## 客户端上行消息

### 文本

```json
{
  "type": "text",
  "payload": {
    "id": "txt_1710000000000_abc123",
    "content": "hello"
  }
}
```

### 文件/图片

```json
{
  "type": "file",
  "payload": {
    "id": "file_1710000000000_abc123",
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

## 服务端下行消息类型

- `welcome`
- `history`
- `peers`
- `text`
- `file`
- `system`
- `pong`
- `kicked`
- `message-history-res`
- `groups-res`

## 本地存储建议

- `relay.token`
- `relay.userId`
- `relay.deviceId`
- `relay.deviceName`
- `relay.expiresAt`
- `relay.hostIp`

## 注意事项

1. `deviceId` 首次生成后固定不变。
2. 图片/视频都走 `type: "file"`，通过 `fileType` 区分。
3. 配对码每 5 分钟刷新，不影响已签发 token。
4. token 默认 12 小时有效，到期需重新 pair。
5. RN 统一接入 `/chat`。
