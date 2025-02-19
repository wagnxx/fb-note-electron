import { formatDate } from '@/utils/utilsDate'
import { CheckOutlined, CloseOutlined, LeftOutlined } from '@ant-design/icons'
import { Button, List, Popconfirm, Tabs, TabsProps } from 'antd'
import React, { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoragedFile } from '../MindMap'

const SidebarTabs: FC<{
  fileList: StoragedFile[]
  selectedFileName: string | null
  onSaveLocal: () => void
  onGetLocalFile: (filename: string) => void
  onRemoveItem: (filepath: string) => void
  onSaveItem: (filename: string) => void
}> = ({ fileList, onSaveLocal, selectedFileName, onGetLocalFile, onRemoveItem, onSaveItem }) => {
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
                style={{ background: selectedFileName === item.name ? '#e6f7ff' : '' }}
                actions={[
                  <Popconfirm
                    title="Delete the task"
                    description="Are you sure to delete the file?"
                    onConfirm={() => onRemoveItem(item.path)}
                    okText="Yes"
                    cancelText="No"
                    disabled={selectedFileName !== item.name}
                  >
                    <CloseOutlined />
                  </Popconfirm>,
                  <Popconfirm
                    title="Submit the task"
                    description="Are you sure to resave file?"
                    onConfirm={() => onSaveItem(item.name)}
                    okText="Yes"
                    cancelText="No"
                    disabled={selectedFileName !== item.name}
                  >
                    <CheckOutlined />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div
                      style={{ cursor: selectedFileName === item.name ? 'no-allowd' : 'pointer' }}
                      onClick={() => onGetLocalFile(item.name)}
                    >
                      <Button
                        disabled={selectedFileName === item.name}
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

  return (
    <div className="p-2">
      <div className="flex flex-row justify-between">
        <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}></Button>
        <Button onClick={() => onSaveLocal()}>Save to Local</Button>
        <Button>Save to Cloud</Button>
      </div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  )
}

export default SidebarTabs
