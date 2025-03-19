// src/pages/MindMapPage.tsx
import React, { useRef } from 'react'
import { ExtendedNode } from '@/features/mindmap/components/flows/Flow'
import { Edge, ReactFlowProvider } from '@xyflow/react'
import { Button, Splitter } from 'antd'
import SidebarDir from './components/SidebarDir'
import SideDrawer from './components/SideDrawer'
import MindMapCanvasContainer, { MindMapRef, TabItem } from './components/MindMapCanvasContainer'
import { SettingFilled } from '@ant-design/icons'

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
  const [isDrawerVisible, setvIsDrawerVisible] = React.useState<boolean>(false)
  const mindRef = useRef<MindMapRef>(null)

  const getCanvasData = () => {
    return mindRef.current?.getData()
  }

  const resetCanvasData = (data: TabItem[]) => {
    mindRef.current?.resetItems(data)
  }

  return (
    <ReactFlowProvider>
      <Splitter style={{ height: 'calc(100vh - 30px)', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        <Splitter.Panel defaultSize="30%" min="2%" max="40%">
          <SidebarDir getCanvasData={getCanvasData} resetCanvasData={resetCanvasData} />
        </Splitter.Panel>
        <Splitter.Panel>
          <div className=" flex flex-row p-2" style={{ height: 'calc(100%)', width: '100%' }}>
            <div
              className="flex flex-col h-full"
              style={{
                width: 'calc(100% - 30px)',
                background: '#fff',
              }}
            >
              <MindMapCanvasContainer ref={mindRef} />
            </div>
            <div
              className="flex flex-col justify-start"
              style={{
                width: '30px',
                background: '#eaeaea',
              }}
            >
              <Button icon={<SettingFilled />} type="text" onClick={() => setvIsDrawerVisible(true)} />
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>

      <SideDrawer open={isDrawerVisible} onClose={() => setvIsDrawerVisible(false)} />
    </ReactFlowProvider>
  )
}

export default MindMapPage
