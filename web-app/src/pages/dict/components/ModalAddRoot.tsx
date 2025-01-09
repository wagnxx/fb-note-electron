import { Button, Form, Input, Modal } from 'antd'
import React, { FC } from 'react'
import { WordRootType } from './WordRootManage'

type Props = {
  visible: boolean
  onAdd: ({ root, meaning, wordCount }: Partial<WordRootType>) => void
}

const ModalAddRoot: FC<Props> = ({ visible, onAdd }) => {
  const onFinish = (values: any) => {
    const r = {
      root: values.root.split('/').filter(Boolean),
      meaning: values.meaning,
      wordCount: Number(values.wordCount),
    }
    onAdd(r)
  }
  return (
    <Modal open={visible}>
      <Form
        name="wrap"
        labelCol={{ flex: '110px' }}
        labelAlign="left"
        labelWrap
        wrapperCol={{ flex: 1 }}
        colon={false}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
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
    </Modal>
  )
}

export default ModalAddRoot
