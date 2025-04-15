// src/pages/MindMapPage.tsx
import React from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

const MindMapNav: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div style={{ height: 'calc(100vh - 60px)' }}>
      <Button onClick={() => navigate('/tool/mindmap/make')}>Go MindMap Page</Button>
    </div>
  )
}

export default MindMapNav
