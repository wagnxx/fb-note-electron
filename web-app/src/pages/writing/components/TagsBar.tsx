import React from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  tags: string[]
  selectedTags: string[]
  filterMode: 'and' | 'or'
  onChangeMode: (mode: 'and' | 'or') => void
  onToggle: (tag: string) => void
}

const TagsBar: React.FC<Props> = ({ tags, selectedTags, filterMode, onChangeMode, onToggle }) => {
  const { t } = useTranslation()
  return (
    <div className="mb-2">
      <div className="bg-[#fbf6f0] border border-[#efe6df] rounded-lg px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-h-[44px]">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map(tag => {
                const isSelected = selectedTags.includes(tag)
                const cls = isSelected
                  ? 'px-3 py-1 rounded-full text-sm bg-[#e8673c] text-white'
                  : 'px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700'
                return (
                  <button key={tag} onClick={() => onToggle(tag)} className={cls}>
                    #{tag}
                  </button>
                )
              })
            ) : (
              <div className="text-xs text-gray-400">{t('writing.tags.empty', { defaultValue: '暂无标签' })}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className={`px-2 py-1 rounded text-xs border ${
              filterMode === 'and'
                ? 'bg-[#e8673c] text-white border-[#e8673c]'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
            onClick={() => onChangeMode('and')}
            title={t('writing.tags.filterModeAndTip', { defaultValue: '需包含全部已选标签' })}
          >
            AND
          </button>
          <button
            type="button"
            className={`px-2 py-1 rounded text-xs border ${
              filterMode === 'or'
                ? 'bg-[#e8673c] text-white border-[#e8673c]'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
            onClick={() => onChangeMode('or')}
            title={t('writing.tags.filterModeOrTip', { defaultValue: '命中任一已选标签即可' })}
          >
            OR
          </button>
        </div>
      </div>
    </div>
  )
}

export default TagsBar
