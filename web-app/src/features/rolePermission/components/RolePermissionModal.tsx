import React, { useEffect } from 'react'
import { Modal, Form, Input, Checkbox } from 'antd'
import { PermissionItem, RolePermission } from '../types'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (data: RolePermission) => void
  permissionOptions: PermissionItem[]
  defaultData?: RolePermission | null
}

const RolePermissionModal: React.FC<Props> = ({ open, onCancel, onSubmit, permissionOptions, defaultData }) => {
  const [form] = Form.useForm()

  // 设置/重置表单值
  useEffect(() => {
    if (open) {
      if (defaultData) {
        form.setFieldsValue({
          role: defaultData.role,
          permissions: defaultData.permissions || [],
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, defaultData, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const finalValues: RolePermission = {
        ...(defaultData || {}),
        ...values,
      }
      onSubmit(finalValues)
      form.resetFields()
    } catch (err) {
      // 可选错误提示
    }
  }

  return (
    <Modal
      title={defaultData ? 'Edit Role' : 'Add Role'}
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields()
        onCancel()
      }}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Please enter a role name' }]}>
          <Input disabled={!!defaultData} />
        </Form.Item>

        <Form.Item
          name="permissions"
          label="Permissions"
          rules={[{ required: true, message: 'Please select permissions' }]}
        >
          <Checkbox.Group className="grid grid-cols-2 gap-2">
            {permissionOptions.map(p => (
              <Checkbox key={p.key} value={p.key}>
                {p.desc_en}
              </Checkbox>
            ))}
            <Checkbox value="*">All (*)</Checkbox>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default RolePermissionModal
