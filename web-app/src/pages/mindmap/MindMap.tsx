// src/pages/MindMapPage.tsx
import React, { useEffect, useMemo, useRef } from 'react'
import { Button, Dropdown, MenuProps, Splitter, Tooltip } from 'antd'
import SidebarDir from './components/SidebarDir'
import SideDrawer from './components/SideDrawer'
import MindMapCanvasContainer, { MindMapRef } from './components/MindMapCanvasContainer'
import { LeftOutlined, SettingFilled, SettingTwoTone } from '@ant-design/icons'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useFirstRender from '@/hooks/useFirstRender'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { TabItem } from '@/features/mindmap/types'
import { toggleIsSiderOpend } from '@/features/mindmap/slices/configSlice'

const MindMapPage: React.FC = () => {
  const [isDrawerSmartVisible, setvIsDrawerSmartVisible] = React.useState<boolean>(false)
  const [isDrawerOpend, setIsDrawerOpend] = React.useState<boolean>(false)

  const mindRef = useRef<MindMapRef>(null)
  const isFirstRender = useFirstRender()
  const currentNodeId = useSelector((state: RootState) => state.mindmapFlow.currentNodeId)
  const isSiderOpend = useSelector((state: RootState) => state.mindmapConfig.isSiderOpend)
  const dispatch = useDispatch()

  const navigate = useNavigate()

  const siderWidth = useMemo(() => {
    if (isSiderOpend) return 240
    return 0
  }, [isSiderOpend])

  const getCanvasData = () => {
    return mindRef.current?.getData()
  }

  const resetCanvasData = (data: TabItem[]) => {
    mindRef.current?.resetItems(data)
  }
  const handleToggleSiderOpen = () => {
    dispatch(toggleIsSiderOpend())
  }

  useEffect(() => {
    if (isFirstRender) return
    setIsDrawerOpend(!!currentNodeId && isDrawerSmartVisible)
  }, [isFirstRender, currentNodeId, isDrawerSmartVisible])

  const settingsMenu: MenuProps['items'] = [
    {
      key: 1,
      label: <Tooltip title="Click to open the settings sidebar immediately.">Toggle Settings Sidebar</Tooltip>,
      onClick: () => setIsDrawerOpend(prev => !prev),
    },
    {
      key: 2,
      label: (
        <Tooltip title="The sidebar will open automatically when an element is selected.">
          Enable Smart Settings Sidebar
        </Tooltip>
      ),
      onClick: () => setvIsDrawerSmartVisible(prev => !prev),
    },
  ]

  return (
    <>
      <Splitter style={{ height: 'calc(100vh - 30px)', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }} onResize={() => {}}>
        <Splitter.Panel defaultSize={'40'} min={'40'} max={'40'} resizable={false}>
          <div className=" h-full flex  flex-col  items-center">
            <Button icon={<LeftOutlined />} type="text" onClick={() => navigate(-1)} aria-label="back"></Button>
            <Button
              icon={isSiderOpend ? <PanelLeftClose /> : <PanelLeftOpen />}
              type="text"
              onClick={handleToggleSiderOpen}
              style={{ marginBlockEnd: 'auto' }}
            />
            <Dropdown menu={{ items: settingsMenu }} trigger={['click', 'contextMenu']}>
              <Button icon={isDrawerSmartVisible ? <SettingTwoTone /> : <SettingFilled />} type="text" />
            </Dropdown>
          </div>
        </Splitter.Panel>
        <Splitter.Panel size={siderWidth} min={0} max={600}>
          <SidebarDir getCanvasData={getCanvasData} resetCanvasData={resetCanvasData} />
        </Splitter.Panel>
        <Splitter.Panel>
          <div className="  px-1 pt-1  h-full">
            <div className="flex  h-full bg-white">
              <MindMapCanvasContainer ref={mindRef} />
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>

      <SideDrawer open={isDrawerOpend} onClose={() => setIsDrawerOpend(false)} />
    </>
  )
}

export default MindMapPage
