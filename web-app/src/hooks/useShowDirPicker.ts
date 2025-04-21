import { useState } from 'react'
// import { FILE_PICKER_RES } from '../../../shared/types'
// import { FILE_PICKER_RES } from '@shared/'

const { ipcRenderer, IPC_ACTIONS } = window.electron || {}

const useShowDirPicker = () => {
  const [filePath, setFilePth] = useState('')
  const handleSelectDirectory = async () => {
    const selectedDir = await ipcRenderer.invoke(IPC_ACTIONS.SELECT_FILE, {
      type: 'directory',
    })
    if (selectedDir?.path) {
      setFilePth(selectedDir.path)
    }
  }

  return {
    handleSelectDirectory,
    filePath,
  }
}

export default useShowDirPicker
