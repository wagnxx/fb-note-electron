import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Empty, Space, Spin, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import type { WritingVolume } from '@/features/writing/types'

const { Title, Paragraph, Text } = Typography

const NovelView: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, fetchWriting } = useWriting()

  const id = searchParams.get('id')
  const queryVolumeId = searchParams.get('volumeId')
  const queryChapterId = searchParams.get('chapterId')
  const [activeVolumeId, setActiveVolumeId] = useState<string | null>(null)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchWriting('novel', id)
    }
  }, [fetchWriting, id])

  const currentItemWithHierarchy = currentItem as
    | (typeof currentItem & {
        volumes?: WritingVolume[]
      })
    | null

  const sortedVolumes = useMemo(
    () => [...(currentItemWithHierarchy?.volumes ?? [])].sort((a, b) => a.order - b.order),
    [currentItemWithHierarchy?.volumes],
  )

  useEffect(() => {
    if (sortedVolumes.length === 0) return

    const initialVolume =
      (queryVolumeId && sortedVolumes.find(volume => volume.id === queryVolumeId)) ||
      sortedVolumes.find(volume => volume.id === activeVolumeId) ||
      sortedVolumes[0]

    const initialChapter =
      (queryChapterId && initialVolume?.chapters.find(chapter => chapter.id === queryChapterId)) ||
      initialVolume?.chapters.find(chapter => chapter.id === activeChapterId) ||
      initialVolume?.chapters[0] ||
      null

    setActiveVolumeId(initialVolume?.id ?? null)
    setActiveChapterId(initialChapter?.id ?? null)
  }, [activeChapterId, activeVolumeId, queryChapterId, queryVolumeId, sortedVolumes])

  const activeVolume = useMemo(
    () => sortedVolumes.find(volume => volume.id === activeVolumeId) ?? sortedVolumes[0] ?? null,
    [activeVolumeId, sortedVolumes],
  )

  const activeChapter = useMemo(
    () => activeVolume?.chapters.find(chapter => chapter.id === activeChapterId) ?? activeVolume?.chapters[0] ?? null,
    [activeChapterId, activeVolume],
  )

  const actions = (
    <Space>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tool/writing?type=novel')}>
        返回
      </Button>
      {id && (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => {
            const params = new URLSearchParams({ id, type: 'novel' })
            if (activeVolumeId) params.set('volumeId', activeVolumeId)
            if (activeChapterId) params.set('chapterId', activeChapterId)
            navigate(`/tool/writing/editor?${params.toString()}`)
          }}
        >
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
      <div className="p-5 max-w-5xl mx-auto">
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
              <div className="flex gap-4" style={{ minHeight: 420 }}>
                <div className="w-64 shrink-0 bg-white border border-gray-200 rounded-lg p-2 overflow-y-auto">
                  {sortedVolumes.map(volume => (
                    <div key={volume.id} className="mb-2">
                      <div className="px-2 py-1 text-sm font-semibold text-gray-700">
                        {volume.title || `第${volume.order + 1}卷`}
                      </div>
                      <div className="space-y-1">
                        {[...(volume.chapters ?? [])]
                          .sort((a, b) => a.order - b.order)
                          .map(chapter => (
                            <button
                              key={chapter.id}
                              type="button"
                              className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                                activeChapterId === chapter.id
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                              onClick={() => {
                                setActiveVolumeId(volume.id)
                                setActiveChapterId(chapter.id)
                              }}
                            >
                              {chapter.title || `第${chapter.order + 1}章`}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                  {activeChapter ? (
                    <>
                      <Title level={5} className="!mb-2">
                        {activeChapter.title || '未命名章节'}
                      </Title>
                      <Paragraph className="!mb-0 text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {activeChapter.content || '（本章暂无内容）'}
                      </Paragraph>
                    </>
                  ) : (
                    <Empty description="暂无章节内容" />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Spin>
  )
}

export default NovelView
