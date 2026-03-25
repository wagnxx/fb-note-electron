import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Empty, Space, Spin, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import type { WritingType } from '@shared/types/writing'
import { getEntryLabel } from '@/features/writing/utils/helpers'
import { useWriting } from '@/features/writing/hooks/useWriting'
import type { WritingChapter } from '@/features/writing/types'
import { useTranslation } from 'react-i18next'

const { Title, Paragraph, Text } = Typography

const ChapteredView: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, fetchWriting } = useWriting()

  const type = ((searchParams.get('type') as WritingType) || 'short_story') as 'short_story' | 'video_script'
  const id = searchParams.get('id')
  const queryChapterId = searchParams.get('chapterId')
  const entryLabel = getEntryLabel(type)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchWriting(type, id)
    }
  }, [fetchWriting, id, type])

  const chapters = useMemo(
    () => [...((currentItem?.chapters as WritingChapter[] | undefined) ?? [])].sort((a, b) => a.order - b.order),
    [currentItem?.chapters],
  )

  useEffect(() => {
    if (chapters.length === 0) {
      setActiveChapterId(null)
      return
    }

    const nextChapter =
      (queryChapterId && chapters.find(chapter => chapter.id === queryChapterId)) ||
      chapters.find(chapter => chapter.id === activeChapterId) ||
      chapters[0]
    setActiveChapterId(nextChapter?.id ?? null)
  }, [activeChapterId, chapters, queryChapterId])

  const activeChapter = useMemo(
    () => chapters.find(chapter => chapter.id === activeChapterId) ?? chapters[0] ?? null,
    [activeChapterId, chapters],
  )

  const actions = (
    <Space>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/tool/writing?type=${type}`)}>
        {t('writing.actions.back')}
      </Button>
      {id && (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => {
            const params = new URLSearchParams({ id, type })
            if (activeChapterId) params.set('chapterId', activeChapterId)
            navigate(`/tool/writing/editor?${params.toString()}`)
          }}
        >
          {t('writing.actions.edit')}
        </Button>
      )}
    </Space>
  )

  if (!id) {
    return (
      <div className="p-5">
        <Alert type="error" message={t('writing.view.missingArticleId')} className="mb-4" />
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
            {currentItem?.title ?? t('writing.common.loading')}
          </Title>
          {actions}
        </div>

        {!loading && !currentItem ? (
          <Empty description={t('writing.view.contentMissing')} />
        ) : currentItem ? (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4 text-gray-500 text-sm">
              <Text type="secondary">
                {t('writing.common.updatedAt', {
                  date: new Date(currentItem.updatedAt).toLocaleString(
                    i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US',
                  ),
                })}
              </Text>
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
                <div className="w-56 shrink-0 bg-white border border-gray-200 rounded-lg p-2 overflow-y-auto">
                  {chapters.map(chapter => (
                    <button
                      key={chapter.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        activeChapterId === chapter.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => setActiveChapterId(chapter.id)}
                    >
                      {chapter.title || `第${chapter.order + 1}${entryLabel}`}
                    </button>
                  ))}
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                  {activeChapter ? (
                    <>
                      <Title level={5} className="!mb-2">
                        {activeChapter.title || t('writing.view.untitledEntry', { entryLabel })}
                      </Title>
                      <Paragraph className="!mb-0 text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {activeChapter.content || t('writing.view.emptyEntryContent', { entryLabel })}
                      </Paragraph>
                    </>
                  ) : (
                    <Empty description={t('writing.view.emptyEntryListContent', { entryLabel })} />
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

export default ChapteredView
