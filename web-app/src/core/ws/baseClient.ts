export type RawWSClient = {
  id: string
  socket: WebSocket
}

export type BaseClientGetOptions = {
  forceNew?: boolean
}

type CreateBaseWSClientConfig<TContext> = {
  idStorageKey: string
  idFactory: () => string
  buildUrl: (id: string, context: TContext) => string
  isSameContext?: (prev: TContext, next: TContext) => boolean
}

const isSocketReusable = (socket: WebSocket | null | undefined) => {
  if (!socket) return false
  return socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN
}

const getOrCreateSessionId = (storageKey: string, idFactory: () => string) => {
  let socketId = sessionStorage.getItem(storageKey)
  if (!socketId) {
    socketId = idFactory()
    sessionStorage.setItem(storageKey, socketId)
  }
  return socketId
}

export function createBaseWSClient<TContext>(config: CreateBaseWSClientConfig<TContext>) {
  let client: RawWSClient | null = null
  let currentContext: TContext | null = null

  const isSameContext = (nextContext: TContext) => {
    if (currentContext == null) return false
    if (config.isSameContext) return config.isSameContext(currentContext, nextContext)
    return currentContext === nextContext
  }

  const getClient = async (context: TContext, options?: BaseClientGetOptions): Promise<RawWSClient | null> => {
    const forceNew = options?.forceNew ?? false
    const contextChanged = !isSameContext(context)

    if (!client || forceNew || contextChanged || !isSocketReusable(client.socket)) {
      if (client?.socket && client.socket.readyState !== WebSocket.CLOSED) {
        client.socket.close()
      }

      const id = getOrCreateSessionId(config.idStorageKey, config.idFactory)
      const socket = new WebSocket(config.buildUrl(id, context))
      socket.onopen = () => {
        console.log('WebSocket connection established')
      }

      client = { id, socket }
      currentContext = context
    }

    return client
  }

  const reset = () => {
    if (client?.socket && client.socket.readyState !== WebSocket.CLOSED) {
      client.socket.close()
    }
    client = null
    currentContext = null
  }

  return {
    getClient,
    reset,
  }
}
