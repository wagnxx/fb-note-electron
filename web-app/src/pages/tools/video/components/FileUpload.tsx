import React from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { isElectron } from '@/utils/utilsSystem'
import { v4 as uuidv4 } from 'uuid'

export interface PlayItem {
  url: string
  name: string
  played: boolean
  id: string
  disabled?: boolean
}
interface FileUploadProps {
  fileInputRef: React.RefObject<HTMLInputElement>
  setPlaylist: React.Dispatch<React.SetStateAction<PlayItem[]>>
}
// 通过 preload 暴露的安全 IPC API
const { ipcRenderer, IPC_ACTIONS } = window.electron || {}
const FileUpload: React.FC<FileUploadProps> = ({ fileInputRef, setPlaylist }) => {
  // web input file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0]
      if (file && file.type.startsWith('video/')) {
        let videoUrl: string
        if (isElectron()) {
          const { path } = file as File & { path: string }
          videoUrl = path
        } else {
          videoUrl = URL.createObjectURL(file)
        }
        setPlaylist(prev => [
          ...prev,
          { url: videoUrl, name: file.name, played: false, id: uuidv4() },
        ])
      }
    }
  }

  // electron upload
  const handleFileUploadByElectron = (file: any) => {
    if (!file) return
    setPlaylist(prev => [...prev, { url: file.path, name: file.name, played: false, id: uuidv4() }])
  }
  // SELECT_FILE
  const openFileDialog = async () => {
    if (isElectron()) {
      const r = await ipcRenderer?.invoke(IPC_ACTIONS.SELECT_FILE, { type: 'file' })
      handleFileUploadByElectron(r)
      //
    } else {
      fileInputRef.current?.click()
    }
  }
  return (
    <div className="file-upload">
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <Button icon={<PlusOutlined />} onClick={openFileDialog}></Button>
    </div>
  )
}

export default FileUpload
