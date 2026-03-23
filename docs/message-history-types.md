# `message-history-res` 相关类型定义

来源：`shared/types/chat/index.d.ts`

## 核心消息类型

```ts
interface ChatBaseMessage {
  id: string
  sender: string
  groupId: string
  timestamp: number
}

interface ChatTextMessage extends ChatBaseMessage {
  type: 'text'
  content: string
}

interface ChatImageMessage extends ChatBaseMessage {
  type: 'image'
  content: string
}

interface ChatFileMessage extends ChatBaseMessage {
  type: 'file'
  fileName: string
  fileType: string
  content: string
}

type ChatMessage = ChatTextMessage | ChatImageMessage | ChatFileMessage
```

## `message-history-res` Payload

```ts
interface MessageHistoryResPayload {
  groupId: string
  messages: ChatMessage[]
}
```

## 服务端消息映射（节选）

```ts
interface ServerMessagePayloadMap {
  text: ChatTextMessage
  image: ChatImageMessage
  file: ChatFileMessage
  'message-history-res': { groupId: string; messages: ChatMessage[] }
}

interface ServerToClientMessage<T extends keyof ServerMessagePayloadMap = keyof ServerMessagePayloadMap> {
  type: T
  payload: ServerMessagePayloadMap[T]
  requestId?: string
}
```

## 使用示例

```ts
type HistoryRes = ServerToClientMessage<'message-history-res'>

function handleHistory(message: HistoryRes) {
  const { groupId, messages } = message.payload
  console.log('group:', groupId)

  messages.forEach(item => {
    if (item.type === 'text') {
      console.log(item.content)
    }
    if (item.type === 'image') {
      console.log(item.content)
    }
    if (item.type === 'file') {
      console.log(item.fileName, item.fileType)
    }
  })
}
```

## 约定说明

- `groupId` 在 relay 场景通常是 `relay-station`。
- `messages` 是 `ChatMessage[]`。
- 单条消息由 `type` 区分：`text` / `image` / `file`。
