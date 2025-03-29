// src/pages/MindMapPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Splitter } from 'antd'
import SidebarDir from './components/SidebarDir'
import SideDrawer from './components/SideDrawer'
import MindMapCanvasContainer, { MindMapRef } from './components/MindMapCanvasContainer'
import { LeftOutlined, SettingFilled, SettingTwoTone } from '@ant-design/icons'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useFirstRender from '@/hooks/useFirstRender'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { TabItem } from '@/features/mindmap/types'

const MindMapPage: React.FC = () => {
  const [isSiderOpend, setIsSiderOpend] = useState(true)
  const [isDrawerVisible, setvIsDrawerVisible] = React.useState<boolean>(false)
  const [isDrawerOpend, setIsDrawerOpend] = React.useState<boolean>(false)

  const mindRef = useRef<MindMapRef>(null)
  const isFirstRender = useFirstRender()
  const currentNodeId = useSelector((state: RootState) => state.mindmapConfig.currentNodeId)

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
    setIsSiderOpend(pre => !pre)
  }

  useEffect(() => {
    if (isFirstRender) return
    setIsDrawerOpend(!!currentNodeId && isDrawerVisible)
  }, [isFirstRender, currentNodeId, isDrawerVisible])

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

            <Button
              icon={isDrawerVisible ? <SettingTwoTone /> : <SettingFilled />}
              type="text"
              onClick={() => setvIsDrawerVisible(pre => !pre)}
            />
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
