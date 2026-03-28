/**
 * Author: You + AI(Nova)
 * Contributors: You, AI(Nova)
 */
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Empty, Popconfirm, Spin } from 'antd'
import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useWriting } from '@/features/writing/hooks/useWriting'
import { useNotification } from '@/hooks/useNotification'
import { hasChapters, WRITING_TYPES } from '@/features/writing/utils/helpers'
import type { WritingItem, WritingType } from '@shared/types/writing'
import stripMarkdown from '@/features/writing/utils/stripMarkdown'
import type { WritingListEntry } from '@/features/writing/types'
import { useTranslation } from 'react-i18next'

const electronApi = (window as any).electron || ({} as any)
const ipcRenderer = electronApi.ipcRenderer
const IPC_ACTIONS = electronApi.IPC_ACTIONS

const invokeWriting = async <T,>(channel: string, ...args: any[]): Promise<T> => {
  if (!ipcRenderer || typeof ipcRenderer.invoke !== 'function') {
    return Promise.reject(new Error('ipcRenderer.invoke is not available in this environment'))
  }
  return (ipcRenderer.invoke as <T>(channel: string, ...args: any[]) => Promise<T>)(channel, ...args)
}

const resolveWritingType = (value: string | null): WritingType => {
  const matched = WRITING_TYPES.find(item => item.value === value)
  return matched?.value ?? 'short_story'
}

// 类型 → 标签颜色映射
const TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  novel: { bg: '#fef3c7', text: '#d97706' },
  short_story: { bg: '#e0f2fe', text: '#0284c7' },
  video_script: { bg: '#f3e8ff', text: '#9333ea' },
  article: { bg: '#dcfce7', text: '#16a34a' },
}

const DISPLAY_TYPES = WRITING_TYPES.filter(item => item.value !== 'article')

