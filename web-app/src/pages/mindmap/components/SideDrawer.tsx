import { CaretRightOutlined, DownOutlined } from '@ant-design/icons'
import { Button, Collapse, CollapseProps, Drawer, Dropdown, Flex, Input, MenuProps, Select, Space, theme } from 'antd'
import Title from 'antd/es/typography/Title'
import React, { CSSProperties, FC, useState } from 'react'

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`

const getPanelItems: (panelStyle: CSSProperties) => CollapseProps['items'] = panelStyle => [
  {
    key: '1',
    label: 'Shape',
    children: (
      <Space direction="vertical" className=" w-full">
        <Flex justify="space-between" align="center">
          <strong>Fill</strong>
          <Space>
            <Select style={{ width: '100px' }} />
            <Select style={{ width: '100px' }} />
          </Space>
        </Flex>
        <Flex justify="space-between" align="center">
          <strong>Border</strong>
          <Space>
            <Select style={{ width: '100px' }} />
            <Select style={{ width: '100px' }} />
          </Space>
        </Flex>
        <div>
          <Select className=" w-full" />
        </div>
        <Flex justify="space-between" align="center">
          <strong>Length</strong>
          <Space>
            <Select style={{ width: '100px' }} />
            <Input style={{ width: '100px' }} />
          </Space>
        </Flex>
      </Space>
    ),
    style: panelStyle,
  },
  {
    key: '2',
    label: 'Text',
    children: (
      <Space direction="vertical" className=" w-full">
        <Flex justify="space-between" align="center" gap={20}>
          <Select style={{ flex: 2 }} />
          <Select style={{ flex: 1 }} />
        </Flex>
        <Flex justify="space-between" align="center" gap={20}>
          <Select style={{ flex: 2 }} />
          <Select style={{ flex: 1 }} />
        </Flex>
        <Flex justify="space-between" align="center">
          <Button.Group className=" w-full">
            <Button>Left</Button>
            <Button>Middle</Button>
            <Button>Right</Button>
            <Button>Right</Button>
          </Button.Group>
        </Flex>
      </Space>
    ),
    style: panelStyle,
  },
]

const SideDrawer: FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [loading, setloading] = useState(false)
  const [topicTheme, settopicTheme] = useState<{ key: string | number; name: string; style: React.CSSProperties }[]>([
    {
      key: 1,
      name: 'Very Important',
      style: { background: '#6A1F87', color: '#FFFFFF' },
    },
    {
      key: 2,
      name: 'Important',
      style: { background: '#861F56', color: '#FFFFFF' },
    },
    {
      key: 3,
      name: 'Cross out',
      style: { background: '#FFFFFF', color: '#000000', textDecorationLine: 'line-through' },
    },
    {
      key: 4,
      name: 'Default',
      style: { background: '#FFC947', color: '#000000' },
    },
  ])
  const [selectedTheme, setSelectedTheme] = useState(topicTheme[0])

  const { token } = theme.useToken()

  const panelStyle: React.CSSProperties = {
    marginBottom: 12,
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: 'none',
  }

  const dropDownItems: MenuProps['items'] = topicTheme.map(item => ({
    key: item.key,
    label: (
      <div style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}>
        <Button style={item.style} block onClick={() => setSelectedTheme(item)}>
          {item.name}
        </Button>
      </div>
    ),
  }))

  return (
    <Drawer
      closable
      destroyOnClose
      title={<p>Mind Settings</p>}
      placement="right"
      open={open}
      loading={loading}
      onClose={() => onClose()}
      styles={{ body: { padding: 0 } }}
      width={300}
    >
      {/* <Title level={4}>This feature is under development.</Title>
      <p>Defualt Zoom</p>
      <p>Background Color</p>
      <p>Edage Color</p>
      <p>Extro Props Settings:</p>
      <p>Item Node Styles:</p> */}
      <Title level={4} style={{ padding: '8px 12px' }}>
        This feature is under development.
      </Title>
      <Dropdown menu={{ items: dropDownItems }}>
        <Flex style={{ padding: '8px 24px', boxSizing: 'border-box' }} gap={16}>
          <Button block style={selectedTheme.style}>
            {selectedTheme.name}{' '}
          </Button>
          <DownOutlined />
        </Flex>
      </Dropdown>
      <Collapse
        bordered={false}
        defaultActiveKey={['1']}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        style={{ background: token.colorBgContainer }}
        items={getPanelItems(panelStyle)}
      />
    </Drawer>
  )
}

export default SideDrawer
