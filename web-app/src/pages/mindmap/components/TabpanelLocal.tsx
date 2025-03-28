import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'

import { useNotification } from '@/hooks/useNotification'
import { delJsonFile, getJsonFromDocFile, saveJsonToDocFile } from '@/utils/utilsIpc'
import useFirstRender from '@/hooks/useFirstRender'

import { TabpanelRef } from './SidebarDir'
import TabpanelList from './TabpanelList'
import { Spin } from 'antd'
import { StoragedFile, TabItem } from '@/features/mindmap/types'

const FILELIST_STORAGE_KEY = 'MaindMap_paeg_file_list_key'

type Props = {
  getCanvasData: () => TabItem[] | undefined
  resetCanvasData: (data: TabItem[]) => void
}

const TabpanelLocal = forwardRef<TabpanelRef, Props>(({ getCanvasData, resetCanvasData }, ref) => {
  const [fileList, setFileList] = useState<StoragedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<StoragedFile | null>(null)
  const [loading, setLoading] = useState(false)

  const { handleRequestWithNotification, showNotification } = useNotification()

  const isFirstRender = useFirstRender()

  useEffect(() => {
    if (isFirstRender) return
    localStorage.setItem(FILELIST_STORAGE_KEY, JSON.stringify(fileList))
  }, [fileList, isFirstRender])
  useEffect(() => {
    const dataStr = localStorage.getItem(FILELIST_STORAGE_KEY)
    const data = JSON.parse(dataStr!) || []
    setFileList(data)
  }, [])

  const handleRemoveItem = async (file: StoragedFile) => {
    const r = await handleRequestWithNotification(async () => delJsonFile(file.path!), { successField: null })

    if (r) {
      setFileList(prevList => prevList.filter(f => f.path !== file.path))
    }

    if (r && file.path === selectedFile?.path) {
      setSelectedFile(null)
      resetCanvasData([])
    }
  }
  const handleSaveItem = useCallback(
    async (file: StoragedFile): Promise<boolean> => {
      const data = getCanvasData()
      if (!data) return false
      const filepath = await handleRequestWithNotification(async () => saveJsonToDocFile(file.name, data), {
        successField: null,
        successMessage: 'Saved successfully',
      })

      if (filepath) {
        setFileList(prevList => {
          return prevList.map(f => (f.name === file.name ? { ...f, lastModified: Date.now() } : f))
        })
        return true
      }
      return false
    },
    [getCanvasData, handleRequestWithNotification],
  )

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
      async saveFile() {
        if (selectedFile) {
          return handleSaveItem(selectedFile)
        }
        return false
      },
    }
  }, [handleSaveAsNew, handleSaveItem, selectedFile])

  return (
    <Spin spinning={loading}>
      <TabpanelList
        fileList={fileList}
        selectedFile={selectedFile}
        onRemoveItem={handleRemoveItem}
        onSaveItem={handleSaveItem}
        onClickItem={handleGetLocalFile}
      />
    </Spin>
  )
})

export default TabpanelLocal
