/**
 * Author: You + AI(Nova)
 * Contributors: You, AI(Nova)
 */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Empty, Spin, Tag } from 'antd'
import { ArrowLeftOutlined, CaretDownOutlined, CaretRightOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { useNotification } from '@/hooks/useNotification'
import type { WritingVolume } from '@/features/writing/types'

const NovelView: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentItem, loading, error, fetchWriting } = useWriting()
  const { message } = useNotification()

  const id = searchParams.get('id')
  const queryVolumeId = searchParams.get('volumeId')
  const queryChapterId = searchParams.get('chapterId')
  const [activeVolumeId, setActiveVolumeId] = useState<string | null>(null)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)
  const [collapsedVolumeIds, setCollapsedVolumeIds] = useState<string[]>([])

  useEffect(() => {
    if (id) fetchWriting('novel', id)
  }, [fetchWriting, id])

  const currentItemWithHierarchy = currentItem as
    | (typeof currentItem & { volumes?: WritingVolume[] })
    | null

  const sortedVolumes = useMemo(
    () => [...(currentItemWithHierarchy?.volumes ?? [])].sort((a, b) => a.order - b.order),
    [currentItemWithHierarchy?.volumes],
  )

  const toggleVolumeCollapse = (volumeId: string) => {
    setCollapsedVolumeIds(prev =>
      prev.includes(volumeId) ? prev.filter(id => id !== volumeId) : [...prev, volumeId],
    )
  }

  useEffect(() => {
    const volumeIds = new Set(sortedVolumes.map(volume => volume.id))
    setCollapsedVolumeIds(prev => prev.filter(id => volumeIds.has(id)))
  }, [sortedVolumes])

  // 总字数
  const totalWordCount = useMemo(
    () => sortedVolumes.flatMap(v => v.chapters).reduce((sum, ch) => sum + ch.content.replace(/\s/g, '').length, 0),
    [sortedVolumes],
  )

  useEffect(() => {
    if (sortedVolumes.length === 0) return
    const initialVolume =
      (queryVolumeId && sortedVolumes.find(v => v.id === queryVolumeId)) ||
      sortedVolumes.find(v => v.id === activeVolumeId) ||
      sortedVolumes[0]
    const initialChapter =
      (queryChapterId && initialVolume?.chapters.find(ch => ch.id === queryChapterId)) ||
      initialVolume?.chapters.find(ch => ch.id === activeChapterId) ||
      initialVolume?.chapters[0] ||
      null
    setActiveVolumeId(initialVolume?.id ?? null)
    setActiveChapterId(initialChapter?.id ?? null)
  }, [activeChapterId, activeVolumeId, queryChapterId, queryVolumeId, sortedVolumes])

  const activeVolume = useMemo(
    () => sortedVolumes.find(v => v.id === activeVolumeId) ?? sortedVolumes[0] ?? null,
    [activeVolumeId, sortedVolumes],
  )

  const activeChapter = useMemo(
    () => activeVolume?.chapters.find(ch => ch.id === activeChapterId) ?? activeVolume?.chapters[0] ?? null,
    [activeChapterId, activeVolume],
  )

  const activeChapterWordCount = useMemo(
    () => (activeChapter?.content ?? '').replace(/\s/g, '').length,
    [activeChapter?.content],
  )

  const handleCopyChapter = async (chapterId: string) => {
    const chapter = sortedVolumes.flatMap(v => v.chapters).find(ch => ch.id === chapterId)
    if (!chapter) return
    try {
      await navigator.clipboard.writeText(`${chapter.title}\n\n${chapter.content}`)
      message.success('已复制')
    } catch {
      message.error('复制失败')
    }
  }

  if (!id) {
    return (
      <div className="p-5">
        <Alert type="error" message="缺少文章 ID，无法查看内容" className="mb-4" />
        <button onClick={() => navigate('/tool/writing?type=novel')} className="text-sm text-gray-500">返回</button>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="p-5">
        <Alert type="error" message={error} className="mb-4" />
        <button onClick={() => navigate('/tool/writing?type=novel')} className="text-sm text-gray-500">返回</button>
      </div>
    )
  }

  return (
    <Spin spinning={loading}>
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

          {/* 标题 + 总字数 */}
          <div className="flex flex-col items-center">
            <span className="text-base font-semibold text-gray-800">{currentItem?.title ?? '加载中...'}</span>
            <span className="text-xs text-gray-400">
              {totalWordCount >= 10000
                ? `${(totalWordCount / 10000).toFixed(1)}万字`
                : `${totalWordCount}字`}
            </span>
          </div>

          {/* 编辑按钮 */}
          {id && (
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({ id, type: 'novel' })
                if (activeVolumeId) params.set('volumeId', activeVolumeId)
                if (activeChapterId) params.set('chapterId', activeChapterId)
                navigate(`/tool/writing/editor?${params.toString()}`)
              }}
              className="flex items-center gap-1 px-4 py-1.5 bg-[#e8673c] text-white rounded-full text-sm font-medium hover:bg-[#d45a30] transition-colors"
            >
              <EditOutlined />
              编辑
            </button>
          )}
        </div>

        {/* 标签行 */}
        {currentItem?.tags && currentItem.tags.length > 0 && (
          <div className="flex items-center gap-1 px-4 py-1.5 shrink-0 border-b border-black/5 flex-wrap">
            {currentItem.tags.map(tag => (
              <Tag key={tag} style={{ borderRadius: 999 }}>#{tag}</Tag>
            ))}
          </div>
        )}

        {/* 主体：左侧目录 + 右侧正文 */}
        {!loading && !currentItem ? (
          <Empty description="内容不存在或已被删除" className="mt-24" />
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧目录 */}
            <div className="w-56 shrink-0 border-r border-black/10 flex flex-col bg-[#ede8df] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-black/10">
                <span className="text-xs font-medium text-gray-500">目录</span>
                <span className="text-xs text-gray-400">{sortedVolumes.length} 卷</span>
              </div>

              <div className="flex-1 overflow-y-auto py-1">
                {sortedVolumes.length === 0 ? (
                  <Empty description="暂无目录" imageStyle={{ height: 36 }} className="mt-6" />
                ) : (
                  sortedVolumes.map(volume => {
                    const volumeWordCount = (volume.chapters ?? []).reduce(
                      (sum, chapter) => sum + chapter.content.replace(/\s/g, '').length,
                      0,
                    )
                    const isCollapsed = collapsedVolumeIds.includes(volume.id)
                    const isVolumeActive = activeVolumeId === volume.id

                    return (
                    <div key={volume.id}>
                      {/* 卷标题 */}
                      <div
                        className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${
                          isVolumeActive
                            ? 'bg-black/10'
                            : 'bg-transparent hover:bg-black/5'
                        }`}
                      >
                        <button
                          type="button"
                          className={`text-[10px] transition-colors ${
                            isVolumeActive ? 'text-gray-600' : 'text-gray-400 hover:text-gray-600'
                          }`}
                          onClick={() => toggleVolumeCollapse(volume.id)}
                          title={isCollapsed ? '展开卷' : '折叠卷'}
                        >
                          {isCollapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
                        </button>
                        <button
                          type="button"
                          className="text-left flex-1 min-w-0"
                          onClick={() => {
                            setCollapsedVolumeIds(prev => prev.filter(id => id !== volume.id))
                            setActiveVolumeId(volume.id)
                            setActiveChapterId(volume.chapters?.[0]?.id ?? null)
                          }}
                        >
                          <div
                            className={`text-xs font-semibold truncate ${
                              isVolumeActive ? 'text-gray-700' : 'text-gray-600'
                            }`}
                          >
                            {volume.title || `第${volume.order + 1}卷`}
                          </div>
                          <div className={`text-[10px] ${isVolumeActive ? 'text-gray-500' : 'text-gray-400'}`}>
                            {volumeWordCount} 字
                          </div>
                        </button>
                      </div>
                      {/* 章节列表 */}
                      {!isCollapsed && [...(volume.chapters ?? [])].sort((a, b) => a.order - b.order).map(chapter => {
                        const chWc = chapter.content.replace(/\s/g, '').length
                        const isActive = activeChapterId === chapter.id
                        return (
                          <div
                            key={chapter.id}
                            className={`flex items-center justify-between pl-5 pr-2 py-1.5 group cursor-pointer ${
                              isActive ? 'text-[#e8673c]' : 'hover:bg-black/5 text-gray-600'
                            }`}
                            onClick={() => { setActiveVolumeId(volume.id); setActiveChapterId(chapter.id) }}
                          >
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-xs truncate">
                                {chapter.title || `第${chapter.order + 1}章`}
                              </span>
                              <span className="text-[10px] text-gray-400">{chWc} 字</span>
                            </div>
                            {/* 复制本章，hover 显示 */}
                            <button
                              type="button"
                              title="复制本章"
                              onClick={e => { e.stopPropagation(); handleCopyChapter(chapter.id) }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#e8673c] transition-all shrink-0 ml-1"
                            >
                              <CopyOutlined style={{ fontSize: 10 }} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )})
                )}
              </div>
            </div>

            {/* 右侧正文 */}
            <div className="flex-1 overflow-auto px-8 py-6 bg-[#f5f0e8]">
              {activeChapter ? (
                <>
                  <div className="flex items-baseline gap-3 mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {activeChapter.title || '未命名章节'}
                    </h2>
                    <span className="text-sm text-gray-400">{activeChapterWordCount} 字</span>
                  </div>
                  <p className="text-gray-700 leading-[1.9] text-[15px] whitespace-pre-wrap">
                    {activeChapter.content || '（本章暂无内容）'}
                  </p>
                </>
              ) : (
                <Empty description="暂无章节内容" className="mt-24" />
              )}
            </div>
          </div>
        )}
      </div>
    </Spin>
  )
}

export default NovelView

