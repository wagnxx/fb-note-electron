// /src/utils/requestWithNotification.ts

import { notification, message } from 'antd'

interface ApiResponse {
  [key: string]: any // 可以根据具体的返回结构更详细地定义
}

interface NotifyOptions {
  successMessage?: string
  errorMessage?: string
  notificationType?: 'notification' | 'message' | 'alert' | 'notice' // 通知类型
  successField?: string // 自定义字段名，用于检查成功结果
  errorField?: string // 自定义字段名，用于检查错误结果
}

export async function handleRequestWithNotification<T>(
  actionFunc: () => Promise<T>, // 执行的方法
  options: NotifyOptions = {}, // 默认值为空对象
): Promise<T> {
  // 解构参数并为每个属性提供默认值
  const {
    successMessage = 'Operation successful',
    errorMessage = 'Operation failed',
    notificationType = 'notification',
    successField = 'ok',
    errorField = 'message',
  } = options

  try {
    const result = await actionFunc() // 调用传入的方法

    // 根据传入的字段名检查返回结果
    const isSuccess = (result as ApiResponse)?.[successField] === true
    const errorMsg = (result as ApiResponse)?.[errorField] || errorMessage

    if (isSuccess) {
      // 根据传入的通知类型显示成功消息
      showNotification('success', successMessage, notificationType)
    } else {
      // 根据传入的通知类型显示错误消息
      showNotification('error', errorMsg, notificationType)
    }

    return result
  } catch (error) {
    // 捕获异常并显示错误消息
    showNotification('error', 'An unexpected error occurred', notificationType)
    throw error // 重新抛出异常，以便上层捕获
  }
}

// 封装通知的显示
function showNotification(
  type: 'success' | 'error',
  messageContent: string,
  notificationType: 'notification' | 'message' | 'alert' | 'notice',
) {
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
}
