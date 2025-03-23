// src/pages/MindMapPage.tsx
import React, { useMemo, useRef, useState } from 'react'
import { ExtendedNode } from '@/features/mindmap/components/flows/Flow'
import { Edge } from '@xyflow/react'
import { Button, Splitter } from 'antd'
import SidebarDir from './components/SidebarDir'
import SideDrawer from './components/SideDrawer'
import MindMapCanvasContainer, { MindMapRef, TabItem } from './components/MindMapCanvasContainer'
import { LeftOutlined, SettingFilled } from '@ant-design/icons'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export type SheetTag = {
  name: string
  selected?: boolean
  nodes: ExtendedNode[]
  edges: Edge[]
}
export type StoragedFile = {
  name: string
  path?: string
  id?: string
  lastModified: number
  data?: TabItem[]
  order?: number
}

const MindMapPage: React.FC = () => {
  const [isSiderOpend, setIsSiderOpend] = useState(true)
  // const [siderWidth, setSiderWidth] = useState(240)
  const [isDrawerVisible, setvIsDrawerVisible] = React.useState<boolean>(false)
  const mindRef = useRef<MindMapRef>(null)

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

  return (
    <>
      <Splitter style={{ height: 'calc(100vh - 30px)', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }} onResize={() => {}}>
        <Splitter.Panel defaultSize={'40'} min={'40'} max={'40'} resizable={false}>
          <div className=" h-full flex  flex-col justify-between items-center">
            <div className="sider-tool_top">
              <Button icon={<LeftOutlined />} type="text" onClick={() => navigate(-1)} aria-label="back"></Button>
            </div>
            <div className="sider-tool_bottom flex flex-col items-center">
              <Button
                icon={isSiderOpend ? <PanelLeftClose /> : <PanelLeftOpen />}
                type="text"
                onClick={handleToggleSiderOpen}
              />
              <Button icon={<SettingFilled />} type="text" onClick={() => setvIsDrawerVisible(true)} />
            </div>
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

      <SideDrawer open={isDrawerVisible} onClose={() => setvIsDrawerVisible(false)} />
    </>
  )
}

export default MindMapPage
