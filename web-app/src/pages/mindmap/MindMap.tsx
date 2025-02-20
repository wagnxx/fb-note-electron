// src/pages/MindMapPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import { ExtendedNode } from '@/features/mindmap/components/FlowDiagram'
import { Edge, ReactFlowProvider } from 'react-flow-renderer'
import { Button, Form, FormInstance, Input, Splitter } from 'antd'
import SidebarTabs from './components/SidebarTabs'
import SideDrawer from './components/SideDrawer'
import MindMapCanvasContainer, { MindMapRef, TabItem } from './components/MindMapCanvasContainer'
import { SettingFilled } from '@ant-design/icons'
import { useNotification } from '@/hooks/useNotification'
import { delJsonFile, getJsonFromDocFile, saveJsonToDocFile } from '@/utils/utilsIpc'
import useFirstRender from '@/hooks/useFirstRender'

export type SheetTag = {
  name: string
  selected?: boolean
  nodes: ExtendedNode[]
  edges: Edge[]
}
export type StoragedFile = {
  name: string
  path: string
  lastModified: number
}

const FILELIST_STORAGE_KEY = 'MaindMap_paeg_file_list_key'

const MindMapPage: React.FC = () => {
  const [fileList, setFileList] = useState<StoragedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<StoragedFile | null>(null)
  const [isDrawerVisible, setvIsDrawerVisible] = React.useState<boolean>(false)
  const mindRef = useRef<MindMapRef>(null)

  const { showConfirmModal, showNotification, handleRequestWithNotification } = useNotification()
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

  const handleSaveLocal = async () => {
    const data = mindRef.current?.getData()
    if (!data) return
    // localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const docTypeFormRef = React.createRef<FormInstance<any>>()

    const values = await showConfirmModal<{ filename: string }>({
      title: 'Input File Name',
      content: (
        <Form ref={docTypeFormRef}>
          <Form.Item name="filename" rules={[{ required: true, message: 'Please input filername!' }]}>
            <Input />
          </Form.Item>
        </Form>
      ),
    })

    if (!values) return

    const filename = values.filename
    if (!filename) return

    if (fileList.some(file => file.name === filename)) {
      showNotification('error', `The name '${filename}' is already taken. Please change it.`, 'message')
      return
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
    }
  }

  const handleGetLocalFile = async (file: StoragedFile) => {
    const data = await getJsonFromDocFile<TabItem>(file.name)
    if (data) {
      mindRef.current?.resetItems(data)
    }
    setSelectedFile(file)
  }

  const handleRemoveItem = async (file: StoragedFile) => {
    const r = await handleRequestWithNotification(async () => delJsonFile(file.path), { successField: null })

    if (r) {
      setFileList(prevList => prevList.filter(f => f.path !== file.path))
    }

    if (r && file.path === selectedFile?.path) {
      setSelectedFile(null)
      mindRef.current?.resetItems([])
    }
  }
  const handleSaveItem = async (file: StoragedFile) => {
    const data = mindRef.current?.getData()
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

  return (
    <ReactFlowProvider>
      <Splitter style={{ height: 'calc(100vh - 30px)', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        <Splitter.Panel defaultSize="30%" min="2%" max="40%">
          <SidebarTabs
            fileList={fileList}
            selectedFile={selectedFile}
            onSaveLocal={handleSaveLocal}
            onGetLocalFile={handleGetLocalFile}
            onRemoveItem={handleRemoveItem}
            onSaveItem={handleSaveItem}
          />
        </Splitter.Panel>
        <Splitter.Panel>
          <div className=" flex flex-row p-2" style={{ height: 'calc(100%)', width: '100%' }}>
            <div
              style={{
                height: '100%',
                width: 'calc(100% - 30px)',
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
              }}
            >
              <MindMapCanvasContainer ref={mindRef} />
            </div>
            <div
              style={{
                width: '30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                background: '#eaeaea',
              }}
            >
              <Button icon={<SettingFilled />} type="text" onClick={() => setvIsDrawerVisible(true)} />
              {/* <Button icon={<PlusOutlined />} type="text" onClick={() => setvIsDrawerVisible(true)} /> */}
            </div>
          </div>
        </Splitter.Panel>
      </Splitter>

      <SideDrawer open={isDrawerVisible} onClose={() => setvIsDrawerVisible(false)} />
    </ReactFlowProvider>
  )
}

export default MindMapPage
