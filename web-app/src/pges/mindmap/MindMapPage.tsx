// src/pages/MindMapPage.tsx
import React from 'react'
import MindMapCanvas from '@/features/mindmap/components/FlowDiagram'
import { ReactFlowProvider } from 'react-flow-renderer'
import { Button, Splitter, Tabs, TabsProps, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const items: TabsProps['items'] = [
  {
    key: '1',
    label: 'Local',
    children: 'Recently opened file',
  },
  {
    key: '2',
    label: 'Cloud-based',
    children: 'Recently downloaded files from the cloud',
  },
]

const MindMapPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <Splitter style={{ height: '100vh', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        <Splitter.Panel defaultSize="20%" min="2%" max="40%">
          <div className=" p-2">
            <div className="flex flex-row justify-between">
              <Button>Save to Local</Button>
              <Button>Save to Cloud</Button>
            </div>
            <h2>Recent</h2>
            <Tabs defaultActiveKey="1" items={items} />
          </div>
        </Splitter.Panel>
        <Splitter.Panel>
          <div className=" flex flex-col" style={{ height: '100%' }}>
            <MindMapCanvas bgColor="#aaa" className="flex-1" />
            <div
              style={{
                border: '1px solid #ddd',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Tag style={{ padding: '2px ' }}>Default page</Tag>
              <PlusOutlined />
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>
    </ReactFlowProvider>
  )
}

export default MindMapPage
