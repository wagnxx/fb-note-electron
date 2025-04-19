declare module '@shared/ipc/video' {
    export interface StartStreamRequest {
      source: string
      options?: Record<string, any>
    }
  
    export interface StreamStatus {
      isActive: boolean
      port: number
    }
  }
  