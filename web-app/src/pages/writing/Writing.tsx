import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Empty, Popconfirm, Spin } from 'antd'
import {
  CopyOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  MenuOutlined,
  UnorderedListOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import stripMarkdown from '@/features/writing/utils/stripMarkdown'
import { hasChapters, WRITING_TYPES } from '@/features/writing/utils/helpers'
import { useSelector } from 'react-redux'
import type { WritingType } from '@shared/types/writing'
import { useTranslation } from 'react-i18next'
import SettingsButton from './components/SettingsButton'

const DISPLAY_TYPES = WRITING_TYPES.filter(item => item.value !== 'article')

const resolveWritingType = (value: string | null): WritingType => {
  const matched = WRITING_TYPES.find(item => item.value === value)
  return (matched && (matched.value as WritingType)) || 'short_story'
}

const WritingPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, loading, error, fetchWritings, initializeDirectories, removeWriting, setMode, setActiveTag } =
    useWriting()
  const displayMode = useSelector((state: any) => state.writing.displayMode) ?? 'normal'
  const activeTagFilter = useSelector((state: any) => state.writing.activeTagFilter) ?? null

  const [selectedType, setSelectedType] = useState<WritingType>(() => resolveWritingType(searchParams.get('type')))
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false)
  const [toolbarExpanded, setToolbarExpanded] = useState(false)

  useEffect(() => {
    initializeDirectories()
  }, [initializeDirectories])

  useEffect(() => {
    const qType = resolveWritingType(searchParams.get('type'))
    setSelectedType(prev => (prev === qType ? prev : qType))
    if (searchParams.get('type') !== qType) {
      const next = new URLSearchParams(searchParams)
      next.set('type', qType)
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    fetchWritings(selectedType)
  }, [selectedType, fetchWritings])

  const ModeIcon: React.FC<{ mode: string }> = ({ mode }) => {
    if (mode === 'grid') return <AppstoreOutlined />
    if (mode === 'compact') return <MenuOutlined />
    return <UnorderedListOutlined />
  }

  const handleCreateNew = () => navigate(`/tool/writing/editor?type=${selectedType}`)
  const handleView = (id: string) => navigate(`/tool/writing/view?id=${id}&type=${selectedType}`)

  const handleCopy = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const electronApi = (window as any).electron || ({} as any)
      const IPC_ACTIONS = electronApi.IPC_ACTIONS
      const writing = await (electronApi.ipcRenderer.invoke as any)(IPC_ACTIONS.WRITING_LOAD, selectedType, id)
      if (!writing) return
      const chapterSummary =
        hasChapters(writing.type) && writing.chapters?.length
          ? writing.chapters
              .sort((a: any, b: any) => a.order - b.order)[0]
              ?.content.replace(/\s+/g, ' ')
              .trim()
              .slice(0, 120)
          : ''
      const desc =
        (typeof writing.metadata?.description === 'string' && writing.metadata.description.trim()) ||
        chapterSummary ||
        writing.content.replace(/\s+/g, ' ').trim().slice(0, 120) ||
        t('writing.common.noDescription')
      await navigator.clipboard.writeText(
        `${t('writing.common.copyTitlePrefix')}${writing.title}\n${t('writing.common.copyDescriptionPrefix')}${desc}`,
      )
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeWriting(selectedType, id)
    } catch {
      // ignore
    }
  }

  const tagsForType = Array.from(new Set(items.filter(i => i.type === selectedType).flatMap(i => i.tags || [])))

  // support multi-select tag filters locally (OR semantics). initialize from redux single activeTagFilter if present.
  const [selectedTags, setSelectedTags] = useState<string[]>(() => (activeTagFilter ? [activeTagFilter] : []))

  useEffect(() => {
    // keep redux in sync with one of the selected tags (or null)
    try {
      setActiveTag(selectedTags.length ? selectedTags[0] : null)
    } catch {
      // ignore if setActiveTag not available
    }
  }, [selectedTags, setActiveTag])

  const filteredItems = items
    .filter(it => it.type === selectedType)
    .filter(it => (selectedTags.length ? selectedTags.every(tag => (it.tags || []).includes(tag)) : true))
  const formatDate = (d?: string) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString()
    } catch {
      return String(d)
    }
  }
  return (
    <div className="flex flex-col h-full bg-[#f5f0e8] min-h-screen">
      {/* Article type selector (top). No background, underline indicates selected. */}
      <div className="flex items-center overflow-x-auto gap-2 pt-3 pb-0 shrink-0">
        <div className="max-w-md w-full mx-auto px-4">
          {DISPLAY_TYPES.map(tab => (
            <button
              key={tab.value}
              onClick={() => {
                if (tab.value === selectedType) return
                setSelectedType(tab.value as WritingType)
                // clear selected tags when changing type so filters don't hide all items
                try {
                  setSelectedTags([])
                } catch {
                  // ignore if not available
                }
                const nextParams = new URLSearchParams(searchParams)
                nextParams.set('type', tab.value)
                setSearchParams(nextParams, { replace: true })
              }}
              className={`flex-none whitespace-nowrap px-4 sm:px-6 py-2 text-sm font-medium transition-all ${
                selectedType === tab.value ? 'text-[#111827] border-b-2 border-[#e8673c]' : 'text-gray-500'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: content + right sidebar */}
      <div className="flex-1 flex">
        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {error && <Alert type="error" message={error} className="mb-4" />}

          <Spin spinning={loading}>
            {filteredItems.length === 0 && !loading ? (
              <Empty
                description={t('writing.list.emptyByType', {
                  typeLabel: t(WRITING_TYPES.find(x => x.value === selectedType)?.label || ''),
                })}
                className="mt-20"
              >
                <button
                  onClick={handleCreateNew}
                  className="mt-2 px-6 py-2 bg-[#e8673c] text-white rounded-full text-sm font-medium hover:bg-[#d45a30] transition-colors"
                >
                  {t('writing.actions.createFirst', { defaultValue: '创建' })}
                </button>
              </Empty>
            ) : (
              <div className="flex flex-col gap-4 max-w-md w-full mx-auto px-2 sm:px-0">
                {tagsForType.length > 0 && (
                  <div className="mb-2">
                    <div className="bg-[#fbf6f0] border border-[#efe6df] rounded-lg px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {tagsForType.map(tag => {
                            const isSelected = selectedTags.includes(tag)
                            const cls = isSelected
                              ? 'px-3 py-1 rounded-full text-sm bg-[#e8673c] text-white'
                              : 'px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700'
                            return (
                              <button
                                key={tag}
                                onClick={() => {
                                  setSelectedTags(prev =>
                                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
                                  )
                                }}
                                className={cls}
                              >
                                #{tag}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {displayMode === 'compact' ? (
                  filteredItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3 mb-2 bg-white rounded shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleView(item.id)}
                    >
                      <div>
                        <div className="font-medium">{stripMarkdown(item.title)}</div>
                        <div className="text-xs text-gray-500">
                          {item.tags
                            ?.slice(0, 3)
                            .map(t => `#${t}`)
                            .join(' ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {item.type !== 'novel' && (
                          <button
                            onClick={e => handleCopy(item.id, e)}
                            className="p-2 text-gray-500 rounded-md hover:bg-gray-100"
                            aria-label={t('writing.actions.copy', { defaultValue: '复制' })}
                          >
                            <CopyOutlined />
                          </button>
                        )}

                        <Popconfirm
                          title={t('writing.confirm.deleteTitle', { defaultValue: '删除' })}
                          description={t('writing.confirm.deleteDescription', {
                            defaultValue: '确定要删除这篇文章吗？',
                          })}
                          okText={t('writing.actions.delete', { defaultValue: '删除' })}
                          cancelText={t('writing.actions.cancel', { defaultValue: '取消' })}
                          onConfirm={() => handleDelete(item.id)}
                        >
                          <button className="p-2 text-red-600 rounded-md bg-red-50 hover:bg-red-100">
                            <DeleteOutlined />
                          </button>
                        </Popconfirm>
                      </div>
                    </div>
                  ))
                ) : displayMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map(item => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm p-4 cursor-pointer"
                        onClick={() => handleView(item.id)}
                      >
                        <div className="w-full h-32 bg-gray-100 rounded-md overflow-hidden mb-3">
                          {(item as any).metadata?.cover ? (
                            <img
                              src={(item as any).metadata.cover}
                              alt="cover"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              {t('writing.cover', { defaultValue: '封面' })}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium mb-2">{stripMarkdown(item.title)}</div>
                        <div className="text-xs text-gray-500 mb-2">
                          {item.tags
                            ?.slice(0, 3)
                            .map(t => `#${t}`)
                            .join(' ')}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.type !== 'novel' && (
                            <button
                              onClick={e => handleCopy(item.id, e)}
                              className="p-2 text-gray-500 rounded-md hover:bg-gray-100"
                              aria-label={t('writing.actions.copy', { defaultValue: '复制' })}
                            >
                              <CopyOutlined />
                            </button>
                          )}
                          <Popconfirm
                            title={t('writing.confirm.deleteTitle', { defaultValue: '删除' })}
                            description={t('writing.confirm.deleteDescription', {
                              defaultValue: '确定要删除这篇文章吗？',
                            })}
                            okText={t('writing.actions.delete', { defaultValue: '删除' })}
                            cancelText={t('writing.actions.cancel', { defaultValue: '取消' })}
                            onConfirm={() => handleDelete(item.id)}
                          >
                            <button className="p-2 text-red-600 rounded-md bg-red-50 hover:bg-red-100">
                              <DeleteOutlined />
                            </button>
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white rounded-md shadow-sm overflow-hidden flex flex-row items-center gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleView(item.id)}
                    >
                      <div className="w-12 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                        {(item as any).metadata?.cover ? (
                          <img src={(item as any).metadata.cover} alt="cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                            {t('writing.cover', { defaultValue: '封面' })}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {stripMarkdown(item.title)}
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatDate(
                              (item as any).updatedAt || (item as any).createdAt || (item as any).metadata?.updatedAt,
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-xs text-gray-500 truncate">
                            {item.tags
                              ?.slice(0, 4)
                              .map((t: any) => `#${t}`)
                              .join(' ')}
                          </div>
                        </div>

                        {(item as any).metadata?.summary && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {(item as any).metadata.summary}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                        <div className="text-xs text-gray-500">{(item as any).metadata?.status || ''}</div>
                        <div className="flex items-center gap-2">
                          {item.type !== 'novel' && (
                            <button
                              onClick={e => handleCopy(item.id, e)}
                              className="p-2 text-gray-700 rounded-md bg-gray-50 hover:bg-gray-100"
                              aria-label={t('writing.actions.copy', { defaultValue: '复制' })}
                            >
                              <CopyOutlined />
                            </button>
                          )}

                          <Popconfirm
                            title={t('writing.confirm.deleteTitle', { defaultValue: '删除' })}
                            description={t('writing.confirm.deleteDescription', {
                              defaultValue: '确定要删除这篇文章吗？',
                            })}
                            okText={t('writing.actions.delete', { defaultValue: '删除' })}
                            cancelText={t('writing.actions.cancel', { defaultValue: '取消' })}
                            onConfirm={() => handleDelete(item.id)}
                          >
                            <button className="p-2 text-red-600 rounded-md bg-red-50 hover:bg-red-100">
                              <DeleteOutlined />
                            </button>
                          </Popconfirm>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Spin>
        </div>
        {/* Right sidebar (occupies layout space) - limit to half viewport height */}
        <aside className="w-20 flex-shrink-0 bg-white border-l border-gray-100 px-3 py-4 h-[50vh] self-start">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full">
              <button
                onClick={() => setLayoutMenuOpen(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-white text-gray-700 shadow-sm"
                title={t('writing.layout.choose', { defaultValue: '布局' })}
                aria-label={t('writing.layout.choose', { defaultValue: '布局' })}
              >
                <ModeIcon mode={displayMode} />
              </button>

              {layoutMenuOpen && (
                <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-20">
                  <button
                    onClick={() => {
                      setMode('normal')
                      setLayoutMenuOpen(false)
                    }}
                    title={t('writing.layout.normal', { defaultValue: '普通' })}
                    aria-label={t('writing.layout.normal', { defaultValue: '普通' })}
                    className={`w-full flex items-center justify-center px-3 py-2 ${displayMode === 'normal' ? 'bg-[#fff4ef]' : 'hover:bg-gray-50'}`}
                  >
                    <UnorderedListOutlined className="text-lg" />
                  </button>

                  <button
                    onClick={() => {
                      setMode('compact')
                      setLayoutMenuOpen(false)
                    }}
                    title={t('writing.layout.compact', { defaultValue: '简洁' })}
                    aria-label={t('writing.layout.compact', { defaultValue: '简洁' })}
                    className={`w-full flex items-center justify-center px-3 py-2 ${displayMode === 'compact' ? 'bg-[#fff4ef]' : 'hover:bg-gray-50'}`}
                  >
                    <MenuOutlined className="text-lg" />
                  </button>

                  <button
                    onClick={() => {
                      setMode('grid' as any)
                      setLayoutMenuOpen(false)
                    }}
                    title={t('writing.layout.grid', { defaultValue: '宫格' })}
                    aria-label={t('writing.layout.grid', { defaultValue: '宫格' })}
                    className={`w-full flex items-center justify-center px-3 py-2 ${displayMode === 'grid' ? 'bg-[#fff4ef]' : 'hover:bg-gray-50'}`}
                  >
                    <AppstoreOutlined className="text-lg" />
                  </button>
                </div>
              )}
            </div>

            <div className="w-full flex flex-col items-center gap-3">
              {/* Thumbnails + create area -- collapsed to half viewport height by default */}
              <div
                className={`w-full flex flex-col items-center gap-3 ${
                  toolbarExpanded ? 'max-h-[70vh] overflow-auto' : 'h-[25vh] overflow-hidden'
                }`}
              >
                {items
                  .filter((it: any) => (it as any).metadata?.cover)
                  .slice(0, 10)
                  .map((it: any) => (
                    <div key={it.id} className="w-16 h-20 bg-gray-100 rounded overflow-hidden shadow-sm">
                      <img src={it.metadata.cover} alt="thumb" className="w-full h-full object-cover" />
                    </div>
                  ))}

                {/* create button (smaller to fit slim toolbar) */}
                <button
                  onClick={handleCreateNew}
                  className="mt-2 w-10 h-10 bg-[#e8673c] text-white rounded-full text-lg font-medium hover:bg-[#d45a30] transition-colors flex items-center justify-center shadow-md"
                  aria-label={t('writing.actions.create', { defaultValue: '创建' })}
                  title={t('writing.actions.create', { defaultValue: '创建' })}
                >
                  <PlusOutlined />
                </button>
                {/* Settings button placed inside the toolbar, below create */}
                <div className="mt-2">
                  <SettingsButton />
                </div>
              </div>

              {items.filter((it: any) => (it as any).metadata?.cover).length > 3 && !toolbarExpanded && (
                <button
                  onClick={() => setToolbarExpanded(true)}
                  className="mt-2 px-3 py-1 text-sm text-gray-600 bg-gray-50 rounded-md shadow-sm"
                >
                  更多
                </button>
              )}

              {toolbarExpanded && (
                <button
                  onClick={() => setToolbarExpanded(false)}
                  className="mt-2 px-3 py-1 text-sm text-gray-600 bg-gray-50 rounded-md shadow-sm"
                >
                  收起
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default WritingPage
