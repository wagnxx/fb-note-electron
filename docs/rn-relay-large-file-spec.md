# Relay 大文件传输策略（给 RN 同步）

## 目标

将大文件（如 APK/ZIP/视频）从“WebSocket 内联传输”切换为：

1. **HTTP 上传文件本体**
2. **WS 仅广播文件元数据**
3. **下载时单独走 HTTP**

这样可以避免 WS 大 payload 导致断连。

---

## 总体流程

1. 客户端选择文件
2. 调用 `POST /api/hub/files` 上传二进制文件
3. 服务端返回 `fileId + downloadUrl + size + transferMode`
4. 客户端发送 WS `type='file'` 消息（仅元数据）
5. 接收方点击下载时访问 `GET /api/hub/files/:fileId/download`

---

## HTTP 接口

### 1) 上传文件

- **Method**: `POST`
- **Path**: `/api/hub/files`
- **Headers**:
  - `Content-Type: application/octet-stream`
  - `x-relay-file-name: <url-encoded 文件名>`
  - `x-relay-file-type: <mime type>`（可选，默认 `application/octet-stream`）
  - `x-relay-user-id: <userId>`（可选）
- **Body**: 文件二进制（raw）
- **限制**: 当前后端 raw limit 为 `512mb`

成功响应：

```json
{
  "ok": true,
  "file": {
    "fileId": "relay_file_1711111111111_abcd1234",
    "fileName": "app-release.apk",
    "fileType": "application/vnd.android.package-archive",
    "size": 42873421,
    "transferMode": "remote",
    "downloadUrl": "http://<LAN_IP>:4000/api/hub/files/relay_file_xxx/download"
  }
}
```

失败响应：

- `400 INVALID_FILE_NAME`
- `400 INVALID_FILE_BODY`
- `500 FILE_STORE_FAILED`

---

### 2) 下载文件

- **Method**: `GET`
- **Path**: `/api/hub/files/:fileId/download`
- **返回**: 文件流（attachment）

失败响应：

- `400 INVALID_FILE_ID`
- `404 FILE_NOT_FOUND`

---

## WS 文件消息（仅元数据）

发送类型仍是 `type: 'file'`，但 `payload.content` 不再放 base64 大内容。

推荐 payload：

```json
{
  "type": "file",
  "payload": {
    "id": "file_1711111111111",
    "groupId": "relay-station",
    "sender": "rn-device-001",
    "type": "file",
    "content": "http://<LAN_IP>:4000/api/hub/files/relay_file_xxx/download",
    "fileName": "app-release.apk",
    "fileType": "application/vnd.android.package-archive",
    "transferMode": "remote",
    "fileId": "relay_file_1711111111111_abcd1234",
    "size": 42873421,
    "downloadUrl": "http://<LAN_IP>:4000/api/hub/files/relay_file_xxx/download",
    "timestamp": 1711111111111
  }
}
```

---

## 共享类型（已扩展）

`ChatFileMessage` 新增字段：

- `transferMode?: 'inline' | 'remote'`
- `fileId?: string`
- `size?: number`
- `downloadUrl?: string`

兼容策略：

- 旧消息：`transferMode` 为空，按 `content` 处理（base64/URL）
- 新消息：`transferMode === 'remote'`，优先用 `downloadUrl` 或 `fileId`

---

## RN 侧建议实现

### 上传阶段

1. 读取文件二进制（不要转 base64）
2. 调用 `POST /api/hub/files`
3. 拿到 `file` 元数据
4. 发送 WS `type='file'` 元数据消息

### 下载阶段

优先顺序：

1. `downloadUrl`
2. 若没有则用 `fileId` 拼：`http://<LAN_IP>:4000/api/hub/files/${fileId}/download`
3. 最后兜底 `content`

---

## RN 伪代码

```ts
async function uploadRelayFile(host: string, userId: string, file: {
  name: string
  type: string
  bytes: ArrayBuffer
}) {
  const res = await fetch(`http://${host}:4000/api/hub/files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-relay-file-name': encodeURIComponent(file.name),
      'x-relay-file-type': file.type || 'application/octet-stream',
      'x-relay-user-id': userId,
    },
    body: file.bytes,
  })

  const data = await res.json()
  if (!res.ok || !data?.ok || !data?.file) {
    throw new Error(data?.message || 'upload failed')
  }

  return data.file
}

async function sendLargeFileViaRelay(ws: WebSocket, host: string, userId: string, groupId: string, file: any) {
  const uploaded = await uploadRelayFile(host, userId, file)

  ws.send(
    JSON.stringify({
      type: 'file',
      payload: {
        id: `file_${Date.now()}`,
        groupId,
        sender: userId,
        type: 'file',
        content: uploaded.downloadUrl,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        transferMode: uploaded.transferMode,
        fileId: uploaded.fileId,
        size: uploaded.size,
        downloadUrl: uploaded.downloadUrl,
        timestamp: Date.now(),
      },
    }),
  )
}
```

---

## 注意事项

1. 大文件不要再走 base64 + WS。
2. 若网络自测通过但上传失败，优先检查：
   - `Content-Type` 是否为 `application/octet-stream`
   - 头 `x-relay-file-name` 是否传了
   - body 是否为真实二进制
3. 当前文件索引在内存，App 重启后旧 `fileId` 可能失效（后续可做持久化索引）。
