import { useAuth } from '@/context/AuthContext'
import {
  batchUpdateScreenshotDoc,
  deleteScreenshotDocs,
  getAllScreenshotDoc,
} from '@/service/screenshotDoc'
import React, { useEffect, useState } from 'react'
import {
  Card,
  List,
  Image,
  Switch,
  Typography,
  Button,
  Space,
  Spin,
  Tag,
  Popconfirm,
  Row,
  Col,
  Select,
  Form,
  Input,
  FormInstance,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import DocEditModal from './components/DocEditModal'
import { useNotification } from '@/hooks/useNotification'
import { PlusOutlined } from '@ant-design/icons'
import { FieldValue, Timestamp } from 'firebase/firestore'
import { transFBDate2Local } from '@/utils/utilsDate'

const { Meta } = Card
const { Title, Text } = Typography
const { Option } = Select

const colors = [
  'processing',
  'success',
  'error',
  'warning',
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
]

export type ScreenshotDoc = {
  id?: string
  docName: string
  keyTerms?: string[]
  screenshots: string[]
  createTime?: FieldValue
}

const ScreenshotDocs: React.FC = () => {
  const [data, setData] = useState<ScreenshotDoc[]>([])
  const [isGridView, setIsGridView] = useState(true)
  const [isDocEditModalVisible, setIsDocEditModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<ScreenshotDoc>()

  const [isLoading, setIsloading] = useState(false)
  const [isFormLoading, setIsFormloading] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)

  // const docTypeFormRef = useRef<FormInstance>(null)

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const { handleRequestWithNotification, showConfirmModal } = useNotification()
  const shuffleColors = (arr: string[]) => {
    let shuffled = [...arr] // 拷贝一份数组，避免改变原数组
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  const shuffledColors = shuffleColors(colors)

  useEffect(() => {
    // 判断是否可以返回
    const hasHistory = window.history.length > 1 // 如果历史记录长度大于 1，说明可以返回
    setCanGoBack(hasHistory)
  }, [])

  const showDocEditModal = () => {
    setIsDocEditModalVisible(true)
  }

  const handleDocEditModalCancel = () => {
    setIsDocEditModalVisible(false)
  }

  const handleDocEditModalSave = async (data: ScreenshotDoc) => {
    const docData: ScreenshotDoc = {
      id: data.id,
      docName: data.docName,
      keyTerms: data.keyTerms,
      screenshots: data.screenshots,
    }
    console.log('Saved data:', docData)

    setIsFormloading(true)

    const r = await handleRequestWithNotification(
      async () => await batchUpdateScreenshotDoc([docData]),
      {
        successField: null,
        errorField: null,
      },
    )

    setIsFormloading(false)
    setIsDocEditModalVisible(false)

    if (r) {
      refreshPage()
    }
    // 可以在这里处理保存操作，例如提交到后端
  }

  // 显示编辑 Modal
  const handleEditClick = (item: ScreenshotDoc) => {
    setEditingItem(item)
    showDocEditModal()
  }
  const handleAddDoc = () => {
    const item = {
      docName: '',
      keyTerms: [],
      screenshots: [],
    }
    handleEditClick(item)
  }

  const handleConfirm = async (item: ScreenshotDoc) => {
    console.log('delete item is : ', item)

    if (!item?.id) return

    const r = await handleRequestWithNotification(
      async () => await deleteScreenshotDocs([item.id!]),
      {
        successField: null,
        errorField: null,
      },
    )

    if (r) {
      refreshPage()
    }
  }

  const handleDocType = async () => {
    const docTypeFormRef = React.createRef<FormInstance<any>>()

    showConfirmModal({
      title: 'Add Doc Type',
      content: (
        <Form ref={docTypeFormRef}>
          <Form.Item name="other">
            <Input />
          </Form.Item>
        </Form>
      ),
      onOk(value) {
        console.log('onOk : ', value)
      },
    })
  }

  function refreshPage() {
    setIsloading(true)
    getAllScreenshotDoc()
      .then(data => {
        if (data) {
          setData(
            data.map(item => ({
              id: item.id,
              docName: item.docName,
              keyTerms: item.keyTerms || [],
              screenshots: item.screenshots,
              createTime: item.createTime,
            })),
          )
        }
      })
      .finally(() => {
        setIsloading(false)
      })
  }

  useEffect(() => {
    if (!isAuthenticated) return
    refreshPage()
  }, [isAuthenticated])

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-5">
        <Space>
          <Title level={2}>Screenshot Documents</Title>
          <Button type="link" onClick={() => navigate('/tool/docSnap/multi')}>
            Create
          </Button>
          <Button type="link" onClick={() => navigate(-1)} disabled={!canGoBack}>
            back
          </Button>
        </Space>
        <Space>
          <Button type="text" onClick={refreshPage}>
            Refresh
          </Button>
          <Button type="text" onClick={handleAddDoc}>
            <PlusOutlined />
          </Button>
          <Switch
            checkedChildren="Grid View"
            unCheckedChildren="List View"
            checked={isGridView}
            onChange={setIsGridView}
          />
        </Space>
      </div>

      <div style={{ padding: '10px 0', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        {/* Title Section */}

        {/* Buttons and Selectors */}
        <Row gutter={[16, 16]}>
          <Col>
            <Title level={4}>DocType: </Title>
          </Col>
          <Col>
            <Space size="middle">
              {/* Selector */}
              <Tag>Video</Tag>
              <Tag>English</Tag>

              {/* Button */}
              <Button type="text" icon={<PlusOutlined />} onClick={handleDocType}></Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Spin spinning={isLoading}>
        {/* 文档列表 */}
        {isGridView ? (
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 6,
              xxl: 8,
            }}
            dataSource={data}
            renderItem={doc => (
              <List.Item>
                <Card
                  hoverable
                  cover={
                    doc.screenshots.length ? (
                      <Image
                        src={doc.screenshots[0]}
                        alt={doc.docName}
                        height={200}
                        preview={false}
                      />
                    ) : (
                      <div
                        style={{
                          height: 200,
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text type="secondary">No Screenshot</Text>
                      </div>
                    )
                  }
                >
                  <Meta
                    title={doc.docName}
                    description={
                      doc.screenshots.length
                        ? `${doc.screenshots.length} screenshot(s) available`
                        : 'No screenshots available'
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={doc => (
              <List.Item>
                <List.Item.Meta
                  title={doc.docName}
                  description={
                    <div>
                      <div>
                        <Space>
                          {doc?.keyTerms?.length
                            ? doc.keyTerms.map((k, index) => (
                                <Tag
                                  key={k}
                                  bordered={false}
                                  color={shuffledColors[index % shuffledColors.length]}
                                >
                                  {k}
                                </Tag>
                              ))
                            : null}
                        </Space>
                      </div>
                      <div>
                        <Space>
                          <span>{transFBDate2Local(doc?.createTime as Timestamp)}</span>
                          {doc.screenshots.length ? (
                            <Space>
                              <span>{`${doc.screenshots.length} screenshot(s) available`}</span>
                            </Space>
                          ) : (
                            'No screenshots available'
                          )}

                          <Button type="text" onClick={() => handleEditClick(doc)}>
                            Edit
                          </Button>
                          <Popconfirm
                            title="Delete the task"
                            description="Are you sure to delete this item?"
                            onConfirm={() => handleConfirm(doc)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button size="small" danger>
                              Delete
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                    </div>
                  }
                />
                {doc.screenshots.length ? (
                  <Image.PreviewGroup>
                    {doc.screenshots.slice(0, 3).map((src, idx) => (
                      <Image
                        key={idx}
                        src={src}
                        alt={`Screenshot ${idx + 1}`}
                        width={80}
                        height={80}
                        style={{ marginRight: 10 }}
                        preview={{
                          mask: <span>Click to Preview</span>,
                        }}
                      />
                    ))}
                  </Image.PreviewGroup>
                ) : (
                  <Text type="secondary">No Preview</Text>
                )}
              </List.Item>
            )}
          />
        )}
      </Spin>

      <Spin spinning={isFormLoading}>
        <DocEditModal
          editData={editingItem}
          visible={isDocEditModalVisible}
          onCancel={handleDocEditModalCancel}
          onSave={handleDocEditModalSave}
        />
      </Spin>
    </div>
  )
}

export default ScreenshotDocs
