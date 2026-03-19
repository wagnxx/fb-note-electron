import React, { useState } from 'react'
import { Button, Spin, message } from 'antd'
import googleDriveService from '@/utils/googleDriveApi'

interface GoogleDrivePickerProps {
  onPick?: (doc: any) => void
}

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onPick }) => {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await googleDriveService.ensureScriptsLoaded()
      await googleDriveService.openPicker(onPick)
    } catch (err: any) {
      console.error('Google Picker error:', err)
      message.error(`Google Picker 失败：${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Spin spinning={loading}>
      <Button type="primary" onClick={handleClick}>
        Select File from Google Drive
      </Button>
    </Spin>
  )
}

export default GoogleDrivePicker
