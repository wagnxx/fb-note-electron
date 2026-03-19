import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Button, Empty, Form, Input, Space, Spin, Tag, Typography } from 'antd'
import { DeleteOutlined, FolderAddOutlined, PlusOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { generateWritingTitle, getHierarchyLabel, validateWritingData } from '@/features/writing/utils/helpers'
import type { WritingChapter, WritingFormData, WritingVolume } from '@/features/writing/types'

const { Title, Text } = Typography
const { TextArea } = Input

const NovelEditor: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, createWriting, fetchWriting } = useWriting()

  const id = searchParams.get('id')
  const targetVolumeId = searchParams.get('volumeId')
  const targetChapterId = searchParams.get('chapterId')
  const action = searchParams.get('action')
  const hierarchyLabel = getHierarchyLabel('novel')
  const chapterIdCounter = useRef(0)
  const volumeIdCounter = useRef(0)

  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeVolumeId, setActiveVolumeId] = useState<string | null>(null)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [formData, setFormData] = useState<WritingFormData>({
    type: 'novel',
    title: '',
    content: '',
    tags: [],
    volumes: [],
  })

  const generateChapterId = () => `ch_${Date.now()}_${chapterIdCounter.current++}`
  const generateVolumeId = () => `vol_${Date.now()}_${volumeIdCounter.current++}`

  const buildChapter = useCallback(
    (order: number): WritingChapter => ({
      id: generateChapterId(),
      title: `第${order + 1}章`,
      content: '',
      order,
    }),
    [],
  )

  const buildVolume = useCallback(
    (order: number): WritingVolume => ({
      id: generateVolumeId(),
      title: `第${order + 1}卷`,
      order,
      chapters: [{ id: generateChapterId(), title: '第一章', content: '', order: 0 }],
    }),
    [],
  )

  const normalizeChapters = useCallback(
    (chapters: WritingChapter[] = []) => chapters.map((chapter, index) => ({ ...chapter, order: index })),
    [],
  )

  const normalizeVolumes = useCallback(
    (volumes: WritingVolume[] = []) =>
      volumes.map((volume, volumeIndex) => ({
        ...volume,
        order: volumeIndex,
        chapters: normalizeChapters(volume.chapters ?? []),
      })),
    [normalizeChapters],
  )

  const selectNovelTarget = (volumes: WritingVolume[], volumeId?: string | null, chapterId?: string | null) => {
    const nextVolume = (volumeId && volumes.find(volume => volume.id === volumeId)) || volumes[0] || null
    const nextChapter =
      (chapterId && nextVolume?.chapters.find(chapter => chapter.id === chapterId)) || nextVolume?.chapters[0] || null
    setActiveVolumeId(nextVolume?.id ?? null)
    setActiveChapterId(nextChapter?.id ?? null)
  }

  useEffect(() => {
    if (id) {
      fetchWriting('novel', id)
      return
    }

    const initialVolume = buildVolume(0)
    setFormData({
      type: 'novel',
      title: generateWritingTitle('novel'),
      content: '',
      tags: [],
      volumes: [initialVolume],
    })
    setActiveVolumeId(initialVolume.id)
    setActiveChapterId(initialVolume.chapters[0]?.id ?? null)
  }, [buildVolume, fetchWriting, id])

  useEffect(() => {
    if (!currentItem || !id || currentItem.type !== 'novel') {
      return
    }

    const currentItemWithHierarchy = currentItem as typeof currentItem & {
      volumes?: WritingVolume[]
    }

    let nextVolumes = normalizeVolumes(currentItemWithHierarchy.volumes ?? [])
    if (action === 'createVolume') {
      nextVolumes = [...nextVolumes, buildVolume(nextVolumes.length)]
    } else if (action === 'createChapter') {
      const fallbackVolume = nextVolumes.find(volume => volume.id === targetVolumeId) || nextVolumes[0]
      if (fallbackVolume) {
        const nextChapter = buildChapter(fallbackVolume.chapters.length)
        nextVolumes = nextVolumes.map(volume =>
          volume.id === fallbackVolume.id ? { ...volume, chapters: [...volume.chapters, nextChapter] } : volume,
        )
        setActiveVolumeId(fallbackVolume.id)
        setActiveChapterId(nextChapter.id)
      }
    }

    setFormData({
      id: currentItem.id,
      type: 'novel',
      title: currentItem.title,
      content: '',
      tags: currentItem.tags,
      volumes: nextVolumes,
    })

    if (action === 'createVolume') {
      const createdVolume = nextVolumes[nextVolumes.length - 1]
      setActiveVolumeId(createdVolume?.id ?? null)
      setActiveChapterId(createdVolume?.chapters[0]?.id ?? null)
    } else if (action !== 'createChapter') {
      selectNovelTarget(nextVolumes, targetVolumeId, targetChapterId)
    }
  }, [action, buildChapter, buildVolume, currentItem, id, normalizeVolumes, targetChapterId, targetVolumeId])

  const activeVolume = useMemo(
    () => formData.volumes?.find(volume => volume.id === activeVolumeId) ?? formData.volumes?.[0] ?? null,
    [activeVolumeId, formData.volumes],
  )

  const activeChapter = useMemo(
    () => activeVolume?.chapters.find(chapter => chapter.id === activeChapterId) ?? activeVolume?.chapters[0] ?? null,
    [activeChapterId, activeVolume],
  )

  const handleAddTag = () => {
    const value = tagInput.trim()
    if (!value || formData.tags.includes(value)) return
    setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }))
    setTagInput('')
  }

  const handleAddVolume = () => {
    const nextVolume = buildVolume(formData.volumes?.length ?? 0)
    setFormData(prev => ({ ...prev, volumes: [...(prev.volumes ?? []), nextVolume] }))
    setActiveVolumeId(nextVolume.id)
    setActiveChapterId(nextVolume.chapters[0]?.id ?? null)
  }

  const handleDeleteVolume = (volumeId: string) => {
    setFormData(prev => {
      const nextVolumes = normalizeVolumes((prev.volumes ?? []).filter(volume => volume.id !== volumeId))
      const nextVolume = nextVolumes[0]
      setActiveVolumeId(nextVolume?.id ?? null)
      setActiveChapterId(nextVolume?.chapters[0]?.id ?? null)
      return { ...prev, volumes: nextVolumes }
    })
  }

  const handleAddNovelChapter = (volumeId: string) => {
    setFormData(prev => {
      const nextVolumes = normalizeVolumes(
        (prev.volumes ?? []).map(volume =>
          volume.id === volumeId
            ? { ...volume, chapters: [...volume.chapters, buildChapter(volume.chapters.length)] }
            : volume,
        ),
      )
      const nextVolume = nextVolumes.find(volume => volume.id === volumeId)
      const nextChapter = nextVolume?.chapters[nextVolume.chapters.length - 1] ?? null
      setActiveVolumeId(nextVolume?.id ?? null)
      setActiveChapterId(nextChapter?.id ?? null)
      return { ...prev, volumes: nextVolumes }
    })
  }

  const handleDeleteNovelChapter = (volumeId: string, chapterId: string) => {
    setFormData(prev => {
      const nextVolumes = normalizeVolumes(
        (prev.volumes ?? []).map(volume =>
          volume.id === volumeId
            ? { ...volume, chapters: volume.chapters.filter(chapter => chapter.id !== chapterId) }
            : volume,
        ),
      )
      const nextVolume = nextVolumes.find(volume => volume.id === volumeId) ?? nextVolumes[0] ?? null
      const nextChapter = nextVolume?.chapters[0] ?? null
      setActiveVolumeId(nextVolume?.id ?? null)
      setActiveChapterId(nextChapter?.id ?? null)
      return { ...prev, volumes: nextVolumes }
    })
  }

  const updateVolumeTitle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      volumes: (prev.volumes ?? []).map(volume =>
        volume.id === activeVolumeId ? { ...volume, title: value } : volume,
      ),
    }))
  }

  const updateActiveNovelChapter = (field: keyof WritingChapter, value: string) => {
    setFormData(prev => ({
      ...prev,
      volumes: (prev.volumes ?? []).map(volume =>
        volume.id === activeVolumeId
          ? {
              ...volume,
              chapters: volume.chapters.map(chapter =>
                chapter.id === activeChapterId ? { ...chapter, [field]: value } : chapter,
              ),
            }
          : volume,
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
    navigate('/tool/writing?type=novel')
  }

  return (
    <Spin spinning={loading}>
      <div className="p-5 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!mb-0">
            {id ? '编辑小说' : '新建小说'}
          </Title>
          <Space>
            <Button onClick={() => navigate('/tool/writing?type=novel')}>取消</Button>
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
            <div className="flex gap-4" style={{ minHeight: 560 }}>
              <div className="w-72 shrink-0 border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-white">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <Text className="text-xs text-gray-500">小说目录</Text>
                  <Button type="text" size="small" icon={<FolderAddOutlined />} onClick={handleAddVolume} />
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {!formData.volumes || formData.volumes.length === 0 ? (
                    <Empty description="暂无卷" imageStyle={{ height: 40 }} className="mt-8" />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {formData.volumes.map(volume => (
                        <div
                          key={volume.id}
                          className={`rounded-lg border ${activeVolumeId === volume.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                        >
                          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                            <button
                              type="button"
                              className="text-left text-sm font-medium flex-1"
                              onClick={() =>
                                selectNovelTarget(formData.volumes ?? [], volume.id, volume.chapters[0]?.id)
                              }
                            >
                              {volume.title || `第${volume.order + 1}卷`}
                            </button>
                            <Space size={0}>
                              <Button
                                type="text"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() => handleAddNovelChapter(volume.id)}
                              />
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteVolume(volume.id)}
                              />
                            </Space>
                          </div>
                          <div className="px-2 py-1">
                            {volume.chapters.map(chapter => (
                              <div
                                key={chapter.id}
                                className={`flex items-center justify-between px-2 py-1 rounded-md ${activeChapterId === chapter.id ? 'bg-white shadow-sm' : 'hover:bg-gray-50'}`}
                              >
                                <button
                                  type="button"
                                  className="text-left text-xs flex-1 truncate"
                                  onClick={() => selectNovelTarget(formData.volumes ?? [], volume.id, chapter.id)}
                                >
                                  {chapter.title || `第${chapter.order + 1}章`}
                                </button>
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteNovelChapter(volume.id, chapter.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                  <Button block icon={<FolderAddOutlined />} onClick={handleAddVolume}>
                    新增卷
                  </Button>
                </div>
              </div>

              <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-white flex flex-col gap-3">
                {activeVolume && activeChapter ? (
                  <>
                    <Input
                      value={activeVolume.title}
                      onChange={e => updateVolumeTitle(e.target.value)}
                      placeholder="卷标题..."
                    />
                    <Input
                      value={activeChapter.title}
                      onChange={e => updateActiveNovelChapter('title', e.target.value)}
                      placeholder="章节标题..."
                    />
                    <TextArea
                      value={activeChapter.content}
                      onChange={e => updateActiveNovelChapter('content', e.target.value)}
                      placeholder="开始写这一章..."
                      rows={20}
                    />
                  </>
                ) : (
                  <Empty description="请选择卷和章节，或创建新的目录" className="mt-16" />
                )}
              </div>
            </div>
          </Form.Item>
        </Form>
      </div>
    </Spin>
  )
}

export default NovelEditor
