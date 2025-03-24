import { setSelectedNoteTheme, updateGlobalSettings } from '@/features/mindmap/mindmapSlice'
import { selectGlobalSettings } from '@/features/mindmap/selectors'
import { RootState } from '@/store/store'
import { CaretRightOutlined, DownOutlined } from '@ant-design/icons'
import {
  Button,
  Collapse,
  CollapseProps,
  Drawer,
  Dropdown,
  Flex,
  Input,
  MenuProps,
  Select,
  Space,
  Switch,
  theme,
} from 'antd'
import Title from 'antd/es/typography/Title'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export type TopicTheme = {
  key: string | number
  name: string
  label: string
  style: React.CSSProperties
}

const SideDrawer: FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [loading, setloading] = useState(false)

  const globalSettings = useSelector(selectGlobalSettings)
  const currentNoteTheme = useSelector((state: RootState) => state.mindmap.currentNoteTheme)
  const currentNode = useSelector((state: RootState) => state.mindmap.currentNode)
  const topicThemes = useSelector((state: RootState) => state.mindmap.topicThemes)

  const dispatch = useDispatch()

  const { token } = theme.useToken()

  const handleGlobalPropChagne = useCallback(
    (key: string, val: boolean) => {
      dispatch(updateGlobalSettings({ type: 'change', payload: [{ value: val, key }] }))
    },
    [dispatch],
  )

  const panelStyle: React.CSSProperties = useMemo(() => {
    return {
      marginBottom: 12,
      background: token.colorFillAlter,
      borderRadius: token.borderRadiusLG,
      border: 'none',
    }
  }, [token])

  const dropDownItems: MenuProps['items'] = topicThemes.map(item => ({
    key: item.key,
    label: (
      <div style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}>
        <Button style={item.style} block onClick={() => dispatch(setSelectedNoteTheme(item))}>
          {item.label}
        </Button>
      </div>
    ),
  }))

  const panelItems: CollapseProps['items'] = useMemo(() => {
    const selectedNodeProps = [
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
    const globalProps = [
      {
        key: '3',
        label: 'Global',
        children: (
          <Space direction="vertical" className=" w-full">
            {globalSettings.map(item =>
              item.type === 'boolean' && typeof item.value === 'boolean' ? (
                <Flex key={item.key} justify="space-between" align="center" gap={20}>
                  <strong style={{ flex: 2 }}>{item.key}</strong>
                  <Switch
                    title={item.key}
                    checked={item.value}
                    onChange={checked => handleGlobalPropChagne(item.key, checked)}
                    style={{ width: '50px' }}
                  />
                </Flex>
              ) : (
                '-'
              ),
            )}
          </Space>
        ),
      },
    ]

    return currentNode ? [...selectedNodeProps, ...globalProps] : [...globalProps]
  }, [globalSettings, handleGlobalPropChagne, panelStyle, currentNode])

  // useEffect(() => {
  //   if (currentNode) {
  //     dispatch(setSelectedNoteTheme(currentNode.data.topicTheme || DefaultTopic))
  //   }
  // }, [dispatch, currentNode])

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
      mask={false}
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
      {currentNoteTheme && (
        <Dropdown menu={{ items: dropDownItems }}>
          <Flex style={{ padding: '8px 24px', boxSizing: 'border-box' }} gap={16}>
            <Button block style={currentNoteTheme.style}>
              {currentNoteTheme.name}
            </Button>
            <DownOutlined />
          </Flex>
        </Dropdown>
      )}
      <Collapse
        bordered={false}
        defaultActiveKey={['1']}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        style={{ background: token.colorBgContainer }}
        items={panelItems}
      />
    </Drawer>
  )
}

export default SideDrawer
