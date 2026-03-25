export type SocketIdentity = {
  id: string
  socket: WebSocket
}

export type AcquireSocketOptions = {
  forceNew?: boolean
}

type SocketConnectionFactoryConfig<TContext> = {
  identityStorageKey: string
  createIdentity: () => string
  buildSocketUrl: (id: string, context: TContext) => string
  isSameContext?: (prev: TContext, next: TContext) => boolean
}

const isSocketReusable = (socket: WebSocket | null | undefined) => {
  if (!socket) return false
  return socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN
}

const getOrCreateIdentity = (storageKey: string, idFactory: () => string) => {
  let socketId = sessionStorage.getItem(storageKey)
  if (!socketId) {
    socketId = idFactory()
    sessionStorage.setItem(storageKey, socketId)
  }
  return socketId
}

export function createSocketConnectionFactory<TContext>(config: SocketConnectionFactoryConfig<TContext>) {
  let activeIdentity: SocketIdentity | null = null
  let activeContext: TContext | null = null

  const matchesContext = (nextContext: TContext) => {
    if (activeContext == null) return false
    if (config.isSameContext) return config.isSameContext(activeContext, nextContext)
    return activeContext === nextContext
  }

  const acquire = async (context: TContext, options?: AcquireSocketOptions): Promise<SocketIdentity | null> => {
    const forceNew = options?.forceNew ?? false
    const contextChanged = !matchesContext(context)

    if (!activeIdentity || forceNew || contextChanged || !isSocketReusable(activeIdentity.socket)) {
      if (activeIdentity?.socket && activeIdentity.socket.readyState !== WebSocket.CLOSED) {
        activeIdentity.socket.close()
      }

      const id = getOrCreateIdentity(config.identityStorageKey, config.createIdentity)
      const socket = new WebSocket(config.buildSocketUrl(id, context))
      socket.onopen = () => {
        console.log('WebSocket connection established')
      }

      activeIdentity = { id, socket }
      activeContext = context
    }

    return activeIdentity
  }

  const reset = () => {
    if (activeIdentity?.socket && activeIdentity.socket.readyState !== WebSocket.CLOSED) {
      activeIdentity.socket.close()
    }
    activeIdentity = null
    activeContext = null
  }

  return {
    acquire,
    reset,
  }
}
