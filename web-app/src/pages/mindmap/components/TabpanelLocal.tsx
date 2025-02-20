import { formatDate } from '@/utils/utilsDate'
import { CloseOutlined, CheckOutlined } from '@ant-design/icons'
import { List, Popconfirm, Button } from 'antd'
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { StoragedFile } from '../MindMap'
import { useNotification } from '@/hooks/useNotification'
import { delJsonFile, getJsonFromDocFile, saveJsonToDocFile } from '@/utils/utilsIpc'
import useFirstRender from '@/hooks/useFirstRender'
import { TabItem } from './MindMapCanvasContainer'
import { TabpanelRef } from './SidebarDir'

const FILELIST_STORAGE_KEY = 'MaindMap_paeg_file_list_key'

type Props = {
  getCanvasData: () => TabItem[] | undefined
  resetCanvasData: (data: TabItem[]) => void
}

const TabpanelLocal = forwardRef<TabpanelRef, Props>(({ getCanvasData, resetCanvasData }, ref) => {
  const [fileList, setFileList] = useState<StoragedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<StoragedFile | null>(null)

  const { handleRequestWithNotification, showNotification } = useNotification()

  const isFirstRender = useFirstRender()

  useEffect(() => {
    if (isFirstRender) return
    localStorage.setItem(FILELIST_STORAGE_KEY, JSON.stringify(fileList))
  }, [fileList, isFirstRender])
  useEffect(() => {
    const dataStr = localStorage.getItem(FILELIST_STORAGE_KEY)
    const data = JSON.parse(dataStr!)
    setFileList(data)
  }, [])

  const handleRemoveItem = async (file: StoragedFile) => {
    const r = await handleRequestWithNotification(async () => delJsonFile(file.path), { successField: null })

    if (r) {
      setFileList(prevList => prevList.filter(f => f.path !== file.path))
    }

    if (r && file.path === selectedFile?.path) {
      setSelectedFile(null)
      resetCanvasData([])
    }
  }
  const handleSaveItem = async (file: StoragedFile) => {
    const data = getCanvasData()
    if (!data) return
    const filepath = await handleRequestWithNotification(async () => saveJsonToDocFile(file.name, data), {
      successField: null,
      successMessage: 'Saved successfully',
    })

    if (filepath) {
      setFileList(prevList => {
        return prevList.map(f => (f.name === file.name ? { ...f, lastModified: Date.now() } : f))
      })
    }
  }

  const handleGetLocalFile = async (file: StoragedFile) => {
    const data = await getJsonFromDocFile<TabItem>(file.name)
    if (data) {
      resetCanvasData(data)
    }
    setSelectedFile(file)
  }

  const handleSaveAsNew = useCallback(
    async (filename: string, data: TabItem[]): Promise<boolean> => {
      if (fileList.some(file => file.name === filename)) {
        showNotification('error', `The name '${filename}' is already taken. Please change it.`, 'message')
        return false
      }

      const filepath = await handleRequestWithNotification(async () => saveJsonToDocFile(filename, data), {
        successField: null,
        successMessage: 'Saved successfully',
      })

      if (filepath) {
        const file = { name: filename, path: filepath, lastModified: Date.now() }
        setFileList(prevList => {
          return [...prevList, file]
        })
        setSelectedFile(file)
        return true
      }
      return false
    },
    [fileList, handleRequestWithNotification, showNotification],
  )

  useImperativeHandle(ref, () => {
    return {
      saveNewFile: handleSaveAsNew,
      saveFile() {},
    }
  }, [handleSaveAsNew])

  return (
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
                onConfirm={() => handleRemoveItem(item)}
                okText="Yes"
                cancelText="No"
              >
                <CloseOutlined />
              </Popconfirm>,
              <Popconfirm
                title="Submit the task"
                description="Are you sure to resave file?"
                onConfirm={() => handleSaveItem(item)}
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
                  onClick={() => handleGetLocalFile(item)}
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
              description={formatDate(new Date(item.lastModified))}
            />
          </List.Item>
        )}
      />
    </div>
  )
})

export default TabpanelLocal
