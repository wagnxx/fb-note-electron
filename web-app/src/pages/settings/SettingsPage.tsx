import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Input, Popconfirm, Radio, Row, Space, Typography, notification } from 'antd'
import { ArrowLeftOutlined, CloseOutlined, CopyOutlined, FolderOpenOutlined } from '@ant-design/icons'
import {
  DEFAULT_MENU_DISPLAY_MODE,
  DEFAULT_LOCAL_USER_TYPE,
  getLocalUserTypeConfig,
  LOCAL_USER_TYPES,
  MENU_DISPLAY_MODES,
  MenuDisplayMode,
  LocalUserType,
} from '@/features/preferences/userType'
import { useNavigate } from 'react-router-dom'

const { ipcRenderer, IPC_ACTIONS } = (window as any).electron || {}

const SETTINGS_CHANNELS = {
  GET_SETTINGS_DIR: IPC_ACTIONS?.GET_SETTINGS_DIR || 'GET_SETTINGS_DIR',
  GET_APP_SETTINGS: IPC_ACTIONS?.GET_APP_SETTINGS || 'GET_APP_SETTINGS',
  PATCH_APP_SETTINGS: IPC_ACTIONS?.PATCH_APP_SETTINGS || 'PATCH_APP_SETTINGS',
  SELECT_FILE: IPC_ACTIONS?.SELECT_FILE || 'SELECT_FILE',
  VALIDATE_DIR: IPC_ACTIONS?.VALIDATE_DIR || 'VALIDATE_DIR',
  MIGRATE_SETTINGS: IPC_ACTIONS?.MIGRATE_SETTINGS || 'MIGRATE_SETTINGS',
  SET_SETTINGS_DIR: IPC_ACTIONS?.SET_SETTINGS_DIR || 'SET_SETTINGS_DIR',
  OPEN_SETTINGS_DIR: IPC_ACTIONS?.OPEN_SETTINGS_DIR || 'OPEN_SETTINGS_DIR',
}