const WritingPage: React.FC = () => {
  const { message } = useNotification()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, loading, error, fetchWritings, initializeDirectories, removeWriting } = useWriting()
  const [selectedType, setSelectedType] = useState<WritingType>(() => resolveWritingType(searchParams.get('type')))
  const [copyLoadingId, setCopyLoadingId] = useState<string | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

  useEffect(() => {
    initializeDirectories()
  }, [initializeDirectories])

  useEffect(() => {
    const queryType = resolveWritingType(searchParams.get('type'))
    setSelectedType(prev => (prev === queryType ? prev : queryType))

    if (searchParams.get('type') !== queryType) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('type', queryType)
      setSearchParams(nextParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    fetchWritings(selectedType)
  }, [selectedType, fetchWritings])

  const handleSelectType = (nextType: WritingType) => {
    if (nextType === selectedType) return
    setSelectedType(nextType)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('type', nextType)
    setSearchParams(nextParams, { replace: true })
  }

  const handleCreateNew = () => navigate(`/tool/writing/editor?type=${selectedType}`)
  const handleView = (id: string) => navigate(`/tool/writing/view?id=${id}&type=${selectedType}`)

  const handleCopy = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCopyLoadingId(id)
    try {
      const writing = await invokeWriting<WritingItem | null>(IPC_ACTIONS.WRITING_LOAD, selectedType, id)
      if (!writing) return
      const chapterSummary =
        hasChapters(writing.type) && writing.chapters && writing.chapters.length > 0
          ? writing.chapters
              .sort((a, b) => a.order - b.order)[0]
              ?.content.replace(/\s+/g, ' ')
              .trim()
              .slice(0, 120) || ''
          : ''
      const desc =
        (typeof writing.metadata?.description === 'string' && writing.metadata.description.trim()) ||
        chapterSummary ||
        writing.content.replace(/\s+/g, ' ').trim().slice(0, 120) ||
        t('writing.common.noDescription')
      await navigator.clipboard.writeText(
        `${t('writing.common.copyTitlePrefix')}${writing.title}\n${t('writing.common.copyDescriptionPrefix')}${desc}`,
      )
      message.success(t('writing.messages.copySuccess'))
    } catch {
      message.error(t('writing.messages.copyFailed'))
    } finally {
      setCopyLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteLoadingId(id)
    try {
      await removeWriting(selectedType, id)
      message.success(t('writing.messages.deleteSuccess'))
    } catch {
      message.error(t('writing.messages.deleteFailed'))
    } finally {
      setDeleteLoadingId(null)
    }
  }

  const selectedLabel = t(WRITING_TYPES.find(typeItem => typeItem.value === selectedType)?.label ?? '')

  try {
    return (
      <div className="flex flex-col h-full bg-[#f5f0e8] min-h-screen">
        {/* 顶部 tab 栏 */}
        <div className="flex items-center overflow-x-auto gap-2 pt-3 pb-0 shrink-0 px-4 sm:justify-center sm:px-0">
          {DISPLAY_TYPES.map(tab => (
            <button
              key={tab.value}
              onClick={() => handleSelectType(tab.value)}
              className={`flex-none whitespace-nowrap px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedType === tab.value
                  ? 'bg-[#e8673c] text-white shadow'
                  : 'bg-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>

        {/* 列表区 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {error && <Alert type="error" message={error} className="mb-4" />}

          <Spin spinning={loading}>
            {items.length === 0 && !loading ? (
              <Empty description={t('writing.list.emptyByType', { typeLabel: selectedLabel })} className="mt-20">
                <button
                  onClick={handleCreateNew}
                  className="mt-2 px-6 py-2 bg-[#e8673c] text-white rounded-full text-sm font-medium hover:bg-[#d45a30] transition-colors"
                >
                  {t('writing.actions.createFirst')}
                </button>
              </Empty>
            ) : (
              <div className="flex flex-col gap-0 max-w-2xl w-full mx-auto px-2 sm:px-0">
                {items.map((item, idx) => (
                  <WritingListItem
                    key={item.id}
                    item={item}
                    type={selectedType}
                    isLast={idx === items.length - 1}
                    copyLoading={copyLoadingId === item.id}
                    deleteLoading={deleteLoadingId === item.id}
                    onView={() => handleView(item.id)}
                    onCopy={e => handleCopy(item.id, e)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>
            )}
          </Spin>
        </div>

        {/* 悬浮写作按钮 */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-8 py-3 bg-[#e8673c] text-white rounded-full shadow-xl text-sm font-medium hover:bg-[#d45a30] active:scale-95 transition-all"
          >
            <PlusOutlined />
            {t('writing.actions.create')}
          </button>
        </div>
      </div>
    )
  } catch (err) {
    // Log and show a readable error message so we can debug rendering failures
    // eslint-disable-next-line no-console
    console.error('WritingPage render error:', err)
    return (
      <div className="p-6">
        <h3 className="text-red-600">渲染错误 (WritingPage)</h3>
        <pre className="whitespace-pre-wrap text-sm text-red-500">{String(err)}</pre>
      </div>
    )
  }
}

// ─── 列表行 ────────────────────────────────────────────────────────────────────
interface WritingListItemProps {
  item: WritingListEntry
  type: WritingType
  isLast: boolean
  copyLoading: boolean
  deleteLoading: boolean
  onView: () => void
  onCopy: (e: React.MouseEvent) => void
  onDelete: () => void
}

const WritingListItem: React.FC<WritingListItemProps> = ({
  item,
  type,
  isLast,
  copyLoading,
  deleteLoading,
  onView,
  onCopy,
  onDelete,
}) => {
  const { t, i18n } = useTranslation()
  const color = TYPE_COLOR[type] ?? TYPE_COLOR.article
  // 字数、章节数信息
  const wordCount = (item as any).wordCount ?? 0
  const chapterCount = (item as any).chapterCount ?? (item as any).chapters?.length ?? 0

  const wordCountStr =
    wordCount >= 10000
      ? t('writing.common.wordCountWan', { value: (wordCount / 10000).toFixed(1) })
      : t('writing.common.wordCount', { value: wordCount })

  const chapterStr = chapterCount > 0 ? t('writing.common.chapterCount', { count: chapterCount }) : ''
  const updatedStr = new Date(item.updatedAt).toLocaleDateString(i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <div
      className={`flex items-center gap-4 py-4 px-4 sm:px-2 cursor-pointer hover:bg-black/5 rounded-xl transition-colors group ${!isLast ? 'border-b border-black/5' : ''}`}
      onClick={onView}
    >
      {/* 封面占位（若有封面则显示图片，否则显示色块） */}
      <div
        className="w-14 h-20 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-lg shadow"
        style={{ background: 'linear-gradient(135deg, #c9a96e 0%, #a07850 100%)' }}
      >
        {stripMarkdown(item.title).slice(0, 1)}
      </div>

      {/* 正文 */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-base truncate">{stripMarkdown(item.title)}</div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          {wordCountStr && <span>{wordCountStr}</span>}
          {wordCountStr && chapterStr && <span>｜</span>}
          {chapterStr && <span>{chapterStr}</span>}
          {(wordCountStr || chapterStr) && <span>｜</span>}
          <span>{t('writing.common.serializing')}</span>
        </div>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: color.bg, color: color.text }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-1">{t('writing.common.lastUpdated', { date: updatedStr })}</div>
      </div>

      {/* 操作按钮 — hover 才完全显示 */}
      <div
        className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        {type !== 'novel' && (
          <button
            className={`flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 px-2 py-1 rounded hover:bg-purple-50 transition-colors ${copyLoading ? 'opacity-50' : ''}`}
            onClick={onCopy}
            disabled={copyLoading}
          >
            <CopyOutlined /> {t('writing.actions.copy')}
          </button>
        )}
        <Popconfirm
          title={t('writing.confirm.deleteTitle')}
          description={t('writing.confirm.deleteDescription')}
          okText={t('writing.actions.delete')}
          cancelText={t('writing.actions.cancel')}
          okButtonProps={{ danger: true, loading: deleteLoading }}
          onConfirm={onDelete}
        >
          <button
            className={`flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors ${deleteLoading ? 'opacity-50' : ''}`}
            disabled={deleteLoading}
          >
            <DeleteOutlined /> {t('writing.actions.delete')}
          </button>
        </Popconfirm>
      </div>
    </div>
  )
}

export default WritingPage
