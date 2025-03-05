import { Button, Col, Form, Input, Radio, Row, Space, Spin, Table } from 'antd'
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ModalChildRef } from '@/components/modal/ModalForm'
import { useNotification } from '@/hooks/useNotification'
import Title from 'antd/es/typography/Title'
import { FileSyncOutlined } from '@ant-design/icons'
import SmartTextarea, { SmartTextareaRef } from '@/components/input/SmartTextarea'

// 1️⃣ 先定义联合类型
type SwitchModelType = 'Table' | 'Json' | 'Plain'

// 2️⃣ 再定义 options，并确保 value 只能是 SwitchModelType
const options: { label: string; value: SwitchModelType }[] = [
  { label: 'Table', value: 'Table' },
  { label: 'Json', value: 'Json' },
  { label: 'Plain', value: 'Plain' },
]

type SubmitType = {
  root: string[]
  meaning: string
  wordCount: number
}
const FormAddRoot = forwardRef<ModalChildRef, { onFinish: (values: any) => void; submitLoading: boolean }>(
  ({ onFinish, submitLoading }, ref) => {
    const [form] = Form.useForm()
    const [queue, setQueue] = useState<SubmitType[]>([])
    const [swidtchModel, setSwidtchModel] = useState<SwitchModelType>('Table')
    const [textareaRenderCount, settextareaRenderCount] = useState(0)

    const jsonAreaRef = useRef<HTMLTextAreaElement>(null)
    const plainAreaRef = useRef<SmartTextareaRef>(null)

    const { showNotification, showConfirmationDialog } = useNotification()

    useImperativeHandle(ref, () => ({
      resetFields: () => form.resetFields(),
    }))

    const plainTextValue = useMemo(() => {
      let str = ''
      queue.forEach((item, index) => {
        // 103. -bronch(i)(o)- 气管 \t6\n
        const curStr =
          index +
          '. ' +
          item.root.map(w => '-' + w + '-').join('=') +
          ' ' +
          item.meaning +
          ' ' +
          '\t' +
          item.wordCount +
          '\n'
        str += curStr
      })
      return str
    }, [queue])

    const handleSyncJson = () => {
      if (!jsonAreaRef.current) return
      const textStr = jsonAreaRef.current.value

      try {
        const parsed = JSON.parse(textStr)
        console.log('parsed value: ', parsed)
        setQueue(parsed)
      } catch (error) {
        showNotification('error', 'parsed error:' + error, 'notification')
        console.error('parsed err: ', error)
      }
    }

    const formatText = (input: string) => {
      return input
        .replace(/(\w+-)\s+=/g, '$1=') // 修正 `word- =` -> `word-=`
        .replace(/=\s+(-\w+)/g, '=$1') // 修正 `= -word` -> `=-word` // 修正 `= -xxx`
    }

    const handleSyncPlainText = (textStr: string) => {
      const str = formatText(textStr)
      console.log('format str : ', str)
      try {
        // const regex = /^\d+\.\s+(-[\w()-]+(?:\s*=\s*-[\w()-]+)*)\s+(\S.*?)\t(\d+)$/gm
        const regex = /^\d+\.\s+(-[\w()-]+(?:\s*=\s*-?[\w()-]+)*)\s+(\S.*?)[ \t]+(\d+)$/gm

        const matches = [...textStr.matchAll(regex)]
        console.log('matches text: ', matches)

        const result = matches.map(match => ({
          root: match[1].split('=').map(s => s.trim().replace(/[-()]/g, '')), // 去掉 `-` 和 `()` 符号
          meaning: match[2].trim(), // 提取中文意思
          wordCount: parseInt(match[3], 10), // 提取数字
        }))
        setQueue(result)
      } catch (error) {
        showNotification('error', 'parsed error:' + error, 'notification')
        console.error('parsed err: ', error)
      }
    }

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

      settextareaRenderCount(preCount => preCount + 1)
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
            <div className="flex items-center gap-3">
              <Title level={4}>Pending submission queue Display Model</Title>
              <Radio.Group
                block
                options={options}
                defaultValue="Table"
                optionType="button"
                buttonStyle="solid"
                onChange={e => setSwidtchModel(e.target.value)}
              />
            </div>
            {swidtchModel === 'Table' && (
              <Table
                scroll={{ y: 300 }}
                dataSource={queue}
                columns={[
                  {
                    title: 'Root',
                    dataIndex: 'root',
                    render: (value, record) => <div>[{record.root.join(',')}]</div>,
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
            )}
            {swidtchModel === 'Json' && (
              <div style={{ height: '300px', position: 'relative' }}>
                <textarea
                  key={textareaRenderCount}
                  ref={jsonAreaRef}
                  style={{ height: '100%', width: '100%', border: '1px solid #ddd', padding: '8px' }}
                  defaultValue={JSON.stringify(queue, null, 2)}
                  onBlur={e => console.log(e.target.value)}
                />
                <Button
                  shape="circle"
                  type="primary"
                  style={{ position: 'absolute', bottom: 0, right: 0 }}
                  icon={<FileSyncOutlined />}
                  onClick={handleSyncJson}
                />
              </div>
            )}
            {swidtchModel === 'Plain' && (
              <div style={{ height: '300px', position: 'relative' }}>
                <SmartTextarea
                  ref={plainAreaRef}
                  value={plainTextValue}
                  placeholder='Entering something like "Index. -xxxx- meaning \tWordCount\n".'
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  onBlur={text => console.log('Blurred:', text)}
                  onSave={handleSyncPlainText}
                />
              </div>
            )}
          </div>
        </div>
      </Spin>
    )
  },
)

export default FormAddRoot
