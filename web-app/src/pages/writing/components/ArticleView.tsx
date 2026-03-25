/**
 * Author: You + AI(Nova)
 * Contributors: You, AI(Nova)
 */
import React, { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Empty, Space, Spin, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { useNotification } from '@/hooks/useNotification'
import type { WritingType } from '@shared/types/writing'
import { useTranslation } from 'react-i18next'

const { Title, Paragraph, Text } = Typography

const ArticleView: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, fetchWriting } = useWriting()
  const { message } = useNotification()
  const id = searchParams.get('id')
  const type = ((searchParams.get('type') as WritingType) || 'article') as 'article' | 'short_story' | 'video_script'

  useEffect(() => {
    if (id) {
      fetchWriting(type, id)
    }
  }, [fetchWriting, id, type])

  const actions = (
    <Space>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/tool/writing?type=${type}`)}>
        {t('writing.actions.back')}
      </Button>
      {id && (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/tool/writing/editor?id=${id}&type=${type}`)}
        >
          {t('writing.actions.edit')}
        </Button>
      )}
    </Space>
  )

  if (!id) {
    return (
      <div className="p-5">
        <Alert type="error" message={t('writing.view.missingContentId')} className="mb-4" />
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

  const fallbackContent = ((currentItem?.chapters as Array<{ content?: string }> | undefined) ?? [])[0]?.content ?? ''
  const displayContent = currentItem?.content || fallbackContent
  const totalWordCount = displayContent.replace(/\s/g, '').length
  const scriptSections = useMemo(() => {
    if (type !== 'video_script') return []
    return displayContent
      .split(/\r?\n\s*\r?\n\s*\r?\n+/)
      .map(section => section.trim())
      .filter(Boolean)
  }, [displayContent, type])

  const handleCopySection = async (section: string, index: number) => {
    try {
      await navigator.clipboard.writeText(section)
      message.success(t('writing.view.copySectionSuccess', { index: index + 1 }))
    } catch {
      message.error(t('writing.messages.copyFailed'))
    }
  }

  return (
    <Spin spinning={loading}>
      <div className="p-5 max-w-3xl mx-auto">
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
              <Text type="secondary">{t('writing.common.totalWordCount', { count: totalWordCount })}</Text>
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
              {type === 'video_script' && scriptSections.length > 0 ? (
                <div className="space-y-6">
                  {scriptSections.map((section, index) => {
                    const sectionWordCount = section.replace(/\s/g, '').length
                    return (
                      <div
                        key={`${index}-${section.slice(0, 12)}`}
                        className="rounded-md border border-gray-200 bg-white p-3"
                      >
                        <div className="flex items-center justify-end mb-2">
                          <Space size={8}>
                            <Text type="secondary" className="text-xs">
                              {t('writing.common.wordCount', { value: sectionWordCount })}
                            </Text>
                            <Button
                              size="small"
                              type="text"
                              icon={<CopyOutlined />}
                              onClick={() => handleCopySection(section, index)}
                            >
                              {t('writing.actions.copyCurrentSection')}
                            </Button>
                          </Space>
                        </div>
                        <Paragraph className="!mb-0 text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {section}
                        </Paragraph>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Paragraph className="!mb-0 text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {displayContent || t('writing.common.emptyContentWrapped')}
                </Paragraph>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Spin>
  )
}

export default ArticleView
