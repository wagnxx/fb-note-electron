import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { TabpanelRef } from './SidebarDir'
import { useNotification } from '@/hooks/useNotification'
import TabpanelList from './TabpanelList'
import { createMindFile, deleteMindFiles, getAllMindFiles, saveMindFile } from '@/service/mind'
import { useAuth } from '@/context/AuthContext'
import { Button, Spin } from 'antd'
import { Timestamp } from 'firebase/firestore'
import { CloudDownloadOutlined } from '@ant-design/icons'
import { TabItem, StoragedFile } from '@/features/mindmap/types'

export type CloudMindFile = {
  id?: string
  name: string
  lastModified: number
  data: TabItem[]
  order: number
}

type Props = {
  getCanvasData: () => TabItem[] | undefined
  resetCanvasData: (data: TabItem[]) => void
}

const TabpanelCloud = forwardRef<TabpanelRef, Props>(({ getCanvasData, resetCanvasData }, ref) => {
  const [fileList, setFileList] = useState<CloudMindFile[]>([])
  const [selectedFile, setSelectedFile] = useState<CloudMindFile | null>(null)
  const [loading, setLoading] = useState(false)
  const { handleRequestWithNotification, showNotification } = useNotification()

  const { isAuthenticated } = useAuth()

  const refreshData = () => {
    setLoading(true)
    return getAllMindFiles()
      .then(res => {
        if (!res) return
        const data = res.map(item => {
          return {
            id: item.id,
            name: item.name,
            lastModified: (item.updatedTime as Timestamp).seconds, // TODO
            data: item.data,
            order: item.order,
          }
        })
        setFileList(data)
        return data
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleRemoveItem = async (file: StoragedFile) => {
    const r = await handleRequestWithNotification(async () => deleteMindFiles([file.id!]), { successField: null })
    if (r) {
      setFileList(prevList => prevList.filter(f => f.id !== file.id))
    }
    if (r && file.id === selectedFile?.id) {
      setSelectedFile(null)
      resetCanvasData([])
    }
  }
  const handleSaveItem = useCallback(
    async (file: StoragedFile): Promise<boolean> => {
      const data = getCanvasData()
      if (!data || !file.id) return false
      const params = {
        id: file.id,
        name: file.name,
        data,
        // order: fileList.length,
      }
      const r = await handleRequestWithNotification(async () => saveMindFile(params), {
        successField: null,
        successMessage: 'Saved successfully',
      })
      if (r) {
        refreshData()
        return true
      }
      return false
    },
    [fileList.length, getCanvasData, handleRequestWithNotification],
  )

  const handleGetLocalFile = async (file: StoragedFile) => {
    const data = file.data
    if (data) {
      resetCanvasData(data)
    }
    setSelectedFile(file as CloudMindFile)
  }

  const handleSaveAsNew = useCallback(
    async (filename: string, data: TabItem[]): Promise<boolean> => {
      if (fileList.some(file => file.name === filename)) {
        showNotification('error', `The name '${filename}' is already taken. Please change it.`, 'message')
        return false
      }
      const params = {
        name: filename,
        data,
        order: fileList.length,
      }

      const rid = await handleRequestWithNotification(async () => createMindFile(params), {
        successField: null,
        successMessage: 'Saved successfully',
      })

      let lastData
      if (rid) {
        lastData = await refreshData()
      }

      if (rid && !selectedFile) {
        // const lastData = await refreshData()
        const file = lastData?.find(item => item.id === rid) || null
        setSelectedFile(file)
        return true
      }
      return false
    },
    [fileList, handleRequestWithNotification, selectedFile, showNotification],
  )

  useImperativeHandle(ref, () => {
    return {
      saveNewFile: handleSaveAsNew,
      async saveFile() {
        if (selectedFile) {
          return handleSaveItem(selectedFile)
        }
        return false
      },
    }
  }, [handleSaveAsNew, handleSaveItem, selectedFile])

  useEffect(() => {
    console.log('isAuthenticated:', isAuthenticated)
    if (!isAuthenticated) return
    refreshData()
  }, [isAuthenticated])

  return (
    <div>
      <Button icon={<CloudDownloadOutlined />} onClick={() => refreshData()}>
        Get List
      </Button>
      <Spin spinning={loading}>
        <TabpanelList
          fileList={fileList}
          selectedFile={selectedFile}
          onRemoveItem={handleRemoveItem}
          onSaveItem={handleSaveItem}
          onClickItem={handleGetLocalFile}
        />
      </Spin>
    </div>
  )
})

export default TabpanelCloud
