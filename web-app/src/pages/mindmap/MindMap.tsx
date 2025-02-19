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
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [isDrawerVisible, setvIsDrawerVisible] = React.useState<boolean>(false)
  const mindRef = useRef<MindMapRef>(null)

  const { showConfirmModal, showNotification } = useNotification()
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

  const handleSaveLocal = () => {
    const data = mindRef.current?.getData()
    if (!data) return
    // localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const docTypeFormRef = React.createRef<FormInstance<any>>()

    showConfirmModal<{ filename: string }>({
      title: 'Input File Name',
      content: (
        <Form ref={docTypeFormRef}>
          <Form.Item name="filename" rules={[{ required: true, message: 'Please input filername!' }]}>
            <Input />
          </Form.Item>
        </Form>
      ),
    })
      .then(values => {
        const filename = values.filename
        if (!filename) return
        console.log('onOk : ', values)
        if (fileList.some(file => file.name === filename)) {
          showNotification('error', `The name '${filename}' is already taken. Please change it.`, 'message')
          return
        }
        saveJsonToDocFile(filename, data)
          .then(filepath => {
            if (!filepath) return
            setFileList(prevList => {
              return [...prevList, { name: filename, path: filepath, lastModified: Date.now() }]
            })
          })
          .catch(err => {})
      })
      .catch(reason => {
        console.log('closed reason: ', reason)
      })
  }

  const handleGetLocalFile = async (filename: string) => {
    const data = await getJsonFromDocFile<TabItem>(filename)
    if (data) {
      mindRef.current?.resetItems(data)
    }
    setSelectedFileName(filename)
  }

  const handleRemoveItem = (filepath: string) => {
    delJsonFile(filepath).then(res => {
      if (res) {
        setFileList(prevList => prevList.filter(file => file.path !== filepath))
      }
    })
  }
  const handleSaveItem = (filename: string) => {
    const data = mindRef.current?.getData()
    if (!data) return
    saveJsonToDocFile(filename, data)
      .then(res => {
        showNotification('success', 'Operation successful', 'message')
        setFileList(prevList => {
          return prevList.map(file => (file.name === filename ? { ...file, lastModified: Date.now() } : file))
        })
      })
      .catch(err => {})
  }

  return (
    <ReactFlowProvider>
      <Splitter style={{ height: 'calc(100vh - 30px)', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        <Splitter.Panel defaultSize="30%" min="2%" max="40%">
          <SidebarTabs
            fileList={fileList}
            selectedFileName={selectedFileName}
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
