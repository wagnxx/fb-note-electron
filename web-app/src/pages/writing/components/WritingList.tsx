import React from 'react'
import { useTranslation } from 'react-i18next'
import { CopyOutlined, DeleteOutlined, AppstoreOutlined, MenuOutlined, UnorderedListOutlined } from '@ant-design/icons'
import stripMarkdown from '@/features/writing/utils/stripMarkdown'

type Item = any

type Props = {
  items: Item[]
  displayMode: string
  onView: (id: string) => void
  onCopy: (id: string, e: React.MouseEvent) => Promise<void>
  onDelete: (id: string) => Promise<void>
  formatDate: (d?: string) => string
}

const WritingList: React.FC<Props> = ({ items, displayMode, onView, onCopy, onDelete, formatDate }) => {
  const { t } = useTranslation()
  if (items.length === 0) return null

  if (displayMode === 'compact') {
    return (
      <>
        {items.map(item => (
          <div key={item.id} className="p-3 mb-2 bg-white rounded shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => onView(item.id)}>
            <div>
              <div className="font-medium">{stripMarkdown(item.title)}</div>
              <div className="text-xs text-gray-500">{item.tags?.slice(0, 3).map((t: string) => `#${t}`).join(' ')}</div>
            </div>

            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              {item.type !== 'novel' && (
                <button onClick={e => onCopy(item.id, e)} className="p-2 text-gray-500 rounded-md hover:bg-gray-100" aria-label={t('writing.actions.copy', { defaultValue: '复制' })}>
                  <CopyOutlined />
                </button>
              )}
              <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 rounded-md bg-red-50 hover:bg-red-100">
                <DeleteOutlined />
              </button>
            </div>
          </div>
        ))}
      </>
    )
  }

  if (displayMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 cursor-pointer" onClick={() => onView(item.id)}>
                <div className="w-full h-32 bg-gray-100 rounded-md overflow-hidden mb-3">{(item as any).metadata?.cover ? <img src={(item as any).metadata.cover} alt={t('writing.common.cover', { defaultValue: '封面' })} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">{t('writing.common.cover', { defaultValue: '封面' })}</div>}</div>
            <div className="text-sm font-medium mb-2">{stripMarkdown(item.title)}</div>
            <div className="text-xs text-gray-500 mb-2">{item.tags?.slice(0, 3).map((t: string) => `#${t}`).join(' ')}</div>
            <div className="flex items-center gap-2">
              {item.type !== 'novel' && (
                <button onClick={e => onCopy(item.id, e)} className="p-2 text-gray-500 rounded-md hover:bg-gray-100" aria-label={t('writing.actions.copy', { defaultValue: '复制' })}>
                  <CopyOutlined />
                </button>
              )}
              <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 rounded-md bg-red-50 hover:bg-red-100"><DeleteOutlined /></button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-md shadow-sm overflow-hidden flex flex-row items-center gap-3 p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onView(item.id)}>
            <div className="w-12 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">{(item as any).metadata?.cover ? <img src={(item as any).metadata.cover} alt={t('writing.common.cover', { defaultValue: '封面' })} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">{t('writing.common.cover', { defaultValue: '封面' })}</div>}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-800 truncate">{stripMarkdown(item.title)}</div>
              <div className="text-xs text-gray-500 whitespace-nowrap ml-2">{formatDate((item as any).updatedAt || (item as any).createdAt || (item as any).metadata?.updatedAt)}</div>
            </div>

            <div className="flex items-center gap-2 mt-1"><div className="text-xs text-gray-500 truncate">{item.tags?.slice(0, 4).map((t: string) => `#${t}`).join(' ')}</div></div>

            {(item as any).metadata?.summary && <div className="text-sm text-gray-600 mt-1 line-clamp-1">{(item as any).metadata.summary}</div>}
          </div>

          <div className="flex-shrink-0 flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
            <div className="text-xs text-gray-500">{(item as any).metadata?.status || ''}</div>
            <div className="flex items-center gap-2">
              {item.type !== 'novel' && (<button onClick={e => onCopy(item.id, e)} className="p-2 text-gray-700 rounded-md bg-gray-50 hover:bg-gray-100" aria-label={t('writing.actions.copy', { defaultValue: '复制' })}><CopyOutlined /></button>)}
              <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 rounded-md bg-red-50 hover:bg-red-100"><DeleteOutlined /></button>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default WritingList
