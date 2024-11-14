import { Modal } from 'antd'

interface ConfirmationOptions {
  title?: string // 弹窗的标题
  content: string // 弹窗的内容（可选）
  onOk?: () => void // 用户点击确认按钮时执行的回调
  onCancel?: () => void // 用户点击取消按钮时执行的回调（可选）
}

// 通用确认框方法，适用于所有需要确认操作的场景
export function showConfirmationDialog(options: ConfirmationOptions): Promise<boolean> {
  return new Promise(resolve => {
    Modal.confirm({
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
