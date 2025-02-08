import { Button, Col, Form, Input, Row, Space, Spin, Table } from 'antd'
import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { ModalChildRef } from '@/components/modal/ModalForm'
import { useNotification } from '@/hooks/useNotification'
import Title from 'antd/es/typography/Title'

type SubmitType = {
  root: string[]
  meaning: string
  wordCount: number
}
const FormAddRoot = forwardRef<ModalChildRef, { onFinish: (values: any) => void; submitLoading: boolean }>(
  ({ onFinish, submitLoading }, ref) => {
    const [form] = Form.useForm()
    const [queue, setQueue] = useState<SubmitType[]>([])

    const { showNotification, showConfirmationDialog } = useNotification()

    useImperativeHandle(ref, () => ({
      resetFields: () => form.resetFields(),
    }))

    const addItemToQueue = async () => {
      const values = await form.validateFields()
      const r: SubmitType = {
        root: values.root.split('/').filter(Boolean),
        meaning: values.meaning,
        wordCount: Number(values.wordCount),
      }
      if (r.root.some(rItem => queue.some(q => q.root.includes(rItem)))) {
        showNotification('error', 'Repeated items are not allowed', 'message')
        return
      }
      setQueue(prevQueue => {
        form.resetFields()
        return [...prevQueue, r]
      })
    }

    const onSubmitQueue = (q?: SubmitType[]) => {
      const submitQueue = q || queue

      if (!submitQueue.length) return

      showConfirmationDialog({
        content: 'Are you sure about submitting it ?',
      }).then(ok => {
        if (ok) {
          onFinish(submitQueue)
          setQueue(() => [])
        }
      })
    }
    // submitting from the form
    const onSubmit = (values: any) => {
      const r = {
        root: values.root.split('/').filter(Boolean),
        meaning: values.meaning,
        wordCount: Number(values.wordCount),
      }
      onSubmitQueue([r])
    }

    return (
      <Spin spinning={submitLoading}>
        <div className="flex flex-col">
          <Form
            form={form}
            name="wrap"
            // labelCol={{ flex: '110px' }}
            // labelAlign="left"
            // layout="inline"
            labelWrap
            // wrapperCol={{ flex: 1 }}
            colon={false}
            // style={{ width: '600px' }}
            onFinish={onSubmit}
          >
            <Row gutter={20}>
              <Col span={12}>
                <Form.Item label="root" name="root" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Meaning" name="meaning" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="WordCount" name="wordCount" rules={[{ required: true }]}>
                  <Input type="number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label=" ">
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Submit
                    </Button>
                    <Button type="primary" onClick={addItemToQueue}>
                      Add To Queue
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <div className="pl-2">
            <Title level={3}>Pending submission queue</Title>
            <Table
              scroll={{ y: 300 }}
              dataSource={queue}
              columns={[
                {
                  title: 'Root',
                  dataIndex: 'root',
                  // render: (value, record) => record.root
                },
                { title: 'meaning', dataIndex: 'meaning' },
                { title: 'wordCount', dataIndex: 'wordCount' },
              ]}
              rowKey={record => record.root.join('-')}
              footer={() => (
                <Button type="primary" onClick={() => onSubmitQueue()} disabled={queue.length === 0}>
                  Submit Queue
                </Button>
              )}
            />
          </div>
        </div>
      </Spin>
    )
  },
)

export default FormAddRoot
