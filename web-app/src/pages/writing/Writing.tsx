import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Empty, Space, Spin, Tag, Typography, Alert } from 'antd'
import { PlusOutlined, EditOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { useNotification } from '@/hooks/useNotification'
import { hasChapters, WRITING_TYPES } from '@/features/writing/utils/helpers'
import type { WritingItem, WritingType } from '@shared/types/writing'

const { Title, Text, Paragraph } = Typography

const { ipcRenderer, IPC_ACTIONS } = window.electron || ({} as any)
const invokeWriting = ipcRenderer.invoke as <T>(channel: string, ...args: any[]) => Promise<T>

const WritingPage: React.FC = () => {
  const { message } = useNotification()
  const navigate = useNavigate()
  const { items, loading, error, fetchWritings, initializeDirectories } = useWriting()
  const [selectedType, setSelectedType] = useState<WritingType>('article')
  const [copyLoadingId, setCopyLoadingId] = useState<string | null>(null)

  useEffect(() => {
    initializeDirectories()
  }, [initializeDirectories])

  useEffect(() => {
    fetchWritings(selectedType)
  }, [selectedType, fetchWritings])

  const handleCreateNew = () => navigate(`/tool/writing/editor?type=${selectedType}`)
  const handleView = (id: string) => navigate(`/tool/writing/view?id=${id}&type=${selectedType}`)
  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/tool/writing/editor?id=${id}&type=${selectedType}`)
  }

  const handleCopy = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCopyLoadingId(id)
    try {
      const writing = await invokeWriting<WritingItem | null>(IPC_ACTIONS.WRITING_LOAD, selectedType, id)
      if (!writing) return
      const chapterSummary =
        hasChapters(writing.type) && writing.chapters && writing.chapters.length > 0
          ? writing.chapters
              .sort((a, b) => a.order - b.order)[0]
              ?.content.replace(/\s+/g, ' ')
              .trim()
              .slice(0, 120) || ''
          : ''
      const desc =
        (typeof writing.metadata?.description === 'string' && writing.metadata.description.trim()) ||
        chapterSummary ||
        writing.content.replace(/\s+/g, ' ').trim().slice(0, 120) ||
        '暂无描述'
      await navigator.clipboard.writeText(`标题：${writing.title}\n描述：${desc}`)
      message.success('已复制')
    } catch {
      message.error('复制失败')
    } finally {
      setCopyLoadingId(null)
    }
  }

  const selectedLabel = WRITING_TYPES.find(t => t.value === selectedType)?.label

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="!mb-0">
          写作管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
          新建{selectedLabel}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* 类型选择 */}
        <div className="flex flex-col gap-3 w-52 shrink-0">
          {WRITING_TYPES.map(type => (
            <div
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-sm">{type.label}</div>
              <div className="text-xs text-gray-500 mt-1">{type.description}</div>
            </div>
          ))}
        </div>

        {/* 列表区 */}
        <div className="flex-1">
          {error && <Alert type="error" message={error} className="mb-4" />}

          <Spin spinning={loading}>
            {items.length === 0 && !loading ? (
              <Empty description={`还没有${selectedLabel}`}>
                <Button type="primary" onClick={handleCreateNew}>
                  创建第一个
                </Button>
              </Empty>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {items.map(item => (
                  <Card
                    key={item.id}
                    hoverable
                    onClick={() => handleView(item.id)}
                    actions={[
                      <Button
                        key="copy"
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        loading={copyLoadingId === item.id}
                        onClick={e => handleCopy(item.id, e)}
                      >
                        复制
                      </Button>,
                      <Button
                        key="view"
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={e => {
                          e.stopPropagation()
                          handleView(item.id)
                        }}
                      >
                        查看
                      </Button>,
                      <Button
                        key="edit"
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={e => handleEdit(item.id, e)}
                      >
                        编辑
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={<span className="hover:text-blue-500 transition-colors">{item.title}</span>}
                      description={
                        <Paragraph ellipsis={{ rows: 2 }} className="!mb-2 !text-gray-500">
                          {item.description || '暂无描述'}
                        </Paragraph>
                      }
                    />
                    <div className="flex justify-between items-center mt-3">
                      <Text type="secondary" className="text-xs">
                        {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                      </Text>
                      <Space size={4}>
                        {item.tags.slice(0, 3).map(tag => (
                          <Tag key={tag} color="blue" className="text-xs">
                            #{tag}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Spin>
        </div>
      </div>
    </div>
  )
}

export default WritingPage
