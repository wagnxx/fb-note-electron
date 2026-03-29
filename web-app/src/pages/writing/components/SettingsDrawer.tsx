import React, { useEffect, useState } from 'react'
import { Drawer, Button, Typography, Space, notification } from 'antd'
import { SettingOutlined, FolderOpenOutlined } from '@ant-design/icons'

const { ipcRenderer, IPC_ACTIONS } = (window as any).electron || {}

type Props = {
  visible: boolean
  onClose: () => void
}

const SettingsDrawer: React.FC<Props> = ({ visible, onClose }) => {
  const [currentDir, setCurrentDir] = useState<string>('')
  const [selectedDir, setSelectedDir] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const fetchCurrent = async () => {
    if (!ipcRenderer) return
    try {
      const dir = await ipcRenderer.invoke(IPC_ACTIONS.GET_SETTINGS_DIR)
      setCurrentDir(dir || '')
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (visible) fetchCurrent()
  }, [visible])

  const chooseDir = async () => {
    if (!ipcRenderer) return
    try {
      const res = await ipcRenderer.invoke(IPC_ACTIONS.SELECT_FILE, { type: 'directory' })
      if (res && res.path) {
        setSelectedDir(res.path)
      }
    } catch (e) {
      // ignore
    }
  }

  const onSetDir = async (migrate = false) => {
    if (!ipcRenderer || !selectedDir) return
    setLoading(true)
    try {
      if (migrate) {
        const r = await ipcRenderer.invoke(IPC_ACTIONS.MIGRATE_SETTINGS, selectedDir, { migrate: true })
        if (r?.ok) {
          notification.success({ message: 'Settings migrated', description: 'Migration completed.' })
          setCurrentDir(selectedDir)
        } else {
          notification.error({ message: 'Migration failed', description: r?.error || 'unknown' })
        }
      } else {
        const r = await ipcRenderer.invoke(IPC_ACTIONS.SET_SETTINGS_DIR, selectedDir)
        if (r?.ok) {
          notification.success({ message: 'Settings updated', description: 'Directory changed.' })
          setCurrentDir(selectedDir)
        } else {
          notification.error({ message: 'Update failed', description: r?.error || 'unknown' })
        }
      }
    } catch (e) {
      notification.error({ message: 'Operation failed', description: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const onOpenDir = async () => {
    if (!ipcRenderer) return
    try {
      await ipcRenderer.invoke(IPC_ACTIONS.OPEN_SETTINGS_DIR)
    } catch (e) {
      // ignore
    }
  }

  return (
    <Drawer
      title={
        <span>
          <SettingOutlined /> Settings
        </span>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={520}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Typography.Text strong>Current storage directory</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Typography.Text code>{currentDir || 'Not configured'}</Typography.Text>
            <Button style={{ marginLeft: 12 }} icon={<FolderOpenOutlined />} onClick={onOpenDir} />
          </div>
        </div>

        <div>
          <Typography.Text strong>Choose new directory</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Typography.Text code>{selectedDir || 'No directory selected'}</Typography.Text>
            <Button style={{ marginLeft: 12 }} onClick={chooseDir}>
              Browse
            </Button>
          </div>
        </div>

        <div>
          <Space>
            <Button type="primary" loading={loading} disabled={!selectedDir} onClick={() => onSetDir(false)}>
              Set directory (no migration)
            </Button>
            <Button danger loading={loading} disabled={!selectedDir} onClick={() => onSetDir(true)}>
              Migrate current content to new directory
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: 10 }}>
          <Typography.Text type="secondary">
            Note: Migration will copy existing files to the new directory and remove the old ones.
          </Typography.Text>
        </div>
      </Space>
    </Drawer>
  )
}

export default SettingsDrawer
