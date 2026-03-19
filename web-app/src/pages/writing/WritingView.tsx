import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Empty, Space, Spin, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import type { WritingType } from '@shared/types/writing'
import { hasChapters, hasVolumes } from '@/features/writing/utils/helpers'
import { useWriting } from '@/features/writing/hooks/useWriting'
import type { WritingChapter, WritingVolume } from '@/features/writing/types'

const { Title, Paragraph, Text } = Typography

const WritingView: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, fetchWriting } = useWriting()

  const type = (searchParams.get('type') as WritingType) || 'article'
  const id = searchParams.get('id')
  const queryVolumeId = searchParams.get('volumeId')
  const queryChapterId = searchParams.get('chapterId')
  const isNovel = hasVolumes(type)
  const isChaptered = hasChapters(type)

  const [activeVolumeId, setActiveVolumeId] = useState<string | null>(null)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchWriting(type, id)
    }
  }, [id, type, fetchWriting])

  const currentItemWithHierarchy = currentItem as
    | (typeof currentItem & {
        volumes?: WritingVolume[]
        chapters?: WritingChapter[]
      })
    | null

  const sortedVolumes = useMemo(
    () => [...(currentItemWithHierarchy?.volumes ?? [])].sort((a, b) => a.order - b.order),
    [currentItemWithHierarchy?.volumes],
  )

  const sortedChapters = useMemo(
    () => [...(currentItemWithHierarchy?.chapters ?? [])].sort((a, b) => a.order - b.order),
    [currentItemWithHierarchy?.chapters],
  )

  useEffect(() => {
    if (!isNovel || sortedVolumes.length === 0) return

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
  }, [isNovel, sortedVolumes, queryVolumeId, queryChapterId, activeVolumeId, activeChapterId])

  useEffect(() => {
    if (isNovel) return
    if (sortedChapters.length === 0) {
      setActiveChapterId(null)
      return
    }

    const initialChapter =
      (queryChapterId && sortedChapters.find(chapter => chapter.id === queryChapterId)) ||
      sortedChapters.find(chapter => chapter.id === activeChapterId) ||
      sortedChapters[0]
    setActiveChapterId(initialChapter?.id ?? null)
  }, [isNovel, sortedChapters, queryChapterId, activeChapterId])

  const activeVolume = useMemo(
    () => sortedVolumes.find(volume => volume.id === activeVolumeId) ?? sortedVolumes[0] ?? null,
    [sortedVolumes, activeVolumeId],
  )

  const activeChapter = useMemo(() => {
    if (isNovel) {
      return activeVolume?.chapters.find(chapter => chapter.id === activeChapterId) || activeVolume?.chapters[0] || null
    }
    return sortedChapters.find(chapter => chapter.id === activeChapterId) || sortedChapters[0] || null
  }, [isNovel, activeVolume, sortedChapters, activeChapterId])

  const handleBack = () => navigate(`/tool/writing?type=${type}`)
  const handleEdit = () => {
    if (!id) return
    const params = new URLSearchParams({ id, type })
    if (isNovel && activeVolumeId) params.set('volumeId', activeVolumeId)
    if (activeChapterId) params.set('chapterId', activeChapterId)
    navigate(`/tool/writing/editor?${params.toString()}`)
  }

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
              {isNovel && sortedVolumes.length > 0 ? (
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
              ) : isChaptered && sortedChapters.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {sortedChapters.map(chapter => (
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
