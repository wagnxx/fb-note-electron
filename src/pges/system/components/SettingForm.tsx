import React from 'react'
import type { FormProps } from 'antd'
import { Button, Form, Input } from 'antd'

export type SettingFormFieldType = {
  username?: string
  password?: string

  address?: string
  port?: string
}

type CpProps = {
  onFinish: FormProps<SettingFormFieldType>['onFinish']
  onFinishFailed: FormProps<SettingFormFieldType>['onFinishFailed']
  disabled?: boolean
  initialValues?: SettingFormFieldType
}

const SettingForm: React.FC<CpProps> = ({
  onFinish,
  onFinishFailed,
  disabled,
  initialValues = { address: '127.0.0.1', port: '0' },
}) => (
  <Form
    name="basic"
    labelCol={{ span: 24 }}
    wrapperCol={{ span: 24 }}
    style={{ maxWidth: 600 }}
    initialValues={initialValues}
    autoComplete="off"
    size="small"
    disabled={disabled}
    onFinish={onFinish}
    onFinishFailed={onFinishFailed}
  >
    <Form.Item<SettingFormFieldType>
      label="Address"
      name="address"
      rules={[{ required: true, message: 'Please input your address!' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item<SettingFormFieldType>
      label="Port"
      name="port"
      rules={[{ required: true, message: 'Please input your port!' }]}
    >
      <Input />
    </Form.Item>
    <Form.Item<SettingFormFieldType>
      label="Username"
      name="username"
      rules={[{ required: false, message: 'Please input your username!' }]}
    >
      <Input />
    </Form.Item>

    <Form.Item<SettingFormFieldType>
      label="Password"
      name="password"
      rules={[{ required: false, message: 'Please input your password!' }]}
    >
      <Input.Password />
    </Form.Item>

    <Form.Item wrapperCol={{ offset: 0, span: 16 }}>
      <Button type="primary" htmlType="submit">
        Run
      </Button>
    </Form.Item>
  </Form>
)

export default SettingForm
