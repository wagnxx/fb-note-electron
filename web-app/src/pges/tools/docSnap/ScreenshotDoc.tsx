import { useAuth } from '@/context/AuthContext'
import { getAllScreenshotDoc } from '@/service/screenshotDoc'
import React, { useEffect, useState } from 'react'
import { Card, List, Image, Switch, Typography, Button, Space } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Meta } = Card
const { Title, Text } = Typography

interface ScreenshotDoc {
  id: string
  docName: string
  screenshots: string[]
}

const ScreenshotDocs: React.FC = () => {
  const [data, setData] = useState<ScreenshotDoc[]>([])

  const [isGridView, setIsGridView] = useState(true)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) return
    getAllScreenshotDoc().then(data => {
      if (data) {
        setData(
          data.map(item => ({
            id: item.id,
            docName: item.docName,
            screenshots: item.screenshots,
          })),
        )
      }
    })
  }, [isAuthenticated])

  return (
    <div className="p-5 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-5">
        <Space>
          <Title level={2}>Screenshot Documents</Title>
          <Button type="link" onClick={() => navigate('/tool/docSnap/multi')}>
            Create
          </Button>
        </Space>
        <Switch
          checkedChildren="Grid View"
          unCheckedChildren="List View"
          checked={isGridView}
          onChange={setIsGridView}
        />
      </div>

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
                  doc.screenshots.length
                    ? `${doc.screenshots.length} screenshot(s) available`
                    : 'No screenshots available'
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
    </div>
  )
}

export default ScreenshotDocs
