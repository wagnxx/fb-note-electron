import React, { useState, useCallback } from 'react'
import { App } from 'antd'

interface ApiResponse {
  [key: string]: any // 可以根据具体的返回结构更详细地定义
}

interface NotifyOptions {
  successMessage?: string
  errorMessage?: string
  notificationType?: 'notification' | 'message' | 'alert' | 'notice' // 通知类型
  successField?: string | null // 自定义字段名，用于检查成功结果
  errorField?: string | null // 自定义字段名，用于检查错误结果
}

interface ConfirmModalProps {
  title: string
  content: React.ReactNode
  okText?: string
  cancelText?: string
  onOk?: (value: string) => void // 确认时传递的回调
  onCancel?: () => void // 取消时的回调
}

// `useNotification` hook：处理请求和通知
export function useNotification() {
  const { notification, message, modal } = App.useApp()
  const [isLoading, setIsLoading] = useState(false) // 加载状态

  // 封装通知的显示
  const showNotification = useCallback(
    (
      type: 'success' | 'error',
      messageContent: string,
      notificationType: 'notification' | 'message' | 'alert' | 'notice',
    ) => {
      switch (notificationType) {
        case 'notification':
          if (type === 'success') {
            notification.success({ message: messageContent })
          } else {
            notification.error({ message: messageContent })
          }
          break
        case 'message':
          if (type === 'success') {
            message.success(messageContent)
          } else {
            message.error(messageContent)
          }
          break
        case 'alert':
          alert(messageContent) // alert 弹窗
          break
        case 'notice':
          // 如果需要自定义实现，可以在这里补充 notice 的逻辑
          if (type === 'success') {
            notification.success({ message: messageContent })
          } else {
            notification.error({ message: messageContent })
          }
          break
        default:
          break
      }
    },
    [],
  )

  // `handleRequestWithNotification` 用于发起请求并处理通知
  const handleRequestWithNotification = useCallback(
    async <T>(
      actionFunc: () => Promise<T>, // 执行的方法
      options: NotifyOptions = {}, // 默认值为空对象
    ): Promise<T> => {
      const {
        successMessage = 'Operation successful',
        errorMessage = 'Operation failed',
        notificationType = 'notification',
        successField = 'ok',
        errorField = 'message',
      } = options

      try {
        setIsLoading(true)
        const result = await actionFunc() // 调用传入的方法

        // 根据传入的字段名检查返回结果
        const isSuccess =
          successField === null && result ? true : (result as ApiResponse)?.[successField!] === true
        const errorMsg =
          errorField === null ? errorMessage : (result as ApiResponse)?.[errorField] || errorMessage

        if (isSuccess) {
          // 根据传入的通知类型显示成功消息
          successMessage && showNotification('success', successMessage, notificationType)
        } else {
          // 根据传入的通知类型显示错误消息
          showNotification('error', errorMsg, notificationType)
        }

        return result
      } catch (error) {
        // 捕获异常并显示错误消息
        showNotification('error', 'An unexpected error occurred', notificationType)
        throw error // 重新抛出异常，以便上层捕获
      } finally {
        setIsLoading(false)
      }
    },
    [showNotification],
  )

  const showConfirmModal = ({
    title,
    content,
    okText = 'OK',
    cancelText = 'Cancel',
    onOk,
    onCancel,
  }: ConfirmModalProps) => {
    return new Promise<string>((resolve, reject) => {
      modal.confirm({
        title,
        content,
        okText,
        cancelText,
        onOk() {
          const form = (content as any).ref.current
          if (form) {
            const values = form.getFieldsValue()
            resolve(values)
            onOk?.(values)
          } else {
            reject('No form data found')
          }
        },
        onCancel() {
          reject('Cancelled')
          onCancel?.() // 调用传入的 onCancel
        },
      })
    })
  }

  function showConfirmationDialog(options: {
    title?: string // 弹窗的标题
    content: string // 弹窗的内容（可选）
    onOk?: () => void // 用户点击确认按钮时执行的回调
    onCancel?: () => void // 用户点击取消按钮时执行的回调（可选）
  }): Promise<boolean> {
    return new Promise(resolve => {
      modal.confirm({
        title: options.title || 'System warnning',
        content: options.content, // 默认内容
        onOk: () => {
          if (options.onOk) options.onOk()
          resolve(true)
        },
        onCancel: () => {
          if (options.onCancel) options.onCancel()
          resolve(false)
        },
      })
    })
  }

  return {
    isLoading,
    handleRequestWithNotification,
    showNotification,
    notification,
    message,
    modal,
    showConfirmModal,
    showConfirmationDialog,
  }
}
