import { Button, Form, Input, Spin } from 'antd'
import React, { forwardRef, useImperativeHandle } from 'react'
import { ModalChildRef } from '@/components/modal/ModalForm'

const FormAddRoot = forwardRef<
  ModalChildRef,
  { onFinish: (values: any) => void; submitLoading: boolean }
>(({ onFinish, submitLoading }, ref) => {
  const [form] = Form.useForm()

  useImperativeHandle(ref, () => ({
    resetFields: () => form.resetFields(),
  }))

  const onSubmit = (values: any) => {
    const r = {
      root: values.root.split('/').filter(Boolean),
      meaning: values.meaning,
      wordCount: Number(values.wordCount),
    }
    onFinish(r)
  }

  return (
    <Spin spinning={submitLoading}>
      <Form
        form={form}
        name="wrap"
        labelCol={{ flex: '110px' }}
        labelAlign="left"
        labelWrap
        wrapperCol={{ flex: 1 }}
        colon={false}
        style={{ maxWidth: 600 }}
        onFinish={onSubmit}
      >
        <Form.Item label="root" name="root" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Meaning" name="meaning" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="WordCount" name="wordCount" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>

        <Form.Item label=" ">
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  )
})

export default FormAddRoot
