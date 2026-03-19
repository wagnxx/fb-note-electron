import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Empty, Space, Spin, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import type { WritingType } from '@shared/types/writing'
import { hasChapters } from '@/features/writing/utils/helpers'
import { useWriting } from '@/features/writing/hooks/useWriting'

const { Title, Paragraph, Text } = Typography

const WritingView: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, fetchWriting } = useWriting()

  const type = (searchParams.get('type') as WritingType) || 'article'
  const id = searchParams.get('id')
  const isChaptered = hasChapters(type)

  useEffect(() => {
    if (id) {
      fetchWriting(type, id)
    }
  }, [id, type, fetchWriting])

  const handleBack = () => navigate('/tool/writing')
  const handleEdit = () => id && navigate(`/tool/writing/editor?id=${id}&type=${type}`)

  const actions = (
    <Space>
      <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
        返回
      </Button>
      {id && (
        <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
          编辑
        </Button>
      )}
    </Space>
  )

  if (!id) {
    return (
      <div className="p-5">
        <Alert type="error" message="缺少文章 ID，无法查看内容" className="mb-4" />
        {actions}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5">
        <Alert type="error" message={error} className="mb-4" />
        {actions}
      </div>
    )
  }

  return (
    <Spin spinning={loading}>
      <div className="p-5 max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <Title level={2} className="!mb-0 flex-1 mr-4">
            {currentItem?.title ?? '加载中...'}
          </Title>
          {actions}
        </div>

        {!loading && !currentItem ? (
          <Empty description="内容不存在或已被删除" />
        ) : currentItem ? (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4 text-gray-500 text-sm">
              <Text type="secondary">更新时间：{new Date(currentItem.updatedAt).toLocaleString('zh-CN')}</Text>
              {currentItem.tags.length > 0 && (
                <Space size={4} wrap>
                  {currentItem.tags.map(tag => (
                    <Tag key={tag} color="blue">
                      #{tag}
                    </Tag>
                  ))}
                </Space>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
              {isChaptered && currentItem.chapters && currentItem.chapters.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {[...currentItem.chapters]
                    .sort((a, b) => a.order - b.order)
                    .map(chapter => (
                      <div key={chapter.id} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                        <Title level={5} className="!mb-2">
                          {chapter.title || `第${chapter.order + 1}章`}
                        </Title>
                        <Paragraph className="!mb-0 text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {chapter.content || '（本章暂无内容）'}
                        </Paragraph>
                      </div>
                    ))}
                </div>
              ) : (
                <Paragraph className="!mb-0 text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {currentItem.content}
                </Paragraph>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Spin>
  )
}

export default WritingView
