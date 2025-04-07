import React, { useEffect } from 'react'
import { Modal, Form, Input } from 'antd'
import { PermissionItem } from '../types'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (data: PermissionItem) => void
  defaultData?: PermissionItem | null
}

const PermissionModal: React.FC<Props> = ({ open, onCancel, onSubmit, defaultData }) => {
  const [form] = Form.useForm()

  // ✨ 每次打开或默认值变化时设置表单值
  useEffect(() => {
    if (open) {
      if (defaultData) {
        form.setFieldsValue(defaultData)
      } else {
        form.resetFields()
      }
    }
  }, [open, defaultData, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const finalValues = {
        ...(defaultData || {}),
        ...values, // 保证原始字段（如 key）不丢
      }
      onSubmit(finalValues)
      form.resetFields() // ✅ 提交后清空
    } catch (err) {
      // 验证失败不处理
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={defaultData ? 'Edit Permission' : 'Add Permission'}
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="key" label="Key" rules={[{ required: true }]}>
          <Input disabled={!!defaultData} />
        </Form.Item>
        <Form.Item name="index" label="Index" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>
        <Form.Item name="desc_en" label="Description (EN)" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="desc_zh" label="描述 (ZH)" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default PermissionModal
