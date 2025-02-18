import { LeftOutlined } from '@ant-design/icons'
import { Button, Tabs, TabsProps } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

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

const SidebarTabs = () => {
  const navigate = useNavigate()

  return (
    <div className="p-2">
      <div className="flex flex-row justify-between">
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}></Button>
        <Button>Save to Local</Button>
        <Button>Save to Cloud</Button>
      </div>
      <h2>Recent</h2>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  )
}

export default SidebarTabs
