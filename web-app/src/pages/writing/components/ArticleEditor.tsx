/**
 * Author: You + AI(Nova)
 * Contributors: You, AI(Nova)
 */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Input, Spin, Tag } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { generateWritingTitle, validateWritingData } from '@/features/writing/utils/helpers'
import type { WritingFormData } from '@/features/writing/types'
import type { WritingType } from '@shared/types/writing'

const { TextArea } = Input

const ArticleEditor: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, createWriting, fetchWriting } = useWriting()

  const type = ((searchParams.get('type') as WritingType) || 'article') as 'article' | 'short_story' | 'video_script'
  const id = searchParams.get('id')
  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [formData, setFormData] = useState<WritingFormData>({
    type,
    title: '',
    content: '',
    tags: [],
  })

  useEffect(() => {
    if (id) {
      fetchWriting(type, id)
      return
    }

    setFormData({
      type,
      title: generateWritingTitle(type),
      content: '',
      tags: [],
    })
  }, [fetchWriting, id, type])

  useEffect(() => {
    if (!currentItem || !id) return
    const singleTypes: WritingType[] = ['article', 'short_story', 'video_script']
    if (!singleTypes.includes(currentItem.type)) return

    const chapterFallback =
      ((currentItem.chapters as Array<{ content?: string }> | undefined) ?? [])[0]?.content ?? ''

    setFormData({
      id: currentItem.id,
      type: currentItem.type as typeof type,
      title: currentItem.title,
      content: currentItem.content || chapterFallback,
      tags: currentItem.tags,
    })
  }, [currentItem, id])

  const handleAddTag = () => {
    const value = tagInput.trim()
    if (!value || formData.tags.includes(value)) return
    setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }))
    setTagInput('')
  }

  const handleSave = async () => {
    const validation = validateWritingData(formData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setValidationErrors([])
    await createWriting(formData)
    navigate(`/tool/writing?type=${type}`)
  }

  const wordCount = useMemo(() => formData.content.replace(/\s/g, '').length, [formData.content])
  const canSave = wordCount > 0

  const typeConfig = {
    article:      { titlePlaceholder: '请输入文章标题', contentPlaceholder: '开始写作...' },
    short_story:  { titlePlaceholder: '请输入短故事名称', contentPlaceholder: '· 发布超6000字，即有机会签约\n· 多使用分段或换行，更方便阅读\n· 剧情完整的内容，更容易获得点赞和关注' },
    video_script: { titlePlaceholder: '请输入视频剧本名称', contentPlaceholder: '请输入正文' },
  } as const
  const { titlePlaceholder, contentPlaceholder } = typeConfig[type] ?? typeConfig.article

  return (
    <Spin spinning={loading} className="h-full">
      <div className="flex flex-col h-screen bg-[#f5f0e8]">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#f5f0e8] border-b border-black/10 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/tool/writing?type=${type}`)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm transition-colors"
          >
            <ArrowLeftOutlined />
            <span>返回</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">已保存 | {wordCount} 字</span>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                canSave
                  ? 'bg-[#e8673c] text-white hover:bg-[#d45a30]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <SaveOutlined />
              保存
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {(error || validationErrors.length > 0) && (
          <div className="px-8 pt-3 shrink-0">
            {error && <Alert type="error" message={error} className="mb-2" />}
            {validationErrors.length > 0 && (
              <Alert
                type="warning"
                className="mb-2"
                message={
                  <ul className="m-0 pl-4">
                    {validationErrors.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                }
              />
            )}
          </div>
        )}

        {/* 编辑主体 */}
        <div className="flex-1 overflow-auto flex flex-col px-8 py-6">
          {/* 标题 */}
          <input
            className="w-full bg-transparent text-2xl font-semibold text-gray-800 outline-none border-none placeholder-gray-300 mb-3"
            placeholder={titlePlaceholder}
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />

          {/* 标签 */}
          <div className="flex flex-wrap items-center gap-1 mb-4">
            {formData.tags.map(tag => (
              <Tag
                key={tag}
                closable
                onClose={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                style={{ borderRadius: 999 }}
              >
                #{tag}
              </Tag>
            ))}
            <input
              className="text-xs text-gray-400 bg-transparent outline-none border-none w-28 placeholder-gray-300"
              placeholder="+ 添加标签，回车确认"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
            />
          </div>

          {/* 提示文字 */}
          <TextArea
            value={formData.content}
            onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder={contentPlaceholder}
            autoSize={{ minRows: 22 }}
            variant="borderless"
            style={{ background: 'transparent', fontSize: 15, lineHeight: '1.9', padding: 0, resize: 'none' }}
          />
        </div>
      </div>
    </Spin>
  )
}

export default ArticleEditor
