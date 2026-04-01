import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Spin, Tooltip, Typography } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import './GuidePage.css' // 引入自定义样式
import { useNavigate } from 'react-router-dom'
import {
  DEFAULT_LOCAL_USER_TYPE,
  getLocalUserTypeConfig,
  LOCAL_USER_TYPES,
  LocalUserType,
} from '@/features/preferences/userType'

const { ipcRenderer, IPC_ACTIONS } = (window as any).electron || {}

const SETTINGS_CHANNELS = {
  GET_APP_SETTINGS: IPC_ACTIONS?.GET_APP_SETTINGS || 'GET_APP_SETTINGS',
  PATCH_APP_SETTINGS: IPC_ACTIONS?.PATCH_APP_SETTINGS || 'PATCH_APP_SETTINGS',
}

const GuidePage: React.FC = () => {
  const navigate = useNavigate()
  const [checkingPreference, setCheckingPreference] = useState(true)

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      if (!ipcRenderer) {
        if (mounted) setCheckingPreference(false)
        return
      }

      try {
        const cfg = await ipcRenderer.invoke(SETTINGS_CHANNELS.GET_APP_SETTINGS)
        const savedUserType = cfg?.userPreference?.userType as LocalUserType | undefined
        const hasCompletedOnboarding = !!cfg?.userPreference?.hasCompletedOnboarding

        if (savedUserType && hasCompletedOnboarding) {
          const nextConfig = getLocalUserTypeConfig(savedUserType)
          navigate(nextConfig.startPath, { replace: true })
          return
        }
      } catch {
        // ignore and continue to guide page
      }

      if (mounted) {
        setCheckingPreference(false)
      }
    }

    bootstrap()
    return () => {
      mounted = false
    }
  }, [navigate])

  const handleSelection = async (role: LocalUserType, startPath: string) => {
    try {
      if (ipcRenderer) {
        await ipcRenderer.invoke(SETTINGS_CHANNELS.PATCH_APP_SETTINGS, {
          userPreference: {
            userType: role || DEFAULT_LOCAL_USER_TYPE,
            hasCompletedOnboarding: true,
            updatedAt: new Date().toISOString(),
          },
        })
      }
    } catch {
      // ignore save failure and continue navigation
    }
    navigate(startPath || '/system')
  }

  const cards = LOCAL_USER_TYPES.map(item => ({
    key: item.key,
    title: item.label,
    summary: `进入 ${item.startPath} 并启用对应菜单视图。`,
    detail: item.description,
    onClick: () => handleSelection(item.key, item.startPath),
  }))

  if (checkingPreference) {
    return (
      <div className="min-h-[calc(100vh-28px)] flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="guide-page">
      <h1 className="guide-title">欢迎！请选择您的身份</h1>
      <Row gutter={[16, 16]} justify="start">
        {cards.map(item => (
          <Col key={item.key} xs={24} sm={12} lg={8} xl={6}>
            <Card
              title={
                <div className="guide-card-title">
                  <span>{item.title}</span>
                  <Tooltip title={item.detail}>
                    <QuestionCircleOutlined className="guide-card-help" />
                  </Tooltip>
                </div>
              }
              bordered={false}
              hoverable
              onClick={item.onClick}
              className="guide-card"
            >
              <Typography.Paragraph className="guide-card-summary">{item.summary}</Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default GuidePage
