import React from 'react'
import { Row, Col, Button, Typography } from 'antd'

const { Title } = Typography

interface HeaderProps {
  title: React.ReactNode
  leftIcon?: React.ReactNode // 可选的左侧图标
  rightIcon?: React.ReactNode // 可选的右侧图标
  onLeftClick?: () => void // 左侧按钮点击事件
  onRightClick?: () => void // 右侧按钮点击事件
}

const TitleBar: React.FC<HeaderProps> = ({
  title,
  leftIcon = null,
  rightIcon = null,
  onLeftClick,
  onRightClick,
}) => (
  <Row align="middle" justify="space-between">
    {/* 左侧图标 */}
    <Col>{leftIcon && <Button type="text" icon={leftIcon} onClick={onLeftClick} />}</Col>

    {/* 中间标题 */}
    <Col>{title}</Col>

    {/* 右侧图标 */}
    <Col>{rightIcon && <Button type="text" icon={rightIcon} onClick={onRightClick} />}</Col>
  </Row>
)

export default TitleBar
