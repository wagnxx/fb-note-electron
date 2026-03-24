import React from 'react'
import { Card, Col, Row, Tooltip, Typography } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import './GuidePage.css' // 引入自定义样式
import { useNavigate } from 'react-router-dom'

const GuidePage: React.FC = () => {
  const navigate = useNavigate()
  const handleSelection = (role: string) => {
    // 处理用户选择的角色
    console.log(`用户选择的角色是: ${role}`)
    navigate('/system')
  }

  const cards = [
    {
      key: 'developer',
      title: '开发人员',
      summary: '编写代码与调试。',
      detail: '适合需要开发、调试、查看工程与功能入口的用户。',
      onClick: () => handleSelection('developer'),
    },
    {
      key: 'toolUser',
      title: '使用工具人员',
      summary: '快速进入工具页。',
      detail: '适合以效率工具、页面入口和功能操作为主的用户。',
      onClick: () => handleSelection('toolUser'),
    },
    {
      key: 'writer',
      title: '爱好写作人员',
      summary: '记录与整理想法。',
      detail: '适合偏写作、内容沉淀、灵感记录和输出整理场景。',
      onClick: () => handleSelection('writer'),
    },
    {
      key: 'relay',
      title: '进入中转站',
      summary: '打开 Relay 主控台。',
      detail: '直接进入中转站页面，可查看配对码、群聊消息和接入设备。',
      onClick: () => navigate('/tool/relay'),
    },
  ]

  return (
    <div className="guide-page">
      <h1 className="guide-title">欢迎！请选择您的身份</h1>
      <Row gutter={[16, 16]} justify="center">
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
