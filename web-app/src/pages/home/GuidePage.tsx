import React from 'react'
import { Card, Col, Row, Tooltip, Typography } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import './GuidePage.css' // 引入自定义样式
import { useNavigate } from 'react-router-dom'
import { DEFAULT_LOCAL_USER_TYPE, LOCAL_USER_TYPES, LocalUserType } from '@/features/preferences/userType'

const { ipcRenderer, IPC_ACTIONS } = (window as any).electron || {}

const GuidePage: React.FC = () => {
  const navigate = useNavigate()
  const handleSelection = async (role: LocalUserType, startPath: string) => {
    try {
      if (ipcRenderer) {
        await ipcRenderer.invoke(IPC_ACTIONS.PATCH_APP_SETTINGS, {
          userPreference: {
            userType: role || DEFAULT_LOCAL_USER_TYPE,
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
