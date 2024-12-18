import { useAuth } from '@/context/AuthContext'
import { batchUpdateScreenshotDoc, getAllScreenshotDoc } from '@/service/screenshotDoc'
import React, { useEffect, useState } from 'react'
import { Card, List, Image, Switch, Typography, Button, Space, Spin, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import DocEditModal from './components/DocEditModal'
import { useNotification } from '@/hooks/useNotification'

const { Meta } = Card
const { Title, Text } = Typography

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
  id: string
  docName: string
  keyTerms?: string[]
  screenshots: string[]
}

const ScreenshotDocs: React.FC = () => {
  const [data, setData] = useState<ScreenshotDoc[]>([])
  const [isGridView, setIsGridView] = useState(true)
  const [isDocEditModalVisible, setIsDocEditModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<ScreenshotDoc>()

  const [isLoading, setIsloading] = useState(false)

  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const { handleRequestWithNotification, showNotification } = useNotification()
  const shuffleColors = (arr: string[]) => {
    let shuffled = [...arr] // 拷贝一份数组，避免改变原数组
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  const shuffledColors = shuffleColors(colors)

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
    batchUpdateScreenshotDoc([docData])

    const r = await handleRequestWithNotification(
      async () => await batchUpdateScreenshotDoc([docData]),
      {
        successField: null,
        errorField: null,
      },
    )

    if (r) {
      refreshPage()
    }
    // 可以在这里处理保存操作，例如提交到后端
    setIsDocEditModalVisible(false)
  }

  // 显示编辑 Modal
  const handleEditClick = (item: ScreenshotDoc) => {
    setEditingItem(item)
    showDocEditModal()
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
          <Button type="link" onClick={() => navigate(-1)}>
            back
          </Button>
        </Space>
        <Switch
          checkedChildren="Grid View"
          unCheckedChildren="List View"
          checked={isGridView}
          onChange={setIsGridView}
        />
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
                        </Space>
                      </div>
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

      <DocEditModal
        editData={editingItem}
        visible={isDocEditModalVisible}
        onCancel={handleDocEditModalCancel}
        onSave={handleDocEditModalSave}
      />
    </div>
  )
}

export default ScreenshotDocs
