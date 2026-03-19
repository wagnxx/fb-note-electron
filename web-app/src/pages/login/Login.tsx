import React, { useState } from 'react'
import type { FormProps } from 'antd'
import { Button, Divider, Flex, Form, Input, message } from 'antd'
import { loginUser, signInWithGoogle } from '@/firebase/authService'
import { useNavigate } from 'react-router-dom'
import { GoogleCircleFilled } from '@ant-design/icons'

type FieldType = {
  email: string
  password: string
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const onFinish: FormProps<FieldType>['onFinish'] = async values => {
    try {
      setEmailLoading(true)

      const isSuccessed = await loginUser(values.email, values.password)

      if (!isSuccessed) {
        message.error('邮箱或密码错误')
        return
      }

      message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      console.error('Email login error:', error)
      message.error(error?.message || '登录失败')
    } finally {
      setEmailLoading(false)
    }
  }

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = errorInfo => {
    console.log('Failed:', errorInfo)
  }

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true)

      const isSuccessed = await signInWithGoogle()

      if (!isSuccessed) {
        message.error('Google 登录失败')
        return
      }

      message.success('登录成功')
      navigate('/')
    } catch (error: any) {
      console.error('Google login error:', error)
      message.error(error?.message || 'Google 登录失败')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 30px)' }}>
      <Form
        name="login"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        style={{
          width: 420,
          borderRadius: 8,
          padding: 24,
          boxShadow: '4px 4px 4px #ddd, -1px -1px 1px #ddd',
          background: '#fff',
        }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item<FieldType>
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <Form.Item wrapperCol={{ span: 24 }}>
          <Button type="primary" htmlType="submit" block loading={emailLoading}>
            Login
          </Button>
        </Form.Item>

        <Divider plain>or</Divider>

        <Flex justify={'center'} align={'center'} style={{ gap: 12 }}>
          <Form.Item wrapperCol={{ span: 24 }} style={{ marginBottom: 0 }}>
            <Button
              onClick={handleGoogleLogin}
              loading={googleLoading}
              type={'text'}
              icon={<GoogleCircleFilled style={{ color: '#db4437', fontSize: 18 }} />}
            ></Button>
          </Form.Item>
        </Flex>
      </Form>
    </div>
  )
}

export default Login
