import React from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  tags: string[]
  selectedTags: string[]
  onToggle: (tag: string) => void
}

const TagsBar: React.FC<Props> = ({ tags, selectedTags, onToggle }) => {
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
      </div>
    </div>
  )
}

export default TagsBar
