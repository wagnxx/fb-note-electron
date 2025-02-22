import { Drawer } from 'antd'
import Title from 'antd/es/typography/Title'
import React, { FC, useState } from 'react'

const SideDrawer: FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [loading, setloading] = useState(false)

  return (
    <Drawer
      closable
      destroyOnClose
      title={<p>Mind Settings</p>}
      placement="right"
      open={open}
      loading={loading}
      onClose={() => onClose()}
    >
      <Title level={4}>This feature is under development.</Title>
      <p>Defualt Zoom</p>
      <p>Background Color</p>
      <p>Edage Color</p>
      <p>Extro Props Settings:</p>
      <p>Item Node Styles:</p>
    </Drawer>
  )
}

export default SideDrawer
