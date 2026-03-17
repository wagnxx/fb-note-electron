// src/features/locator/components/map/MapToolbar.tsx
import React from 'react'
import { Space, Button, Tooltip } from 'antd'
import { PlusOutlined, AimOutlined, SwapOutlined } from '@ant-design/icons'
import L from 'leaflet'

interface MapToolbarProps {
  measureMode: boolean
  setMeasureMode: (val: boolean) => void
  currentPosition: [number, number] | null
  mapRef: React.RefObject<L.Map>
  notification: any
  addTask?: () => void
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  measureMode,
  setMeasureMode,
  currentPosition,
  mapRef,
  notification,
  addTask,
}) => {
  const handleFlyToCurrent = () => {
    if (!currentPosition) {
      notification.warning({ message: '定位中', description: '正在获取当前位置...' })
      return
    }
    if (mapRef.current) {
      mapRef.current.flyTo(
        [currentPosition[0], currentPosition[1]],
        mapRef.current.getZoom ? mapRef.current.getZoom() : 16,
        { duration: 1, animate: true },
      )
    } else {
      notification.warning({ message: '地图未初始化' })
    }
    notification.success({ message: '已定位', description: '地图已移动到当前位置' })
  }

  return (
    <Space style={{ marginBottom: 12 }}>
      {addTask && (
        <Tooltip title="添加任务">
          <Button icon={<PlusOutlined />} onClick={addTask} />
        </Tooltip>
      )}
      <Tooltip title="定位到当前位置">
        <Button icon={<AimOutlined />} onClick={handleFlyToCurrent} />
      </Tooltip>
      <Tooltip title="测距模式（点击两点）">
        <Button
          icon={<SwapOutlined />}
          onClick={() => {
            setMeasureMode(!measureMode)
            notification.info({
              message: '测距',
              description: measureMode ? '已退出测距模式' : '已进入测距模式，点击地图选择起点',
            })
          }}
          type={measureMode ? 'primary' : 'default'}
        />
      </Tooltip>
    </Space>
  )
}
