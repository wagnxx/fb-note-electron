import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spin } from 'antd'
// icons removed (not used in this file)
import { useWriting } from '@/features/writing/hooks/useWriting'
// child components
import TypeTabs from './components/TypeTabs'
import TagsBar from './components/TagsBar'
import WritingList from './components/WritingList'
import RightSidebar from './components/RightSidebar'
import { hasChapters, WRITING_TYPES } from '@/features/writing/utils/helpers'
import { useSelector } from 'react-redux'
import type { WritingType } from '@shared/types/writing'
import { useTranslation } from 'react-i18next'

const DISPLAY_TYPES = WRITING_TYPES.filter(item => item.value !== 'article')

const resolveWritingType = (value: string | null): WritingType => {
  const matched = WRITING_TYPES.find(item => item.value === value)
  return (matched && (matched.value as WritingType)) || 'short_story'
}

const WritingPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, loading, fetchWritings, initializeDirectories, removeWriting, setMode, setActiveTag } = useWriting()
  const persistedDisplayMode = useSelector((state: any) => state.writing.displayMode) ?? 'normal'
  const [displayMode, setDisplayMode] = useState<string>(() => persistedDisplayMode)
  const activeTagFilter = useSelector((state: any) => state.writing.activeTagFilter) ?? null

  const [selectedType, setSelectedType] = useState<WritingType>(() => resolveWritingType(searchParams.get('type')))
  const [toolbarExpanded, setToolbarExpanded] = useState(false)

  // handlers to pass to child components
  const handleSelectType = (v: WritingType) => {
    setSelectedTags([])
    setSelectedType(v)
  }

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }

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

  // note: initialize local `displayMode` from persisted value above
  // do NOT sync further to avoid unexpected UI/layout changes when redux rehydrates

  useEffect(() => {
    fetchWritings(selectedType)
  }, [selectedType, fetchWritings])

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

  // adapter: RightSidebar expects a setter with signature (mode: string) => void
  const setModeString = (m: string) => setMode(m as any)

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
    <div style={{ height: 'calc(100vh - 28px)' }} className="flex flex-col bg-[#f5f0e8] overflow-hidden">
      {/* Article type selector (top). No background, underline indicates selected. */}
      <div className="flex items-start overflow-x-auto gap-2 pt-3 pb-0 shrink-0 h-full">
        <div className="max-w-4xl w-full mx-auto px-4 flex flex-col h-full">
          <TypeTabs displayTypes={DISPLAY_TYPES} selectedType={selectedType} onSelect={handleSelectType} />

          <Spin spinning={loading}>
            <div className="flex-1 overflow-auto">
              <div className="flex flex-col gap-4 max-w-4xl w-full mx-auto px-2 sm:px-0">
                <div className="mb-2">
                  <TagsBar tags={tagsForType} selectedTags={selectedTags} onToggle={handleToggleTag} />
                </div>

                <WritingList
                  items={filteredItems}
                  displayMode={displayMode}
                  onView={handleView}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                />
              </div>
            </div>
          </Spin>
        </div>
        {/* Right sidebar (occupies layout space) - limit to half viewport height */}
        <RightSidebar
          items={items}
          toolbarExpanded={toolbarExpanded}
          setToolbarExpanded={setToolbarExpanded}
          onCreate={handleCreateNew}
          displayMode={displayMode}
          setDisplayModeLocal={setDisplayMode}
          setModeRedux={setModeString}
        />
      </div>
    </div>
  )
}

export default WritingPage
