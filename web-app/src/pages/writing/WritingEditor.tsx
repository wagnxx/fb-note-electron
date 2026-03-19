import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Form, Input, Space, Spin, Tag, Typography, List, Empty } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { hasChapters, validateWritingData, generateWritingTitle } from '@/features/writing/utils/helpers'
import type { WritingFormData } from '@/features/writing/types'
import type { WritingChapter, WritingType } from '@shared/types/writing'

const { Title } = Typography
const { TextArea } = Input

const WritingEditorPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, createWriting, fetchWriting } = useWriting()

  const [formData, setFormData] = useState<WritingFormData>({
    type: 'article',
    title: '',
    content: '',
    tags: [],
  })
  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const chapterIdCounter = useRef(0)

  const type = (searchParams.get('type') as WritingType) || 'article'
  const id = searchParams.get('id')
  const isChaptered = hasChapters(type)

  const generateChapterId = () => `ch_${Date.now()}_${chapterIdCounter.current++}`

  useEffect(() => {
    if (id) {
      fetchWriting(type, id)
    } else {
      if (isChaptered) {
        const firstChapterId = generateChapterId()
        setFormData({
          type,
          title: generateWritingTitle(type),
          content: '',
          tags: [],
          chapters: [{ id: firstChapterId, title: '第一章', content: '', order: 0 }],
        })
        setActiveChapterId(firstChapterId)
      } else {
        setFormData({ type, title: generateWritingTitle(type), content: '', tags: [] })
      }
    }
  }, [id, type, isChaptered, fetchWriting])

  useEffect(() => {
    if (currentItem && id) {
      const chapters =
        currentItem.chapters && currentItem.chapters.length > 0
          ? [...currentItem.chapters].sort((a, b) => a.order - b.order)
          : undefined
      setFormData({
        type: currentItem.type,
        title: currentItem.title,
        content: currentItem.content,
        tags: currentItem.tags,
        chapters,
      })
      if (chapters && chapters.length > 0) {
        setActiveChapterId(chapters[0].id)
      }
    }
  }, [currentItem, id])

  const handleSave = async () => {
    const validation = validateWritingData(formData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    setValidationErrors([])
    await createWriting(formData)
    navigate('/tool/writing')
  }

  const handleAddTag = () => {
    const val = tagInput.trim()
    if (val && !formData.tags.includes(val)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }))
      setTagInput('')
    }
  }

  // 章节操作
  const handleAddChapter = () => {
    const newId = generateChapterId()
    const order = formData.chapters?.length ?? 0
    const newChapter: WritingChapter = {
      id: newId,
      title: `第${order + 1}章`,
      content: '',
      order,
    }
    setFormData(prev => ({ ...prev, chapters: [...(prev.chapters ?? []), newChapter] }))
    setActiveChapterId(newId)
  }

  const handleDeleteChapter = (chapterId: string) => {
    setFormData(prev => {
      const filtered = (prev.chapters ?? []).filter(c => c.id !== chapterId)
      const reordered = filtered.map((c, i) => ({ ...c, order: i }))
      return { ...prev, chapters: reordered }
    })
    setActiveChapterId(prev => {
      if (prev !== chapterId) return prev
      return formData.chapters?.find(c => c.id !== chapterId)?.id ?? null
    })
  }

  const updateActiveChapter = (field: keyof WritingChapter, value: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: (prev.chapters ?? []).map(c => (c.id === activeChapterId ? { ...c, [field]: value } : c)),
    }))
  }

  const activeChapter = formData.chapters?.find(c => c.id === activeChapterId)

  return (
    <Spin spinning={loading}>
      <div className="p-5 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!mb-0">
            {id ? '编辑' : '新建'}写作
          </Title>
          <Space>
            <Button onClick={() => navigate('/tool/writing')}>取消</Button>
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
                {validationErrors.map((e, i) => (
                  <li key={i}>{e}</li>
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
                    onClose={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                  >
                    #{tag}
                  </Tag>
                ))}
              </div>
            )}
          </Form.Item>

          {isChaptered ? (
            <Form.Item label="章节">
              <div className="flex gap-3" style={{ minHeight: 480 }}>
                <div className="w-44 shrink-0 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-xs text-gray-500 font-medium">章节列表</span>
                    <Button type="text" size="small" icon={<PlusOutlined />} onClick={handleAddChapter} />
                  </div>
                  {!formData.chapters || formData.chapters.length === 0 ? (
                    <Empty description="暂无章节" className="my-4" imageStyle={{ height: 40 }} />
                  ) : (
                    <List
                      size="small"
                      className="flex-1 overflow-y-auto"
                      dataSource={formData.chapters}
                      renderItem={chapter => (
                        <List.Item
                          className={`cursor-pointer px-3 !py-2 hover:bg-blue-50 transition-colors ${
                            activeChapterId === chapter.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                          }`}
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
                          <span className="text-xs truncate w-full">{chapter.title || `第${chapter.order + 1}章`}</span>
                        </List.Item>
                      )}
                    />
                  )}
                  <div className="px-3 py-2 border-t border-gray-200">
                    <Button block size="small" icon={<PlusOutlined />} onClick={handleAddChapter}>
                      新增章节
                    </Button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  {activeChapter ? (
                    <>
                      <Input
                        value={activeChapter.title}
                        onChange={e => updateActiveChapter('title', e.target.value)}
                        placeholder="章节标题..."
                        className="font-medium"
                      />
                      <TextArea
                        value={activeChapter.content}
                        onChange={e => updateActiveChapter('content', e.target.value)}
                        placeholder="开始写这一章..."
                        style={{ flex: 1, resize: 'none' }}
                        rows={18}
                      />
                    </>
                  ) : (
                    <Empty description="请选择或新建章节" className="mt-16" />
                  )}
                </div>
              </div>
            </Form.Item>
          ) : (
            <Form.Item label="内容">
              <TextArea
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="开始写作..."
                rows={20}
              />
            </Form.Item>
          )}
        </Form>
      </div>
    </Spin>
  )
}

export default WritingEditorPage
