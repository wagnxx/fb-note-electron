/**
 * Author: You + AI(Nova)
 * Contributors: You, AI(Nova)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import countCharacters from '@/features/writing/utils/countCharacters'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Empty, Input, Spin, Tag } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import {
  generateWritingTitle,
  getEntryLabel,
  getWritingTypeLabel,
  validateWritingData,
} from '@/features/writing/utils/helpers'
import type { WritingChapter, WritingFormData } from '@/features/writing/types'
import type { WritingType } from '@shared/types/writing'
import { useTranslation } from 'react-i18next'

const { TextArea } = Input

const ChapteredEditor: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, createWriting, fetchWriting } = useWriting()

  const type = ((searchParams.get('type') as WritingType) || 'short_story') as 'short_story' | 'video_script'
  const id = searchParams.get('id')
  const targetChapterId = searchParams.get('chapterId')
  const action = searchParams.get('action')
  const entryLabel = getEntryLabel(type)
  const chapterIdCounter = useRef(0)

  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [formData, setFormData] = useState<WritingFormData>({
    type,
    title: '',
    content: '',
    tags: [],
    chapters: [],
  })

  const generateChapterId = () => `ch_${Date.now()}_${chapterIdCounter.current++}`
  const buildChapter = useCallback(
    (order: number): WritingChapter => ({
      id: generateChapterId(),
      title: `第${order + 1}${entryLabel}`,
      content: '',
      order,
    }),
    [entryLabel],
  )

  const normalizeChapters = useCallback(
    (chapters: WritingChapter[] = []) => chapters.map((chapter, index) => ({ ...chapter, order: index })),
    [],
  )

  useEffect(() => {
    if (id) {
      fetchWriting(type, id)
      return
    }

    const initialChapter = buildChapter(0)
    setFormData({
      type,
      title: generateWritingTitle(type),
      content: '',
      tags: [],
      chapters: [initialChapter],
    })
    setActiveChapterId(initialChapter.id)
  }, [buildChapter, fetchWriting, id, type])

  useEffect(() => {
    if (!currentItem || !id || currentItem.type !== type) {
      return
    }

    let nextChapters = normalizeChapters((currentItem.chapters as WritingChapter[] | undefined) ?? [])
    if (action === 'createChapter') {
      const nextChapter = buildChapter(nextChapters.length)
      nextChapters = [...nextChapters, nextChapter]
      setActiveChapterId(nextChapter.id)
    }

    setFormData({
      id: currentItem.id,
      type,
      title: currentItem.title,
      content: '',
      tags: currentItem.tags,
      chapters: nextChapters,
    })

    if (action !== 'createChapter') {
      const nextChapter =
        (targetChapterId && nextChapters.find(chapter => chapter.id === targetChapterId)) || nextChapters[0] || null
      setActiveChapterId(nextChapter?.id ?? null)
    }
  }, [action, buildChapter, currentItem, id, normalizeChapters, targetChapterId, type])

  const activeChapter = useMemo(
    () => formData.chapters?.find(chapter => chapter.id === activeChapterId) ?? formData.chapters?.[0] ?? null,
    [activeChapterId, formData.chapters],
  )

  const handleAddTag = () => {
    const value = tagInput.trim()
    if (!value || formData.tags.includes(value)) return
    setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }))
    setTagInput('')
  }

  const handleAddChapter = () => {
    const nextChapter = buildChapter(formData.chapters?.length ?? 0)
    setFormData(prev => ({ ...prev, chapters: [...(prev.chapters ?? []), nextChapter] }))
    setActiveChapterId(nextChapter.id)
  }

  const handleDeleteChapter = (chapterId: string) => {
    setFormData(prev => {
      const nextChapters = normalizeChapters((prev.chapters ?? []).filter(chapter => chapter.id !== chapterId))
      setActiveChapterId(nextChapters[0]?.id ?? null)
      return { ...prev, chapters: nextChapters }
    })
  }

  const updateActiveChapter = (field: keyof WritingChapter, value: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: (prev.chapters ?? []).map(chapter =>
        chapter.id === activeChapterId ? { ...chapter, [field]: value } : chapter,
      ),
    }))
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

  // 字数统计
  const wordCount = useMemo(() => {
    const text = activeChapter?.content ?? ''
    return countCharacters(text)
  }, [activeChapter?.content])

  const totalWordCount = useMemo(
    () => (formData.chapters ?? []).reduce((sum, chapter) => sum + countCharacters(chapter.content), 0),
    [formData.chapters],
  )
  const canSave = totalWordCount > 0

  const typeLabel = getWritingTypeLabel(type)

  return (
    <Spin spinning={loading} className="h-full">
      <div className="flex flex-col h-screen bg-[#f5f0e8]">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#f5f0e8] border-b border-black/10 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/tool/writing?type=${type}`)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm transition-colors"
          >
            <ArrowLeftOutlined />
            <span>{t('writing.actions.back')}</span>
          </button>

          <input
            className="flex-1 mx-6 bg-transparent text-center text-base font-semibold text-gray-800 outline-none border-none placeholder-gray-400"
            placeholder={t('writing.editor.typeNamePlaceholder', { typeLabel })}
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{t('writing.editor.savedWordCount', { count: wordCount })}</span>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                canSave ? 'bg-[#e8673c] text-white hover:bg-[#d45a30]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <SaveOutlined />
              {t('writing.actions.save')}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {(error || validationErrors.length > 0) && (
          <div className="px-4 pt-2 shrink-0">
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

        {/* 主体：左侧目录 + 右侧编辑 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧章节目录 */}
          <div className="w-52 shrink-0 border-r border-black/10 flex flex-col bg-[#ede8df] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-black/10">
              <span className="text-xs font-medium text-gray-500">
                {type === 'video_script' ? t('writing.editor.sectionList') : t('writing.editor.chapterCatalog')}
              </span>
              <button
                type="button"
                title={t('writing.actions.addEntry', { entryLabel })}
                onClick={handleAddChapter}
                className="text-gray-400 hover:text-[#e8673c] transition-colors"
              >
                <PlusOutlined />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {!formData.chapters || formData.chapters.length === 0 ? (
                <Empty
                  description={t('writing.editor.emptyEntry', { entryLabel })}
                  imageStyle={{ height: 36 }}
                  className="mt-6"
                />
              ) : (
                formData.chapters.map(chapter => (
                  <div
                    key={chapter.id}
                    className={`flex items-center justify-between px-3 py-2 group cursor-pointer ${
                      activeChapterId === chapter.id ? 'bg-white/60 text-[#e8673c]' : 'hover:bg-black/5 text-gray-600'
                    }`}
                    onClick={() => setActiveChapterId(chapter.id)}
                  >
                    <span className="text-xs truncate flex-1">
                      {chapter.title || `第${chapter.order + 1}${entryLabel}`}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteChapter(chapter.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <DeleteOutlined style={{ fontSize: 10 }} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleAddChapter}
              className="shrink-0 flex items-center justify-center gap-1 py-2 border-t border-black/10 text-xs text-gray-500 hover:text-[#e8673c] hover:bg-black/5 transition-colors"
            >
              <PlusOutlined /> {t('writing.actions.addEntry', { entryLabel })}
            </button>
          </div>

          {/* 右侧编辑区 */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f0e8]">
            {activeChapter ? (
              <>
                {/* 章节标题 */}
                <div className="px-8 pt-6 pb-2 shrink-0">
                  <input
                    className="w-full bg-transparent text-2xl font-semibold text-gray-800 outline-none border-none placeholder-gray-300"
                    value={activeChapter.title}
                    onChange={e => updateActiveChapter('title', e.target.value)}
                    placeholder={t('writing.editor.inputTitle')}
                  />
                </div>

                {/* 标签 */}
                <div className="px-8 pb-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-1">
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
                      className="text-xs text-gray-400 bg-transparent outline-none border-none w-24 placeholder-gray-300"
                      placeholder={t('writing.editor.addTagShort')}
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 正文 */}
                <div className="flex-1 overflow-auto px-8 pb-8">
                  <TextArea
                    value={activeChapter.content}
                    onChange={e => updateActiveChapter('content', e.target.value)}
                    placeholder={
                      type === 'video_script'
                        ? t('writing.editor.videoScript.contentPlaceholder')
                        : t('writing.editor.shortStory.contentPlaceholderSimple')
                    }
                    autoSize={{ minRows: 20 }}
                    variant="borderless"
                    style={{ background: 'transparent', fontSize: 15, lineHeight: '1.9', padding: 0, resize: 'none' }}
                  />
                </div>
              </>
            ) : (
              <Empty description={t('writing.editor.selectOrCreateEntry', { entryLabel })} className="mt-24" />
            )}
          </div>
        </div>
      </div>
    </Spin>
  )
}

export default ChapteredEditor
