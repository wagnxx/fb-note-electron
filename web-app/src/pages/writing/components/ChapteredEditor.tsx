import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Empty, Form, Input, List, Space, Spin, Tag, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import {
  generateWritingTitle,
  getEntryLabel,
  getHierarchyLabel,
  validateWritingData,
} from '@/features/writing/utils/helpers'
import type { WritingChapter, WritingFormData } from '@/features/writing/types'
import type { WritingType } from '@shared/types/writing'

const { Title, Text } = Typography
const { TextArea } = Input

const ChapteredEditor: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, createWriting, fetchWriting } = useWriting()

  const type = ((searchParams.get('type') as WritingType) || 'short_story') as 'short_story' | 'video_script'
  const id = searchParams.get('id')
  const targetChapterId = searchParams.get('chapterId')
  const action = searchParams.get('action')
  const entryLabel = getEntryLabel(type)
  const hierarchyLabel = getHierarchyLabel(type)
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

  return (
    <Spin spinning={loading}>
      <div className="p-5 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!mb-0">
            {id ? '编辑' : '新建'}
            {type === 'video_script' ? '视频剧本' : '短篇故事'}
          </Title>
          <Space>
            <Button onClick={() => navigate(`/tool/writing?type=${type}`)}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Space>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {validationErrors.length > 0 && (
          <Alert
            type="warning"
            className="mb-4"
            message={
              <ul className="m-0 pl-4">
                {validationErrors.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            }
          />
        )}

        <Form layout="vertical" className="flex flex-col gap-2">
          <Form.Item label="标题">
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="输入标题..."
            />
          </Form.Item>

          <Form.Item label="标签">
            <Space.Compact className="w-full">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onPressEnter={handleAddTag}
                placeholder="输入标签，按回车或点击添加..."
              />
              <Button onClick={handleAddTag}>添加</Button>
            </Space.Compact>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map(tag => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(item => item !== tag) }))}
                  >
                    #{tag}
                  </Tag>
                ))}
              </div>
            )}
          </Form.Item>

          <Form.Item label={hierarchyLabel}>
            <div className="flex gap-4" style={{ minHeight: 520 }}>
              <div className="w-56 shrink-0 border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <Text className="text-xs text-gray-500">{type === 'video_script' ? '分节列表' : '章节目录'}</Text>
                  <Button type="text" size="small" icon={<PlusOutlined />} onClick={handleAddChapter} />
                </div>
                {!formData.chapters || formData.chapters.length === 0 ? (
                  <Empty description={`暂无${entryLabel}`} className="my-4" imageStyle={{ height: 40 }} />
                ) : (
                  <List
                    size="small"
                    className="flex-1 overflow-y-auto"
                    dataSource={formData.chapters}
                    renderItem={chapter => (
                      <List.Item
                        className={`cursor-pointer px-3 !py-2 hover:bg-blue-50 transition-colors ${activeChapterId === chapter.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                        onClick={() => setActiveChapterId(chapter.id)}
                        actions={[
                          <Button
                            key="del"
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={e => {
                              e.stopPropagation()
                              handleDeleteChapter(chapter.id)
                            }}
                          />,
                        ]}
                      >
                        <span className="text-xs truncate w-full">
                          {chapter.title || `第${chapter.order + 1}${entryLabel}`}
                        </span>
                      </List.Item>
                    )}
                  />
                )}
                <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                  <Button block size="small" icon={<PlusOutlined />} onClick={handleAddChapter}>
                    新增{entryLabel}
                  </Button>
                </div>
              </div>

              <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-white flex flex-col gap-3">
                {activeChapter ? (
                  <>
                    <Input
                      value={activeChapter.title}
                      onChange={e => updateActiveChapter('title', e.target.value)}
                      placeholder={`${entryLabel}标题...`}
                      className="font-medium"
                    />
                    <TextArea
                      value={activeChapter.content}
                      onChange={e => updateActiveChapter('content', e.target.value)}
                      placeholder={type === 'video_script' ? '开始写这一节...' : '开始写这一章...'}
                      rows={20}
                    />
                  </>
                ) : (
                  <Empty description={`请选择或新建${entryLabel}`} className="mt-16" />
                )}
              </div>
            </div>
          </Form.Item>
        </Form>
      </div>
    </Spin>
  )
}

export default ChapteredEditor
