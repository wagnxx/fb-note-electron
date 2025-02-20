import { formatDate } from '@/utils/utilsDate'
import { CheckOutlined, CloseOutlined, DownOutlined, LeftOutlined } from '@ant-design/icons'
import { Button, Dropdown, List, MenuProps, Popconfirm, Tabs, TabsProps } from 'antd'
import React, { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoragedFile } from '../MindMap'

const SidebarTabs: FC<{
  fileList: StoragedFile[]
  selectedFile: StoragedFile | null
  onSaveLocal: () => void
  onGetLocalFile: (file: StoragedFile) => void
  onRemoveItem: (file: StoragedFile) => void
  onSaveItem: (filename: StoragedFile) => void
}> = ({ fileList, onSaveLocal, selectedFile, onGetLocalFile, onRemoveItem, onSaveItem }) => {
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const getDataTime = (n: number) => {
    return formatDate(new Date(n))
  }

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Local',
      children: (
        <div>
          <List
            dataSource={fileList}
            renderItem={item => (
              <List.Item
                style={{ background: selectedFile?.name === item.name ? '#e6f7ff' : '' }}
                actions={[
                  <Popconfirm
                    title="Delete the task"
                    description="Are you sure to delete the file?"
                    onConfirm={() => onRemoveItem(item)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <CloseOutlined />
                  </Popconfirm>,
                  <Popconfirm
                    title="Submit the task"
                    description="Are you sure to resave file?"
                    onConfirm={() => onSaveItem(item)}
                    okText="Yes"
                    cancelText="No"
                    disabled={selectedFile?.name !== item.name}
                  >
                    <CheckOutlined />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div
                      style={{ cursor: selectedFile?.name === item.name ? 'no-allowd' : 'pointer' }}
                      onClick={() => onGetLocalFile(item)}
                    >
                      <Button
                        disabled={selectedFile?.name === item.name}
                        block
                        type="text"
                        style={{ textAlign: 'left', display: 'unset' }}
                      >
                        {item.name}
                      </Button>
                    </div>
                  }
                  description={getDataTime(item.lastModified)}
                />
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: 'Cloud-based',
      children: 'Recently downloaded files from the cloud',
    },
  ]

  const memuItems: MenuProps['items'] = [
    {
      key: '1',
      label: <span onClick={() => onSaveLocal()}>Save Locally As New</span>,
    },
    {
      key: '2',
      label: <span onClick={() => {}}>Save to Cloud As New</span>,
    },
    {
      key: '3',
      label: <span onClick={() => {}}>Save File</span>,
    },
  ]

  return (
    <div className="p-2">
      <div className="flex flex-row justify-between items-center">
        <Button icon={<LeftOutlined />} type="text" onClick={() => navigate(-1)}></Button>
        {/* <Button onClick={() => onSaveLocal()}>Save to Local</Button>
        <Button>Save to Cloud</Button> */}
        <Dropdown menu={{ items: memuItems }} trigger={['click']}>
          <Button loading={isSaving} icon={<DownOutlined />} iconPosition="end" type="text">
            Save
          </Button>
        </Dropdown>
      </div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  )
}

export default SidebarTabs
