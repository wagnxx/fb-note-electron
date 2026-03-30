import React from 'react'
import { useTranslation } from 'react-i18next'
import type { WritingType } from '@shared/types/writing'

type Props = {
  displayTypes: Array<{ value: string; label: string }>
  selectedType: WritingType
  onSelect: (v: WritingType) => void
}

const TypeTabs: React.FC<Props> = ({ displayTypes, selectedType, onSelect }) => {
  const { t } = useTranslation()
  return (
    <div className="w-full">
      <div className="flex justify-center pt-4 pb-2">
        <div className="flex items-end gap-6">
          {displayTypes.map(tab => (
            <button
              key={tab.value}
              onClick={() => {
                if (tab.value === selectedType) return
                onSelect(tab.value as WritingType)
              }}
              className={
                tab.value === selectedType
                  ? 'text-sm pb-2 text-[#e8673c] border-b-2 border-[#e8673c] transition-colors'
                  : 'text-sm pb-2 text-gray-600 hover:text-gray-800 border-b-2 border-transparent transition-colors'
              }
            >
              {t(tab.label, { defaultValue: tab.label })}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TypeTabs
