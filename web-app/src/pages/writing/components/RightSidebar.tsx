import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusOutlined, AppstoreOutlined, MenuOutlined, UnorderedListOutlined, SettingOutlined } from '@ant-design/icons'
import SettingsDrawer from './SettingsDrawer'

type Props = {
  items: any[]
  toolbarExpanded: boolean
  setToolbarExpanded: (v: boolean) => void
  onCreate: () => void
  displayMode: string
  setDisplayModeLocal: (mode: string) => void
  setModeRedux?: (mode: string) => void
}

const RightSidebar: React.FC<Props> = ({
  items,
  toolbarExpanded,
  setToolbarExpanded,
  onCreate,
  displayMode,
  setDisplayModeLocal,
  setModeRedux,
}) => {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <aside className="w-20 flex-shrink-0 bg-white/80 border-l border-gray-100 px-3 py-4 h-[50vh] self-start">
      <div className="flex flex-col items-center gap-4">
        {/* spacer area: thumbnails + create button live in the middle; layout controls grouped at bottom */}

        {/* Toolbar: gear, floating create and compact layout buttons (sticky at top) */}
        <div className="w-full sticky top-6 flex flex-col items-center gap-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 bg-white rounded-md flex items-center justify-center shadow-sm"
            title={t('writing.toolbar.settings', { defaultValue: '设置' })}
            aria-label={t('writing.toolbar.settings', { defaultValue: '设置' })}
          >
            <SettingOutlined />
          </button>

          <button
            onClick={onCreate}
            className="w-10 h-10 bg-[#e8673c] text-white rounded-full text-lg flex items-center justify-center shadow-md"
            aria-label={t('writing.actions.create', { defaultValue: '创建' })}
          >
            <PlusOutlined />
          </button>

          <div className="flex flex-col gap-2 p-1 bg-white rounded-md shadow-sm">
            <button
              onClick={() => {
                setDisplayModeLocal('normal')
                try {
                  setModeRedux && setModeRedux('normal')
                } catch (e) {
                  /* ignore */
                }
              }}
              className={`p-2 rounded-md ${displayMode === 'normal' ? 'bg-[#fff4ef]' : 'hover:bg-gray-50'}`}
              title={t('writing.toolbar.normal', { defaultValue: '默认列表' })}
              aria-label={t('writing.toolbar.normal', { defaultValue: '默认列表' })}
            >
              <UnorderedListOutlined />
            </button>
            <button
              onClick={() => {
                setDisplayModeLocal('compact')
                try {
                  setModeRedux && setModeRedux('compact')
                } catch (e) {
                  /* ignore */
                }
              }}
              className={`p-2 rounded-md ${displayMode === 'compact' ? 'bg-[#fff4ef]' : 'hover:bg-gray-50'}`}
              title={t('writing.toolbar.compact', { defaultValue: '紧凑' })}
              aria-label={t('writing.toolbar.compact', { defaultValue: '紧凑' })}
            >
              <MenuOutlined />
            </button>
            <button
              onClick={() => {
                setDisplayModeLocal('grid')
                try {
                  setModeRedux && setModeRedux('grid')
                } catch (e) {
                  /* ignore */
                }
              }}
              className={`p-2 rounded-md ${displayMode === 'grid' ? 'bg-[#fff4ef]' : 'hover:bg-gray-50'}`}
              title={t('writing.toolbar.grid', { defaultValue: '卡片' })}
              aria-label={t('writing.toolbar.grid', { defaultValue: '卡片' })}
            >
              <AppstoreOutlined />
            </button>
          </div>

          <SettingsDrawer visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>

        {/* thumbnails area (kept but without create button) */}
        <div
          className={`w-full flex flex-col items-center gap-3 ${toolbarExpanded ? 'max-h-[70vh] overflow-auto' : 'h-[25vh] overflow-hidden'}`}
        >
          {items
            .filter(it => (it as any).metadata?.cover)
            .slice(0, 10)
            .map(it => (
              <div key={it.id} className="w-16 h-20 bg-gray-100 rounded overflow-hidden shadow-sm">
                <img src={it.metadata.cover} alt="thumb" className="w-full h-full object-cover" />
              </div>
            ))}
        </div>

        {items.filter(it => (it as any).metadata?.cover).length > 3 && !toolbarExpanded && (
          <button
            onClick={() => setToolbarExpanded(true)}
            className="mt-2 px-3 py-1 text-sm text-gray-600 bg-gray-50 rounded-md shadow-sm"
          >
            {t('writing.toolbar.more', { defaultValue: '更多' })}
          </button>
        )}

        {toolbarExpanded && (
          <button
            onClick={() => setToolbarExpanded(false)}
            className="mt-2 px-3 py-1 text-sm text-gray-600 bg-gray-50 rounded-md shadow-sm"
          >
            {t('writing.toolbar.collapse', { defaultValue: '收起' })}
          </button>
        )}

        {/* footer removed: controls live in toolbar above */}
      </div>
    </aside>
  )
}

export default RightSidebar
