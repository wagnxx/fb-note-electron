// src/pages/MindMapPage.tsx
import React from 'react'
import { ExtendedNode } from '@/features/mindmap/components/FlowDiagram'
import { Edge, ReactFlowProvider } from 'react-flow-renderer'
import { Button, Splitter } from 'antd'
import SidebarTabs from './components/SidebarTabs'
import SideDrawer from './components/SideDrawer'
import MindMapCanvasContainer from './components/MindMapCanvasContainer'
import { SettingFilled } from '@ant-design/icons'

export type SheetTag = {
  name: string
  selected?: boolean
  nodes: ExtendedNode[]
  edges: Edge[]
}

const MindMapPage: React.FC = () => {
  const [isDrawerVisible, setvIsDrawerVisible] = React.useState<boolean>(false)

  return (
    <ReactFlowProvider>
      <Splitter style={{ height: 'calc(100vh - 30px)', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        <Splitter.Panel defaultSize="20%" min="2%" max="40%">
          <SidebarTabs />
        </Splitter.Panel>
        <Splitter.Panel>
          <div className=" flex flex-row p-2" style={{ height: 'calc(100%)', width: '100%' }}>
            <div
              style={{
                height: '100%',
                width: 'calc(100% - 30px)',
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
              }}
            >
              <MindMapCanvasContainer />
            </div>
            <div
              style={{
                width: '30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                background: '#eaeaea',
              }}
            >
              <Button icon={<SettingFilled />} type="text" onClick={() => setvIsDrawerVisible(true)} />
              {/* <Button icon={<PlusOutlined />} type="text" onClick={() => setvIsDrawerVisible(true)} /> */}
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>

      <SideDrawer open={isDrawerVisible} onClose={() => setvIsDrawerVisible(false)} />
    </ReactFlowProvider>
  )
}

export default MindMapPage
