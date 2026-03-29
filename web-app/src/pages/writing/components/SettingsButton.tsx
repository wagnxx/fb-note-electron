import React, { useState } from 'react'
import { Button } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import SettingsDrawer from './SettingsDrawer'

const SettingsButton: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 9999 }}>
        <Button shape="circle" size="large" icon={<SettingOutlined />} onClick={() => setOpen(true)} />
      </div>
      <SettingsDrawer visible={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default SettingsButton
