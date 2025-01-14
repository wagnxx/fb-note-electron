import React, { useState, useEffect } from 'react'
import { Modal, Input, Upload, Form } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { ScreenshotDoc } from '../ScreenshotDoc'
import { useNotification } from '@/hooks/useNotification'
import { uploadFileToFirebase } from '@/service/firebaseUploader'
import { Optional } from '@/utils/types'

interface DocEditModalProps {
  visible: boolean
  onCancel: () => void
  onSave: (data: ScreenshotDoc) => void
  editData?: Optional<ScreenshotDoc, 'id'> // 接收编辑的数据
}

const DocEditModal: React.FC<DocEditModalProps> = ({ visible, onCancel, onSave, editData }) => {
  const [form] = Form.useForm()
  const [screenshots, setScreenshots] = useState<string[]>([]) // 存储图片列表

  const { message, modal, showConfirmModal } = useNotification()

  // 当编辑的数据发生变化时，更新表单字段
  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        docName: editData.docName,
        key: (editData.keyTerms || []).join('/'),
        order: editData.order,
      })
      setScreenshots(editData.screenshots || [])
    }
  }, [editData, form])

  // 处理上传的图片
  const handleUploadChange = async (info: any) => {}

  const handleCustomRequest = ({ file, onSuccess, onError, onProgress }: any) => {
    uploadFileToFirebase(file, `screenshotDoc/${file.name}`, progress =>
      onProgress({ percent: progress * 100 }),
    ).then(downloadURL => {
      if (downloadURL) {
        setScreenshots(prevScreenshots => [...prevScreenshots, downloadURL])
      }
    })
  }

  // 删除图片
  const handleDeleteImage = (image: string) => {
    setScreenshots(prevScreenshots => prevScreenshots.filter(img => img !== image))
  }

  const handleSave = () => {
    form
      .validateFields()
      .then(values => {
        const docData = {
          ...values,
          id: editData ? editData.id : void 0,
          keyTerms: values.key.trim().split('/').filter(Boolean),
          order: Number(values.order),
          screenshots,
        }
        onSave(docData) // 将表单数据和图片列表传递给父组件
        form.resetFields() // 重置表单
        setScreenshots([]) // 清空图片列表
      })
      .catch(info => {
        console.log('Validate Failed:', info)
      })
  }

  return (
    <Modal
      title="Edit Document"
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      okText="Save"
      cancelText="Cancel"
      destroyOnClose // 关闭时销毁 Modal 内容
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Document Name"
          name="docName"
          rules={[{ required: true, message: 'Please input the document name!' }]}
        >
          <Input placeholder="Enter document name" />
        </Form.Item>

        <Form.Item
          label="Key"
          name="key"
          rules={[{ required: true, message: 'Please input the key!' }]}
        >
          <Input placeholder="Enter key separated by '/'" />
        </Form.Item>
        <Form.Item
          label="Order"
          name="order"
          rules={[{ required: true, message: 'Please input the order!' }]}
        >
          <Input placeholder="Enter order number" type="number" />
        </Form.Item>

        <Form.Item label="Screenshots" name="screenshots">
          <div>
            <Upload
              // action="/upload" // 这里是上传图片的 API 地址
              listType="picture-card"
              multiple={false}
              showUploadList={{
                showRemoveIcon: true,
              }}
              customRequest={handleCustomRequest}
              onChange={handleUploadChange}
              // beforeUpload={() => true} // 阻止自动上传，改为手动上传
            >
              <UploadOutlined />
            </Upload>

            <div style={{ marginTop: 16 }}>
              {screenshots.length > 0 && (
                <div>
                  <strong>Uploaded Images:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 8 }}>
                    {screenshots.map((image, index) => (
                      <div key={index} style={{ margin: 8, position: 'relative' }}>
                        <img
                          src={image}
                          alt="screenshot"
                          style={{ width: 100, height: 100, objectFit: 'cover' }}
                        />
                        <DeleteOutlined
                          onClick={() => handleDeleteImage(image)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: '50%',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default DocEditModal
