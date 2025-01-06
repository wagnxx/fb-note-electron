import React from 'react'
import { Card, Col, Row } from 'antd'
import './GuidePage.css' // 引入自定义样式
import { useNavigate } from 'react-router-dom'

const GuidePage: React.FC = () => {
  const navigate = useNavigate()
  const handleSelection = (role: string) => {
    // 处理用户选择的角色
    console.log(`用户选择的角色是: ${role}`)
    navigate('/system')
  }

  return (
    <div className="guide-page">
      <h1 className="guide-title">欢迎！请选择您的身份</h1>
      <Row gutter={16} justify="center">
        <Col span={8}>
          <Card
            title="开发人员"
            bordered={false}
            hoverable
            onClick={() => handleSelection('developer')}
            className="guide-card"
          >
            <p>专注于编写代码和构建应用程序。</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="使用工具人员"
            bordered={false}
            hoverable
            onClick={() => handleSelection('toolUser')}
            className="guide-card"
          >
            <p>利用各种工具提高工作效率。</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="爱好写作人员"
            bordered={false}
            hoverable
            onClick={() => handleSelection('writer')}
            className="guide-card"
          >
            <p>享受写作和分享想法。</p>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default GuidePage
