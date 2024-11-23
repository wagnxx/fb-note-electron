import React from 'react'
import type { FormProps } from 'antd'
import { Button, Form, Input } from 'antd'
import { loginUser } from '@/firebase/authService'
import { useNavigate } from 'react-router-dom'

type FieldType = {
  email: string
  password: string
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const onFinish: FormProps<FieldType>['onFinish'] = async values => {
    console.log('Success:', values)
    const isSuccessed = await loginUser(values.email, values.password)
    console.log('isSuccessed : ', isSuccessed)
    navigate('/')
  }

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = errorInfo => {
    console.log('Failed:', errorInfo)
  }

  return (
    <div className="flex  justify-center items-center" style={{ height: 'calc(100vh - 30px)' }}>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{
          maxWidth: 600,
          borderRadius: '8px',
          padding: 20,
          boxShadow: '4px 4px 4px #ddd, -1px -1px 1px #ddd',
        }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="email"
          name="email"
          rules={[{ required: true, message: 'Please input your email!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit">
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default Login
