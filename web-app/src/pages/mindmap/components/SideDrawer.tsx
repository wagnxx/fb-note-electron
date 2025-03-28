import ColorGridPicker from '@/components/select/ColorGridPicker'
import { setSelectedNoteTheme, updateGlobalSettings, updateSelectedNoteTheme } from '@/features/mindmap/mindmapSlice'
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

const borderOptions = [
  { label: 'Default', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'Double', value: 'double' },
  { label: 'None', value: 'none' },
]
const borderWidthOptions = [
  { label: 'Extra Thin', value: '1px' },
  { label: 'Thin', value: '2px' },
  { label: 'Medium', value: '3px' },
  { label: 'Bold', value: '4px' },
  { label: 'Extra Bold', value: '5px' },
]
const textWeightOptions = [
  { label: 'Regular', value: '400' },
  { label: 'Light', value: '300' },
  { label: 'Medium', value: '500' },
  { label: 'Bold', value: '600' },
]
const textSizeOptions = [
  { label: '8', value: '8' },
  { label: '10', value: '10' },
  { label: '12', value: '12' },
  { label: '14', value: '14' },
  { label: '18', value: '18' },
  { label: '24', value: '24' },
  { label: '36', value: '36' },
  { label: '48', value: '48' },
  { label: '60', value: '60' },
  { label: '8', value: '88' },
  { label: '8', value: '88' },
]

const SideDrawer: FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [loading, setloading] = useState(false)

  const globalSettings = useSelector(selectGlobalSettings)
  const currentNoteTheme = useSelector((state: RootState) => state.mindmap.currentNoteTheme)
  const currentNodeId = useSelector((state: RootState) => state.mindmap.currentNodeId)
  const topicThemes = useSelector((state: RootState) => state.mindmap.topicThemes)

  const dispatch = useDispatch()

  const { token } = theme.useToken()

  const handleGlobalPropChagne = useCallback(
    (key: string, val: boolean) => {
      dispatch(updateGlobalSettings({ type: 'change', payload: [{ value: val, key }] }))
    },
    [dispatch],
  )

  const handleUpdateCurrentTheme = useCallback(
    (style: React.CSSProperties) => {
      dispatch(updateSelectedNoteTheme(style))
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
                <ColorGridPicker
                  style={{ width: '100px' }}
                  value={currentNoteTheme?.style.backgroundColor || (currentNoteTheme?.style.background as string)}
                  onChange={val => handleUpdateCurrentTheme({ backgroundColor: val })}
                />
              </Space>
            </Flex>
            <Flex justify="space-between" align="center">
              <strong>Border</strong>
              <Space>
                <Select
                  style={{ width: '100px' }}
                  options={borderOptions}
                  value={currentNoteTheme?.style.borderStyle}
                  onChange={val => handleUpdateCurrentTheme({ borderStyle: val })}
                />
                <ColorGridPicker
                  style={{ width: '100px' }}
                  value={currentNoteTheme?.style.borderColor}
                  onChange={val => handleUpdateCurrentTheme({ borderColor: val })}
                />
              </Space>
            </Flex>
            <div>
              <Select
                className=" w-full"
                defaultValue={'1px'}
                options={borderWidthOptions}
                value={currentNoteTheme?.style.borderWidth}
                onChange={val => handleUpdateCurrentTheme({ borderWidth: val })}
              />
            </div>
            <Flex justify="space-between" align="center">
              <strong>Length</strong>
              <Space>
                <Select style={{ width: '100px' }} disabled />
                <Input style={{ width: '100px' }} disabled />
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
              <strong>Color</strong>
              <ColorGridPicker
                style={{ width: '100px' }}
                value={currentNoteTheme?.style.color}
                onChange={val => handleUpdateCurrentTheme({ color: val })}
              />
            </Flex>
            <Flex justify="space-between" align="center" gap={20}>
              <Select
                style={{ flex: 2 }}
                options={textWeightOptions}
                value={currentNoteTheme?.style.fontWeight}
                onChange={val => handleUpdateCurrentTheme({ fontWeight: val })}
              />
              <Select
                style={{ flex: 1 }}
                value={currentNoteTheme?.style.fontSize}
                options={textSizeOptions}
                onChange={val => handleUpdateCurrentTheme({ fontSize: val })}
              />
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

    return currentNodeId ? [...selectedNodeProps, ...globalProps] : [...globalProps]
  }, [currentNoteTheme, panelStyle, globalSettings, currentNodeId, handleUpdateCurrentTheme, handleGlobalPropChagne])

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
        <Dropdown menu={{ items: dropDownItems }} trigger={['click']}>
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
