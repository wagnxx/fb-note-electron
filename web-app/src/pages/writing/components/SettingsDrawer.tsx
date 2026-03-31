import React, { useEffect, useState } from 'react'
import {
  Drawer,
  Button,
  Typography,
  Space,
  notification,
  Tooltip,
  Popconfirm,
  Divider,
  Alert,
  Card,
  Input,
  Row,
  Col,
} from 'antd'
import { SettingOutlined, FolderOpenOutlined, CopyOutlined, CloseOutlined } from '@ant-design/icons'

const { ipcRenderer, IPC_ACTIONS } = (window as any).electron || {}

type Props = {
  visible: boolean
  onClose: () => void
}

const SettingsDrawer: React.FC<Props> = ({ visible, onClose }) => {
  const [currentDir, setCurrentDir] = useState<string>('')
  const [selectedDir, setSelectedDir] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [infoMsg, setInfoMsg] = useState<string>('')
  const [dirInfo, setDirInfo] = useState<any>(null)

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
        setInfoMsg('')
        // validate selected target
        try {
          const info = await ipcRenderer.invoke(IPC_ACTIONS.VALIDATE_DIR, res.path)
          setDirInfo(info)
        } catch {
          setDirInfo(null)
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const clearSelected = () => {
    setSelectedDir('')
    setInfoMsg('')
    setDirInfo(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notification.success({ message: 'Copied', description: 'Path copied to clipboard' })
    } catch (e) {
      notification.error({ message: 'Copy failed' })
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
      <Space direction="vertical" style={{ width: '100%' }} size={20}>
        <Card size="small" style={{ borderRadius: 8, background: '#fafafa' }} bodyStyle={{ padding: 12 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col span={24}>
              <Typography.Text strong>Current storage directory</Typography.Text>
            </Col>

            <Col span={24}>
              <Input
                value={currentDir || ''}
                placeholder="Not configured"
                readOnly
                aria-label="current-dir-input"
                addonBefore={<FolderOpenOutlined />}
                suffix={
                  <Space>
                    <Tooltip title="Open directory">
                      <Button
                        type="text"
                        size="small"
                        icon={<FolderOpenOutlined />}
                        onClick={onOpenDir}
                        aria-label="open-dir"
                      />
                    </Tooltip>
                    <Tooltip title="Copy path">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(currentDir)}
                        aria-label="copy-dir"
                        disabled={!currentDir}
                      />
                    </Tooltip>
                  </Space>
                }
              />
            </Col>
          </Row>
        </Card>

        <Card size="small" style={{ borderRadius: 8 }} bodyStyle={{ padding: 12 }}>
          <Row gutter={[12, 12]} align="middle">
            <Col span={24}>
              <Typography.Text strong>Choose new directory</Typography.Text>
            </Col>

            <Col span={24}>
              <Input
                value={selectedDir || ''}
                placeholder="No directory selected"
                readOnly
                aria-label="selected-dir-input"
                suffix={
                  <Space>
                    <Button type="default" size="small" onClick={chooseDir} aria-label="browse">
                      Browse
                    </Button>
                    {selectedDir ? (
                      <Tooltip title="Clear selection">
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={clearSelected}
                          aria-label="clear-selected"
                        />
                      </Tooltip>
                    ) : null}
                  </Space>
                }
              />
            </Col>

            {selectedDir ? (
              <Col span={24}>
                <Typography.Text type="secondary">
                  Selected directory will be used for new storage or migration.
                </Typography.Text>
              </Col>
            ) : null}
            {dirInfo ? (
              <Col span={24}>
                {dirInfo.isDirectory ? (
                  dirInfo.isEmpty ? (
                    <Alert message={`Target is empty (${dirInfo.fileCount} files)`} type="success" showIcon />
                  ) : (
                    <Alert message={`Target is not empty (${dirInfo.fileCount} files)`} type="info" showIcon />
                  )
                ) : (
                  <Alert message={`Not a directory or inaccessible`} type="warning" showIcon />
                )}
                {!dirInfo.writable && <Typography.Text type="warning"> Directory is not writable.</Typography.Text>}
              </Col>
            ) : null}
          </Row>
        </Card>

        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button
                type="primary"
                loading={loading}
                disabled={
                  !selectedDir ||
                  selectedDir === currentDir ||
                  dirInfo?.error === 'forbidden_project_root' ||
                  (dirInfo && (!dirInfo.isDirectory || !dirInfo.writable))
                }
                onClick={() => onSetDir(false)}
                aria-label="use-directory"
              >
                Use this directory
              </Button>
              <Popconfirm
                title="Migrate current files to the new directory? This will copy files and remove the old ones."
                onConfirm={() => onSetDir(true)}
                okText="Confirm"
                cancelText="Cancel"
                disabled={
                  !selectedDir ||
                  selectedDir === currentDir ||
                  dirInfo?.error === 'forbidden_project_root' ||
                  (dirInfo && (!dirInfo.isDirectory || !dirInfo.writable))
                }
              >
                <Button
                  danger
                  loading={loading}
                  disabled={
                    !selectedDir ||
                    selectedDir === currentDir ||
                    dirInfo?.error === 'forbidden_project_root' ||
                    (dirInfo && (!dirInfo.isDirectory || !dirInfo.writable))
                  }
                  aria-label="migrate"
                >
                  Migrate and move files here
                </Button>
              </Popconfirm>
            </Space>
          </div>
          <div style={{ marginTop: 8 }}>
            {!selectedDir && <Typography.Text type="secondary">Select a directory to enable actions.</Typography.Text>}
            {selectedDir && selectedDir === currentDir && (
              <Typography.Text type="secondary">Selected directory is same as current directory.</Typography.Text>
            )}
            {dirInfo?.error === 'forbidden_project_root' && (
              <div>
                <Typography.Text type="danger">
                  Selected directory cannot be the project root (except the default support directory).
                </Typography.Text>
              </div>
            )}
            {dirInfo && !dirInfo.isDirectory && (
              <div>
                <Typography.Text type="warning">Selected path is not a directory.</Typography.Text>
              </div>
            )}
            {dirInfo && !dirInfo.writable && (
              <div>
                <Typography.Text type="warning">Selected directory is not writable.</Typography.Text>
              </div>
            )}
          </div>
        </div>

        <Divider />

        <Alert
          message="Migration behavior"
          description={
            <div>
              <div>• If the target directory is empty, migration will move all files (clean transfer).</div>
              <div>• If the target directory is not empty, files will be copied into it (merge/commit-style).</div>
              <div style={{ marginTop: 6 }}>You will be prompted to confirm before any destructive action.</div>
            </div>
          }
          type="info"
          showIcon
        />

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
