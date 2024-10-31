// src/pages/MindMapPage.tsx
import React from 'react'
import MindMapCanvas from '@/features/mindmap/components/FlowDiagram'
import { ReactFlowProvider } from 'react-flow-renderer'

const MindMapPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <MindMapCanvas />
    </ReactFlowProvider>
  )
}

export default MindMapPage
