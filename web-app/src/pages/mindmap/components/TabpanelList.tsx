import React, { FC } from 'react'
import { formatDate } from '@/utils/utilsDate'
import { CloseOutlined, CheckOutlined } from '@ant-design/icons'
import { List, Popconfirm, Button, Badge } from 'antd'
import { StoragedFile } from '@/features/mindmap/types'

const TabpanelList: FC<{
  fileList: StoragedFile[]
  selectedFile: StoragedFile | null
  onRemoveItem: (item: StoragedFile) => void
  onSaveItem: (item: StoragedFile) => void
  onClickItem: (item: StoragedFile) => void
  allowedActions?: {
    delete: boolean
    update: boolean
  }
}> = ({
  fileList,
  selectedFile,
  onRemoveItem,
  onSaveItem,
  onClickItem,
  allowedActions = { delete: true, update: true },
}) => {
  return (
    <List
      dataSource={fileList}
      renderItem={item => (
        <List.Item
          style={{ background: selectedFile?.name === item.name ? '#e6f7ff' : '' }}
          actions={[
            allowedActions.delete && (
              <Popconfirm
                title="Delete the task"
                description="Are you sure to delete the file?"
                onConfirm={() => onRemoveItem(item)}
                okText="Yes"
                cancelText="No"
                disabled={allowedActions.delete}
              >
                <CloseOutlined />
              </Popconfirm>
            ),
            allowedActions.update && (
              <Popconfirm
                title="Submit the task"
                description="Are you sure to resave file?"
                onConfirm={() => onSaveItem(item)}
                okText="Yes"
                cancelText="No"
                disabled={selectedFile?.name !== item.name}
              >
                <CheckOutlined />
              </Popconfirm>
            ),
          ]}
        >
          <List.Item.Meta
            title={
              <div
                className="flex"
                style={{ cursor: selectedFile?.name === item.name ? 'no-allowd' : 'pointer' }}
                onClick={() => onClickItem(item)}
              >
                <Button
                  disabled={selectedFile?.name === item.name}
                  block
                  type="text"
                  style={{ textAlign: 'left', display: 'unset' }}
                >
                  {item.name}
                </Button>
                <Badge count={item.order}></Badge>
              </div>
            }
            description={formatDate(new Date(item.lastModified))}
          />
        </List.Item>
      )}
    />
  )
}

export default TabpanelList
