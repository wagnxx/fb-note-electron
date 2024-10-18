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

const isValidIP = (ip: string) => {
  const validIps = ['localhost']
  if (validIps.includes(ip)) return true
  const pattern =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return pattern.test(ip)
}

const isValidPort = (port: string) => {
  const portNum = parseInt(port, 10)
  return portNum >= 1 && portNum <= 65535
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
      rules={[
        { required: true, message: 'Please input your address!' },
        {
          validator: (_, value) => {
            if (isValidIP(value)) {
              return Promise.resolve()
            }
            return Promise.reject(new Error('Invalid IP address!'))
          },
        },
      ]}
    >
      <Input />
    </Form.Item>
    <Form.Item<SettingFormFieldType>
      label="Port"
      name="port"
      rules={[
        { required: true, message: 'Please input your port!' },
        {
          validator: (_, value) => {
            if (isValidPort(value)) {
              return Promise.resolve()
            }
            return Promise.reject(new Error('Invalid port number!'))
          },
        },
      ]}
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
