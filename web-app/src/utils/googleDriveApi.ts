/* eslint-disable no-undef */

// Token 刷新装饰器（仅用于实例方法）
function withTokenRefresh(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
): void {
  const originalMethod = descriptor.value!

  descriptor.value = async function (...args: any[]) {
    const self = this as GoogleDriveService

    try {
      return await originalMethod.apply(this, args)
    } catch (error: any) {
      console.log('withTokenRefresh catch error : ', error)
      if ([401, 403].includes(error?.status) && self.getStoredToken()) {
        console.log(`Token 可能过期，尝试刷新方法 ${propertyKey}...`)
        self.clearStoredToken()

        try {
          await self.requestNewToken()
          return await originalMethod.apply(this, args)
        } catch (refreshError) {
          console.error(`方法 ${propertyKey} Token 刷新失败:`, refreshError)
          throw refreshError
        }
      }
      throw error
    }
  }
}

class GoogleDriveService {
  GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID!
  GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY!
  // SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly'
  SCOPES = 'https://www.googleapis.com/auth/drive'
  TOKEN_KEY = 'google_drive_access_token'

  private createAuthCancelledError(extra?: any): Error & { code: string; type?: string } {
    const err = new Error('User cancelled Google authorization') as Error & {
      code: string
      type?: string
    }

    err.code = 'AUTH_CANCELLED'
    if (extra?.type) {
      err.type = extra.type
    }

    return err
  }

  // 确保加载所有需要的 Google API 脚本
  loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.body.appendChild(script)
    })
  }

  async ensureScriptsLoaded(): Promise<void> {
    const promises: Promise<void>[] = []

    if (!window.gapi) {
      promises.push(this.loadScript('https://apis.google.com/js/api.js'))
    }

    if (!window.google?.accounts?.oauth2) {
      promises.push(this.loadScript('https://accounts.google.com/gsi/client'))
    }

    await Promise.all(promises)
  }

  getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  clearStoredToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
  }

  async getValidToken(): Promise<string> {
    let token = this.getStoredToken()
    if (!token) {
      token = await this.requestNewToken()
    }
    return token
  }
  async requestNewToken(): Promise<string> {
    if (!window.google?.accounts?.oauth2) {
      await this.loadScript('https://accounts.google.com/gsi/client')
    }

    return new Promise<string>((resolve, reject) => {
      let settled = false

      const safeResolve = (token: string) => {
        if (settled) return
        settled = true
        this.storeToken(token)
        resolve(token)
      }

      const safeReject = (err: any) => {
        if (settled) return
        settled = true
        reject(err)
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: this.GOOGLE_CLIENT_ID,
        scope: this.SCOPES,
        callback: (response: any) => {
          if (response?.access_token) {
            safeResolve(response.access_token)
            return
          }

          const err: any = new Error(response?.error_description || response?.error || 'Failed to get access token')
          err.code = response?.error || 'AUTH_ERROR'
          err.response = response
          safeReject(err)
        },
        error_callback: (err: any) => {
          if (err?.type === 'popup_closed') {
            safeReject(this.createAuthCancelledError(err))
            return
          }

          const authErr: any = new Error(err?.type || 'Google auth failed')
          authErr.code = 'AUTH_ERROR'
          authErr.type = err?.type
          safeReject(authErr)
        },
      })

      client.requestAccessToken()
    })
  }

  async requestNewToken1(): Promise<string> {
    return new Promise((resolve, reject) => {
      const initAndRequest = (): Promise<string> =>
        new Promise((resolveInner, rejectInner) => {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: this.GOOGLE_CLIENT_ID,
            scope: this.SCOPES,
            callback: (response: any) => {
              if (response?.access_token) {
                this.storeToken(response.access_token)
                resolveInner(response.access_token)
              } else {
                rejectInner(new Error('Failed to get access token'))
              }
            },
          })
          client.requestAccessToken()
        })

      if (!window.google?.accounts?.oauth2) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.onload = () => resolve(initAndRequest())
        script.onerror = () => reject(new Error('Failed to load identity service'))
        document.body.appendChild(script)
      } else {
        resolve(initAndRequest())
      }
    })
  }

  // 修改方法签名：去掉 accessToken 参数
  // @withTokenRefresh
  async openPicker(onPick?: (doc: any) => void): Promise<void> {
    let accessToken = await this.getValidToken() // 内部自己处理 token

    try {
      accessToken = await this.getValidToken()
    } catch (err: any) {
      // 用户主动关闭授权窗口，不当成真正异常
      if (err?.code === 'AUTH_CANCELLED') {
        return
      }
      throw err
    }

    return new Promise<void>((resolve, reject) => {
      window.gapi.load('picker', () => {
        try {
          const view = new window.google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true)

          const picker = new window.google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(accessToken)
            .setDeveloperKey(this.GOOGLE_API_KEY)
            .setCallback((data: any) => {
              if (data.action === window.google.picker.Action.PICKED && data.docs.length > 0) {
                const doc = data.docs[0]
                onPick?.(doc)
              }
            })
            .setOrigin(window.location.origin) // 👈 必须设置
            // .setParent(window.location.origin) // 👈 加上这行修复 .favicon.ico 问题
            .build()

          picker.setVisible(true)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  async listFilesInFolder(folderId: string): Promise<any[]> {
    const token = await this.getValidToken()

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return data.files
  }

  async fetchFileAsArrayBuffer(fileId: string): Promise<ArrayBuffer> {
    const token = await this.getValidToken()

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const buffer = await response.arrayBuffer()
    return buffer
  }
}

// 导出单例实例（唯一出口）
const googleDriveService = new GoogleDriveService()
export default googleDriveService
