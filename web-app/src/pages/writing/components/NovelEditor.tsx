/**
 * Author: Mr WANG + AI(Nova)
 * Contributors: Mr WANG, AI(Nova)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Empty, Input, Popconfirm, Spin, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  FolderAddOutlined,
  HolderOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { useNotification } from '@/hooks/useNotification'
import { generateWritingTitle, validateWritingData } from '@/features/writing/utils/helpers'
import type { WritingChapter, WritingFormData, WritingVolume } from '@/features/writing/types'

const { TextArea } = Input

const NovelEditor: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, createWriting, fetchWriting } = useWriting()
  const { message } = useNotification()

  const id = searchParams.get('id')
  const targetVolumeId = searchParams.get('volumeId')
  const targetChapterId = searchParams.get('chapterId')
  const action = searchParams.get('action')
  const chapterIdCounter = useRef(0)
  const volumeIdCounter = useRef(0)

  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [activeVolumeId, setActiveVolumeId] = useState<string | null>(null)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [collapsedVolumeIds, setCollapsedVolumeIds] = useState<string[]>([])
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
    if (nextVolume?.id) {
      setCollapsedVolumeIds(prev => prev.filter(id => id !== nextVolume.id))
    }
  }

  const toggleVolumeCollapse = (volumeId: string) => {
    setCollapsedVolumeIds(prev => (prev.includes(volumeId) ? prev.filter(id => id !== volumeId) : [...prev, volumeId]))
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

  useEffect(() => {
    const volumeIds = new Set((formData.volumes ?? []).map(volume => volume.id))
    setCollapsedVolumeIds(prev => prev.filter(id => volumeIds.has(id)))
  }, [formData.volumes])

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
    setCollapsedVolumeIds(prev => prev.filter(id => id !== nextVolume.id))
  }

  const handleDeleteVolume = (volumeId: string) => {
    setFormData(prev => {
      const nextVolumes = normalizeVolumes((prev.volumes ?? []).filter(volume => volume.id !== volumeId))
      const nextVolume = nextVolumes[0]
      setActiveVolumeId(nextVolume?.id ?? null)
      setActiveChapterId(nextVolume?.chapters[0]?.id ?? null)
      return { ...prev, volumes: nextVolumes }
    })
    setCollapsedVolumeIds(prev => prev.filter(id => id !== volumeId))
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

  const handleAddChapterToActiveVolume = () => {
    const volumes = formData.volumes ?? []
    const targetVolumeId = activeVolumeId ?? volumes[0]?.id

    if (!targetVolumeId) {
      message.warning('请先创建并选择一个卷')
      return
    }

    handleAddNovelChapter(targetVolumeId)
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleReorderChapters = (volumeId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setFormData(prev => {
      const nextVolumes = (prev.volumes ?? []).map(volume => {
        if (volume.id !== volumeId) return volume
        const oldIndex = volume.chapters.findIndex(ch => ch.id === active.id)
        const newIndex = volume.chapters.findIndex(ch => ch.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return volume
        const reordered = arrayMove(volume.chapters, oldIndex, newIndex).map((ch, i) => ({ ...ch, order: i }))
        return { ...volume, chapters: reordered }
      })
      return { ...prev, volumes: nextVolumes }
    })
  }

  // 字数统计
  const wordCount = useMemo(() => {
    const text = activeChapter?.content ?? ''
    return text.replace(/\s/g, '').length
  }, [activeChapter?.content])

  const totalWordCount = useMemo(
    () =>
      (formData.volumes ?? [])
        .flatMap(volume => volume.chapters)
        .reduce((sum, chapter) => sum + chapter.content.replace(/\s/g, '').length, 0),
    [formData.volumes],
  )
  const canSave = totalWordCount > 0

  return (
    <Spin spinning={loading} className="h-full">
      <div className="flex flex-col h-screen bg-[#f5f0e8]">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#f5f0e8] border-b border-black/10 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/tool/writing?type=novel')}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm transition-colors"
          >
            <ArrowLeftOutlined />
            <span>返回</span>
          </button>

          {/* 标题输入 */}
          <input
            className="flex-1 mx-6 bg-transparent text-center text-base font-semibold text-gray-800 outline-none border-none placeholder-gray-400"
            placeholder="请输入小说标题"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />

          {/* 右侧操作区 */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              总 {totalWordCount} 字 | 本章 {wordCount} 字
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                canSave ? 'bg-[#e8673c] text-white hover:bg-[#d45a30]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <SaveOutlined />
              保存
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

        {/* 主体区：左侧目录 + 右侧编辑 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧目录 */}
          <div className="w-56 shrink-0 border-r border-black/10 flex flex-col bg-[#ede8df] overflow-hidden">
            {/* 第一卷标签栏 + 新增卷 */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-black/10">
              <span className="text-xs font-medium text-gray-500">目录</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="向当前卷新增章节"
                  onClick={handleAddChapterToActiveVolume}
                  className="text-gray-400 hover:text-[#e8673c] transition-colors"
                >
                  <PlusOutlined />
                </button>
                <button
                  type="button"
                  title="新增卷"
                  onClick={handleAddVolume}
                  className="text-gray-400 hover:text-[#e8673c] transition-colors"
                >
                  <FolderAddOutlined />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {!formData.volumes || formData.volumes.length === 0 ? (
                <Empty description="暂无卷" imageStyle={{ height: 36 }} className="mt-6" />
              ) : (
                formData.volumes.map(volume => {
                  const volumeWordCount = (volume.chapters ?? []).reduce(
                    (sum, chapter) => sum + chapter.content.replace(/\s/g, '').length,
                    0,
                  )
                  const isCollapsed = collapsedVolumeIds.includes(volume.id)

                  return (
                    <div key={volume.id}>
                      {/* 卷标题行 */}
                      <div
                        className={`flex items-center justify-between px-3 py-1.5 group ${
                          activeVolumeId === volume.id ? 'bg-black/10' : 'hover:bg-black/5'
                        }`}
                      >
                        <button
                          type="button"
                          className="mr-1 text-[10px] text-gray-400 hover:text-gray-600"
                          onClick={() => toggleVolumeCollapse(volume.id)}
                          title={isCollapsed ? '展开卷' : '折叠卷'}
                        >
                          {isCollapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
                        </button>
                        <button
                          type="button"
                          className="text-left flex-1 min-w-0"
                          onClick={() => selectNovelTarget(formData.volumes ?? [], volume.id, volume.chapters[0]?.id)}
                        >
                          <div className="text-xs font-semibold text-gray-700 truncate">
                            {volume.title || `第${volume.order + 1}卷`}
                          </div>
                          <div className="text-[10px] text-gray-400">{volumeWordCount} 字</div>
                        </button>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Popconfirm
                            title="确认删除卷"
                            description="删除卷会同时删除该卷下所有章节，确定继续吗？"
                            okText="删除"
                            cancelText="取消"
                            onConfirm={() => handleDeleteVolume(volume.id)}
                          >
                            <button type="button" title="删除卷" className="text-gray-400 hover:text-red-500 px-1">
                              <DeleteOutlined style={{ fontSize: 10 }} />
                            </button>
                          </Popconfirm>
                        </div>
                      </div>

                      {/* 章节列表（可拖拽排序） */}
                      {!isCollapsed && (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={e => handleReorderChapters(volume.id, e)}
                        >
                          <SortableContext
                            items={volume.chapters.map(ch => ch.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {volume.chapters.map(chapter => (
                              <SortableChapterItem
                                key={chapter.id}
                                chapter={chapter}
                                isActive={activeChapterId === chapter.id}
                                onSelect={() => selectNovelTarget(formData.volumes ?? [], volume.id, chapter.id)}
                                onDelete={() => handleDeleteNovelChapter(volume.id, chapter.id)}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* 右侧编辑区 */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f0e8]">
            {activeVolume && activeChapter ? (
              <>
                {/* 卷标题行 */}
                <div className="flex items-center gap-3 px-8 pt-4 pb-1 shrink-0">
                  <span className="text-xs text-gray-400">卷：</span>
                  <input
                    className="flex-1 bg-transparent text-sm text-gray-600 outline-none border-none border-b border-black/10 pb-0.5 focus:border-[#e8673c] transition-colors"
                    value={activeVolume.title}
                    onChange={e => updateVolumeTitle(e.target.value)}
                    placeholder="卷标题..."
                  />
                </div>

                {/* 章节标题 */}
                <div className="px-8 pt-3 pb-2 shrink-0">
                  <input
                    className="w-full bg-transparent text-2xl font-semibold text-gray-800 outline-none border-none placeholder-gray-300"
                    value={activeChapter.title}
                    onChange={e => updateActiveNovelChapter('title', e.target.value)}
                    placeholder="请输入标题"
                  />
                </div>

                {/* 标签 */}
                <div className="px-8 pb-2 shrink-0">
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
                      placeholder="+ 添加标签"
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

                {/* 正文编辑区 */}
                <div className="flex-1 overflow-auto px-8 pb-8">
                  <TextArea
                    value={activeChapter.content}
                    onChange={e => updateActiveNovelChapter('content', e.target.value)}
                    placeholder="· 先写清主线冲突与人物目标，便于长篇推进
· 每章结尾保留悬念，提升追读
· 建议固定更新节奏，持续积累读者"
                    autoSize={{ minRows: 20 }}
                    variant="borderless"
                    style={{ background: 'transparent', fontSize: 15, lineHeight: '1.9', padding: 0, resize: 'none' }}
                  />
                </div>
              </>
            ) : (
              <Empty description="请选择章节，或创建新的卷和章节" className="mt-24" />
            )}
          </div>
        </div>
      </div>
    </Spin>
  )
}

// ─── 可拖拽章节条目 ────────────────────────────────────────────────────────────
interface SortableChapterItemProps {
  chapter: WritingChapter
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

const SortableChapterItem: React.FC<SortableChapterItemProps> = ({ chapter, isActive, onSelect, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const chWc = chapter.content.replace(/\s/g, '').length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between pl-3 pr-2 py-1 group cursor-pointer ${
        isActive ? 'text-[#e8673c]' : 'hover:bg-black/5 text-gray-600'
      }`}
      onClick={onSelect}
    >
      {/* 拖拽把手 */}
      <span
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing mr-1 shrink-0"
      >
        <HolderOutlined style={{ fontSize: 10 }} />
      </span>

      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-xs truncate">{chapter.title || `第${chapter.order + 1}章`}</span>
        <span className="text-[10px] text-gray-400">{chWc} 字</span>
      </div>

      <Popconfirm
        title="确认删除章节"
        description="删除后不可恢复，确定继续吗？"
        okText="删除"
        cancelText="取消"
        onConfirm={onDelete}
      >
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all shrink-0"
        >
          <DeleteOutlined style={{ fontSize: 10 }} />
        </button>
      </Popconfirm>
    </div>
  )
}

export default NovelEditor