type DirInfo = {
  exists?: boolean
  isDirectory?: boolean
  writable?: boolean
  fileCount?: number
  isEmpty?: boolean
  error?: string
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [currentDir, setCurrentDir] = useState('')
  const [selectedDir, setSelectedDir] = useState('')
  const [dirInfo, setDirInfo] = useState<DirInfo | null>(null)
  const [userType, setUserType] = useState<LocalUserType>(DEFAULT_LOCAL_USER_TYPE)
  const [menuDisplayMode, setMenuDisplayMode] = useState<MenuDisplayMode>(DEFAULT_MENU_DISPLAY_MODE)

  const canApplyDir = useMemo(() => {
    if (!selectedDir || selectedDir === currentDir) return false
    if (dirInfo?.error === 'forbidden_project_root') return false
    if (dirInfo && (!dirInfo.isDirectory || !dirInfo.writable)) return false
    return true
  }, [selectedDir, currentDir, dirInfo])

  const loadAll = async () => {
    if (!ipcRenderer) return
    setSettingsLoading(true)
    try {
      const [dir, cfg] = await Promise.all([
        ipcRenderer.invoke(SETTINGS_CHANNELS.GET_SETTINGS_DIR),
        ipcRenderer.invoke(SETTINGS_CHANNELS.GET_APP_SETTINGS),
      ])
      setCurrentDir(dir || cfg?.settingsDir || '')
      setUserType((cfg?.userPreference?.userType as LocalUserType) || DEFAULT_LOCAL_USER_TYPE)
      setMenuDisplayMode((cfg?.userPreference?.menuDisplayMode as MenuDisplayMode) || DEFAULT_MENU_DISPLAY_MODE)
    } catch (e) {
      notification.error({ message: '读取设置失败', description: String(e) })
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const chooseDir = async () => {
    if (!ipcRenderer) return
    const res = await ipcRenderer.invoke(SETTINGS_CHANNELS.SELECT_FILE, { type: 'directory' })
    if (!res?.path) return
    setSelectedDir(res.path)
    try {
      const info = await ipcRenderer.invoke(SETTINGS_CHANNELS.VALIDATE_DIR, res.path)
      setDirInfo(info)
    } catch {
      setDirInfo(null)
    }
  }

  const applyDir = async (migrate = false) => {
    if (!ipcRenderer || !canApplyDir) return
    setLoading(true)
    try {
      const action = migrate ? SETTINGS_CHANNELS.MIGRATE_SETTINGS : SETTINGS_CHANNELS.SET_SETTINGS_DIR
      const args = migrate ? [selectedDir, { migrate: true }] : [selectedDir]
      const r = await ipcRenderer.invoke(action, ...args)
      if (r?.ok) {
        setCurrentDir(selectedDir)
        notification.success({ message: migrate ? '目录迁移完成' : '目录更新完成' })
      } else {
        notification.error({ message: '目录设置失败', description: r?.error || 'unknown' })
      }
    } catch (e) {
      notification.error({ message: '目录设置失败', description: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const saveUserType = async () => {
    if (!ipcRenderer) return
    setLoading(true)
    try {
      const r = await ipcRenderer.invoke(SETTINGS_CHANNELS.PATCH_APP_SETTINGS, {
        userPreference: {
          userType,
          menuDisplayMode,
          hasCompletedOnboarding: true,
          updatedAt: new Date().toISOString(),
        },
      })
      if (r?.ok) {
        notification.success({ message: '用户偏好已保存' })
        const nextConfig = getLocalUserTypeConfig(userType)
        navigate(nextConfig.startPath)
      } else {
        notification.error({ message: '用户偏好保存失败', description: r?.error || 'unknown' })
      }
    } catch (e) {
      notification.error({ message: '用户偏好保存失败', description: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const copyPath = async () => {
    if (!currentDir) return
    try {
      await navigator.clipboard.writeText(currentDir)
      notification.success({ message: '路径已复制' })
    } catch {
      notification.error({ message: '复制失败' })
    }
  }

  const openDir = async () => {
    if (!ipcRenderer) return
    await ipcRenderer.invoke(SETTINGS_CHANNELS.OPEN_SETTINGS_DIR)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 0 }}>
          全局设置
        </Typography.Title>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button icon={<CloseOutlined />} onClick={() => navigate('/system')}>
            关闭
          </Button>
        </Space>
      </div>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card loading={settingsLoading} title="用户偏好" bordered={false}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text strong>用户类型</Typography.Text>
            <Radio.Group value={userType} onChange={e => setUserType(e.target.value)}>
              <Space direction="vertical">
                {LOCAL_USER_TYPES.map(item => (
                  <Radio key={item.key} value={item.key}>
                    <span className="font-medium">{item.label}</span>
                    <span className="text-gray-500 ml-2">{item.description}</span>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
            <div>
              <Typography.Text strong>菜单展示模式</Typography.Text>
              <Radio.Group value={menuDisplayMode} onChange={e => setMenuDisplayMode(e.target.value)}>
                <Space direction="vertical">
                  {MENU_DISPLAY_MODES.map(item => (
                    <Radio key={item.key} value={item.key}>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-gray-500 ml-2">{item.description}</span>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
            <div>
              <Button type="primary" onClick={saveUserType} loading={loading}>
                保存用户偏好
              </Button>
            </div>
          </Space>
        </Card>

        <Card loading={settingsLoading} title="Writing 存储目录" bordered={false}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Row gutter={12}>
              <Col span={24}>
                <Input
                  value={currentDir}
                  readOnly
                  placeholder="未配置"
                  addonBefore={<FolderOpenOutlined />}
                  suffix={
                    <Space>
                      <Button type="text" size="small" icon={<FolderOpenOutlined />} onClick={openDir} />
                      <Button type="text" size="small" icon={<CopyOutlined />} onClick={copyPath} disabled={!currentDir} />
                    </Space>
                  }
                />
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={24}>
                <Input
                  value={selectedDir}
                  readOnly
                  placeholder="选择新目录"
                  suffix={
                    <Space>
                      <Button size="small" onClick={chooseDir}>
                        浏览
                      </Button>
                    </Space>
                  }
                />
              </Col>
            </Row>

            {dirInfo ? (
              <Alert
                type={dirInfo.isDirectory && dirInfo.writable ? 'info' : 'warning'}
                showIcon
                message={
                  dirInfo.error === 'forbidden_project_root'
                    ? '目标目录不能为项目根目录'
                    : dirInfo.isDirectory
                      ? `目录校验通过，文件数：${dirInfo.fileCount || 0}`
                      : '目标路径不是有效目录'
                }
              />
            ) : null}

            <Space>
              <Button type="primary" disabled={!canApplyDir} loading={loading} onClick={() => applyDir(false)}>
                使用此目录
              </Button>
              <Popconfirm
                title="迁移现有文件到新目录？"
                description="会复制后尝试删除旧目录。"
                okText="确认"
                cancelText="取消"
                onConfirm={() => applyDir(true)}
                disabled={!canApplyDir}
              >
                <Button danger disabled={!canApplyDir} loading={loading}>
                  迁移并切换
                </Button>
              </Popconfirm>
            </Space>

            <Alert
              type="success"
              showIcon
              message="写入安全说明"
              description="设置写入采用临时文件 + 备份回滚机制（app-settings.json.tmp / .bak），写入异常会自动恢复。"
            />
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default SettingsPage
